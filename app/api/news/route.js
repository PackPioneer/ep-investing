/**
 * app/api/news/route.js
 *
 * Chronological news feed (for "Latest" sort on /news).
 *
 *   GET /api/news                            → latest 25 articles
 *   GET /api/news?classification=funding     → filter by type
 *   GET /api/news?region=us                  → filter by region
 *   GET /api/news?source=canary-media        → filter by source
 *   GET /api/news?limit=25&offset=25         → paginate
 *
 * Unauthenticated users get a limited teaser (no pagination beyond page 1);
 * authenticated users get full access. This matches the existing /news page
 * behavior we had before Phase 3C — we're just extracting it to an API route
 * so the same endpoint serves both the page and the dashboard widgets.
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;
const UNAUTH_TEASER_COUNT = 3;

export async function GET(request) {
  const { userId } = await auth();
  const isAuthed = Boolean(userId);

  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10);
  const rawOffset = parseInt(searchParams.get('offset') ?? '', 10);

  const limit = isAuthed
    ? (Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT)
    : UNAUTH_TEASER_COUNT;
  const offset = isAuthed && Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  const classification = searchParams.get('classification');
  const region = searchParams.get('region');
  const sourceSlug = searchParams.get('source');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  let query = supabase
    .from('news_articles')
    .select(`
      id, title, url, excerpt, summary_factual, published_at, image_url,
      classification, geography_tags, sector_tags,
      is_secondary_source, primary_source_attribution,
      source:news_sources ( id, slug, name, homepage_url, attribution_label, region, credibility_tier )
    `)
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (classification) query = query.eq('classification', classification);

  if (sourceSlug) {
    const { data: src } = await supabase
      .from('news_sources')
      .select('id')
      .eq('slug', sourceSlug)
      .single();
    if (src?.id) query = query.eq('source_id', src.id);
  }

  if (region) {
    const { data: srcIds } = await supabase
      .from('news_sources')
      .select('id')
      .eq('region', region);
    const ids = (srcIds ?? []).map((r) => r.id);
    if (ids.length > 0) query = query.in('source_id', ids);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: data ?? [],
    authed: isAuthed,
  });
}
