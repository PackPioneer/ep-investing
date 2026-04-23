/**
 * app/api/news/for-you/route.js
 *
 * Returns the authenticated user's personalized news feed, ranked by
 * rank_news_for_user() in the database.
 *
 *   GET /api/news/for-you              → top 50 articles
 *   GET /api/news/for-you?limit=5      → top 5 (for dashboard tab)
 *   GET /api/news/for-you?offset=50    → paginate
 *
 * Any authenticated user gets a feed. If they have no embedding yet, the
 * ranking SQL degrades gracefully — semantic similarity scores 0.5 for
 * everyone and the feed effectively becomes recency + credibility +
 * pipeline-matches based.
 *
 * Separate from /api/news (the chronological public feed) — different
 * sort, different access rules.
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Caps on what a single request can fetch. Prevents anyone from dumping
// the whole corpus via /api/news/for-you?limit=100000.
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export async function GET(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10);
  const rawOffset = parseInt(searchParams.get('offset') ?? '', 10);
  const rawMaxAge = parseInt(searchParams.get('max_age_days') ?? '', 10);

  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  const maxAgeDays = Number.isFinite(rawMaxAge) && rawMaxAge > 0 ? rawMaxAge : 14;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await supabase.rpc('rank_news_for_user', {
    p_clerk_user_id: userId,
    p_limit: limit,
    p_offset: offset,
    p_max_age_days: maxAgeDays,
  });

  if (error) {
    return NextResponse.json(
      { error: 'Ranking failed', detail: error.message },
      { status: 500 }
    );
  }

  // Check if the user has an embedding; useful for UI to show "add
  // preferences for better picks" nudge if not.
  const { data: prefs } = await supabase
    .from('user_news_preferences')
    .select('user_embedding, embedding_updated_at')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  const hasEmbedding = Boolean(prefs?.user_embedding);

  return NextResponse.json({
    articles: data ?? [],
    has_embedding: hasEmbedding,
    embedding_updated_at: prefs?.embedding_updated_at ?? null,
  });
}
