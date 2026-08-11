import { supabase } from "@/lib/supabase";

// Published job listings for a company profile. Matches on company_id (set by the
// scraper / backfill) OR the company's exact name (case-insensitive), so real
// scraped jobs surface on a profile even before they've been linked by id.
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const isNumericId = /^\d+$/.test(String(id));

    const { data: company } = await supabase
      .from("companies")
      .select("id, name")
      .eq(isNumericId ? "id" : "slug", id)
      .single();

    if (!company) return Response.json({ jobs: [] });

    const cols = "id, title, company, company_id, location, type, sector, work_mode, experience_level, apply_url, contact_email, created_at";

    const [byId, byName] = await Promise.all([
      supabase.from("job_listings").select(cols).eq("status", "published").eq("company_id", company.id).order("created_at", { ascending: false }).limit(50),
      company.name
        ? supabase.from("job_listings").select(cols).eq("status", "published").ilike("company", company.name).order("created_at", { ascending: false }).limit(50)
        : Promise.resolve({ data: [] }),
    ]);

    // Merge + dedupe by id
    const seen = new Set();
    const jobs = [];
    for (const row of [...(byId.data || []), ...(byName.data || [])]) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      jobs.push(row);
    }
    jobs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return Response.json({ jobs, company: { id: company.id, name: company.name } });
  } catch (error) {
    console.error("Error fetching company jobs:", error);
    return Response.json({ jobs: [] });
  }
}
