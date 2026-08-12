import { supabase } from "@/lib/supabase";
import { idFromSlug } from "@/lib/slug";

// Portfolio companies for an investor. Primary source is the investor_portfolio
// link table; falls back to the legacy enrichment_provenance tag if the table is
// empty or absent. Hidden/pending companies are excluded until approved.
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const investorId = idFromSlug(id);
    const cols = "id,name,slug,logo_url,industry_tags,description,url";

    // 1) Link table
    let companyIds = [];
    try {
      const { data: links } = await supabase
        .from("investor_portfolio")
        .select("company_id")
        .eq("investor_id", investorId)
        .limit(200);
      companyIds = (links || []).map((l) => l.company_id);
    } catch { /* table may not exist yet */ }

    if (companyIds.length) {
      const { data: companies } = await supabase
        .from("companies")
        .select(cols)
        .in("id", companyIds)
        .neq("is_hidden", true)
        .order("name")
        .limit(200);
      return Response.json({ companies: companies || [] });
    }

    // 2) Legacy fallback: enrichment_provenance tag
    const { data: inv } = await supabase.from("vc_firms").select("name").eq("id", investorId).single();
    if (!inv?.name) return Response.json({ companies: [] });
    const tag = `scraped_from_vc_portfolio:${inv.name}`;
    const tryMatch = async (val) => {
      try {
        const { data } = await supabase
          .from("companies").select(cols)
          .eq("enrichment_provenance", val).neq("is_hidden", true).order("name").limit(60);
        return data || [];
      } catch { return []; }
    };
    let companies = await tryMatch(tag);
    if (!companies.length) companies = await tryMatch(JSON.stringify(tag));
    return Response.json({ companies });
  } catch (error) {
    console.error("Error fetching investor portfolio:", error);
    return Response.json({ companies: [] });
  }
}
