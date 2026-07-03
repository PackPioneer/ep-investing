import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Load the member's record (industries drive the feed)
  const { data: member } = await supabase
    .from("experts")
    .select("id, name, role, industries, intent, is_listed")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!member) return NextResponse.json({ error: "No member profile" }, { status: 404 });

  const industries = Array.isArray(member.industries) ? member.industries : [];

  let companies = [];
  if (industries.length > 0) {
    // companies whose industry_tags overlap the member's followed industries
    const { data, error } = await supabase
      .from("companies")
      .select("id, name, slug, description, logo_url, industry_tags, headquarters_city, headquarters_country")
      .overlaps("industry_tags", industries)
      .not("is_hidden", "is", true)
      .limit(40);
    if (!error && data) companies = data;
  }

  return NextResponse.json({
    member: {
      name: member.name,
      role: member.role,
      industries,
      intent: member.intent,
      is_listed: member.is_listed,
    },
    companies,
  });
}