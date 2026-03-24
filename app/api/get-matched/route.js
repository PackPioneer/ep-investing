// ============================================================
// FILE 1: app/api/get-matched/route.js
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPostHogClient } from "@/lib/posthog-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  const body = await req.json();
  const { path, name, email, firm, focus, stage, check_size, company, website, technology, raise, linkedin, specialties, availability, rate, notes, bio } = body;

  if (!name || !email || !path) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("matched_requests")
    .insert({ path, name, email, firm, focus, stage, check_size, company, website, technology, raise, linkedin, specialties, availability, rate, notes, bio })
    .select().single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const posthog = getPostHogClient();
  posthog.identify({ distinctId: email, properties: { email, name } });
  posthog.capture({ distinctId: email, event: "get_matched_submitted", properties: { path, email, name, source: "server" } });

  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabase
    .from("matched_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const { id, status, admin_notes } = await req.json();
  const { data, error } = await supabase
    .from("matched_requests")
    .update({ status, admin_notes })
    .eq("id", id).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}
