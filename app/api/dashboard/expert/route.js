import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: expert } = await supabaseAdmin
    .from("experts")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  return Response.json({ expert: expert || null });
}

export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, bio, expertise_areas, hourly_rate, availability, linkedin_url, website_url, location } = body;

  const { data, error } = await supabaseAdmin
    .from("experts")
    .update({ name, bio, expertise_areas, hourly_rate, availability, linkedin_url, website_url, location })
    .eq("clerk_user_id", userId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}