import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { pushAnnouncementToFeed, removeAnnouncementFromFeed } from "@/lib/announcements/feed";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CATEGORIES = ["partnership", "raise_open", "raise_close", "product", "award", "hire", "milestone", "expansion", "other"];

// Resolve the company this user manages (org membership, then legacy owner fields).
async function resolveCompany(userId) {
  const supabase = db();
  try {
    const client = await clerkClient();
    const { data: memberships } = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
    const orgIds = (memberships || []).map((m) => m.organization.id);
    if (orgIds.length) {
      const { data } = await supabase.from("companies").select("id, name, industry_tags").in("clerk_organization_id", orgIds).maybeSingle();
      if (data) return data;
    }
  } catch { /* ignore org lookup errors */ }
  const { data } = await supabase.from("companies").select("id, name, industry_tags")
    .or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`).maybeSingle();
  return data || null;
}

// Raise announcements feed the market tracker live (from a vetted company).
async function applyRaiseFlywheel(supabase, company, ann) {
  const m = ann.meta || {};
  if (ann.category === "raise_open") {
    await supabase.from("companies").update({
      looking_to_raise: true,
      raise_round_type: m.round_type || undefined,
      raise_target: m.amount_target_usd ? Number(m.amount_target_usd) : undefined,
      raise_lead_investor: m.lead_investor || undefined,
    }).eq("id", company.id);
    return null;
  }
  if (ann.category === "raise_close") {
    const { data } = await supabase.from("funding_events").insert({
      source: "self_reported", verified: true, category: "capital", type: "venture_equity",
      company_id: company.id, company_name: company.name,
      counterparty: m.lead_investor || null,
      amount_usd: m.amount_usd ? Number(m.amount_usd) : null,
      stage: m.round_type || null,
      sector: (company.industry_tags || [])[0] || null,
      announced_date: m.close_date || new Date().toISOString().slice(0, 10),
      confidence: "high", is_hidden: false,
      dedup_key: `${(company.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")}|${m.amount_usd || 0}|selfreport`,
    }).select("id").single();
    return data?.id || null;
  }
  return null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const company = await resolveCompany(userId);
  if (!company) return Response.json({ error: "No company found" }, { status: 404 });
  const { data } = await db().from("company_announcements")
    .select("*").eq("company_id", company.id).order("created_at", { ascending: false });
  return Response.json({ company, announcements: data || [] });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const company = await resolveCompany(userId);
  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const body = await req.json();
  const { category, title, body: text, link_url, meta } = body;
  if (!CATEGORIES.includes(category)) return Response.json({ error: "Invalid category" }, { status: 400 });
  if (!title || !title.trim()) return Response.json({ error: "Title is required" }, { status: 400 });

  const supabase = db();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("company_announcements").insert({
    company_id: company.id,
    category,
    title: title.trim(),
    body: text || null,
    link_url: link_url || null,
    meta: meta && typeof meta === "object" ? meta : {},
    status: "published",       // vetted companies publish immediately
    published_at: now,
    created_by: userId,
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Raise announcements go live in the tracker right away.
  const trackerId = await applyRaiseFlywheel(supabase, company, data);
  if (trackerId) await supabase.from("company_announcements").update({ tracker_event_id: trackerId }).eq("id", data.id);

  // Push into the personalized For You feed (sector + tracked-company matched).
  try { await pushAnnouncementToFeed(supabase, company, data); } catch { /* non-fatal */ }

  return Response.json(data);
}

export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const company = await resolveCompany(userId);
  if (!company) return Response.json({ error: "No company found" }, { status: 404 });
  const id = new URL(req.url).searchParams.get("id");
  // Retract own announcement; also hide any tracker event it created.
  const dbc = db();
  const { data: row } = await dbc.from("company_announcements").select("id, tracker_event_id").eq("id", id).eq("company_id", company.id).maybeSingle();
  if (row?.tracker_event_id) await dbc.from("funding_events").update({ is_hidden: true }).eq("id", row.tracker_event_id);
  if (row?.id) { try { await removeAnnouncementFromFeed(dbc, row.id); } catch { /* non-fatal */ } }
  await dbc.from("company_announcements").delete().eq("id", id).eq("company_id", company.id);
  return Response.json({ ok: true });
}
