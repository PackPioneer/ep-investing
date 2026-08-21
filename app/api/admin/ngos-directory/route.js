/**
 * Admin-gated NGO directory management.
 *   GET  ?q=term         -> search ALL ngos by name/url
 *   PATCH { id, action }  -> 'hide' | 'unhide' (soft delete via is_hidden)
 * NGOs are gated publicly by status='active' AND is_hidden!=true.
 */
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function GET(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = (new URL(req.url).searchParams.get("q") || "").trim();

  // select("*") is resilient to schema differences (e.g. is_hidden not yet added).
  let query = supabase.from("ngos").select("*").order("name", { ascending: true }).limit(100);
  if (q) query = query.or(`name.ilike.%${q}%,website_url.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ngos: data || [] });
}

export async function PATCH(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }
  const { id, action } = body;
  if (!id || !["hide", "unhide"].includes(action)) return NextResponse.json({ error: "id and action required" }, { status: 400 });
  const { error } = await supabase.from("ngos").update({ is_hidden: action === "hide" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id, is_hidden: action === "hide" });
}
