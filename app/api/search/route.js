// app/api/search/route.js
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return Response.json({ companies: [], investors: [], grants: [] });
    }

    // Search companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (companiesError) console.error('Companies search error:', companiesError);

    // Search VC firms (investors)
    const { data: investors, error: investorsError } = await supabase
      .from('vc_firms')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (investorsError) console.error('Investors search error:', investorsError);

    // Search grants
    const { data: grants, error: grantsError } = await supabase
      .from('grants')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,funder_name.ilike.%${query}%`)
      .limit(20);

    if (grantsError) console.error('Grants search error:', grantsError);

    return Response.json({
      companies: companies || [],
      investors: investors || [],
      grants: grants || []
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json(
      { message: "Error performing search" },
      { status: 500 }
    );
  }
}
