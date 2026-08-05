import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Public newsroom feed — published announcements only, featured first.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const sector = searchParams.get("sector");
  const companyId = searchParams.get("company_id");
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 300);

  let q = db().from("company_announcements")
    .select("id, category, title, body, link_url, meta, is_featured, published_at, company:companies(id, name, slug, logo_url, industry_tags)")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (category) q = q.eq("category", category);
  if (companyId) q = q.eq("company_id", companyId);

  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let rows = data || [];
  // Sector filter is applied client-side on the joined company's tags.
  if (sector) rows = rows.filter((r) => (r.company?.industry_tags || []).includes(sector));
  return Response.json(rows);
}
