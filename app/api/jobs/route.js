import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  // Look up the user's company (via clerk_user_id OR claimed_by_clerk_user_id)
  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`)
    .maybeSingle();

  // If no company, check NGOs
  let ngo = null;
  if (!company) {
    const { data } = await supabase
      .from("ngos")
      .select("id, name")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    ngo = data;
  }

  // Require either company or NGO ownership to post
  if (!company && !ngo) {
    return NextResponse.json({ message: "Only company or NGO owners can post jobs" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    company: companyName,
    location,
    type,
    sector,
    description,
    contact_email,
    apply_url,
    // Rich fields from the company dashboard form
    role_overview,
    responsibilities,
    requirements,
    nice_to_haves,
    mission_statement,
    work_mode,
    experience_level,
    salary_min,
    salary_max,
    salary_currency,
    equity_offered,
    sector_tags,
    application_deadline,
  } = body;

  if (!title || !location) {
    return NextResponse.json({ message: "Missing required fields: title and location" }, { status: 400 });
  }
  if (!apply_url && !contact_email) {
    return NextResponse.json({ message: "Provide either an apply URL or a contact email" }, { status: 400 });
  }

  // Build insert payload — only include fields that have values to avoid writing nulls/empties.
  const payload = {
    title,
    company: companyName || company?.name || ngo?.name || null,
    location,
    status: "pending",
  };
  if (company?.id) payload.company_id = company.id;
  if (ngo?.id) payload.ngo_id = ngo.id;
  if (type) payload.type = type;
  if (sector) payload.sector = sector;
  if (description) payload.description = description;
  if (contact_email) payload.contact_email = contact_email;
  if (apply_url) payload.apply_url = apply_url;
  if (role_overview) payload.role_overview = role_overview;
  if (responsibilities) payload.responsibilities = responsibilities;
  if (requirements) payload.requirements = requirements;
  if (nice_to_haves) payload.nice_to_haves = nice_to_haves;
  if (mission_statement) payload.mission_statement = mission_statement;
  if (work_mode) payload.work_mode = work_mode;
  if (experience_level) payload.experience_level = experience_level;
  if (salary_min !== null && salary_min !== undefined && salary_min !== "") {
    const n = Number(salary_min);
    if (!isNaN(n)) payload.salary_min = n;
  }
  if (salary_max !== null && salary_max !== undefined && salary_max !== "") {
    const n = Number(salary_max);
    if (!isNaN(n)) payload.salary_max = n;
  }
  if (salary_currency) payload.salary_currency = salary_currency;
  if (typeof equity_offered === "boolean") payload.equity_offered = equity_offered;
  if (Array.isArray(sector_tags) && sector_tags.length > 0) payload.sector_tags = sector_tags;
  if (application_deadline) payload.application_deadline = application_deadline;

  const { data, error } = await supabase
    .from("job_listings")
    .insert(payload)
    .select().single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "100");

  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const { id, status } = await req.json();
  const { data, error } = await supabase
    .from("job_listings")
    .update({ status })
    .eq("id", id).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}