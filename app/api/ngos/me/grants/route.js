import { supabase } from "@/lib/supabase";
import { getOwnedNgo } from "@/lib/ngo-owner";

export async function GET() {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  const { data, error } = await supabase
    .from("grants")
    .select("id, title, program_name, amount_min_usd, amount_max_usd, currency, deadline_date, application_url, country, industry_tags, created_at")
    .eq("ngo_id", ngo.id)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ grants: data ?? [] });
}

export async function POST(req) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  try {
    const body = await req.json();
    const {
      title, description, amount_min_usd, amount_max_usd, currency,
      deadline_date, application_url, country, industry_tags, eligibility,
    } = body;

    if (!title || !application_url) {
      return Response.json({ error: "Title and application URL are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("grants")
      .insert({
        title,
        description: description || null,
        funder_name: ngo.name,
        funder_type: "ngo",
        ngo_id: ngo.id,
        amount_min_usd: amount_min_usd ? parseFloat(amount_min_usd) : null,
        amount_max_usd: amount_max_usd ? parseFloat(amount_max_usd) : null,
        currency: currency || "USD",
        deadline_date: deadline_date || null,
        application_url,
        url: application_url,
        country: country || null,
        industry_tags: industry_tags ?? [],
        eligibility: eligibility || null,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ grant: data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
