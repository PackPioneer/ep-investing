import { supabase } from "@/lib/supabase";
import { getOwnedNgo } from "@/lib/ngo-owner";

export async function GET(req, { params }) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("id", id)
    .eq("ngo_id", ngo.id)
    .single();

  if (error || !data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ job: data });
}

export async function PATCH(req, { params }) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  const { id } = await params;
  try {
    const body = await req.json();
    const update = {};
    const ALLOWED = ["title", "location", "type", "sector", "description", "apply_url", "contact_email", "status"];
    for (const k of ALLOWED) if (body[k] !== undefined) update[k] = body[k];

    const { data, error } = await supabase
      .from("job_listings")
      .update(update)
      .eq("id", id)
      .eq("ngo_id", ngo.id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ job: data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  const { id } = await params;
  const { error } = await supabase
    .from("job_listings")
    .delete()
    .eq("id", id)
    .eq("ngo_id", ngo.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
