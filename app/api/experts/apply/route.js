import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const body = await req.json();
  const { name, email, specialties, bio, rate, availability } = body;

  if (!name || !email || !specialties || !bio) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expert_applications")
    .insert({ name, email, specialties, bio, rate, availability })
    .select().single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabase
    .from("expert_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const { id, status, admin_notes } = await req.json();
  const { data, error } = await supabase
    .from("expert_applications")
    .update({ status, admin_notes })
    .eq("id", id).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}
