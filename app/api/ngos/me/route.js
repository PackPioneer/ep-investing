import { supabase } from "@/lib/supabase";
import { getOwnedNgo } from "@/lib/ngo-owner";

export async function GET() {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });
  return Response.json({ ngo });
}

const ALLOWED_FIELDS = [
  "name", "legal_name", "short_description", "bio",
  "logo_url", "cover_image_url", "website_url",
  "headquarters_city", "headquarters_country",
  "sector_tags", "geography_focus",
  "founded_year", "staff_size", "annual_grants_budget_usd_range",
  "open_to_partnerships", "partnership_description",
  "contact_email",
];

export async function PATCH(req) {
  const { userId, ngo } = await getOwnedNgo();
  if (!userId) return Response.json({ error: "Not authenticated" }, { status: 401 });
  if (!ngo) return Response.json({ error: "No NGO profile" }, { status: 404 });

  try {
    const body = await req.json();

    const update = {};
    for (const field of ALLOWED_FIELDS) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    if (Object.keys(update).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    if (update.partnership_description !== undefined && !update.open_to_partnerships) {
      // If they're closing partnerships, clear the description
      if (body.open_to_partnerships === false) update.partnership_description = null;
    }

    const { data, error } = await supabase
      .from("ngos")
      .update(update)
      .eq("id", ngo.id)
      .eq("clerk_user_id", userId)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ ngo: data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
