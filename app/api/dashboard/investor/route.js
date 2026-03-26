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

  const focusTags = profile.focus
    ? profile.focus.split(",").map(f => f.trim()).filter(Boolean)
    : [];

  let companies = [];
  if (focusTags.length > 0) {
    const { data } = await supabase
      .from("companies")
      .select("id, name, description, funding_stage, looking_to_raise, is_hiring, industry_tags")
      .eq("looking_to_raise", true)
      .limit(20);
    companies = data || [];
  } else {
    const { data } = await supabase
      .from("companies")
      .select("id, name, description, funding_stage, looking_to_raise, is_hiring, industry_tags")
      .eq("looking_to_raise", true)
      .limit(20);
    companies = data || [];
  }

  return Response.json({ profile, companies });
}