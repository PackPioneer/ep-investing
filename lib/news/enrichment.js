/**
 * lib/news/enrichment.js
 *
 * Core enrichment worker. Takes an article row, makes two Anthropic API
 * calls (Haiku for structure, Sonnet for summary), returns the enriched
 * fields ready to write back to the DB.
 *
 * Deliberately decoupled from both the cron route and the backfill script
 * so the same logic runs in production and in dev.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  buildExtractionPrompt,
  buildSummaryPrompt,
  CLASSIFICATIONS,
} from './prompts.js';

// Use dated model IDs to pin behavior — model upgrades can change output
// shape and we want to opt into them deliberately. Bump these after testing.
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-6';

// Max characters of article content we send to the LLM. Most articles are
// way under this. 12k chars ≈ 3k tokens, keeps prompt cost predictable.
const MAX_CONTENT_CHARS = 12000;

/**
 * Lazy init — matches the pattern used in the existing Resend setup. Avoids
 * crashing at build time if ANTHROPIC_API_KEY isn't available yet.
 */
let _client = null;
function getAnthropic() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

/**
 * Strip HTML tags from RSS content:encoded. Many RSS feeds ship the full
 * article as HTML inside <content:encoded>. We don't want <p>, <a>, etc. in
 * the prompt — wastes tokens and distracts the model.
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    // Drop script/style blocks entirely
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Convert <br> and <p> boundaries to newlines before tag removal
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    // Remove remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Build the content blob we feed to both prompts. Prefers clean_content if
 * present (populated by Phase 2+ content extraction), falls back to raw
 * RSS content with HTML stripped.
 */
function prepareContent(article) {
  const source = article.clean_content || article.raw_content || article.excerpt || '';
  const cleaned = article.clean_content ? source : stripHtml(source);
  return cleaned.slice(0, MAX_CONTENT_CHARS);
}

/**
 * Parse and validate the Haiku extraction response. Haiku is instructed to
 * return pure JSON, but we still defensive-strip markdown fences in case.
 */
function parseExtraction(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty extraction response');
  }
  // Strip ```json ... ``` fences defensively
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Extraction JSON parse failed: ${err.message}`);
  }

  // Validate classification; fall back to 'other' rather than failing
  if (!CLASSIFICATIONS.includes(parsed.classification)) {
    parsed.classification = 'other';
  }

  // Normalize arrays
  parsed.geography_tags = Array.isArray(parsed.geography_tags)
    ? parsed.geography_tags.filter((t) => typeof t === 'string' && t.length > 0).slice(0, 6)
    : [];
  parsed.sector_tags = Array.isArray(parsed.sector_tags)
    ? parsed.sector_tags.filter((t) => typeof t === 'string' && t.length > 0).slice(0, 6)
    : [];
 // Coerce entity types to the 5 values allowed by the DB constraint.
  // Claude sometimes returns "legislation", "technology", "initiative", etc. —
  // map those to the closest valid type or drop them if no fit.
  const ENTITY_TYPE_MAP = {
    company: 'company', corporation: 'company', startup: 'company', firm: 'company', organization: 'company',
    person: 'person', people: 'person', individual: 'person',
    policy: 'policy', legislation: 'policy', regulation: 'policy', law: 'policy', bill: 'policy',
      treaty: 'policy', initiative: 'policy', program: 'policy',
    agency: 'agency', department: 'agency', ministry: 'agency', government: 'agency', regulator: 'agency',
    fund: 'fund', investor: 'fund', vc: 'fund', investment_fund: 'fund', fund_manager: 'fund',
  };
  parsed.entities = Array.isArray(parsed.entities)
    ? parsed.entities
        .filter((e) => e && typeof e.name === 'string' && typeof e.type === 'string')
        .map((e) => ({
          type: ENTITY_TYPE_MAP[e.type.toLowerCase().replace(/[\s-]/g, '_')] ?? null,
          name: e.name,
        }))
        .filter((e) => e.type !== null)
        .slice(0, 10)
    : [];

  // Coerce deal_size_usd to integer or null
  if (parsed.deal_size_usd !== null && parsed.deal_size_usd !== undefined) {
    const n = Number(parsed.deal_size_usd);
    parsed.deal_size_usd = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  } else {
    parsed.deal_size_usd = null;
  }

  return parsed;
}

/**
 * Pull the text out of an Anthropic response. Messages API returns a content
 * array; we want the text of the first text block.
 */
function textFromResponse(response) {
  const block = response?.content?.find((b) => b.type === 'text');
  return block?.text ?? '';
}

/**
 * Enrich a single article. Makes two parallel API calls. Returns
 * { summary_factual, classification, geography_tags, sector_tags,
 *   deal_size_usd, entities }.
 *
 * Throws on catastrophic failure (network, auth). Callers should catch and
 * mark the article as enrichment_status='failed'.
 */
export async function enrichArticle(article) {
  const anthropic = getAnthropic();
  const content = prepareContent(article);

  if (content.length < 50) {
    // Not enough content to reason over. Don't burn API calls on these.
    return {
      summary_factual: article.excerpt ?? article.title,
      classification: 'other',
      geography_tags: [],
      sector_tags: [],
      deal_size_usd: null,
      entities: [],
      _skipped_reason: 'insufficient_content',
    };
  }

  const commonArgs = {
    title: article.title,
    source: article.source_name ?? 'unknown',
    publishedAt: article.published_at ?? null,
    content,
  };

  // Parallel: Haiku (structured) + Sonnet (summary). They're independent.
  const [extractionResp, summaryResp] = await Promise.all([
    anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildExtractionPrompt(commonArgs) }],
    }),
    anthropic.messages.create({
      model: SONNET_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: buildSummaryPrompt(commonArgs) }],
    }),
  ]);

  const extraction = parseExtraction(textFromResponse(extractionResp));
  const summary = textFromResponse(summaryResp).trim();

  return {
    summary_factual: summary,
    classification: extraction.classification,
    geography_tags: extraction.geography_tags,
    sector_tags: extraction.sector_tags,
    deal_size_usd: extraction.deal_size_usd,
    entities: extraction.entities,
  };
}

/**
 * Enrich a batch of articles in parallel with concurrency limit and write
 * results to the DB. Used by both the cron route and the backfill script.
 *
 * Returns summary counts { processed, succeeded, failed, errors }.
 */
export async function enrichBatch(articles, supabase, { concurrency = 5 } = {}) {
  const stats = { processed: 0, succeeded: 0, failed: 0, errors: [] };
  if (!articles || articles.length === 0) return stats;

  // Process in chunks of `concurrency` — simple rate limiting that stays
  // under Anthropic's per-minute request budgets at our volume and avoids
  // flooding Supabase with simultaneous writes.
  for (let i = 0; i < articles.length; i += concurrency) {
    const chunk = articles.slice(i, i + concurrency);

    await Promise.all(
      chunk.map(async (article) => {
        stats.processed += 1;

        // Mark as in-progress so a parallel run doesn't re-process it
        await supabase
          .from('news_articles')
          .update({
            enrichment_status: 'in_progress',
            enrichment_attempts: (article.enrichment_attempts ?? 0) + 1,
          })
          .eq('id', article.id);

        try {
          const enriched = await enrichArticle(article);

          // Write enrichment fields to news_articles
          const { error: updateError } = await supabase
            .from('news_articles')
            .update({
              summary_factual: enriched.summary_factual,
              classification: enriched.classification,
              geography_tags: enriched.geography_tags,
              sector_tags: enriched.sector_tags,
              deal_size_usd: enriched.deal_size_usd,
              enrichment_status: 'done',
              enrichment_error: null,
            })
            .eq('id', article.id);

          if (updateError) throw new Error(`DB update: ${updateError.message}`);

          // Write entities to news_entities (if any). Best-effort: don't fail
          // the whole enrichment if entity insert fails.
          if (enriched.entities.length > 0) {
            const entityRows = enriched.entities.map((e) => ({
              article_id: article.id,
              entity_type: e.type,
              entity_name: e.name,
            }));
            const { error: entityError } = await supabase
              .from('news_entities')
              .insert(entityRows);
            if (entityError) {
              console.warn(
                `Entity insert for article ${article.id} failed: ${entityError.message}`
              );
            }
          }

          stats.succeeded += 1;
        } catch (err) {
          stats.failed += 1;
          stats.errors.push({ article_id: article.id, message: err.message });
          await supabase
            .from('news_articles')
            .update({
              enrichment_status: 'failed',
              enrichment_error: String(err.message).slice(0, 500),
            })
            .eq('id', article.id);
        }
      })
    );
  }

  return stats;
}

/**
 * Fetch N articles from the DB that need enrichment and enrich them.
 * Used by both the cron run (with a small limit) and the backfill script.
 */
export async function enrichPending(supabase, { limit = 30, concurrency = 5 } = {}) {
  // Join source name so the prompt has it — reduces the DB roundtrips
  // compared to a separate lookup per article.
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select(`
      id, title, excerpt, raw_content, clean_content, published_at,
      enrichment_attempts,
      source:news_sources ( name )
    `)
    .eq('enrichment_status', 'pending')
    .lt('enrichment_attempts', 3)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return {
      processed: 0, succeeded: 0, failed: 0,
      errors: [{ message: `Fetch pending: ${error.message}` }],
    };
  }

  // Flatten source_name onto articles
  const flat = (articles ?? []).map((a) => ({
    ...a,
    source_name: a.source?.name ?? 'unknown',
  }));

  return enrichBatch(flat, supabase, { concurrency });
}
