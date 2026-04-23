/**
 * app/api/cron/ingest-news/route.js
 *
 * Phase 4A update: the daily cron now ALSO ingests and enriches policies.
 * Execution order:
 *   1. News ingestion from RSS sources
 *   2. News enrichment (Haiku + Sonnet + embeddings)
 *   3. Policy ingestion from Federal Register API + RSS
 *   4. Policy enrichment (Haiku + Sonnet)
 *   5. User embedding refresh
 *
 * All of this fits in one cron job to stay within Vercel Hobby's 2-cron
 * limit. Total duration is typically under 3 minutes.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ingestAllSources } from '@/lib/news/ingestion';
import { enrichPending } from '@/lib/news/enrichment';
import { refreshAllUserEmbeddings } from '@/lib/news/user-embeddings';
import { ingestAllPolicySources } from '@/lib/policies/ingestion';
import { enrichPendingPolicies } from '@/lib/policies/enrichment';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const NEWS_ENRICH_PER_RUN = 30;
const NEWS_ENRICH_CONCURRENCY = 5;
const POLICY_ENRICH_PER_RUN = 15;
const POLICY_ENRICH_CONCURRENCY = 3;

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
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
    news_ingestion: null,
    news_enrichment: null,
    policy_ingestion: null,
    policy_enrichment: null,
    user_embeddings: null,
    started_at: new Date().toISOString(),
    completed_at: null,
  };

  try {
    // 1. News
    response.news_ingestion = await ingestAllSources(supabase);
    response.news_enrichment = await enrichPending(supabase, {
      limit: NEWS_ENRICH_PER_RUN,
      concurrency: NEWS_ENRICH_CONCURRENCY,
    });

    // 2. Policies (new in Phase 4A)
    try {
      response.policy_ingestion = await ingestAllPolicySources(supabase, { sinceDays: 1 });
    } catch (err) {
      response.policy_ingestion = { error: err.message };
    }

    try {
      response.policy_enrichment = await enrichPendingPolicies(supabase, {
        limit: POLICY_ENRICH_PER_RUN,
        concurrency: POLICY_ENRICH_CONCURRENCY,
      });
    } catch (err) {
      response.policy_enrichment = { error: err.message };
    }

    // 3. User embeddings (don't block cron on failure)
    try {
      response.user_embeddings = await refreshAllUserEmbeddings(supabase, { maxAgeHours: 24 });
    } catch (err) {
      response.user_embeddings = { error: err.message };
    }

    response.completed_at = new Date().toISOString();
    return NextResponse.json({ ok: true, ...response }, { status: 200 });
  } catch (err) {
    console.error('Cron run failed:', err);
    response.completed_at = new Date().toISOString();
    return NextResponse.json({ ok: false, error: err.message, ...response }, { status: 500 });
  }
}
