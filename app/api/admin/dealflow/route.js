import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const monthsAgo = (d) => d ? (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30.4) : null;

export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // All capital events linked to a company (for "latest round" logic).
  const { data: ev } = await supabase
    .from("funding_events")
    .select("company_id, company_name, amount_usd, type, stage, sector, announced_date")
    .eq("category", "capital").not("amount_usd", "is", null)
    .order("announced_date", { ascending: false }).limit(5000);
  const events = ev || [];

  // ---- Recently raised (momentum): last 120 days, one row per company ----
  const seen = new Set();
  const recentlyRaised = [];
  for (const e of events) {
    if (monthsAgo(e.announced_date) > 4) continue;
    const key = e.company_id || e.company_name;
    if (seen.has(key)) continue;
    seen.add(key);
    recentlyRaised.push(e);
  }

  // ---- Likely raising soon: latest linked round is 18-33 months old ----
  const latestByCompany = new Map();
  for (const e of events) {
    if (!e.company_id) continue;
    if (!latestByCompany.has(e.company_id)) latestByCompany.set(e.company_id, e); // events are date-desc, first = latest
  }
  const dueIds = [];
  for (const [id, e] of latestByCompany) {
    const age = monthsAgo(e.announced_date);
    if (age >= 18 && age <= 33 && !["ipo", "public"].includes(e.stage)) dueIds.push({ id, last: e });
  }
  let likelyRaising = [];
  if (dueIds.length) {
    const { data: comps } = await supabase.from("companies")
      .select("id, name, slug, url, industry_tags, funding_stage")
      .in("id", dueIds.map((d) => d.id)).neq("is_hidden", true);
    const cmap = new Map((comps || []).map((c) => [c.id, c]));
    likelyRaising = dueIds.map((d) => ({ ...cmap.get(d.id), last_round: d.last }))
      .filter((c) => c.id)
      .sort((a, b) => new Date(a.last_round.announced_date) - new Date(b.last_round.announced_date));
  }

  // ---- Currently raising: self-reported ----
  const { data: raising } = await supabase.from("companies")
    .select("id, name, slug, url, industry_tags, funding_stage, raise_target, raise_round_type")
    .eq("looking_to_raise", true).neq("is_hidden", true).limit(200);

  return Response.json({
    currentlyRaising: raising || [],
    likelyRaising: likelyRaising.slice(0, 100),
    recentlyRaised: recentlyRaised.slice(0, 100),
    counts: { currentlyRaising: (raising || []).length, likelyRaising: likelyRaising.length, recentlyRaised: recentlyRaised.length },
  });
}
