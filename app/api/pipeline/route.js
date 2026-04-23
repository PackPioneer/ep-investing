/**
 * app/api/pipeline/route.js
 *
 * CRUD for user_saved_companies.
 *
 *   GET    /api/pipeline                    → list caller's saved companies
 *   POST   /api/pipeline                    → { company_id, stage?, notes? }
 *   PATCH  /api/pipeline                    → { company_id, stage?, notes? }
 *   DELETE /api/pipeline?company_id=...     → remove one
 *
 * Auth via Clerk. user_type is inferred from the caller's user record
 * (investor / company / expert / researcher). All writes go through the
 * service role client on the server — never expose directly to browser.
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Valid pipeline stages for investors. The DB column is free-text so we
// validate at the API layer — lets us add new stages without migrations.
// Accept both 'in_diligence' (canonical) and 'diligence' (legacy from
// Phase 1 dashboard) for backward compatibility.
const VALID_STAGES = ['watching', 'contacted', 'in_diligence', 'diligence', 'passed'];

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

/**
 * Resolve user_type for a clerk_user_id by checking which of the four
 * profile tables the user has a record in. Returns 'investor' | 'company'
 * | 'expert' | 'researcher' | null.
 */
async function resolveUserType(sb, clerkUserId) {
  // Tables are checked in order of expected frequency for ranking purposes.
  // If a single clerk_user_id appears in multiple (unlikely but possible
  // for a researcher who also claimed a company), investor > company >
  // expert > researcher wins.
  const checks = [
    { table: 'investors', type: 'investor' },
    { table: 'companies', type: 'company' },
    { table: 'experts', type: 'expert' },
    { table: 'researchers', type: 'researcher' },
  ];

  for (const { table, type } of checks) {
    const { data } = await sb
      .from(table)
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .limit(1)
      .maybeSingle();
    if (data) return type;
  }
  return null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = supabase();

  // Return saved companies with the joined company record so the client
  // can render pipeline cards without a second roundtrip.
  const { data, error } = await sb
    .from('user_saved_companies')
    .select(`
      id, stage, notes, saved_at, updated_at,
      company:companies ( id, name, logo_url, funding_stage, industry_tags, short_description )
    `)
    .eq('clerk_user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: data ?? [] });
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { company_id, stage = 'watching', notes = null } = body;

  if (!company_id) {
    return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  }
  if (!VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: 'invalid stage' }, { status: 400 });
  }

  const sb = supabase();

  const userType = await resolveUserType(sb, userId);
  if (!userType) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
  }

  // Upsert so re-saving an already-saved company doesn't 409. If it exists,
  // just update stage/notes and bump updated_at.
  const { data, error } = await sb
    .from('user_saved_companies')
    .upsert(
      {
        clerk_user_id: userId,
        user_type: userType,
        company_id,
        stage,
        notes,
      },
      { onConflict: 'clerk_user_id,company_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: data });
}

export async function PATCH(request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { company_id, stage, notes } = body;

  if (!company_id) {
    return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  }
  if (stage !== undefined && !VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: 'invalid stage' }, { status: 400 });
  }

  const updates = {};
  if (stage !== undefined) updates.stage = stage;
  if (notes !== undefined) updates.notes = notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const sb = supabase();

  const { data, error } = await sb
    .from('user_saved_companies')
    .update(updates)
    .eq('clerk_user_id', userId)
    .eq('company_id', company_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ saved: data });
}

export async function DELETE(request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');

  if (!companyId) {
    return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  }

  const sb = supabase();

  const { error } = await sb
    .from('user_saved_companies')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('company_id', companyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
