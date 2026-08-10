import { supabase } from "@/lib/supabase";
import { idFromSlug } from "@/lib/slug";

// Portfolio companies for an investor. The VC-portfolio scraper inserts each
// portfolio company as a `companies` row tagged with an enrichment_provenance
// of `scraped_from_vc_portfolio:{investorName}`. enrichment_provenance may be a
// text or jsonb column depending on environment, so we try both shapes.
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data: inv } = await supabase
      .from("vc_firms")
      .select("name")
      .eq("id", idFromSlug(id))
      .single();

    if (!inv?.name) return Response.json({ companies: [] });

    const tag = `scraped_from_vc_portfolio:${inv.name}`;
    const cols = "id,name,slug,logo_url,industry_tags,description,url";

    const tryMatch = async (val) => {
      try {
        const { data } = await supabase
          .from("companies")
          .select(cols)
          .eq("enrichment_provenance", val)
          .neq("is_hidden", true)
          .order("name")
          .limit(60);
        return data || [];
      } catch {
        return [];
      }
    };

    // text column stores the raw string; jsonb column stores the JSON-encoded string
    let companies = await tryMatch(tag);
    if (!companies.length) companies = await tryMatch(JSON.stringify(tag));

    return Response.json({ companies });
  } catch (error) {
    console.error("Error fetching investor portfolio:", error);
    return Response.json({ companies: [] });
  }
}
