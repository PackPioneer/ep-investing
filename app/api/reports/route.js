import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const sector = searchParams.get("sector");
  const geography = searchParams.get("geography");
  const slug = searchParams.get("slug");

  let query = supabase
    .from("reports")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (slug) query = query.eq("slug", slug).single();
  if (sector) query = query.eq("sector", sector);
  if (geography) query = query.eq("geography", geography);

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const {
    slug, title, subtitle, sector, geography, summary,
    pdf_url, cover_image_url, market_value, expected_growth,
    linked_company_tags, linked_investor_ids, linked_grant_ids,
    key_findings, chart_data, published
  } = body;

  const { data, error } = await supabase
    .from("reports")
    .insert({
      slug, title, subtitle, sector, geography, summary,
      pdf_url, cover_image_url, market_value, expected_growth,
      linked_company_tags, linked_investor_ids, linked_grant_ids,
      key_findings, chart_data,
      published: published || false,
      published_at: published ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}
