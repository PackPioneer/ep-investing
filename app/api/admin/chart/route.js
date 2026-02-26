import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const tables = {
  investors: "vc_firms",
  companies: "companies",
  grants: "grants",
  subscribers: "subscribers",
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "investors";
  const table = tables[type];

  if (!table) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(table)
    .select("created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped = {};
  for (const row of data) {
    const date = row.created_at?.split("T")[0];
    if (date) grouped[date] = (grouped[date] || 0) + 1;
  }

  const result = Object.entries(grouped).map(([_id, count]) => ({ _id, count }));
  return NextResponse.json(result);
}