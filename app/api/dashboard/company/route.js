import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Resolve the company this user can manage, via Clerk Organization membership.
// Any member of the company's org can view and edit (multi-user team support).
async function resolveCompanyForUser(userId) {
  const client = await clerkClient();
  const { data: memberships } =
    await client.users.getOrganizationMembershipList({ userId, limit: 100 });
  const orgIds = memberships.map((m) => m.organization.id);

  if (orgIds.length > 0) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .in("clerk_organization_id", orgIds)
      .maybeSingle();
    if (data) return data;
  }

  const { data: legacy } = await supabase
    .from("companies")
    .select("*")
    .or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`)
    .maybeSingle();
  return legacy || null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const company = await resolveCompanyForUser(userId);
  if (!company) return Response.json({ error: "No company found" }, { status: 404 });
  return Response.json(company);
}

export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const company = await resolveCompanyForUser(userId);
  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const body = await req.json();
  const {
    url, description, tagline, headquarters_city, headquarters_country, linkedin_url,
    twitter_url, founding_year, employee_count, location, funding_stage, business_model,
    looking_to_raise, is_hiring, seeking_partnerships, industry_tags, raise_target,
    raise_current, raise_close_date, min_check_size, raise_round_type, raise_instrument,
    raise_valuation, raise_lead_investor, raise_use_of_proceeds, raise_revenue_status,
    raise_data_room_url, raise_intro_call_url, show_contact, primary_contact_name,
    primary_contact_email, secondary_contact_name, secondary_contact_email,
  } = body;

  // Coerce empty strings to null for integer columns (Postgres rejects "" for int).
  const founding_year_clean = founding_year === "" || founding_year === undefined ? null : founding_year;
  const employee_count_clean = employee_count === "" || employee_count === undefined ? null : employee_count;

  const { data, error } = await supabase
    .from("companies")
    .update({
      url, description, tagline, headquarters_city, headquarters_country, linkedin_url,
      twitter_url, founding_year: founding_year_clean, employee_count: employee_count_clean,
      location, funding_stage, business_model,
      looking_to_raise, is_hiring, seeking_partnerships, industry_tags, show_contact,
      primary_contact_name, primary_contact_email, secondary_contact_name,
      secondary_contact_email, raise_target, raise_current, raise_close_date, min_check_size,
      raise_round_type, raise_instrument, raise_valuation, raise_lead_investor,
      raise_use_of_proceeds, raise_revenue_status, raise_data_room_url, raise_intro_call_url,
    })
    .eq("id", company.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}