/**
 * Backfill The Energy Pioneer articles into news_articles (source_id 6).
 *
 * PHASE A — DRY RUN. Writes nothing. Fetches all posts from the WordPress
 * REST API, compares against what's already ingested, and reports what's new.
 *
 * Run from repo root:
 *   node --env-file=.env.local backfill-energy-pioneer-dryrun.mjs
 *
 * Phase B (the execute version) inserts the new ones and enriches them.
 */

import { createClient } from '@supabase/supabase-js';
import { hashUrl, normalizeUrl } from './lib/news/url-hash.js';

const WP_BASE = 'https://theenergypioneer.com/wp-json/wp/v2/posts';
const SOURCE_ID = 6; // The Energy Pioneer

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Pull all posts, paginating until exhausted.
async function fetchAllPosts() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${WP_BASE}?per_page=100&page=${page}&_fields=id,date_gmt,link,title,excerpt`;
    const res = await fetch(url);
    if (res.status === 400) break; // WP returns 400 when page exceeds total
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

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim();
}

async function main() {
  console.log('PHASE A — DRY RUN. Nothing will be written.\n');

  const posts = await fetchAllPosts();
  console.log(`Fetched ${posts.length} posts from the WordPress API.\n`);

  // Existing source-6 url_hashes, to dedup.
  const { data: existing, error } = await supabase
    .from('news_articles')
    .select('url_hash')
    .eq('source_id', SOURCE_ID);
  if (error) {
    console.error('Supabase query failed:', error.message);
    process.exit(1);
  }
  const existingHashes = new Set((existing || []).map((r) => r.url_hash));
  console.log(`Already ingested for source ${SOURCE_ID}: ${existingHashes.size}\n`);

  const newPosts = [];
  for (const p of posts) {
    let urlHash;
    try {
      urlHash = hashUrl(p.link);
    } catch {
      urlHash = null;
    }
    if (urlHash && !existingHashes.has(urlHash)) {
      newPosts.push({
        title: stripHtml(p.title?.rendered),
        url: p.link,
        published_at: p.date_gmt ? new Date(p.date_gmt + 'Z').toISOString() : null,
      });
    }
  }

  console.log(`NEW posts to ingest: ${newPosts.length}\n`);
  newPosts.forEach((p, i) =>
    console.log(`  ${String(i + 1).padStart(3)}. ${p.title}`)
  );

  console.log(`\nSummary: ${posts.length} total, ${existingHashes.size} already in, ${newPosts.length} new.`);
  console.log('DRY RUN COMPLETE. No data written.');
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
