import { supabase } from "@/lib/supabase";
import { getOwnedNgo } from "@/lib/ngo-owner";

async function verifyOwnership(grantId, ngoId) {
  const { data } = await supabase
    .from("grants")
    .select("id, ngo_id")
    .eq("id", grantId)
    .single();
  return data && data.ngo_id === ngoId;
}

export async function GET(req, { params }) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  const { id } = await params;
  const { data, error } = await supabase
    .from("grants")
    .select("*")
    .eq("id", id)
    .eq("ngo_id", ngo.id)
    .single();

  if (error || !data) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ grant: data });
}

export async function PATCH(req, { params }) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  const { id } = await params;
  if (!(await verifyOwnership(id, ngo.id))) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const update = {};
    const ALLOWED = [
      "title", "description", "amount_min_usd", "amount_max_usd", "currency",
      "deadline_date", "application_url", "country", "industry_tags", "eligibility",
    ];
    for (const k of ALLOWED) if (body[k] !== undefined) update[k] = body[k];

    if (update.amount_min_usd) update.amount_min_usd = parseFloat(update.amount_min_usd);
    if (update.amount_max_usd) update.amount_max_usd = parseFloat(update.amount_max_usd);
    if (update.application_url) update.url = update.application_url;

    const { data, error } = await supabase
      .from("grants")
      .update(update)
      .eq("id", id)
      .eq("ngo_id", ngo.id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ grant: data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  const { id } = await params;
  if (!(await verifyOwnership(id, ngo.id))) {
    return Response.json({ error: "Not authorized" }, { status: 403 });
  }

  const { error } = await supabase
    .from("grants")
    .delete()
    .eq("id", id)
    .eq("ngo_id", ngo.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
