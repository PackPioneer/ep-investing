import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parse } from "node-html-parser";
import { requireAdmin } from "@/lib/admin";

const VALID_TAGS = [
  "battery_storage", "carbon_credits", "circular_economy", "clean_cooking", "consultancy",  "direct_air_capture",
  "electric_aviation", "ev_charging", "geothermal_energy", "green_hydrogen",
  "grid_storage", "industrial_decarbonization", "nuclear_technologies",
  "saf_efuels", "solar", "wind_energy", "energy_generation",
];

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
    const rawTitle = getMeta("og:site_name") || getMeta("og:title") ||
      root.querySelector("title")?.text?.trim() || "";
    const name = rawTitle.split(/[|\\-–—]/)[0].trim().slice(0, 100);
    const description = getMeta("og:description") || getMeta("description") || "";
    const domain = new URL(url).hostname;
    let logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    try {
      const lr = await fetch(`https://logo.clearbit.com/${domain}`, {
        method: "HEAD", signal: AbortSignal.timeout(3000),
      });
      if (lr.ok) logo_url = `https://logo.clearbit.com/${domain}`;
    } catch { /* keep favicon */ }
    return { name, description, logo_url };
  } catch {
    return {};
  }
}

async function classifyWithClaude(name, description) {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return ["industrial_decarbonization"];
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: `Classify this climate company into 1-3 tags from this list only:\n${VALID_TAGS.join(", ")}\n\nCompany: ${name}\nDescription: ${description}\n\nReply with ONLY a JSON array, e.g. ["solar", "battery_storage"]`,
        }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || "[]";
    const cleaned = text.replace(/```[a-z]*\n?|\n?```/g, "").trim();
    const tags = JSON.parse(cleaned);
    return tags.filter(t => VALID_TAGS.includes(t));
  } catch {
    return ["industrial_decarbonization"];
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
    const {
      url,
      name: submittedName,
      description: submittedDesc,
      // Optional detail fields
      founding_year,
      headquarters_city,
      headquarters_country,
      funding_stage,
      tagline,
      industry_tags: manualTags,
    } = body;

    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    if (!submittedName) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    let normalizedUrl;
    try {
      normalizedUrl = new URL(url.startsWith("http") ? url : `https://${url}`).href;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, "");

    const { data: existing } = await supabase
      .from("companies")
      .select("id, name")
      .ilike("url", `%${hostname}%`)
      .limit(1);

    if (existing?.length > 0) {
      return NextResponse.json({
        error: `Already exists: ${existing[0].name}`,
        existing_id: existing[0].id,
      }, { status: 409 });
    }

    const scraped = await scrapeUrl(normalizedUrl);
    const name = submittedName || scraped.name || hostname;
    const description = submittedDesc || scraped.description || "";

    // Skip Haiku classification when admin provides manual industry tags
    const tags = Array.isArray(manualTags) && manualTags.length > 0
      ? manualTags
      : await classifyWithClaude(name, description);

    // Build payload — required fields first, then conditionally add optional ones
    const payload = {
      name,
      url: normalizedUrl,
      description: description.slice(0, 500),
      logo_url: scraped.logo_url || null,
      industry_tags: tags,
      sector: "cleantech_company",
      enrichment_provenance: "admin_quick_add",
    };
    if (founding_year && Number.isInteger(founding_year)) payload.founding_year = founding_year;
    if (headquarters_city) payload.headquarters_city = headquarters_city;
    if (headquarters_country) payload.headquarters_country = headquarters_country;
    if (funding_stage) payload.funding_stage = funding_stage;
    if (tagline) payload.tagline = tagline;

    const { data: inserted, error } = await supabase
      .from("companies")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Admin add-company insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: inserted.id, name });
  } catch (err) {
    console.error("Admin add-company error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
