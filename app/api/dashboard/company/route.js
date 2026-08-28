import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Resolve the company this user can manage, via Clerk Organization membership.
// Any member of the company's org can view and edit (multi-user team support).
async function resolveCompanyForUser(userId) {
  // Org membership (multi-user teams). Wrapped so a Clerk hiccup can't 500 the
  // whole dashboard — fall through to the legacy owner/claimant lookup instead.
  let orgIds = [];
  try {
    const client = await clerkClient();
    const { data: memberships } = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
    orgIds = (memberships || []).map((m) => m.organization.id);
  } catch { /* ignore — fall through */ }

  if (orgIds.length > 0) {
    // limit(1), not maybeSingle(): a user matching >1 company must not error.
    const { data } = await supabase
      .from("companies")
      .select("*")
      .in("clerk_organization_id", orgIds)
      .order("id", { ascending: true })
      .limit(1);
    if (data && data[0]) return data[0];
  }

  const { data: legacy } = await supabase
    .from("companies")
    .select("*")
    .or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`)
    .order("id", { ascending: true })
    .limit(1);
  return (legacy && legacy[0]) || null;
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
    name,
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

  // Company name — only apply when a non-empty value is provided (never blank it).
  const name_clean = typeof name === "string" && name.trim() ? name.trim().slice(0, 200) : undefined;
  const nameChanged = name_clean && name_clean !== company.name;

  const { data, error } = await supabase
    .from("companies")
    .update({
      ...(name_clean ? { name: name_clean } : {}),
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

  // Job listings are matched to a company by its name string, so keep any
  // existing roles attached when the company renames.
  if (nameChanged && company.name) {
    try { await supabase.from("job_listings").update({ company: name_clean }).eq("company", company.name); } catch { /* non-fatal */ }
  }

  return Response.json(data);
}