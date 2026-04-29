import { supabase } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { slug } = await params;

    // Get NGO
    const { data: ngo, error } = await supabase
      .from("ngos")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error || !ngo) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Get linked grants (newest first)
    const { data: grants } = await supabase
      .from("grants")
      .select("id, title, program_name, amount_min_usd, amount_max_usd, currency, deadline_date, application_url, country, region, industry_tags")
      .eq("ngo_id", ngo.id)
      .order("deadline_date", { ascending: true, nullsFirst: false })
      .limit(20);

    // Get linked jobs (active only)
    const { data: jobs } = await supabase
      .from("job_listings")
      .select("id, title, location, type, sector, apply_url, created_at")
      .eq("ngo_id", ngo.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);

    return Response.json({
      ngo,
      grants: grants ?? [],
      jobs: jobs ?? [],
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
