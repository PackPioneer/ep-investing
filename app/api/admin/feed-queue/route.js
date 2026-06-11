/**
 * app/api/admin/feed-queue/route.js
 *
 * Backs the admin curation queue UI.
 *
 *   GET    /api/admin/feed-queue            → list pending candidates
 *   POST   /api/admin/feed-queue  (approve) → copy candidate into company_feed_items
 *   POST   /api/admin/feed-queue  (reject)  → mark candidate rejected
 *
 * Approve accepts edited values (category/importance/title/body/published_at),
 * so the admin can fix the draft before it goes live. published_at defaults to
 * now() so "this just in" reflects when it was surfaced.
 */

import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = ['capital', 'grant', 'policy', 'industry'];

function supa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = supa();
  const { data, error } = await supabase
    .from('candidate_feed_items')
    .select('*')
    .eq('status', 'pending')
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach the source article url so the admin can verify before approving.
  const articleIds = [...new Set((data || []).map((c) => c.source_article_id).filter(Boolean))];
  let urlMap = {};
  if (articleIds.length) {
    const { data: arts } = await supabase
      .from('news_articles')
      .select('id, url, title')
      .in('id', articleIds);
    urlMap = Object.fromEntries((arts || []).map((a) => [a.id, { url: a.url, title: a.title }]));
  }

  const candidates = (data || []).map((c) => ({
    ...c,
    source_article_url: c.source_article_id ? urlMap[c.source_article_id]?.url ?? null : null,
    source_article_title: c.source_article_id ? urlMap[c.source_article_id]?.title ?? null : null,
  }));

  return NextResponse.json({ candidates });
}

export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { action, id } = body;
  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action (approve|reject) and id required' }, { status: 400 });
  }

  const supabase = supa();

  // Load the candidate.
  const { data: cand, error: loadErr } = await supabase
    .from('candidate_feed_items')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (loadErr || !cand) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
  }
  if (cand.status !== 'pending') {
    return NextResponse.json({ error: `Already ${cand.status}` }, { status: 409 });
  }

  if (action === 'reject') {
    await supabase
      .from('candidate_feed_items')
      .update({ status: 'rejected', reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq('id', id);
    return NextResponse.json({ ok: true });
  }

  // approve — use edited values from the request if present, else the draft.
  const edits = body.edits || {};
  const category = VALID_CATEGORIES.includes(edits.category) ? edits.category : cand.category;
  const importance = [1, 2, 3].includes(Number(edits.importance)) ? Number(edits.importance) : cand.importance;
  const title = typeof edits.title === 'string' && edits.title.trim() ? edits.title.trim() : cand.title;
  const bodyText = typeof edits.body === 'string' ? edits.body : cand.body;
  const publishedAt = edits.published_at ? new Date(edits.published_at).toISOString() : new Date().toISOString();

  if (!category) {
    return NextResponse.json({ error: 'Category required to approve' }, { status: 400 });
  }

  // Insert into the live table.
  const { data: live, error: insErr } = await supabase
    .from('company_feed_items')
    .insert({
      category,
      title,
      body: bodyText,
      link_url: cand.link_url || cand.source_article_url || null,
      entity_type: cand.entity_type,
      entity_id: cand.entity_id,
      topics: cand.topics || [],
      geography_tags: cand.geography_tags || [],
      importance,
      source: 'news_derived',
      published_at: publishedAt,
    })
    .select('id')
    .single();

  if (insErr) {
    return NextResponse.json({ error: `Publish failed: ${insErr.message}` }, { status: 500 });
  }

  // Mark the candidate approved and link to the published item.
  await supabase
    .from('candidate_feed_items')
    .update({
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      published_item_id: live.id,
    })
    .eq('id', id);

  return NextResponse.json({ ok: true, published_item_id: live.id });
}
