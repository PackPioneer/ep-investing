import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parse } from "node-html-parser";
import { requireAdmin } from "@/lib/admin";

async function scrapeUrl(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EPInvestingBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return {};
    const html = await res.text();
    const root = parse(html);
    const getMeta = (prop) => {
      const el = root.querySelector(`meta[property="${prop}"]`) ||
                 root.querySelector(`meta[name="${prop}"]`);
      return el?.getAttribute("content")?.trim() || null;
    };
    const description = getMeta("og:description") || getMeta("description") || "";
    const domain = new URL(url).hostname;
    let logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    try {
      const lr = await fetch(`https://logo.clearbit.com/${domain}`, {
        method: "HEAD", signal: AbortSignal.timeout(3000),
      });
      if (lr.ok) logo_url = `https://logo.clearbit.com/${domain}`;
    } catch { /* keep favicon */ }
    return { description, logo_url };
  } catch {
    return {};
  }
}

export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const body = await req.json();
    const { name, url, description: submittedDesc } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Normalize URL
    let normalizedUrl;
    try {
      normalizedUrl = new URL(url.startsWith("http") ? url : `https://${url}`).href;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, "");

    // Dupe check by hostname
    const { data: existing } = await supabase
      .from("vc_firms")
      .select("id, name")
      .ilike("url", `%${hostname}%`)
      .limit(1);

    if (existing?.length > 0) {
      return NextResponse.json({
        error: `Already exists: ${existing[0].name}`,
        existing_id: existing[0].id,
      }, { status: 409 });
    }

    // Scrape for description fallback + logo
    const scraped = await scrapeUrl(normalizedUrl);
    const description = submittedDesc || scraped.description || "";

    // Insert — no special flags needed (vc_firms has no status/claimable columns).
    // claim card on the public profile auto-shows when claimed_by_clerk_user_id is null.
    const { data: inserted, error } = await supabase
      .from("vc_firms")
      .insert({
        name,
        url: normalizedUrl,
        description,
        logo_url: scraped.logo_url || null,
        investor_intel_provenance: "admin_quick_add",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Admin add-investor insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: inserted.id, name });
  } catch (err) {
    console.error("Admin add-investor error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
