import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status");
  let q = db().from("enterprise_inquiries").select("*").order("created_at", { ascending: false }).limit(500);
  if (status && status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}

export async function PATCH(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id, status, admin_notes } = await req.json().catch(() => ({}));
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const update = {};
  if (status && ["new", "in_progress", "closed"].includes(status)) update.status = status;
  if (admin_notes !== undefined) update.admin_notes = admin_notes || null;
  if (!Object.keys(update).length) return Response.json({ error: "Nothing to update" }, { status: 400 });
  const { data, error } = await db().from("enterprise_inquiries").update(update).eq("id", id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, inquiry: data });
}
