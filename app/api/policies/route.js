/**
 * app/api/policies/route.js
 *
 * List policies with filters. Primary endpoint for the /news/policy page.
 *
 *   GET /api/policies                        → all enriched policies, newest first
 *   GET /api/policies?status=proposed        → filter by status
 *   GET /api/policies?jurisdiction=US        → filter by jurisdiction
 *   GET /api/policies?sector=solar           → filter by sector tag (array contains)
 *   GET /api/policies?agency=US%20EPA        → filter by agency name
 *   GET /api/policies?q=methane              → search title + implications
 *   GET /api/policies?limit=25&offset=25     → paginate
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const jurisdiction = searchParams.get('jurisdiction');
  const sector = searchParams.get('sector');
  const agency = searchParams.get('agency');
  const q = searchParams.get('q');

  const rawLimit = parseInt(searchParams.get('limit') ?? '', 10);
  const rawOffset = parseInt(searchParams.get('offset') ?? '', 10);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  let query = supabase
    .from('policies')
    .select(`
      id, title, jurisdiction, agency, status, document_type, docket_id,
      published_at, effective_date, comment_deadline,
      sectors, affected_company_types, investor_implications, source_url
    `)
    .eq('enrichment_status', 'done')
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (jurisdiction) query = query.eq('jurisdiction', jurisdiction);
  if (agency) query = query.eq('agency', agency);
  if (sector) query = query.contains('sectors', [sector]);
  if (q) {
    // Simple ilike search across title + implications
    query = query.or(`title.ilike.%${q}%,investor_implications.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also return counts grouped by status so the UI can show nav badges.
  // Separate query, not part of the filtered list.
  const { data: statusCounts } = await supabase
    .from('policies')
    .select('status')
    .eq('enrichment_status', 'done');

  const countsByStatus = {};
  for (const row of statusCounts ?? []) {
    countsByStatus[row.status] = (countsByStatus[row.status] ?? 0) + 1;
  }

  return NextResponse.json({
    policies: data ?? [],
    counts_by_status: countsByStatus,
  });
}
