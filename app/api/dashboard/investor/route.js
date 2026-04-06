import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("matched_requests")
    .select("*")
    .eq("clerk_user_id", userId)
    .eq("path", "investor")
    .single();

  if (!profile) return Response.json({ error: "No investor profile found" }, { status: 404 });

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, description, funding_stage, looking_to_raise, is_hiring, seeking_partnerships, industry_tags")
    .order("created_at", { ascending: false })
    .limit(50);

  return Response.json({ profile, companies: companies || [] });
}

export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, firm, focus, stage, check_size, thesis, linkedin, website } = body;

  const { data, error } = await supabase
    .from("matched_requests")
    .update({ name, firm, focus, stage, check_size, thesis, linkedin, website })
    .eq("clerk_user_id", userId)
    .eq("path", "investor")
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}