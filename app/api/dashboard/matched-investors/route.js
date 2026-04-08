import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Get the company's sector and stage
  const { data: company } = await supabase
    .from("companies")
    .select("industry_tags, funding_stage")
    .eq("clerk_user_id", userId)
    .single();

  if (!company) return Response.json([]);

  // Get all approved investors
  const { data: investors } = await supabase
    .from("matched_requests")
    .select("id, name, firm, focus, stage, check_size, show_contact, primary_contact_email, linkedin")
    .eq("path", "investor")
    .eq("status", "approved");

  if (!investors) return Response.json([]);

  // Match investors whose focus overlaps with company's industry tags
  const companyTags = company.industry_tags || [];
  const companyStage = company.funding_stage || "";

  const matched = investors.filter(inv => {
    if (!inv.focus) return false;
    const invFocus = inv.focus.toLowerCase();
    const hasTagMatch = companyTags.some(tag => invFocus.includes(tag.replace(/_/g, " ")) || invFocus.includes(tag));
    return hasTagMatch;
  });

  return Response.json(matched.slice(0, 10));
}