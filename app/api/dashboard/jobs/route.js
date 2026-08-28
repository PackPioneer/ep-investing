import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { companyHasBoardAccess } from "@/lib/company-billing";

// Free companies can keep up to this many active (published) job posts.
// Growth / Enterprise are unlimited.
const FREE_JOB_LIMIT = 3;

// Fetch billing fields resiliently (columns may not all exist on older DBs).
async function companyBilling(companyId) {
  const { data, error } = await supabase.from("companies")
    .select("stripe_customer_id, newsroom_access").eq("id", companyId).maybeSingle();
  if (error || !data) return { stripe_customer_id: null, newsroom_access: false };
  return data;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("clerk_user_id", userId)
    .single();

  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("company", company.name)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const billing = await companyBilling(company.id);
  const board_access = await companyHasBoardAccess({ ...company, ...billing });
  return Response.json({ jobs: data, company, board_access, job_limit: FREE_JOB_LIMIT });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("clerk_user_id", userId)
    .single();

  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  // Free plan cap: up to FREE_JOB_LIMIT active (published) posts. Growth is unlimited.
  const billing = await companyBilling(company.id);
  const hasAccess = await companyHasBoardAccess({ ...company, ...billing });
  if (!hasAccess) {
    const { count } = await supabase
      .from("job_listings")
      .select("id", { count: "exact", head: true })
      .eq("company", company.name)
      .eq("status", "published");
    if ((count || 0) >= FREE_JOB_LIMIT) {
      return Response.json({
        error: `The free plan allows up to ${FREE_JOB_LIMIT} active job posts. Upgrade to Growth for unlimited postings, or remove an existing role.`,
        code: "job_limit",
      }, { status: 402 });
    }
  }

  const body = await req.json();
  const { title, location, type, sector, description, contact_email, work_mode, experience_level, salary_min, salary_max, salary_currency, equity_offered, role_overview, responsibilities, requirements, nice_to_haves, sector_tags, mission_statement, apply_url, application_deadline } = body;

  const { data, error } = await supabase
    .from("job_listings")
    .insert({ title, company: company.name, location, type, sector, description, contact_email, work_mode, experience_level, salary_min, salary_max, salary_currency, equity_offered, role_overview, responsibilities, requirements, nice_to_haves, sector_tags, mission_statement, apply_url, application_deadline, status: "published" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  const { error } = await supabase
    .from("job_listings")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("clerk_user_id", userId)
    .single();

  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const body = await req.json();
  const { id, ...fields } = body;

  const { data, error } = await supabase
    .from("job_listings")
    .update(fields)
    .eq("id", id)
    .eq("company", company.name)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
