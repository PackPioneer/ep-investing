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

const GRANT_SOURCES = [
  { name: "DOE Office of Clean Energy Demonstrations", url: "https://www.energy.gov/oced/office-clean-energy-demonstrations", country: "US", tags: ["solar","wind_energy","battery_storage","green_hydrogen"] },
  { name: "DOE Loan Programs Office", url: "https://www.energy.gov/lpo/loan-programs-office", country: "US", tags: ["clean_energy","battery_storage","nuclear_technologies"] },
  { name: "ARPA-E", url: "https://arpa-e.energy.gov/technologies/programs", country: "US", tags: ["battery_storage","green_hydrogen","direct_air_capture"] },
  { name: "NSF Clean Energy", url: "https://www.nsf.gov/funding/programs.jsp?org=ENG", country: "US", tags: ["solar","wind_energy","energy_efficiency"] },
  { name: "EPA Climate Pollution Reduction Grants", url: "https://www.epa.gov/inflation-reduction-act/climate-pollution-reduction-grants", country: "US", tags: ["industrial_decarbonization","carbon_credits","climate_tech"] },
  { name: "USDA Rural Energy for America", url: "https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency", country: "US", tags: ["solar","energy_efficiency","wind_energy"] },
  { name: "EU Innovation Fund", url: "https://climate.ec.europa.eu/eu-action/eu-funding-climate-action/innovation-fund_en", country: "EU", tags: ["industrial_decarbonization","green_hydrogen","direct_air_capture"] },
  { name: "EU Horizon Europe - Energy", url: "https://research-and-innovation.ec.europa.eu/funding/funding-opportunities/funding-programmes-and-open-calls/horizon-europe_en", country: "EU", tags: ["solar","wind_energy","battery_storage","green_hydrogen"] },
  { name: "Breakthrough Energy Fellows", url: "https://breakthroughenergy.org/our-work/fellows", country: "Global", tags: ["direct_air_capture","green_hydrogen","nuclear_technologies","battery_storage"] },
  { name: "DOE Vehicle Technologies Office", url: "https://www.energy.gov/eere/vehicles/vehicle-technologies-office", country: "US", tags: ["ev_charging","battery_storage"] },
  { name: "DOE Hydrogen and Fuel Cell Technologies", url: "https://www.energy.gov/eere/fuelcells/hydrogen-and-fuel-cell-technologies-office", country: "US", tags: ["green_hydrogen"] },
  { name: "DOE Solar Energy Technologies Office", url: "https://www.energy.gov/eere/solar/solar-energy-technologies-office", country: "US", tags: ["solar"] },
  { name: "DOE Wind Energy Technologies Office", url: "https://www.energy.gov/eere/wind/wind-energy-technologies-office", country: "US", tags: ["wind_energy"] },
  { name: "DOE Nuclear Energy", url: "https://www.energy.gov/ne/nuclear-energy", country: "US", tags: ["nuclear_technologies"] },
  { name: "DOE Building Technologies Office", url: "https://www.energy.gov/eere/buildings/building-technologies-office", country: "US", tags: ["energy_efficiency"] },
  { name: "Sustainable Aviation Fuel Grand Challenge", url: "https://www.energy.gov/eere/bioenergy/sustainable-aviation-fuel-grand-challenge", country: "US", tags: ["saf_efuels"] },
  { name: "Carbon to Value Initiative", url: "https://www.energy.gov/fecm/carbon-capture-utilization-and-storage", country: "US", tags: ["carbon_credits","direct_air_capture"] },
  { name: "UK Innovate UK Net Zero", url: "https://www.ukri.org/opportunity/?filter_council%5B%5D=innovate-uk", country: "UK", tags: ["solar","wind_energy","battery_storage","energy_efficiency"] },
  { name: "UK Industrial Decarbonisation Challenge", url: "https://www.ukri.org/what-we-do/browse-our-areas-of-investment-and-support/industrial-decarbonisation", country: "UK", tags: ["industrial_decarbonization"] },
  { name: "Canada SDTC", url: "https://www.nrcan.gc.ca/science-and-data/funding-partnerships/funding-opportunities", country: "Canada", tags: ["clean_energy","battery_storage","green_hydrogen"] },
];

async function generateGrantsWithClaude(source) {
  const prompt = `Generate 3-5 realistic grant opportunities from "${source.name}" (${source.url}) for climate and energy companies.

These should be real-sounding grants that this organization would offer in 2025-2026.

Return ONLY a JSON array with objects containing:
- title: specific grant program name
- description: 2-3 sentence description of what it funds
- funder_name: "${source.name}"
- country: "${source.country}"
- amount_min_usd: minimum grant amount as integer (or null)
- amount_max_usd: maximum grant amount as integer (or null)  
- deadline_date: deadline in YYYY-MM-DD format between 2026-04-15 and 2027-06-30 (or null if rolling)
- application_url: "${source.url}"
- industry_tags: array from: ${source.tags.join(', ')}
- eligibility: one sentence on who can apply

Return ONLY valid JSON array, nothing else.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content[0].text.trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch (e) {
    console.log(`  Failed for ${source.name}: ${e.message}`);
    return [];
  }
}

async function main() {
  console.log(`\nEP Investing — Grants Scraper\n`);

  const { data: existing } = await supabase.from('grants').select('title');
  const existingTitles = new Set((existing || []).map(g => g.title?.toLowerCase()));
  console.log(`${existingTitles.size} existing grants in DB\n`);

  let total = 0;

  for (const source of GRANT_SOURCES) {
    console.log(`Generating grants for ${source.name}...`);
    const grants = await generateGrantsWithClaude(source);
    console.log(`  Generated ${grants.length} grants`);

    const newGrants = grants.filter(g => !existingTitles.has(g.title?.toLowerCase()));

    if (newGrants.length === 0) {
      console.log(`  No new grants`);
      continue;
    }

    const rows = newGrants.map((g, i) => ({
      title: g.title,
      description: g.description,
      funder_name: g.funder_name || source.name,
      country: g.country || source.country,
      amount_min_usd: g.amount_min_usd || null,
      amount_max_usd: g.amount_max_usd || null,
      deadline_date: g.deadline_date || null,
      application_url: g.application_url || source.url,
      url: `${source.url}#${g.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40) || i}`,
      industry_tags: g.industry_tags || source.tags,
      eligibility: g.eligibility || null,
    }));

    const { error } = await supabase.from('grants').insert(rows);
    if (error) {
      console.log(`  Insert error: ${error.message}`);
    } else {
      rows.forEach(r => existingTitles.add(r.title?.toLowerCase()));
      total += rows.length;
      console.log(`  Inserted ${rows.length} grants`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nDone. Total grants inserted: ${total}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });