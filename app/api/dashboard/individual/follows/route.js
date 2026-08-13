import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await db().from("company_follows")
    .select("company_id, company:companies(id, name, slug, logo_url, industry_tags, description)")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });
  const companies = (data || []).map((r) => r.company).filter(Boolean);
  return Response.json({ ids: (data || []).map((r) => r.company_id), companies });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { company_id } = await req.json();
  if (!company_id) return Response.json({ error: "company_id required" }, { status: 400 });
  const { error } = await db().from("company_follows")
    .upsert({ clerk_user_id: userId, company_id }, { onConflict: "clerk_user_id,company_id" });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const company_id = new URL(req.url).searchParams.get("company_id");
  await db().from("company_follows").delete().eq("clerk_user_id", userId).eq("company_id", company_id);
  return Response.json({ ok: true });
}
