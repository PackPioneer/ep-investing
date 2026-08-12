import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Resolve the company this user owns/manages (owner or claimant).
async function resolveCompany(supabase, userId) {
  const { data } = await supabase
    .from("companies")
    .select("id, name")
    .or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`)
    .maybeSingle();
  return data || null;
}

// POST { investor_id, note } — a registered company requests to connect.
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "unauthenticated" }, { status: 401 });

  const { investor_id, note } = await req.json();
  if (!investor_id) return Response.json({ error: "investor_id required" }, { status: 400 });

  const supabase = db();
  const company = await resolveCompany(supabase, userId);
  if (!company) return Response.json({ error: "no_company" }, { status: 403 });

  const { error } = await supabase.from("investor_connections").upsert(
    { investor_id, company_id: company.id, clerk_user_id: userId, note: note || null, status: "pending" },
    { onConflict: "investor_id,company_id", ignoreDuplicates: false }
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, company: { id: company.id, name: company.name } });
}

// GET — connection requests for the vc_firms profile(s) this user has claimed.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ connections: [], claimed: false });

  const supabase = db();
  const { data: firms } = await supabase.from("vc_firms").select("id").eq("claimed_by_clerk_user_id", userId);
  const firmIds = (firms || []).map((f) => f.id);
  if (!firmIds.length) return Response.json({ connections: [], claimed: false });

  const { data: conns } = await supabase
    .from("investor_connections")
    .select("id, company_id, note, status, created_at")
    .in("investor_id", firmIds)
    .order("created_at", { ascending: false })
    .limit(200);

  const companyIds = [...new Set((conns || []).map((c) => c.company_id))];
  let companies = [];
  if (companyIds.length) {
    const { data } = await supabase.from("companies").select("id, name, slug, logo_url, url, industry_tags, funding_stage").in("id", companyIds);
    companies = data || [];
  }
  const byId = new Map(companies.map((c) => [c.id, c]));
  const connections = (conns || []).map((c) => ({ ...c, company: byId.get(c.company_id) || null }));

  return Response.json({ connections, claimed: true });
}
