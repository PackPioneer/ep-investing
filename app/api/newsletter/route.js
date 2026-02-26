import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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