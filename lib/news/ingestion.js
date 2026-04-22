/**
 * lib/news/ingestion.js
 *
 * Core ingestion logic. Fetches a feed, parses items, and upserts articles
 * into Supabase with dedup via url_hash unique constraint.
 *
 * This module is intentionally decoupled from the cron route — you can run
 * it standalone (see scripts/ingest-once.js) or from an API handler.
 */

import Parser from 'rss-parser';
import { hashUrl, normalizeUrl } from './url-hash.js';

const parser = new Parser({
  timeout: 20000,
  headers: {
    'User-Agent': 'EPInvestingNewsBot/0.1 (+https://epinvesting.com/news)',
  },
  customFields: {
    // content:encoded is the full-text field many RSS feeds use
    item: [['content:encoded', 'contentEncoded']],
  },
});

/**
 * Max characters of raw_content we persist per article. RSS can include
 * enormous content:encoded blocks (full article text plus ads). 50k covers
 * long-form without blowing up storage.
 */
const MAX_RAW_CONTENT = 50_000;

/**
 * Upper bound on items processed per source per run. Prevents a single
 * misbehaving feed from eating the cron budget.
 */
const MAX_ITEMS_PER_SOURCE = 50;

function truncate(text, max) {
  if (!text) return null;
  const s = String(text);
  return s.length > max ? s.slice(0, max) : s;
}

function parseDate(candidate) {
  if (!candidate) return null;
  const d = new Date(candidate);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Convert an RSS item into the shape we insert into news_articles.
 * Returns null if the item is unusable (missing URL or title).
 */
function itemToArticleRow(item, source) {
  if (!item.link || !item.title) return null;

  let normalizedUrl, urlHash;
  try {
    normalizedUrl = normalizeUrl(item.link);
    urlHash = hashUrl(item.link);
  } catch {
    return null; // malformed URL — skip
  }

  const rawContent = item.contentEncoded || item.content || item.summary || '';
  const excerpt = item.contentSnippet || item.summary || null;

  return {
    source_id: source.id,
    url: normalizedUrl,
    url_hash: urlHash,
    title: truncate(item.title.trim(), 500),
    author: item.creator || item.author || null,
    published_at: parseDate(item.isoDate || item.pubDate),
    raw_content: truncate(rawContent, MAX_RAW_CONTENT),
    excerpt: truncate(excerpt, 2000),
    image_url: item.enclosure?.url || null,
    is_secondary_source: source.is_secondary_source ?? false,
    primary_source_attribution: source.attribution_label ?? null,
    enrichment_status: 'pending',
  };
}

/**
 * Ingest a single source. Returns counts and any error encountered.
 *
 * Does not throw — callers get a result object so one bad source doesn't
 * abort the whole cron run.
 */
export async function ingestSource(source, supabase) {
  const result = {
    source_id: source.id,
    source_slug: source.slug,
    fetched: 0,
    inserted: 0,
    skipped_duplicate: 0,
    error: null,
  };

  let feed;
  try {
    feed = await parser.parseURL(source.feed_url);
  } catch (err) {
    result.error = `fetch/parse: ${err.message}`;
    await supabase
      .from('news_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        last_error: result.error,
        consecutive_failures: (source.consecutive_failures ?? 0) + 1,
      })
      .eq('id', source.id);
    return result;
  }

  const items = (feed.items ?? []).slice(0, MAX_ITEMS_PER_SOURCE);
  result.fetched = items.length;

  // Build rows, filter out unusable ones
  const rows = items
    .map((item) => itemToArticleRow(item, source))
    .filter(Boolean);

  if (rows.length === 0) {
    await supabase
      .from('news_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error: null,
        consecutive_failures: 0,
      })
      .eq('id', source.id);
    return result;
  }

  // Insert with ignoreDuplicates — the url_hash unique constraint handles
  // dedup at the DB level, so we don't need to pre-check existence.
  const { data, error } = await supabase
    .from('news_articles')
    .upsert(rows, {
      onConflict: 'url_hash',
      ignoreDuplicates: true,
    })
    .select('id');

  if (error) {
    result.error = `insert: ${error.message}`;
    await supabase
      .from('news_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        last_error: result.error,
        consecutive_failures: (source.consecutive_failures ?? 0) + 1,
      })
      .eq('id', source.id);
    return result;
  }

  result.inserted = data?.length ?? 0;
  result.skipped_duplicate = rows.length - result.inserted;

  await supabase
    .from('news_sources')
    .update({
      last_fetched_at: new Date().toISOString(),
      last_success_at: new Date().toISOString(),
      last_error: null,
      consecutive_failures: 0,
    })
    .eq('id', source.id);

  return result;
}

/**
 * Top-level orchestration: fetch all active sources, ingest each, write a
 * row to news_ingestion_runs for observability.
 */
export async function ingestAllSources(supabase) {
  const runStart = new Date().toISOString();

  // Create audit row up front so we can attribute failures
  const { data: runRow, error: runError } = await supabase
    .from('news_ingestion_runs')
    .insert({ started_at: runStart, status: 'running' })
    .select('id')
    .single();

  if (runError) {
    // Soft-fail: continue without audit row rather than aborting ingestion
    console.error('Could not create ingestion_runs row:', runError.message);
  }

  const { data: sources, error: srcError } = await supabase
    .from('news_sources')
    .select('*')
    .eq('active', true);

  if (srcError) {
    const final = {
      started_at: runStart,
      completed_at: new Date().toISOString(),
      status: 'failed',
      errors: [{ stage: 'load_sources', message: srcError.message }],
    };
    if (runRow) {
      await supabase.from('news_ingestion_runs').update(final).eq('id', runRow.id);
    }
    return { ok: false, ...final };
  }

  const results = [];
  for (const source of sources ?? []) {
    const r = await ingestSource(source, supabase);
    results.push(r);
  }

  const summary = {
    sources_attempted: results.length,
    sources_succeeded: results.filter((r) => !r.error).length,
    articles_inserted: results.reduce((sum, r) => sum + r.inserted, 0),
    articles_skipped_duplicate: results.reduce((sum, r) => sum + r.skipped_duplicate, 0),
    errors: results
      .filter((r) => r.error)
      .map((r) => ({ source: r.source_slug, message: r.error })),
  };

  const final = {
    completed_at: new Date().toISOString(),
    status: 'completed',
    ...summary,
  };

  if (runRow) {
    await supabase.from('news_ingestion_runs').update(final).eq('id', runRow.id);
  }

  return { ok: true, ...final, per_source: results };
}
