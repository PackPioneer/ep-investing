/**
 * lib/policies/ingestion.js
 *
 * Ingests policies from configured sources. Key behaviors:
 *   - Dedup via (external_source, external_id). If a row already exists,
 *     we UPDATE it (not duplicate) and log any status change to
 *     policy_status_history.
 *   - Multi-source. Federal Register uses JSON API, EU/UK use RSS.
 *   - Stores raw_payload so we can re-enrich or diff later.
 *
 * Ingestion is separate from enrichment — we get raw data in, then let a
 * second pass attach AI summaries. This keeps the fetch fast and the
 * retry story simple (enrichment can fail without losing ingestion data).
 */

import Parser from 'rss-parser';
import { POLICY_SOURCES } from './sources.js';

const FR_API_BASE = 'https://www.federalregister.gov/api/v1/documents.json';
const FR_PER_PAGE = 100;
// Default document types to ingest from Federal Register. 'Rule' and
// 'Proposed Rule' are the high-signal ones for investors; we exclude
// 'Notice' by default as it covers routine admin stuff like meeting
// agendas. Can be widened later.
const FR_DOC_TYPES = ['RULE', 'PRORULE'];

const rssParser = new Parser({ timeout: 20_000 });

/**
 * Map Federal Register document types to our internal status vocabulary.
 * Status represents where a policy is in its lifecycle.
 */
function statusFromFederalRegister(doc) {
  const type = doc.type ?? doc.subtype ?? '';
  if (type === 'Proposed Rule' || type === 'PRORULE') return 'proposed';
  if (type === 'Rule' || type === 'RULE') {
    // If effective date is in the future, it's enacted-but-not-yet-in-force
    if (doc.effective_on) {
      const effective = new Date(doc.effective_on);
      if (effective > new Date()) return 'enacted_pending_effective';
      return 'in_force';
    }
    return 'enacted';
  }
  if (type === 'Notice') return 'notice';
  return 'unknown';
}

/**
 * Fetch all Federal Register documents for a specific agency within the
 * past N days. Paginates automatically. Returns normalized policy rows.
 */
async function fetchFederalRegister(source, { sinceDays = 1, maxDocs = 500 } = {}) {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const sinceStr = since.toISOString().slice(0, 10);

  const docs = [];
  let page = 1;

  while (docs.length < maxDocs) {
    const params = new URLSearchParams({
      'conditions[agencies][]': source.agency_slug,
      'conditions[publication_date][gte]': sinceStr,
      'conditions[type][]': '', // set via multiple params below
      'per_page': String(Math.min(FR_PER_PAGE, maxDocs - docs.length)),
      'page': String(page),
      'order': 'newest',
    });
    // URLSearchParams doesn't deduplicate multi-value params, append directly
    params.delete('conditions[type][]');
    for (const t of FR_DOC_TYPES) {
      params.append('conditions[type][]', t);
    }

    const url = `${FR_API_BASE}?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Federal Register HTTP ${res.status}: ${await res.text().catch(() => '')}`);
    }
    const data = await res.json();
    const results = data.results ?? [];
    if (results.length === 0) break;

    for (const doc of results) {
      docs.push({
        external_source: source.slug,
        external_id: doc.document_number,
        jurisdiction: source.jurisdiction,
        agency: source.name,
        title: doc.title,
        status: statusFromFederalRegister(doc),
        document_type: doc.type,
        docket_id: Array.isArray(doc.docket_ids) ? doc.docket_ids[0] : doc.docket_id ?? null,
        published_at: doc.publication_date ? new Date(doc.publication_date).toISOString() : null,
        effective_date: doc.effective_on ? new Date(doc.effective_on).toISOString() : null,
        comment_close_date: doc.comments_close_on ? new Date(doc.comments_close_on).toISOString() : null,
        url: doc.html_url,
        abstract: doc.abstract ?? null,
        raw_payload: doc,
      });
    }

    if (!data.next_page_url) break;
    page += 1;
  }

  return docs;
}

/**
 * Fetch policies from an RSS-based source (EU, UK). Less structured than
 * Federal Register — we don't get effective dates or docket IDs reliably,
 * so those stay null and the AI enrichment will try to extract them.
 */
async function fetchRssSource(source, { sinceDays = 7 } = {}) {
  const feed = await rssParser.parseURL(source.feed_url);
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  const docs = [];
  for (const item of feed.items ?? []) {
    const pub = item.isoDate || item.pubDate;
    if (pub && new Date(pub) < since) continue;

    // Use the GUID (or URL as fallback) as the dedup key
    const externalId = item.guid || item.id || item.link;
    if (!externalId) continue;

    docs.push({
      external_source: source.slug,
      external_id: externalId,
      jurisdiction: source.jurisdiction,
      agency: source.name,
      title: item.title ?? '(untitled)',
      status: 'unknown',  // AI enrichment will refine
      document_type: 'rss_item',
      docket_id: null,
      published_at: pub ? new Date(pub).toISOString() : null,
      effective_date: null,
      comment_close_date: null,
      url: item.link,
      abstract: item.contentSnippet ?? item.summary ?? item.content ?? null,
      raw_payload: item,
    });
  }
  return docs;
}

/**
 * Upsert a single policy row. If it already exists (matched by
 * external_source + external_id), we update the existing row and log any
 * status change to policy_status_history.
 *
 * Returns:
 *   { action: 'inserted' | 'updated' | 'unchanged', id, prev_status }
 */
async function upsertPolicy(supabase, doc) {
  // Fetch existing by (external_source, external_id)
  const { data: existing, error: lookupErr } = await supabase
    .from('policies')
    .select('id, status, enrichment_status')
    .eq('external_source', doc.external_source)
    .eq('external_id', doc.external_id)
    .maybeSingle();

  if (lookupErr) throw new Error(`Lookup failed: ${lookupErr.message}`);

  const payload = {
    external_source: doc.external_source,
    external_id: doc.external_id,
    jurisdiction: doc.jurisdiction,
    agency: doc.agency,
    title: doc.title,
    status: doc.status,
    document_type: doc.document_type,
    docket_id: doc.docket_id,
    published_at: doc.published_at,
    effective_date: doc.effective_date,
    comment_deadline: doc.comment_close_date,
    source_url: doc.url,
    abstract: doc.abstract,
    raw_payload: doc.raw_payload,
    fetched_at: new Date().toISOString(),
  };

  if (!existing) {
    // New policy: insert with enrichment_status 'pending' so the enrichment
    // worker picks it up on the next pass.
    payload.enrichment_status = 'pending';
    payload.enrichment_attempts = 0;

    const { data: inserted, error: insertErr } = await supabase
      .from('policies')
      .insert(payload)
      .select('id')
      .single();

    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);

    // Seed the history with the initial status
    await supabase.from('policy_status_history').insert({
      policy_id: inserted.id,
      from_status: null,
      to_status: doc.status,
      source_event: 'ingestion_new',
    });

    return { action: 'inserted', id: inserted.id, prev_status: null };
  }

  // Existing policy: update, and if status changed, log the transition.
  const statusChanged = existing.status !== doc.status;

  const { error: updateErr } = await supabase
    .from('policies')
    .update(payload)
    .eq('id', existing.id);
  if (updateErr) throw new Error(`Update failed: ${updateErr.message}`);

  if (statusChanged) {
    await supabase.from('policy_status_history').insert({
      policy_id: existing.id,
      from_status: existing.status,
      to_status: doc.status,
      source_event: 'ingestion_update',
    });
  }

  return {
    action: statusChanged ? 'updated' : 'unchanged',
    id: existing.id,
    prev_status: existing.status,
  };
}

/**
 * Ingest a single source. Called by ingestAllPolicySources() and by the
 * backfill script.
 */
export async function ingestOneSource(supabase, source, { sinceDays = 1, maxDocs = 500 } = {}) {
  const stats = {
    source_slug: source.slug,
    docs_fetched: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    errors: [],
  };

  try {
    let docs = [];
    if (source.type === 'federal_register') {
      docs = await fetchFederalRegister(source, { sinceDays, maxDocs });
    } else if (source.type === 'rss') {
      docs = await fetchRssSource(source, { sinceDays });
    } else {
      stats.errors.push(`Unknown source type: ${source.type}`);
      return stats;
    }
    stats.docs_fetched = docs.length;

    for (const doc of docs) {
      try {
        const { action } = await upsertPolicy(supabase, doc);
        stats[action] += 1;
      } catch (err) {
        stats.errors.push({ external_id: doc.external_id, message: err.message });
      }
    }
  } catch (err) {
    stats.errors.push({ message: `Source fetch failed: ${err.message}` });
  }

  return stats;
}

/**
 * Entrypoint for the daily cron. Runs all sources in sequence (not
 * parallel) to be gentle on rate limits.
 */
export async function ingestAllPolicySources(supabase, { sinceDays = 1 } = {}) {
  const overall = {
    sources_attempted: 0,
    sources_succeeded: 0,
    total_inserted: 0,
    total_updated: 0,
    per_source: [],
  };

  for (const source of POLICY_SOURCES) {
    overall.sources_attempted += 1;
    const s = await ingestOneSource(supabase, source, { sinceDays });
    if (s.errors.length === 0 || s.docs_fetched > 0) overall.sources_succeeded += 1;
    overall.total_inserted += s.inserted;
    overall.total_updated += s.updated;
    overall.per_source.push(s);
  }

  return overall;
}
