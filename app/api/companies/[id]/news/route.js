/**
 * app/api/companies/[id]/news/route.js
 *
 * "In the News" for a company profile.
 *   1. Company-specific mentions: news_entities matched to the company name.
 *   2. Fallback: if no direct mentions, recent news in the company's sector(s).
 *
 * Returns { mode: 'company' | 'sector' | 'none', sector?, items: [...] }
 * so the UI can label the section honestly.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const LIMIT = 5;

export async function GET(request, { params }) {
  const { id } = await params;
  const companyId = parseInt(id, 10);
  if (!Number.isFinite(companyId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  // Get the company name + sector tags.
const { data: company, error: cErr } = await supabase
    .from('companies')
    .select('name, sector, industry_tags')
    .eq('id', companyId)
    .maybeSingle();

  if (cErr || !company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  // 1) Company-specific mentions via news_entities (strict name match).
  if (company.name) {
    const { data: entityRows } = await supabase
      .from('news_entities')
      .select('article_id')
      .eq('entity_type', 'company')
      .ilike('entity_name', company.name);

    const articleIds = [...new Set((entityRows || []).map((r) => r.article_id))];
    if (articleIds.length > 0) {
      const { data: arts } = await supabase
        .from('news_articles')
        .select('id, title, url, published_at, source_id, news_sources(name)')
        .in('id', articleIds)
        .eq('enrichment_status', 'done')
        .order('published_at', { ascending: false })
        .limit(LIMIT);

      if (arts && arts.length > 0) {
        return NextResponse.json({
          mode: 'company',
          items: arts.map(formatArticle),
        });
      }
    }
  }

  // 2) Sector fallback — recent news whose sector_tags overlap the company's.
  const sectorTags = (company.industry_tags && company.industry_tags.length
    ? company.industry_tags
    : (company.sector ? [company.sector] : [])) || [];

  if (sectorTags.length > 0) {
    const { data: arts } = await supabase
      .from('news_articles')
      .select('id, title, url, published_at, source_id, sector_tags, news_sources(name)')
      .eq('enrichment_status', 'done')
      .overlaps('sector_tags', sectorTags)
      .order('published_at', { ascending: false })
      .limit(LIMIT);

    if (arts && arts.length > 0) {
      return NextResponse.json({
        mode: 'sector',
        sector: sectorTags[0],
        items: arts.map(formatArticle),
      });
    }
  }

  return NextResponse.json({ mode: 'none', items: [] });
}

function formatArticle(a) {
  return {
    id: a.id,
    title: a.title,
    url: a.url,
    published_at: a.published_at,
    source_name: a.news_sources?.name || null,
  };
}
