// scripts/scrape-vcs.js
// Run: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/scrape-vcs.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

const BAD_NAMES = [
  "home","index","welcome","main","landing","page","loading","untitled",
  "just a moment","attention required","403","404","error","access denied",
  "cloudflare","please wait","redirecting",
];

const CLIMATE_KEYWORDS = [
  "climate","energy","cleantech","clean tech","sustainability","sustainable",
  "carbon","net zero","decarbonization","hydrogen","solar","wind","battery",
  "nuclear","ev","electric vehicle","renewable","green","environment",
  "emissions","transition","nature","ocean","water","food","agriculture",
  "biodiversity","circular economy","waste","materials","deep tech","hard tech",
];

const STAGE_KEYWORDS = {
  "pre-seed": ["pre-seed","preseed","idea stage","day zero","day 0","pre seed","earliest stage"],
  "seed": ["seed stage","seed fund","seed investor","seed capital","seed round","seed check"],
  "series-a": ["series a","series-a"],
  "series-b": ["series b","series-b"],
  "growth": ["growth stage","growth equity","late stage","growth capital"],
};

const GEO_KEYWORDS = {
  "United States": ["united states","u.s.","america","north america","new york","san francisco","austin","chicago","boston","los angeles","silicon valley"],
  "Europe": ["europe","european","uk ","london","berlin","paris","stockholm","amsterdam"],
  "Global": ["global","worldwide","international","across the world"],
  "Africa": ["africa","african","nairobi","lagos","cape town"],
  "Asia": ["asia","asian","southeast asia","singapore","tokyo","beijing","india"],
  "Latin America": ["latin america","latam","brazil","mexico","colombia","chile"],
};

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
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
    .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function domainToName(url) {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const base = hostname.split(".")[0];
  return base
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function isGoodName(name, url) {
  if (!name || name.length < 2) return false;
  const lower = name.toLowerCase().trim();
  if (BAD_NAMES.some(bad => lower === bad || lower.startsWith(bad + " "))) return false;
  if (name.length > 60) return false;
  if (name.split(" ").length > 6) return false;
  if (/[.!?]/.test(name) && name.split(" ").length > 4) return false;
  return true;
}

function extractName(html, url) {
  const candidates = [];

  const ogSiteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i)?.[1];
  if (ogSiteName) candidates.push(ogSiteName.trim());

  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1];
  if (ogTitle) candidates.push(ogTitle.replace(/\s*[|\-–—:·•].*$/, "").trim());

  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (titleTag) candidates.push(titleTag.replace(/\s*[|\-–—:·•].*$/, "").trim());

  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim();
  if (h1) candidates.push(h1);

  for (const candidate of candidates) {
    const clean = candidate.replace(/\s+/g, " ").trim();
    if (isGoodName(clean, url)) return clean.slice(0, 80);
  }

  return domainToName(url);
}

function extractMeta(html, url) {
  if (!html) return null;
  const fullText = stripHtml(html).toLowerCase();
  const website = new URL(url).origin;

  const name = extractName(html, url);

  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i)?.[1];
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)?.[1];
  const description = (ogDesc || metaDesc || "").replace(/\s+/g, " ").trim().slice(0, 600);

  const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1]
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)?.[1];
  let logo_url = null;
  if (ogImage) {
    logo_url = ogImage.startsWith("http") ? ogImage : new URL(ogImage, url).href;
  } else {
    const favicon = html.match(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i)?.[1];
    if (favicon) logo_url = favicon.startsWith("http") ? favicon : new URL(favicon, url).href;
  }

  const climate_focus_areas = CLIMATE_KEYWORDS.filter(k => fullText.includes(k)).slice(0, 8);

  const investment_stages = [];
  for (const [stage, keywords] of Object.entries(STAGE_KEYWORDS)) {
    if (keywords.some(k => fullText.includes(k))) investment_stages.push(stage);
  }
  if (investment_stages.length === 0 && (fullText.includes("venture") || fullText.includes("invest"))) {
    investment_stages.push("seed");
  }

  const geographies = [];
  for (const [geo, keywords] of Object.entries(GEO_KEYWORDS)) {
    if (keywords.some(k => fullText.includes(k))) geographies.push(geo);
  }

  const fundSizeMatch = fullText.match(/\$\s*(\d+(?:\.\d+)?)\s*(m|million|b|billion)\s*(?:fund|capital|raised|aum|assets)/i);
  const fund_size = fundSizeMatch
    ? `$${fundSizeMatch[1]}${fundSizeMatch[2].toLowerCase().startsWith("b") ? "B" : "M"}`
    : null;

  const checkMatch = fullText.match(/\$\s*(\d+(?:k|m)?)\s*(?:to|-)\s*\$?\s*(\d+(?:k|m)?)\s*(?:check|ticket|investment|deal)/i);
  const sweet_spot_check_size = checkMatch ? `$${checkMatch[1]} - $${checkMatch[2]}` : null;

  const ai_summary = [
    name, "is a",
    investment_stages.length > 0 ? investment_stages.join("/") : "venture capital",
    "firm",
    climate_focus_areas.length > 0 ? `focused on ${climate_focus_areas.slice(0, 3).join(", ")}` : "",
    geographies.length > 0 ? `investing in ${geographies.slice(0, 2).join(" and ")}` : "",
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim() + ".";

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
  const { data: existing } = await supabase.from("vc_firms").select("url, name");
  const existingMap = new Map((existing || []).map(e => [e.url?.replace(/\/$/, ""), e.name]));

  console.log(`\n📋 ${VC_URLS.length} URLs to process — ${existingMap.size} already in DB\n`);

  let added = 0, updated = 0, skipped = 0, failed = 0;

  for (const url of VC_URLS) {
    const cleanUrl = new URL(url).origin;
    const existingName = existingMap.get(cleanUrl);

    if (existingName && isGoodName(existingName, url)) {
      console.log(`  ⏭  Skipping (good name exists): ${existingName}`);
      skipped++;
      continue;
    }

    if (existingName) {
      console.log(`  🔄 Re-scraping bad name "${existingName}": ${url}`);
    } else {
      console.log(`  🔍 Scraping: ${url}`);
    }

    const html = await fetchPage(url);
    const meta = extractMeta(html, url);

    if (!meta?.name) {
      console.log(`  ✗ No data: ${url}`);
      failed++;
      continue;
    }

    if (existingName) {
      const { error } = await supabase.from("vc_firms").update(meta).eq("url", cleanUrl);
      if (error) {
        console.log(`  ✗ Update error for ${meta.name}: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✓ Updated: "${existingName}" → "${meta.name}"`);
        updated++;
      }
    } else {
      const { error } = await supabase.from("vc_firms").insert(meta);
      if (error) {
        console.log(`  ✗ Insert error for ${meta.name}: ${error.message}`);
        failed++;
      } else {
        console.log(`  ✓ Added: ${meta.name}`);
        added++;
      }
    }

    await new Promise(r => setTimeout(r, 800));
  }

  console.log(`\n✅ Done — ${added} added, ${updated} updated, ${skipped} skipped, ${failed} failed\n`);
}

main().catch(console.error);
