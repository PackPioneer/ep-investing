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

    if (orgType) query = query.eq("org_type", orgType);
    if (sector) query = query.contains("sector_tags", [sector]);
    if (geography) query = query.contains("geography_focus", [geography]);
    if (partnership === "true") query = query.eq("open_to_partnerships", true);
    if (search) query = query.ilike("name", `%${search}%`);

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ngos: data ?? [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
