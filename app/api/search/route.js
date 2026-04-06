import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 100;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let companiesQuery = supabase.from('companies').select('*', { count: 'exact' }).range(from, to);
    let investorsQuery = supabase.from('vc_firms').select('*', { count: 'exact' }).range(from, to);
    let grantsQuery = supabase.from('grants').select('*', { count: 'exact' }).range(from, to);

    if (query) {
      companiesQuery = companiesQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      investorsQuery = investorsQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      grantsQuery = grantsQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%,funder_name.ilike.%${query}%`);
    }

    const [
      { data: companies, count: companiesCount, error: companiesError },
      { data: investors, count: investorsCount, error: investorsError },
      { data: grants, count: grantsCount, error: grantsError },
    ] = await Promise.all([companiesQuery, investorsQuery, grantsQuery]);

    if (companiesError) console.error('Companies search error:', companiesError);
    if (investorsError) console.error('Investors search error:', investorsError);
    if (grantsError) console.error('Grants search error:', grantsError);

    return Response.json({
      companies: companies || [],
      investors: investors || [],
      grants: grants || [],
      meta: {
        page,
        limit,
        companiesTotal: companiesCount || 0,
        investorsTotal: investorsCount || 0,
        grantsTotal: grantsCount || 0,
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ message: "Error performing search" }, { status: 500 });
  }
}