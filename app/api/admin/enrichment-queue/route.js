/**
 * app/api/admin/enrichment-queue/route.js
 *
 * Backs the company profile enrichment review queue.
 *
 *   GET   → pending field drafts (with company name) + pending duplicate flags
 *   POST approve  → write drafted_value (or edited value) to companies.<field>, mark approved
 *   POST reject   → mark draft rejected
 *   POST hide_dup → soft-delete (is_hidden=true) the sparser company in a dup pair
 *
 * Only the five enrichable text fields may be written — field_name is
 * whitelisted so an approve can never target an arbitrary column.
 */

import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENRICHABLE_FIELDS = ['description', 'core_technology', 'target_market', 'key_customers', 'business_model'];

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

  const { data: drafts, error } = await supabase
    .from('company_enrichment_drafts')
    .select('*')
    .eq('status', 'pending')
    .order('company_id', { ascending: true })
    .order('field_name', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach company names.
  const companyIds = [...new Set((drafts || []).map((d) => d.company_id))];
  let nameMap = {};
  if (companyIds.length) {
    const { data: comps } = await supabase
      .from('companies')
      .select('id, name, url')
      .in('id', companyIds);
    nameMap = Object.fromEntries((comps || []).map((c) => [c.id, { name: c.name, url: c.url }]));
  }
  const withNames = (drafts || []).map((d) => ({
    ...d,
    company_name: nameMap[d.company_id]?.name ?? `#${d.company_id}`,
    company_url: nameMap[d.company_id]?.url ?? null,
  }));

  // Duplicate flags, with both companies' names + fullness for display.
  const { data: dupes } = await supabase
    .from('company_duplicate_flags')
    .select('*')
    .eq('status', 'pending');
  const dupCompanyIds = [...new Set((dupes || []).flatMap((d) => [d.company_id_a, d.company_id_b]))];
  let dupMap = {};
  if (dupCompanyIds.length) {
    const { data: comps } = await supabase
      .from('companies')
      .select('id, name, url, description, core_technology, target_market, key_customers, business_model, is_hidden')
      .in('id', dupCompanyIds);
    const score = (c) => ENRICHABLE_FIELDS.filter((f) => c[f] != null && String(c[f]).length > 0).length;
    dupMap = Object.fromEntries((comps || []).map((c) => [c.id, { name: c.name, url: c.url, fullness: score(c), is_hidden: c.is_hidden }]));
  }
  const flags = (dupes || []).map((d) => ({
    ...d,
    a: dupMap[d.company_id_a] || null,
    b: dupMap[d.company_id_b] || null,
  }));

  return NextResponse.json({ drafts: withNames, duplicates: flags });
}

export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { action } = body;
  const supabase = supa();

  // ----- approve a field draft -----
  if (action === 'approve') {
    const { id, value } = body;
    const { data: draft } = await supabase
      .from('company_enrichment_drafts').select('*').eq('id', id).maybeSingle();
    if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    if (draft.status !== 'pending') return NextResponse.json({ error: `Already ${draft.status}` }, { status: 409 });
    if (!ENRICHABLE_FIELDS.includes(draft.field_name)) {
      return NextResponse.json({ error: 'Field not allowed' }, { status: 400 });
    }
    const finalValue = (typeof value === 'string' && value.trim()) ? value.trim() : draft.drafted_value;

    // Write to the live company row (only the whitelisted column).
    const { error: upErr } = await supabase
      .from('companies').update({ [draft.field_name]: finalValue }).eq('id', draft.company_id);
    if (upErr) return NextResponse.json({ error: `Write failed: ${upErr.message}` }, { status: 500 });

    await supabase.from('company_enrichment_drafts')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), drafted_value: finalValue })
      .eq('id', id);
    return NextResponse.json({ ok: true });
  }

  // ----- reject a field draft -----
  if (action === 'reject') {
    const { id } = body;
    await supabase.from('company_enrichment_drafts')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', id);
    return NextResponse.json({ ok: true });
  }

  // ----- hide the sparser company in a duplicate pair -----
  if (action === 'hide_dup') {
    const { flag_id, hide_company_id } = body;
    const { data: flag } = await supabase
      .from('company_duplicate_flags').select('*').eq('id', flag_id).maybeSingle();
    if (!flag) return NextResponse.json({ error: 'Flag not found' }, { status: 404 });

    // Guard: never hide a claimed company.
    const claimed = (hide_company_id === flag.company_id_a && flag.a_is_claimed) ||
                    (hide_company_id === flag.company_id_b && flag.b_is_claimed);
    if (claimed) {
      return NextResponse.json({ error: 'That company is claimed — refusing to hide it.' }, { status: 400 });
    }

    const { error: hideErr } = await supabase
      .from('companies').update({ is_hidden: true }).eq('id', hide_company_id);
    if (hideErr) return NextResponse.json({ error: hideErr.message }, { status: 500 });

    await supabase.from('company_duplicate_flags')
      .update({ status: 'resolved' }).eq('id', flag_id);
    return NextResponse.json({ ok: true });
  }

  // ----- dismiss a duplicate flag without hiding anything -----
  if (action === 'dismiss_dup') {
    const { flag_id } = body;
    await supabase.from('company_duplicate_flags')
      .update({ status: 'dismissed' }).eq('id', flag_id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
