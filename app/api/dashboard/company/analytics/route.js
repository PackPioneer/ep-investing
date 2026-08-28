import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { companyHasBoardAccess } from "@/lib/company-billing";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function resolveCompany(userId) {
  const supabase = db();
  try {
    const client = await clerkClient();
    const { data: memberships } = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
    const orgIds = (memberships || []).map((m) => m.organization.id);
    if (orgIds.length) {
      const { data } = await supabase.from("companies").select("id, name")
        .in("clerk_organization_id", orgIds).order("id", { ascending: true }).limit(1);
      if (data && data[0]) return data[0];
    }
  } catch { /* ignore */ }
  const { data } = await supabase.from("companies").select("id, name")
    .or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`).order("id", { ascending: true }).limit(1);
  return (data && data[0]) || null;
}

async function companyBilling(companyId) {
  const { data } = await db().from("companies").select("stripe_customer_id, newsroom_access").eq("id", companyId).maybeSingle();
  return data || { stripe_customer_id: null, newsroom_access: false };
}

// "Who viewed you" — aggregate counts always; named viewer list only for Growth.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const company = await resolveCompany(userId);
  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const billing = await companyBilling(company.id);
  const board_access = await companyHasBoardAccess({ ...company, ...billing });

  const sel = "viewer_clerk_user_id, viewer_kind, viewer_label, viewer_investor_id, viewer_company_id, signals, created_at";
  let { data: views, error } = await db().from("company_profile_views")
    .select(sel).eq("company_id", company.id).order("created_at", { ascending: false }).limit(2000);
  // Fall back if the signals column hasn't been migrated yet.
  if (error && /signals/i.test(error.message)) {
    ({ data: views, error } = await db().from("company_profile_views")
      .select(sel.replace(", signals", "")).eq("company_id", company.id).order("created_at", { ascending: false }).limit(2000));
  }
  // Table not migrated yet, or empty.
  if (error) return Response.json({ board_access, investor_count: 0, partner_count: 0, viewers: [], signals_seen: [], cta_clicks: [] });

  const rows = views || [];

  // Named viewers only (investors + companies); individuals stay anonymous and
  // are not surfaced. Deduped to one entry per viewer (most-recent).
  const byViewer = new Map();
  for (const r of rows) {
    if (r.viewer_kind === "individual") continue;
    const key = `${r.viewer_kind}:${r.viewer_investor_id ?? r.viewer_company_id ?? r.viewer_clerk_user_id}`;
    const prev = byViewer.get(key);
    if (prev) { prev.count += 1; continue; }
    byViewer.set(key, {
      kind: r.viewer_kind,
      label: r.viewer_label || (r.viewer_kind === "investor" ? "An investor" : "A company"),
      investor_id: r.viewer_investor_id || null,
      company_id: r.viewer_company_id || null,
      last_viewed: r.created_at,
      count: 1,
    });
  }
  const all = [...byViewer.values()].sort((a, b) => new Date(b.last_viewed) - new Date(a.last_viewed));
  const investor_count = all.filter((v) => v.kind === "investor").length;
  // Companies and NGOs are framed as "potential partners".
  const partner_count = all.filter((v) => v.kind === "company" || v.kind === "ngo").length;

  // Signals seen: reach per active signal, from what was live at view time.
  const isPartner = (k) => k === "company" || k === "ngo";
  const SIGNAL_LABEL = { raising: "Raising", hiring: "Hiring", partnership: "Open to partnership" };
  const signalAgg = {};
  for (const r of rows) {
    for (const s of (r.signals || [])) {
      const e = signalAgg[s] || { signal: s, label: SIGNAL_LABEL[s] || s, views: 0, investors: 0, partners: 0 };
      e.views += 1;
      if (r.viewer_kind === "investor") e.investors += 1;
      else if (isPartner(r.viewer_kind)) e.partners += 1;
      signalAgg[s] = e;
    }
  }
  const signals_seen = Object.values(signalAgg).sort((a, b) => b.views - a.views);

  // CTA clicks on the profile (website / jobs / contact).
  const cta = await ctaClicks(company.id);

  // Engagement: clicks on this company's announcement action items (CTAs).
  const engagement = await announcementEngagement(company.id);

  // Free companies see the counts (the hook) but not the names/details.
  return Response.json({
    board_access,
    investor_count,
    partner_count,
    viewers: board_access ? all : [],
    signals_seen,                                   // aggregate counts — safe to always show
    cta_clicks: cta.items,
    cta_click_count: cta.total,
    engagement_count: engagement.total,
    engagement: board_access ? engagement.items : [],
  });
}

const CTA_LABEL = { website: "Visit website", jobs: "Apply to a role", contact: "Contact / get in touch" };
async function ctaClicks(companyId) {
  const { data, error } = await db().from("company_cta_clicks")
    .select("cta, clicker_kind, created_at").eq("company_id", companyId)
    .order("created_at", { ascending: false }).limit(2000);
  if (error || !data || !data.length) return { total: 0, items: [] };
  const agg = {};
  for (const c of data) {
    const e = agg[c.cta] || { cta: c.cta, label: CTA_LABEL[c.cta] || c.cta, clicks: 0, investors: 0, partners: 0, last_clicked: c.created_at };
    e.clicks += 1;
    if (c.clicker_kind === "investor") e.investors += 1;
    else if (c.clicker_kind === "company" || c.clicker_kind === "ngo") e.partners += 1;
    agg[c.cta] = e;
  }
  return { total: data.length, items: Object.values(agg).sort((a, b) => b.clicks - a.clicks) };
}

// Group announcement CTA clicks by announcement, newest first.
async function announcementEngagement(companyId) {
  const supabase = db();
  const { data: clicks, error } = await supabase.from("announcement_clicks")
    .select("announcement_id, clicker_kind, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error || !clicks || !clicks.length) return { total: 0, items: [] };

  const byAnn = new Map();
  for (const c of clicks) {
    const e = byAnn.get(c.announcement_id) || { announcement_id: c.announcement_id, clicks: 0, investors: 0, partners: 0, last_clicked: c.created_at };
    e.clicks += 1;
    if (c.clicker_kind === "investor") e.investors += 1;
    else if (c.clicker_kind === "company" || c.clicker_kind === "ngo") e.partners += 1;
    byAnn.set(c.announcement_id, e);
  }
  const annIds = [...byAnn.keys()];
  const { data: anns } = await supabase.from("company_announcements")
    .select("id, title, category, meta").in("id", annIds);
  const meta = new Map((anns || []).map((a) => [a.id, a]));
  const items = [...byAnn.values()].map((e) => {
    const a = meta.get(e.announcement_id);
    return {
      ...e,
      title: a?.title || "an announcement",
      cta_label: a?.meta?.cta_label || "the action item",
    };
  }).sort((x, y) => new Date(y.last_clicked) - new Date(x.last_clicked));
  return { total: clicks.length, items };
}
