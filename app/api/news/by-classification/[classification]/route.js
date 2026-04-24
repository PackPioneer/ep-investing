/**
 * app/api/news/by-classification/[classification]/route.js
 *
 * Returns recent news articles filtered to a single classification.
 * One endpoint serves all the "signal-specific" dashboard widgets:
 * IPO, leadership changes, earnings, fund closes.
 *
 *   GET /api/news/by-classification/ipo                 → recent IPOs
 *   GET /api/news/by-classification/leadership_change   → recent hires
 *   GET /api/news/by-classification/earnings?limit=10   → earnings
 *   GET /api/news/by-classification/fund_close          → fund closes
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Whitelist to prevent arbitrary classifications from hitting the DB
const ALLOWED = new Set([
  'ipo',
  'leadership_change',
  'earnings',
  'fund_close',
  'funding',
  'm_and_a',
  'policy',
  'regulatory',
  'product',
  'market',
  'partnership',
  'other',
]);

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const classification = resolvedParams?.classification;

  if (!classification || !ALLOWED.has(classification)) {
    return NextResponse.json({ error: 'Invalid classification' }, { status: 400 });
  }

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
      source:news_sources ( id, slug, name, homepage_url, attribution_label, credibility_tier )
    `)
    .eq('classification', classification)
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
