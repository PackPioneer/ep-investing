import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET current expert-listing state + fields
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data } = await supabase
    .from("experts")
    .select("id, is_listed, status, bio, expertise_areas, linkedin_url, website_url, location")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  return NextResponse.json({ listing: data || null });
}

// POST update expert-listing fields + opt in
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const { bio, expertise_areas, linkedin_url, website_url, location, list } = body;

  const update = {};
  if (typeof bio === "string") update.bio = bio.trim();
  if (Array.isArray(expertise_areas)) update.expertise_areas = expertise_areas;
  if (typeof linkedin_url === "string") update.linkedin_url = linkedin_url.trim();
  if (typeof website_url === "string") update.website_url = website_url.trim();
  if (typeof location === "string") update.location = location.trim();

  // Opting in requests listing -> pending review; opting out unlists
  if (list === true) {
    update.is_listed = true;
    update.status = "pending"; // admin reviews before public listing
  } else if (list === false) {
    update.is_listed = false;
  }

  const { error } = await supabase
    .from("experts")
    .update(update)
    .eq("clerk_user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}