/**
 * app/api/news/by-classification/[classification]/route.js
 *
 * Phase 8 update: when primary classification has zero results AND fallback=true,
 * return the most recent articles from the fallback pool for that classification,
 * tagged with meta._fallback=true so widgets can show a "Related activity" label.
 *
 * Fallback pools:
 *   ipo → funding (large deals preferred)
 *   fund_close → funding
 *   leadership_change → partnership
 *   earnings → market
 *
 *   GET /api/news/by-classification/ipo
 *   GET /api/news/by-classification/ipo?fallback=true    → may return funding articles
 *   GET /api/news/by-classification/ipo?fallback=true&exclude=123,456 → dedup across widgets
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const ALLOWED = new Set([
  'ipo', 'fund_close', 'leadership_change', 'earnings',
  'funding', 'm_and_a', 'policy', 'regulatory',
  'product', 'market', 'partnership', 'other',
]);

// When primary has 0 results, look here instead.
const FALLBACK_POOL = {
  ipo: 'funding',
  fund_close: 'funding',
  leadership_change: 'partnership',
  earnings: 'market',
};

async function fetchArticles(supabase, classification, limit, excludeIds = []) {
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

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

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
  const fallbackEnabled = searchParams.get('fallback') === 'true';
  const excludeRaw = searchParams.get('exclude') ?? '';
  const excludeIds = excludeRaw
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  try {
    // Try primary classification first
    const primary = await fetchArticles(supabase, classification, limit, excludeIds);

    if (primary.length > 0 || !fallbackEnabled) {
      return NextResponse.json({
        articles: primary,
        fallback: false,
        primary_classification: classification,
      });
    }

    // Primary empty & fallback enabled — look in the fallback pool
    const fallbackClass = FALLBACK_POOL[classification];
    if (!fallbackClass) {
      return NextResponse.json({
        articles: [],
        fallback: false,
        primary_classification: classification,
      });
    }

    const fallbackArticles = await fetchArticles(supabase, fallbackClass, limit, excludeIds);

    return NextResponse.json({
      articles: fallbackArticles,
      fallback: true,
      primary_classification: classification,
      fallback_classification: fallbackClass,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
