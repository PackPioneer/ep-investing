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

  // Check the user has an approved company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, status")
    .eq("clerk_user_id", userId)
    .single();

  if (companyError || !company || company.status !== "approved") {
    return NextResponse.json({ message: "Only approved companies can post jobs" }, { status: 403 });
  }

  const body = await req.json();
  const { title, company: companyName, location, type, sector, description, contact_email } = body;

  if (!title || !companyName || !location || !contact_email) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("job_listings")
    .insert({ title, company: companyName, location, type, sector, description, contact_email, status: "pending" })
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