import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = existsSync(resolve(root, '.env.local'))
  ? resolve(root, '.env.local') : resolve(root, '.env');

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const [key, ...rest] = line.split('=');
  const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
  if (key && !(key in process.env)) process.env[key] = val;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLIMATE_KEYWORDS = [
  "clean energy", "renewable energy", "solar energy", "wind energy",
  "hydrogen", "nuclear energy", "carbon capture", "electric vehicle",
  "energy storage", "battery", "energy efficiency", "climate",
  "decarbonization", "sustainable aviation fuel", "geothermal",
  "direct air capture", "carbon removal", "offshore wind"
];

const TAG_MAP = {
  solar: ["solar", "photovoltaic", "pv"],
  wind_energy: ["wind", "offshore wind"],
  battery_storage: ["battery", "energy storage", "grid storage"],
  green_hydrogen: ["hydrogen", "electrolyzer", "fuel cell"],
  nuclear_technologies: ["nuclear", "fusion", "fission", "advanced reactor"],
  ev_charging: ["electric vehicle", "ev charging", "evse"],
  carbon_credits: ["carbon market", "carbon offset", "carbon trading"],
  direct_air_capture: ["direct air capture", "carbon removal", "dac"],
  saf_efuels: ["sustainable aviation", "saf", "efuel", "aviation fuel"],
  electric_aviation: ["electric aviation", "electric aircraft"],
  geothermal_energy: ["geothermal"],
  industrial_decarbonization: ["industrial decarbonization", "steel", "cement", "industrial"],
  clean_cooking: ["clean cooking", "cookstove"],
  energy_efficiency: ["energy efficiency", "building efficiency"],
  climate_tech: ["climate", "decarbonization", "net zero", "clean energy"],
};

function inferTags(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const tags = [];
  for (const [tag, keywords] of Object.entries(TAG_MAP)) {
    if (keywords.some(k => text.includes(k))) tags.push(tag);
  }
  return tags.length > 0 ? tags : ["climate_tech"];
}

async function fetchSimplerGrants(keyword) {
  try {
    const res = await fetch("https://api.simpler.grants.gov/v1/opportunities/search", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": process.env.SIMPLER_GRANTS_API_KEY,
      },
      body: JSON.stringify({
        query: keyword,
        filters: { opportunity_status: { one_of: ["posted", "forecasted"] } },
        pagination: { page_offset: 1, page_size: 25, sort_order: [{ order_by: "close_date", sort_direction: "ascending" }] }
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.log(`  API returned ${res.status} for "${keyword}"`);
      return [];
    }

    const data = await res.json();
    return data.data || [];
  } catch (e) {
    console.log(`  Failed for "${keyword}": ${e.message}`);
    return [];
  }
}

async function main() {
  console.log(`\nEP Investing — Grants Scraper (Simpler Grants API)\n`);

  const { data: existing } = await supabase.from('grants').select('url, title');
  const existingUrls = new Set((existing || []).map(g => g.url).filter(Boolean));
  const existingTitles = new Set((existing || []).map(g => g.title?.toLowerCase()).filter(Boolean));
  console.log(`${existingUrls.size} existing grants in DB\n`);

  const allOpportunities = new Map();

  for (const keyword of CLIMATE_KEYWORDS) {
    console.log(`Searching: "${keyword}"...`);
    const results = await fetchSimplerGrants(keyword);
    console.log(`  Found ${results.length} opportunities`);

    for (const opp of results) {
      if (!allOpportunities.has(opp.opportunity_id)) {
        allOpportunities.set(opp.opportunity_id, opp);
      }
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nTotal unique opportunities found: ${allOpportunities.size}`);

  let inserted = 0;
  let skipped = 0;

  for (const opp of allOpportunities.values()) {
    const url = `https://www.grants.gov/search-results-detail/${opp.opportunity_id}`;
    const title = opp.opportunity_title || opp.opportunity_number || "Untitled";

    if (existingUrls.has(url) || existingTitles.has(title.toLowerCase())) {
      skipped++;
      continue;
    }

    const summary = opp.summary || {};
    const description = summary.summary_description || opp.opportunity_title || "";
    const tags = inferTags(title, description);
    const deadline = summary.close_date || summary.archive_date || null;
    const openDate = summary.post_date || null;
    const amountMin = summary.award_floor || null;
    const amountMax = summary.award_ceiling || null;
    const funderName = summary.agency_name || opp.agency || "US Federal Government";

    const row = {
      title,
      description: description.slice(0, 1000),
      funder_name: funderName,
      country: "US",
      amount_min_usd: amountMin,
      amount_max_usd: amountMax,
      deadline_date: deadline,
      open_date: openDate,
      application_url: url,
      url,
      industry_tags: tags,
    };

    const { error } = await supabase.from('grants').insert(row);
    if (error) {
      console.log(`  Error inserting "${title.slice(0, 40)}": ${error.message}`);
    } else {
      existingUrls.add(url);
      existingTitles.add(title.toLowerCase());
      inserted++;
      if (inserted % 10 === 0) console.log(`  Inserted ${inserted} so far...`);
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });