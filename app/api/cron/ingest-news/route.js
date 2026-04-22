/**
 * app/api/cron/ingest-news/route.js
 *
 * Vercel cron entry point for hourly news ingestion.
 *
 * Schedule in vercel.json. Protected by CRON_SECRET: Vercel sends
 * `Authorization: Bearer ${CRON_SECRET}` automatically on scheduled
 * invocations when that env var is set.
 *
 * Manual testing:
 *   curl https://epinvesting.com/api/cron/ingest-news \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ingestAllSources } from '@/lib/news/ingestion';

// Node runtime — rss-parser uses Node APIs that aren't available on Edge
export const runtime = 'nodejs';

// Route-level timeout. Ingestion should finish well under this; set high
// as insurance against one slow feed stalling the run.
export const maxDuration = 300;

// Never cache this route's response
export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Auth guard — Vercel cron sends Authorization: Bearer ${CRON_SECRET}
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

  try {
    const result = await ingestAllSources(supabase);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (err) {
    console.error('Ingestion failed:', err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
