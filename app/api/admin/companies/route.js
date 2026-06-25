/**
 * app/api/admin/companies/route.js
 *
 * Admin-gated company management.
 *   GET  ?q=term        -> search ALL companies by name/url (server-side, paginated)
 *   PATCH { id, action } -> action: 'hide' | 'unhide'  (soft delete via is_hidden)
 */

import { requireAdmin } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function GET(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  let query = supabase
    .from("companies")
    .select("id, name, slug, url, logo_url, funding_stage, industry_tags, claimed_by_clerk_user_id, clerk_organization_id, is_hidden")
    .order("name", { ascending: true });

  if (q) {
    // search across all companies by name or url
    query = query.or(`name.ilike.%${q}%,url.ilike.%${q}%`).limit(100);
  } else {
    // no search term: return first 100 alphabetically so the page isn't empty
    query = query.limit(100);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data || [] });
}

export async function PATCH(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }
  const { id, action } = body;
  if (!id || !["hide", "unhide"].includes(action)) {
    return NextResponse.json({ error: "id and action ('hide'|'unhide') required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("companies")
    .update({ is_hidden: action === "hide" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, is_hidden: action === "hide" });
}
