/**
 * app/api/dashboard/company-feed/route.js
 *
 * Returns the "this just in" briefing strip for the signed-in company user.
 * Calls rank_company_feed(), which ranks recent company_feed_items by
 * importance x recency, boosted for the user's followed topics/entities.
 *
 *   GET /api/dashboard/company-feed            → top 8
 *   GET /api/dashboard/company-feed?limit=5
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 8;

export async function GET(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.rpc('rank_company_feed', {
    p_clerk_user_id: userId,
    p_limit: limit,
    p_max_age_days: 10,
  });

  if (error) {
    return NextResponse.json(
      { error: 'Feed ranking failed', detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data ?? [] });
}
