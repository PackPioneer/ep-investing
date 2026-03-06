// app/api/search/route.js
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    let companiesQuery = supabase.from('companies').select('*').limit(50);
    let investorsQuery = supabase.from('vc_firms').select('*').limit(50);
    let grantsQuery = supabase.from('grants').select('*').limit(50);

    if (query) {
      companiesQuery = companiesQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      investorsQuery = investorsQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      grantsQuery = grantsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,funder_name.ilike.%${query}%`);
    }

    const [
      { data: companies, error: companiesError },
      { data: investors, error: investorsError },
      { data: grants, error: grantsError },
    ] = await Promise.all([companiesQuery, investorsQuery, grantsQuery]);

    if (companiesError) console.error('Companies search error:', companiesError);
    if (investorsError) console.error('Investors search error:', investorsError);
    if (grantsError) console.error('Grants search error:', grantsError);

    return Response.json({
      companies: companies || [],
      investors: investors || [],
      grants: grants || [],
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ message: "Error performing search" }, { status: 500 });
  }
}
