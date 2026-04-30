import { supabase } from "@/lib/supabase";
import { getOwnedNgo } from "@/lib/ngo-owner";

export async function GET() {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  const { data, error } = await supabase
    .from("job_listings")
    .select("id, title, location, type, sector, status, apply_url, created_at, views")
    .eq("ngo_id", ngo.id)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ jobs: data ?? [] });
}

export async function POST(req) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  try {
    const body = await req.json();
    const { title, location, type, sector, description, apply_url, contact_email } = body;

    if (!title || !apply_url) {
      return Response.json({ error: "Title and apply URL are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("job_listings")
      .insert({
        title,
        company: ngo.name,
        ngo_id: ngo.id,
        location: location || null,
        type: type || null,
        sector: sector || null,
        description: description || null,
        apply_url,
        contact_email: contact_email || ngo.contact_email || null,
        status: "active",
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ job: data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
