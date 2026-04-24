/**
 * app/api/news/ma-pulse/route.js
 *
 * Returns recent M&A-classified news articles. No new data — just a
 * filtered view of our existing news corpus.
 *
 *   GET /api/news/ma-pulse                → top N most recent
 *   GET /api/news/ma-pulse?limit=5        → tune count
 *   GET /api/news/ma-pulse?sector=solar   → filter by sector
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
  const sector = searchParams.get('sector');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  let query = supabase
    .from('news_articles')
    .select(`
      id, title, url, excerpt, summary_factual, published_at, image_url,
      classification, geography_tags, sector_tags, deal_size_usd,
      is_secondary_source, primary_source_attribution,
      source:news_sources ( id, slug, name, homepage_url, attribution_label, credibility_tier )
    `)
    .eq('classification', 'm_and_a')
    .eq('enrichment_status', 'done')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (sector) query = query.contains('sector_tags', [sector]);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data ?? [] });
}
