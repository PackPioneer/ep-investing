import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const [investors, companies, grants, subscribers] = await Promise.all([
    supabase.from("vc_firms").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("grants").select("id", { count: "exact", head: true }),
    supabase.from("subscribers").select("id", { count: "exact", head: true }),
  ]);
  return NextResponse.json({
    investors: investors.count || 0,
    companies: companies.count || 0,
    grants: grants.count || 0,
    subscribers: subscribers.count || 0,
  });
}

export async function POST(req) {
  try {
    const { email, source } = await req.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        { email: email.toLowerCase().trim(), source: source || "homepage" },
        { onConflict: "email" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}