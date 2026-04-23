/**
 * app/api/policies/[id]/route.js
 *
 * Policy detail endpoint. Returns the policy plus:
 *   - Its status history (transitions over time from policy_status_history)
 *   - Related news articles (via find_related_articles_for_policy SQL function)
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams?.id ?? '', 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data: policy, error } = await supabase
    .from('policies')
    .select(`
      id, title, jurisdiction, agency, status, document_type, docket_id,
      published_at, effective_date, comment_deadline,
      sectors, affected_company_types, investor_implications, abstract,
      source_url, external_source, fetched_at, last_updated_at
    `)
    .eq('id', id)
    .single();

  if (error || !policy) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
  }

  const { data: history } = await supabase
    .from('policy_status_history')
    .select('from_status, to_status, changed_at, source_event, notes')
    .eq('policy_id', id)
    .order('changed_at', { ascending: true });

  const { data: related } = await supabase.rpc('find_related_articles_for_policy', {
    p_policy_id: id,
    p_limit: 10,
  });

  return NextResponse.json({
    policy,
    status_history: history ?? [],
    related_articles: related ?? [],
  });
}
