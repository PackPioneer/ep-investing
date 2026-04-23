/**
 * scripts/policies-backfill.js
 *
 * One-shot ingestion of the last 30 days of policies from all configured
 * sources. Run once after Phase 4A deploy. After that the daily cron
 * takes over with sinceDays=1.
 *
 * Run with:
 *   node scripts/policies-backfill.js
 *
 * Options (via env):
 *   BACKFILL_DAYS=30     number of days to go back
 *   MAX_DOCS=500         hard cap per source
 *   ENRICH=true          also run enrichment after ingestion (default true)
 *   ENRICH_LIMIT=200     max to enrich this run
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ingestAllPolicySources } from '../lib/policies/ingestion.js';
import { enrichPendingPolicies } from '../lib/policies/enrichment.js';

dotenv.config({ path: '.env.local' });

const BACKFILL_DAYS = parseInt(process.env.BACKFILL_DAYS ?? '30', 10);
const ENRICH = process.env.ENRICH !== 'false';
const ENRICH_LIMIT = parseInt(process.env.ENRICH_LIMIT ?? '200', 10);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  if (!process.env.ANTHROPIC_API_KEY && ENRICH) {
    console.error('Missing ANTHROPIC_API_KEY (set ENRICH=false to skip enrichment)');
    process.exit(1);
  }

  console.log(`Backfilling policies for the last ${BACKFILL_DAYS} days...`);
  const ingestStart = Date.now();
  const ingestStats = await ingestAllPolicySources(supabase, { sinceDays: BACKFILL_DAYS });
  const ingestDur = ((Date.now() - ingestStart) / 1000).toFixed(1);

  console.log(`\nIngestion complete (${ingestDur}s):`);
  console.log(`  Sources attempted: ${ingestStats.sources_attempted}`);
  console.log(`  Sources succeeded: ${ingestStats.sources_succeeded}`);
  console.log(`  New policies:      ${ingestStats.total_inserted}`);
  console.log(`  Updated policies:  ${ingestStats.total_updated}`);
  console.log(`\nPer-source breakdown:`);
  for (const s of ingestStats.per_source) {
    const errs = s.errors.length > 0 ? ` (${s.errors.length} errors)` : '';
    console.log(`  ${s.source_slug}: fetched ${s.docs_fetched}, inserted ${s.inserted}, updated ${s.updated}${errs}`);
    for (const err of s.errors.slice(0, 3)) {
      console.log(`    ! ${typeof err === 'string' ? err : err.message}`);
    }
  }

  if (!ENRICH) {
    console.log('\nSkipping enrichment (ENRICH=false).');
    return;
  }

  // Enrichment may need multiple rounds for large backfills since we limit
  // per run to avoid Anthropic rate limits
  console.log(`\nEnriching pending policies (up to ${ENRICH_LIMIT})...`);
  let totalEnriched = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let round = 0;

  while (totalEnriched + totalSkipped + totalFailed < ENRICH_LIMIT) {
    round += 1;
    const remaining = ENRICH_LIMIT - (totalEnriched + totalSkipped + totalFailed);
    const batchSize = Math.min(20, remaining);

    const start = Date.now();
    const stats = await enrichPendingPolicies(supabase, { limit: batchSize, concurrency: 3 });
    const dur = ((Date.now() - start) / 1000).toFixed(1);

    if (stats.processed === 0) {
      console.log('  No more pending policies.');
      break;
    }

    totalEnriched += stats.succeeded;
    totalSkipped += stats.skipped;
    totalFailed += stats.failed;

    console.log(`  Round ${round} (${dur}s): +${stats.succeeded} enriched, +${stats.skipped} skipped, +${stats.failed} failed`);
    for (const err of stats.errors.slice(0, 2)) {
      console.log(`    ! policy ${err.policy_id}: ${err.message}`);
    }
  }

  console.log(`\nEnrichment total: ${totalEnriched} done, ${totalSkipped} skipped (non-climate), ${totalFailed} failed`);

  const { count: pendingCount } = await supabase
    .from('policies')
    .select('id', { count: 'exact', head: true })
    .eq('enrichment_status', 'pending');
  console.log(`Remaining pending: ${pendingCount ?? 0}`);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
