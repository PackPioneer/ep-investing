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

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function generateUniqueSlug(supabase, baseSlug) {
  let slug = baseSlug;
  let suffix = 1;
  // Try base slug, then -2, -3, etc. until one is available.
  while (true) {
    const { data: existing } = await supabase
      .from("ngos")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
    if (suffix > 50) throw new Error("Could not generate unique slug");
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
    const { name, website_url, description: submittedDesc } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!website_url) return NextResponse.json({ error: "Website URL is required" }, { status: 400 });

    // Normalize URL
    let normalizedUrl;
    try {
      normalizedUrl = new URL(website_url.startsWith("http") ? website_url : `https://${website_url}`).href;
    } catch {
      return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
    }
    const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, "");

    // Dupe check by hostname
    const { data: existing } = await supabase
      .from("ngos")
      .select("id, name, slug")
      .ilike("website_url", `%${hostname}%`)
      .limit(1);

    if (existing?.length > 0) {
      return NextResponse.json({
        error: `Already exists: ${existing[0].name}`,
        existing_slug: existing[0].slug,
      }, { status: 409 });
    }

    // Generate unique slug
    const baseSlug = slugify(name);
    if (!baseSlug) {
      return NextResponse.json({ error: "Could not generate slug from name" }, { status: 400 });
    }
    const slug = await generateUniqueSlug(supabase, baseSlug);

    // Scrape for description fallback + logo
    const scraped = await scrapeUrl(normalizedUrl);
    const bio = submittedDesc || scraped.description || "";

    // Insert — explicitly setting claimable: true and status: "active"
    // (defaults are false and "pending" which would make the NGO invisible/unclaimable)
    const { data: inserted, error } = await supabase
      .from("ngos")
      .insert({
        name,
        slug,
        website_url: normalizedUrl,
        bio,
        logo_url: scraped.logo_url || null,
        claimable: true,
        status: "active",
        org_type: "implementation_nonprofit",
      })
      .select("id, slug")
      .single();

    if (error) {
      console.error("Admin add-ngo insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, slug: inserted.slug, name });
  } catch (err) {
    console.error("Admin add-ngo error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
