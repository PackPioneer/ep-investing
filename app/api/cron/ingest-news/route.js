/**
 * app/api/cron/ingest-news/route.js
 *
 * Phase 3B update: after ingestion + enrichment, also refreshes user
 * embeddings that are older than 24h. Keeps everything in one cron to
 * stay within Vercel Hobby's 2-cron limit.
 *
 * Execution order:
 *   1. Ingest from all active sources → new rows in news_articles
 *   2. Enrich up to ENRICH_PER_RUN pending articles → summaries, tags,
 *      entities, embeddings
 *   3. Refresh user embeddings whose embedding_updated_at is null or >24h
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ingestAllSources } from '@/lib/news/ingestion';
import { enrichPending } from '@/lib/news/enrichment';
import { refreshAllUserEmbeddings } from '@/lib/news/user-embeddings';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const ENRICH_PER_RUN = 30;
const ENRICH_CONCURRENCY = 5;

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({
      error: 'Unauthorized',
      sent_prefix: (authHeader || '').slice(7, 11),
      sent_len: Math.max(0, (authHeader || '').length - 7),
      expected_prefix: cronSecret.slice(0, 4),
      expected_len: cronSecret.length,
    }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const response = {
    ingestion: null,
    enrichment: null,
    user_embeddings: null,
    started_at: new Date().toISOString(),
    completed_at: null,
  };

  try {
    response.ingestion = await ingestAllSources(supabase);

    response.enrichment = await enrichPending(supabase, {
      limit: ENRICH_PER_RUN,
      concurrency: ENRICH_CONCURRENCY,
    });

    // Refresh user embeddings. Don't let a failure here fail the whole cron —
    // ingestion + enrichment are more important. Errors are collected in
    // the response for debugging.
    try {
      response.user_embeddings = await refreshAllUserEmbeddings(supabase, {
        maxAgeHours: 24,
      });
    } catch (err) {
      response.user_embeddings = { error: err.message };
    }

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
