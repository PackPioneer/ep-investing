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