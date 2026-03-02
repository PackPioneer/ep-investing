// scripts/scrape-vcs.js
// Run: node scripts/scrape-vcs.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ── Add new VC URLs here anytime ──────────────────────────
const VC_URLS = [
  "https://www.antler.co/",
  "https://www.sputnikatx.com/",
  "https://launch.co/",
  "https://www.rebelfund.vc/",
  "https://www.lvlup.vc/",
  "https://www.pioneerfund.vc/",
  "https://www.generalcatalyst.com/",
  "https://www.manaventures.vc/",
  "https://www.southparkcommons.com/",
  "https://www.transposeplatform.vc/",
  "https://www.8090industries.com/",
  "https://www.afore.vc/",
  "https://www.boost.vc/",
  "https://drivecapital.com/",
  "https://www.joinef.com/",
  "https://www.everywhere.vc/",
  "https://www.hustlefund.vc/",
  "https://ritualcapital.com/",
  "https://www.schematicventures.com/",
  "https://www.serviceprovidercapital.com/",
  "https://www.streamlined.vc/",
  "https://www.eranyc.com/",
  "https://www.2100.vc/",
  "https://www.34stud.io/",
];

const CLIMATE_KEYWORDS = ["climate","energy","cleantech","clean tech","sustainability","sustainable","carbon","net zero","decarbonization","hydrogen","solar","wind","battery","nuclear","ev","electric vehicle","renewable","green","environment","emissions","transition","nature","ocean","water","food","agriculture","biodiversity","circular economy","waste","materials"];

const STAGE_KEYWORDS = {
  "pre-seed": ["pre-seed","preseed","idea stage","day zero","day 0"],
  "seed": ["seed","early stage","early-stage"],
  "series-a": ["series a","series-a"],
  "series-b": ["series b","series-b"],
  "growth": ["growth","late stage","growth equity"],
};

const GEO_KEYWORDS = {
  "United States": ["united states","america","north america","new york","san francisco","austin","chicago"],
  "Europe": ["europe","european","uk","london","berlin","paris"],
  "Global": ["global","worldwide","international"],
  "Africa": ["africa","african"],
  "Asia": ["asia","asian","southeast asia"],
  "Latin America": ["latin america","latam","brazil","mexico"],
};

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EPInvestmentBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    return await res.text();
  } catch (err) {
    console.warn(`  ⚠ Could not fetch ${url}: ${err.message}`);
    return null;
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html, url) {
  if (!html) return null;
  const fullText = stripHtml(html).toLowerCase();

  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1];
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const name = (ogTitle || titleTag || new URL(url).hostname)
    .replace(/\s*[|\-–—].*$/, "").replace(/\s+/g, " ").trim().slice(0, 100);

  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1];
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)?.[1];
  const description = (ogDesc || metaDesc || "").trim().slice(0, 600);

  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)?.[1];
  let logo_url = null;
  if (ogImage) {
    logo_url = ogImage.startsWith("http") ? ogImage : new URL(ogImage, url).href;
  } else {
    const favicon = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1];
    if (favicon) logo_url = favicon.startsWith("http") ? favicon : new URL(favicon, url).href;
  }

  const website = new URL(url).origin;
  const climate_focus_areas = CLIMATE_KEYWORDS.filter(k => fullText.includes(k)).slice(0, 8);
  const investment_stages = [];
  for (const [stage, keywords] of Object.entries(STAGE_KEYWORDS)) {
    if (keywords.some(k => fullText.includes(k))) investment_stages.push(stage);
  }
  const geographies = [];
  for (const [geo, keywords] of Object.entries(GEO_KEYWORDS)) {
    if (keywords.some(k => fullText.includes(k))) geographies.push(geo);
  }

  const fundSizeMatch = fullText.match(/\$\s*(\d+(?:\.\d+)?)\s*(m|million|b|billion)\s*(?:fund|capital|raised|aum)/i);
  const fund_size = fundSizeMatch ? `$${fundSizeMatch[1]}${fundSizeMatch[2].toLowerCase().startsWith("b") ? "B" : "M"}` : null;

  const checkMatch = fullText.match(/\$\s*(\d+(?:k|m)?)\s*(?:to|-)\s*\$?\s*(\d+(?:k|m)?)\s*(?:check|ticket|investment)/i);
  const sweet_spot_check_size = checkMatch ? `$${checkMatch[1]} - $${checkMatch[2]}` : null;

  const ai_summary = `${name} is a ${investment_stages.length > 0 ? investment_stages.join("/") : "venture"} investor${climate_focus_areas.length > 0 ? ` with interests in ${climate_focus_areas.slice(0, 3).join(", ")}` : ""}${geographies.length > 0 ? `, focused on ${geographies.slice(0, 2).join(" and ")}` : ""}.`;

  

  return {
    url: website,
    name,
    description,
    logo_url,
    climate_focus_areas: climate_focus_areas.length > 0 ? climate_focus_areas : null,
    investment_stages: investment_stages.length > 0 ? investment_stages : null,
    geographies: geographies.length > 0 ? geographies : null,
    fund_size,
    sweet_spot_check_size,
    ai_summary,
  };
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing env vars. Run:");
    console.error("   NEXT_PUBLIC_SUPABASE_URL=https://vfcfdoaxlbkfqpfzhzvu.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key node scripts/scrape-vcs.js");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: existing } = await supabase.from("vc_firms").select("url");
  const existingUrls = new Set((existing || []).map(e => e.url?.replace(/\/$/, "")));

  console.log(`\n📋 ${VC_URLS.length} URLs to process — ${existingUrls.size} already in DB\n`);

  let added = 0, skipped = 0, failed = 0;

  for (const url of VC_URLS) {
    const cleanUrl = new URL(url).origin;
    if (existingUrls.has(cleanUrl)) {
      console.log(`  ⏭  Skipping (exists): ${cleanUrl}`);
      skipped++; continue;
    }

    console.log(`  🔍 Scraping: ${url}`);
    const html = await fetchPage(url);
    const meta = extractMeta(html, url);

    if (!meta?.name) {
      console.log(`  ✗ No data: ${url}`);
      failed++; continue;
    }

    const { error } = await supabase.from("vc_firms").insert(meta);
    if (error) {
      console.log(`  ✗ DB error for ${meta.name}: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓ Added: ${meta.name} [${meta.type}]`);
      added++;
    }
    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\n✅ Done — ${added} added, ${skipped} skipped, ${failed} failed\n`);
}

main().catch(console.error);
