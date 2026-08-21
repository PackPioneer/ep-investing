import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orgType = searchParams.get("org_type");
    const sector = searchParams.get("sector");
    const geography = searchParams.get("geography");
    const partnership = searchParams.get("partnership"); // "true" to filter
    const search = searchParams.get("q");
    const limitParam = parseInt(searchParams.get("limit") ?? "100", 10);
    const limit = Math.min(Math.max(limitParam, 1), 200);

    let query = supabase
      .from("ngos")
      .select("id, slug, name, org_type, short_description, logo_url, website_url, headquarters_country, sector_tags, geography_focus, staff_size, open_to_partnerships, claimable, verified")
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(limit);

    const applyFilters = (qb) => {
      if (orgType) qb = qb.eq("org_type", orgType);
      if (sector) qb = qb.contains("sector_tags", [sector]);
      if (geography) qb = qb.contains("geography_focus", [geography]);
      if (partnership === "true") qb = qb.eq("open_to_partnerships", true);
      if (search) qb = qb.ilike("name", `%${search}%`);
      return qb;
    };
    query = applyFilters(query.neq("is_hidden", true));

    let { data, error } = await query;
    // Fall back if is_hidden column isn't present yet.
    if (error) {
      let q2 = supabase.from("ngos")
        .select("id, slug, name, org_type, short_description, logo_url, website_url, headquarters_country, sector_tags, geography_focus, staff_size, open_to_partnerships, claimable, verified")
        .eq("status", "active").order("name", { ascending: true }).limit(limit);
      ({ data, error } = await applyFilters(q2));
    }
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ngos: data ?? [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
