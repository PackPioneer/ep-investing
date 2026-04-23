/**
 * app/api/policies/for-you/route.js
 *
 * Personalized policy feed. Calls rank_policies_for_user() which scores
 * policies by user sector match + recency + jurisdiction + status.
 *
 *   GET /api/policies/for-you?limit=5       → top 5 for dashboard widget
 *   GET /api/policies/for-you?limit=50      → full feed
 *   GET /api/policies/for-you?status=proposed&limit=5
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 5;

export async function GET(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10);
  const status = searchParams.get('status');
  const jurisdiction = searchParams.get('jurisdiction');

  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.rpc('rank_policies_for_user', {
    p_clerk_user_id: userId,
    p_limit: limit,
    p_offset: 0,
    p_status_filter: status,
    p_jurisdiction_filter: jurisdiction,
  });

  if (error) {
    return NextResponse.json(
      { error: 'Ranking failed', detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ policies: data ?? [] });
}
