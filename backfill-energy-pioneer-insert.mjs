/**
 * Backfill The Energy Pioneer — PHASE B, STEP 1: INSERT.
 *
 * Fetches all WordPress posts (with full content), dedups against existing
 * source-6 articles by url_hash, and inserts the new ones into news_articles
 * with enrichment_status='pending'. Does NOT enrich — run the enrich script
 * after, once you've confirmed the rows landed.
 *
 * Idempotent: upsert on url_hash with ignoreDuplicates, so re-running is safe.
 *
 * Run from repo root:
 *   node --env-file=.env.local backfill-energy-pioneer-insert.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { hashUrl } from './lib/news/url-hash.js';

const WP_BASE = 'https://theenergypioneer.com/wp-json/wp/v2/posts';
const SOURCE_ID = 6;
const MAX_RAW_CONTENT = 12000; // match the pipeline's truncation

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function fetchAllPosts() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${WP_BASE}?per_page=100&page=${page}&_fields=id,date_gmt,link,title,excerpt,content`;
    const res = await fetch(url);
    if (res.status === 400) break;
    if (!res.ok) throw new Error(`WP API ${res.status} on page ${page}`);
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
    if (page >= totalPages) break;
    page += 1;
  }
  return all;
}

// Decode common HTML entities and strip tags -> clean plain text.
function cleanText(html) {
  if (!html) return '';
  let t = html.replace(/<[^>]*>/g, ' ');
  const entities = {
    '&#8217;': '\u2019', '&#8216;': '\u2018', '&#8220;': '\u201C', '&#8221;': '\u201D',
    '&#8211;': '\u2013', '&#8212;': '\u2014', '&#038;': '&', '&amp;': '&',
    '&#8230;': '\u2026', '&nbsp;': ' ', '&quot;': '"', '&lt;': '<', '&gt;': '>',
    '&#039;': "'", '&apos;': "'",
  };
  for (const [k, v] of Object.entries(entities)) t = t.split(k).join(v);
  // any remaining numeric entities
  t = t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
  return t.replace(/\s+/g, ' ').trim();
}

function truncate(s, n) {
  return s && s.length > n ? s.slice(0, n) : s;
}

async function main() {
  console.log('PHASE B — INSERT. Fetching posts...\n');
  const posts = await fetchAllPosts();
  console.log(`Fetched ${posts.length} posts.`);

  const { data: existing } = await supabase
    .from('news_articles')
    .select('url_hash')
    .eq('source_id', SOURCE_ID);
  const existingHashes = new Set((existing || []).map((r) => r.url_hash));
  console.log(`Already ingested: ${existingHashes.size}`);

  const rows = [];
  for (const p of posts) {
    let urlHash;
    try { urlHash = hashUrl(p.link); } catch { continue; }
    if (!urlHash || existingHashes.has(urlHash)) continue;

    rows.push({
      url: p.link,
      url_hash: urlHash,
      title: cleanText(p.title?.rendered),
      excerpt: truncate(cleanText(p.excerpt?.rendered), 1000),
      raw_content: truncate(cleanText(p.content?.rendered), MAX_RAW_CONTENT),
      published_at: p.date_gmt ? new Date(p.date_gmt + 'Z').toISOString() : null,
      source_id: SOURCE_ID,
      enrichment_status: 'pending',
    });
  }

  console.log(`New rows to insert: ${rows.length}\n`);
  if (rows.length === 0) {
    console.log('Nothing to insert. Done.');
    return;
  }

  // Insert in chunks, upserting on url_hash (idempotent).
  let inserted = 0;
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await supabase
      .from('news_articles')
      .upsert(chunk, { onConflict: 'url_hash', ignoreDuplicates: true })
      .select('id');
    if (error) {
      console.error(`Insert chunk ${i / CHUNK + 1} failed: ${error.message}`);
      continue;
    }
    inserted += data?.length ?? 0;
    console.log(`  chunk ${i / CHUNK + 1}: inserted ${data?.length ?? 0}`);
  }

  console.log(`\nDONE. Inserted ${inserted} new articles (status=pending).`);
  console.log('Next: run the enrich script to extract entities and light up profiles.');
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
