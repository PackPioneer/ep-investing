import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, url, description, sector, logo_url, industry_tags, founding_year, headquarters_location, core_technology, production_status, total_funding_raised')
    .order('id', { ascending: true })
    .limit(50);

  if (error) {
    return Response.json({ message: error.message, details: error }, { status: 500 });
  }

  return Response.json(companies);
}