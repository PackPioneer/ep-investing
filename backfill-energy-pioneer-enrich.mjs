/**
 * Backfill The Energy Pioneer — PHASE B, STEP 2: ENRICH.
 *
 * Runs the existing enrichment pipeline over pending articles in batches until
 * none remain. This extracts entities (-> news_entities, which lights up the
 * "In the News" sections on matching company profiles), sector tags, summaries,
 * and embeddings — identical to the daily cron, just run now in a batch.
 *
 * Reuses lib/news/enrichment.js enrichPending() so results match production.
 *
 * Run from repo root:
 *   node --env-file=.env.local backfill-energy-pioneer-enrich.mjs
 *
 * Note: this makes model calls (Haiku + Sonnet + embeddings) per article.
 * ~119 articles -> a few dollars, a few minutes. Safe to re-run; it only
 * processes whatever is still 'pending'.
 */

import { createClient } from '@supabase/supabase-js';
import { enrichPending } from './lib/news/enrichment.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const BATCH = 30;        // match the cron's per-run size
const CONCURRENCY = 5;   // match the cron's concurrency

async function pendingCount() {
  const { count } = await supabase
    .from('news_articles')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'pending');
  return count ?? 0;
}

async function main() {
  console.log('PHASE B — ENRICH. Processing pending articles in batches.\n');

  let totalBefore = await pendingCount();
  console.log(`Pending articles (all sources): ${totalBefore}\n`);
  if (totalBefore === 0) {
    console.log('Nothing pending. Done.');
    return;
  }

  let round = 0;
  while (true) {
    const remaining = await pendingCount();
    if (remaining === 0) break;
    round += 1;
    console.log(`Round ${round}: ${remaining} pending, enriching up to ${BATCH}...`);

    const result = await enrichPending(supabase, { limit: BATCH, concurrency: CONCURRENCY });
    console.log(`  -> ${JSON.stringify(result)}`);

    // Safety stop: if a round made no progress, bail to avoid an infinite loop.
    const after = await pendingCount();
    if (after >= remaining) {
      console.log('  No progress this round — stopping to avoid a loop. Check for stuck articles.');
      break;
    }
    // gentle pause between batches
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log('\nDONE. Enrichment complete (or stopped). Company profiles with');
  console.log('matching coverage now show Energy Pioneer articles in "In the News".');
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
