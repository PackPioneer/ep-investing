/**
 * scripts/embed-backfill.js
 *
 * Generates embeddings for articles that have been enriched (summary +
 * tags populated) but don't yet have an embedding. Use this once after
 * Phase 3B deploys to embed your 212 existing articles.
 *
 * Cost: text-embedding-3-small is $0.02/1M tokens. 212 articles × ~200
 * tokens each ≈ 42k tokens = about $0.001. Takes ~15 seconds.
 *
 * Run with:
 *   node scripts/embed-backfill.js
 *
 * Options (via env):
 *   BATCH=50   articles per OpenAI batch call (default 50)
 *   MAX=500    hard cap on total articles to process
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { buildArticleEmbeddingText, embedTexts } from '../lib/news/embeddings.js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BATCH = parseInt(process.env.BATCH ?? '50', 10);
const MAX = process.env.MAX ? parseInt(process.env.MAX, 10) : Infinity;

async function countMissing() {
  const { count, error } = await supabase
    .from('news_articles')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
    .eq('enrichment_status', 'done');
  if (error) throw new Error(`Count missing failed: ${error.message}`);
  return count ?? 0;
}

async function fetchBatch(limit) {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id, title, excerpt, summary_factual, classification, sector_tags, geography_tags')
    .is('embedding', null)
    .eq('enrichment_status', 'done')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw new Error(`Fetch batch failed: ${error.message}`);
  return data ?? [];
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY in .env.local');
    process.exit(1);
  }

  const missingBefore = await countMissing();
  console.log(`Articles needing embeddings: ${missingBefore}`);

  if (missingBefore === 0) {
    console.log('Nothing to do.');
    return;
  }

  const target = Math.min(missingBefore, MAX);
  console.log(`Processing up to ${target} articles in batches of ${BATCH}.\n`);

  let totalSucceeded = 0;
  let totalFailed = 0;
  let round = 0;

  while (totalSucceeded + totalFailed < target) {
    round += 1;
    const remaining = target - totalSucceeded - totalFailed;
    const thisBatch = Math.min(BATCH, remaining);

    const articles = await fetchBatch(thisBatch);
    if (articles.length === 0) break;

    const start = Date.now();
    const texts = articles.map((a) => buildArticleEmbeddingText(a));

    try {
      const vectors = await embedTexts(texts);

      // Update rows one at a time — Supabase doesn't have a batch vector
      // update primitive but individual updates are fast at this scale.
      for (let i = 0; i < articles.length; i += 1) {
        const { error } = await supabase
          .from('news_articles')
          .update({ embedding: vectors[i] })
          .eq('id', articles[i].id);
        if (error) {
          totalFailed += 1;
          console.log(`  ! article ${articles[i].id}: ${error.message}`);
        } else {
          totalSucceeded += 1;
        }
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  Batch ${round}: ${articles.length} embedded (${elapsed}s) — running total: ${totalSucceeded}/${target}`);
    } catch (err) {
      totalFailed += articles.length;
      console.log(`  Batch ${round}: OpenAI call failed — ${err.message}`);
    }
  }

  const missingAfter = await countMissing();
  console.log(`\nDone. Embedded ${totalSucceeded} articles, ${totalFailed} failed.`);
  console.log(`Still missing embeddings: ${missingAfter}`);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
