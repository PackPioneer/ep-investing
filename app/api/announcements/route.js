import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Public newsroom feed — published announcements only, featured first.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const sector = searchParams.get("sector");
  const companyId = searchParams.get("company_id");
  const ngoId = searchParams.get("ngo_id");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 300);

  // Entity-scoped requests (a company/NGO profile showing its own updates) see
  // everything they've published. The general board only shows updates that were
  // published to it (newsroom = true) — profile-only posts stay off the board.
  const entityScoped = !!(companyId || ngoId);
  const build = (sel, withNewsroom) => {
    let q = db().from("company_announcements")
      .select(sel)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(limit);
    if (category) q = q.eq("category", category);
    if (companyId) q = q.eq("company_id", companyId);
    if (ngoId) q = q.eq("ngo_id", ngoId);
    if (withNewsroom && !entityScoped) q = q.eq("newsroom", true);
    return q;
  };

  const NGO_JOIN = ", ngo:ngos(id, name, slug, logo_url, sector_tags)";
  const FULL = "id, category, title, body, link_url, meta, is_featured, is_curated, published_at, company:companies(id, name, slug, logo_url, industry_tags)" + NGO_JOIN;
  let { data, error } = await build(FULL, true);
  // Fall back gracefully if the is_curated column hasn't been added yet.
  if (error && /is_curated/i.test(error.message)) {
    ({ data, error } = await build(FULL.replace(", is_curated", ""), true));
  }
  // Fall back if the ngo relationship hasn't been migrated yet.
  if (error && /ngo/i.test(error.message)) {
    ({ data, error } = await build(FULL.replace(NGO_JOIN, "").replace(", is_curated", ""), true));
  }
  // Fall back if the newsroom column hasn't been added yet (pre-migration).
  if (error && /newsroom/i.test(error.message)) {
    ({ data, error } = await build(FULL.replace(NGO_JOIN, "").replace(", is_curated", ""), false));
  }
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let rows = data || [];
  // Featured first, then newest (done in JS so it works with the fallback select).
  rows.sort((a, b) => (Number(b.is_featured) || 0) - (Number(a.is_featured) || 0) || (new Date(b.published_at || 0) - new Date(a.published_at || 0)));
  if (sector) rows = rows.filter((r) => [...(r.company?.industry_tags || []), ...(r.ngo?.sector_tags || [])].includes(sector));
  return Response.json(rows);
}
