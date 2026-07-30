import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await db().from("saved_searches").select("*").eq("clerk_user_id", userId).order("created_at", { ascending: false });
  return Response.json(data || []);
}

export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { name, filters, email } = await req.json();
  const { data, error } = await db().from("saved_searches")
    .insert({ clerk_user_id: userId, email: email || null, name: name || "Saved search", filters: filters || {} })
    .select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  await db().from("saved_searches").delete().eq("id", id).eq("clerk_user_id", userId);
  return Response.json({ ok: true });
}
