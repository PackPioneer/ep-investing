import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const monthsAgo = (d) => d ? (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30.4) : null;
const daysAgoIso = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

// Normalize a company name for fuzzy matching between news entities and the directory.
const norm = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/(incorporated|inc|ltd|limited|llc|corporation|corp|company|co|group|holdings)$/g, "");

// Senior / capital-adjacent titles that tend to precede a raise.
const SENIOR_RE = /\b(vp|vice president|head of|chief|cfo|controller|director of (finance|corporate development|strategy|business development)|corporate development|investor relations|fundrais|capital markets)\b/i;

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

  // ---- Recently raised (momentum): last ~4 months, one row per company ----
  const seen = new Set();
  const recentlyRaised = [];
  for (const e of events) {
    if (monthsAgo(e.announced_date) > 4) continue;
    const key = e.company_id || e.company_name;
    if (seen.has(key)) continue;
    seen.add(key);
    recentlyRaised.push(e);
  }

  // ---- Likely raising soon (dormant): latest linked round is 18-33 months old ----
  const latestByCompany = new Map();
  for (const e of events) {
    if (!e.company_id) continue;
    if (!latestByCompany.has(e.company_id)) latestByCompany.set(e.company_id, e); // date-desc, first = latest
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

  // ---- Currently raising: self-reported on EP ----
  const { data: raising } = await supabase.from("companies")
    .select("id, name, slug, url, industry_tags, funding_stage, raise_target, raise_round_type")
    .eq("looking_to_raise", true).neq("is_hidden", true).limit(200);

  // Directory lookup (normalized) — reused by the news-intent matcher.
  const { data: allCos } = await supabase.from("companies")
    .select("id, name, slug, industry_tags").neq("is_hidden", true).limit(20000);
  const byNorm = new Map();
  for (const c of allCos || []) {
    const n = norm(c.name);
    if (n && !byNorm.has(n)) byNorm.set(n, c);
  }
  const selfReportedIds = new Set((raising || []).map((c) => c.id));

  // ---- Currently raising: detected from news (classification = raising_intent) ----
  let pressRaising = [];
  const { data: intentArticles } = await supabase.from("news_articles")
    .select("id, title, url, published_at")
    .eq("classification", "raising_intent")
    .gte("published_at", daysAgoIso(90))
    .order("published_at", { ascending: false }).limit(400);
  const articleIds = (intentArticles || []).map((a) => a.id);
  if (articleIds.length) {
    const artMap = new Map((intentArticles || []).map((a) => [a.id, a]));
    const { data: ents } = await supabase.from("news_entities")
      .select("article_id, entity_name")
      .eq("entity_type", "company")
      .in("article_id", articleIds);
    // One row per distinct company name, keeping the most-recent article.
    const byName = new Map();
    for (const en of ents || []) {
      const art = artMap.get(en.article_id);
      if (!art) continue;
      const key = norm(en.entity_name);
      if (!key) continue;
      const existing = byName.get(key);
      if (!existing || new Date(art.published_at) > new Date(existing.article.published_at)) {
        byName.set(key, { name: en.entity_name, article: art });
      }
    }
    pressRaising = [...byName.entries()]
      .map(([key, v]) => {
        const co = byNorm.get(key) || null;
        return {
          name: co?.name || v.name,
          company_id: co?.id || null,
          slug: co?.slug || null,
          industry_tags: co?.industry_tags || [],
          matched: !!co,
          article_title: v.article.title,
          article_url: v.article.url,
          published_at: v.article.published_at,
        };
      })
      // Don't double-count companies that already self-reported.
      .filter((r) => !(r.company_id && selfReportedIds.has(r.company_id)))
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  }

  // ---- Likely raising soon: hiring velocity from job_listings ----
  let hiringSignal = [];
  const { data: jobs } = await supabase.from("job_listings")
    .select("company_id, title, created_at")
    .not("company_id", "is", null)
    .gte("created_at", daysAgoIso(60))
    .limit(8000);
  if ((jobs || []).length) {
    const agg = new Map(); // company_id -> { postings, senior, latest }
    for (const j of jobs) {
      const a = agg.get(j.company_id) || { postings: 0, senior: 0, latest: null };
      a.postings += 1;
      if (SENIOR_RE.test(j.title || "")) a.senior += 1;
      if (!a.latest || new Date(j.created_at) > new Date(a.latest)) a.latest = j.created_at;
      agg.set(j.company_id, a);
    }
    // Qualify: a burst of postings (>=3 in 60d) OR any senior capital-adjacent role.
    const qualified = [...agg.entries()]
      .filter(([id, a]) => (a.postings >= 3 || a.senior >= 1) && !selfReportedIds.has(id));
    if (qualified.length) {
      const { data: hc } = await supabase.from("companies")
        .select("id, name, slug, url, industry_tags").neq("is_hidden", true)
        .in("id", qualified.map(([id]) => id));
      const hmap = new Map((hc || []).map((c) => [c.id, c]));
      hiringSignal = qualified
        .map(([id, a]) => ({ ...(hmap.get(id) || {}), ...a, id }))
        .filter((c) => c.name)
        .sort((a, b) => (b.senior - a.senior) || (b.postings - a.postings))
        .slice(0, 60);
    }
  }

  return Response.json({
    currentlyRaising: raising || [],
    pressRaising: pressRaising.slice(0, 100),
    likelyRaising: likelyRaising.slice(0, 100),
    hiringSignal,
    recentlyRaised: recentlyRaised.slice(0, 100),
    counts: {
      currentlyRaising: (raising || []).length,
      pressRaising: pressRaising.length,
      likelyRaising: likelyRaising.length,
      hiringSignal: hiringSignal.length,
      recentlyRaised: recentlyRaised.length,
    },
  });
}
