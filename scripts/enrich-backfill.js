/**
 * scripts/enrich-backfill.js
 *
 * Processes pending articles from the terminal until the queue is empty.
 * Use this once after the initial Phase 2 deploy to enrich the 195 articles
 * already in your DB. Running it here instead of waiting on the daily cron
 * means you see results in minutes, not weeks.
 *
 * Run with:
 *   node scripts/enrich-backfill.js
 *
 * Options (pass via env vars):
 *   BATCH=50         articles per batch (default 50)
 *   CONCURRENCY=8    parallel Anthropic calls (default 5)
 *   MAX=200          hard cap on total articles to process (default unlimited)
 *
 * Cost: at ~$0.0085/article (Haiku + Sonnet), backfilling 200 articles = ~$1.70.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { enrichPending } from '../lib/news/enrichment.js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BATCH = parseInt(process.env.BATCH ?? '50', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY ?? '5', 10);
const MAX = process.env.MAX ? parseInt(process.env.MAX, 10) : Infinity;

async function countPending() {
  const { count, error } = await supabase
    .from('news_articles')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'pending')
    .lt('enrichment_attempts', 3);
  if (error) throw new Error(`Count pending failed: ${error.message}`);
  return count ?? 0;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY in .env.local');
    process.exit(1);
  }

  const pendingBefore = await countPending();
  console.log(`Pending articles to enrich: ${pendingBefore}`);

  if (pendingBefore === 0) {
    console.log('Nothing to do. All articles already enriched.');
    return;
  }

  const target = Math.min(pendingBefore, MAX);
  console.log(`Processing up to ${target} articles in batches of ${BATCH} (concurrency ${CONCURRENCY}).\n`);

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  let round = 0;

  while (totalProcessed < target) {
    round += 1;
    const remaining = target - totalProcessed;
    const thisBatch = Math.min(BATCH, remaining);

    const start = Date.now();
    const result = await enrichPending(supabase, {
      limit: thisBatch,
      concurrency: CONCURRENCY,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    totalProcessed += result.processed;
    totalSucceeded += result.succeeded;
    totalFailed += result.failed;

    console.log(
      `  Batch ${round}: ${result.succeeded}✓ ${result.failed}✗ ` +
      `(${elapsed}s) — running total: ${totalSucceeded}/${totalProcessed}`
    );

    if (result.errors.length > 0) {
      for (const e of result.errors.slice(0, 3)) {
        console.log(`    ! article ${e.article_id}: ${e.message}`);
      }
      if (result.errors.length > 3) {
        console.log(`    ... and ${result.errors.length - 3} more errors`);
      }
    }

    // If the query returned fewer articles than requested, we've drained
    // the pending queue (or all remaining articles have hit retry cap).
    if (result.processed < thisBatch) break;
  }

  const pendingAfter = await countPending();
  console.log(`\nDone. Enriched ${totalSucceeded} articles, ${totalFailed} failed.`);
  console.log(`Pending remaining: ${pendingAfter}`);

  if (totalFailed > 0) {
    console.log(
      '\nFailed articles have enrichment_status="failed" in the DB. ' +
      'Inspect enrichment_error on those rows for details. To retry them, ' +
      'run: UPDATE news_articles SET enrichment_status=\'pending\', enrichment_attempts=0 WHERE enrichment_status=\'failed\';'
    );
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
