import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const body = await req.json();
  const { title, company, location, type, sector, description, contact_email } = body;

  if (!title || !company || !location || !contact_email) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("job_listings")
    .insert({ title, company, location, type, sector, description, contact_email, status: "pending" })
    .select().single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
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
