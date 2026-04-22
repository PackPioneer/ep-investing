/**
 * app/api/cron/ingest-news/route.js
 *
 * Phase 2 update: after ingestion, enrich pending articles in the same cron
 * invocation. This keeps everything in one cron slot (important on Vercel
 * Hobby, which limits us to 2 daily crons).
 *
 * Execution order:
 *   1. Ingest from all active sources → new rows in news_articles
 *   2. Enrich up to ENRICH_PER_RUN pending articles → fills summary,
 *      classification, tags, entities
 *
 * If enrichment can't finish the backlog in one run, the leftover pending
 * articles get picked up on the next daily run. For first-time backfill,
 * use scripts/enrich-backfill.js from your terminal instead of relying on
 * the cron to chip through 200+ articles over a week.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ingestAllSources } from '@/lib/news/ingestion';
import { enrichPending } from '@/lib/news/enrichment';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// How many articles to enrich per cron run. At ~3-5s per article and
// concurrency=5, 30 articles finishes in ~30-60s. Adjust up if you're on
// Vercel Pro (300s timeout) and want the queue to drain faster.
const ENRICH_PER_RUN = 30;
const ENRICH_CONCURRENCY = 5;

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const response = {
    ingestion: null,
    enrichment: null,
    started_at: new Date().toISOString(),
    completed_at: null,
  };

  try {
    // 1. Ingest new articles from all sources
    response.ingestion = await ingestAllSources(supabase);

    // 2. Enrich pending articles (newly-inserted + any leftovers from
    //    previous runs that failed or were skipped)
    response.enrichment = await enrichPending(supabase, {
      limit: ENRICH_PER_RUN,
      concurrency: ENRICH_CONCURRENCY,
    });

    response.completed_at = new Date().toISOString();
    return NextResponse.json({ ok: true, ...response }, { status: 200 });
  } catch (err) {
    console.error('Cron run failed:', err);
    response.completed_at = new Date().toISOString();
    return NextResponse.json(
      { ok: false, error: err.message, ...response },
      { status: 500 }
    );
  }
}
