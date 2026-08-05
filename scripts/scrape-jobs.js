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


const CAREERS_PAGES = [
  // Confirmed working
  { company: "Octopus Energy", url: "https://api.lever.co/v0/postings/octoenergy?mode=json", sector: "climate_tech", ats: "lever", limit: 20 },
  { company: "Encore Renewable Energy", url: "https://api.lever.co/v0/postings/encore-renewable-energy?mode=json", sector: "solar", ats: "lever" },
  { company: "E3", url: "https://api.lever.co/v0/postings/ethree?mode=json", sector: "climate_finance", ats: "lever" },
  { company: "Solar Landscape", url: "https://api.lever.co/v0/postings/solarlandscape?mode=json", sector: "solar", ats: "lever" },
  { company: "Arcadia", url: "https://api.lever.co/v0/postings/arcadia?mode=json", sector: "clean_energy", ats: "lever" },
  { company: "Beta Technologies", url: "https://api.lever.co/v0/postings/beta?mode=json", sector: "electric_aviation", ats: "lever" },
  { company: "Redaptive", url: "https://api.lever.co/v0/postings/redaptiveinc?mode=json", sector: "energy_efficiency", ats: "lever" },
  { company: "Sylvera", url: "https://api.lever.co/v0/postings/sylvera?mode=json", sector: "carbon_markets", ats: "lever" },
  // New confirmed from search results
  { company: "Climate Power", url: "https://api.lever.co/v0/postings/climatepower?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "AiDash", url: "https://api.lever.co/v0/postings/aidash?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Pano AI", url: "https://api.lever.co/v0/postings/pano?mode=json", sector: "climate_tech", ats: "lever" },
  // New slugs to try
  { company: "Clearway Energy", url: "https://api.lever.co/v0/postings/clearwayenergygroup?mode=json", sector: "wind_energy", ats: "lever" },
  { company: "Nexamp", url: "https://api.lever.co/v0/postings/nexamp?mode=json", sector: "solar", ats: "lever" },
  { company: "Heirloom Carbon", url: "https://api.lever.co/v0/postings/heirloomcarbon?mode=json", sector: "direct_air_capture", ats: "lever" },
  { company: "Commonwealth Fusion Systems", url: "https://api.lever.co/v0/postings/cfs?mode=json", sector: "nuclear_technologies", ats: "lever" },
  { company: "Fervo Energy", url: "https://api.lever.co/v0/postings/fervoenergy?mode=json", sector: "geothermal", ats: "lever" },
  { company: "Boston Metal", url: "https://api.lever.co/v0/postings/bostonmetal?mode=json", sector: "industrial_decarbonization", ats: "lever" },
  { company: "Form Energy", url: "https://api.lever.co/v0/postings/form-energy?mode=json", sector: "battery_storage", ats: "lever" },
  { company: "Crusoe Energy", url: "https://api.lever.co/v0/postings/crusoe?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "LevelTen Energy", url: "https://api.lever.co/v0/postings/leveltenenergy?mode=json", sector: "clean_energy", ats: "lever" },
  { company: "Turntide Technologies", url: "https://api.lever.co/v0/postings/turntide?mode=json", sector: "energy_efficiency", ats: "lever" },
  { company: "Twelve", url: "https://api.lever.co/v0/postings/twelve-co?mode=json", sector: "saf_efuels", ats: "lever" },
  { company: "South Pole", url: "https://api.lever.co/v0/postings/southpolegroup?mode=json", sector: "carbon_markets", ats: "lever" },
  { company: "ZeroAvia", url: "https://api.lever.co/v0/postings/zeroavia?mode=json", sector: "electric_aviation", ats: "lever" },
  { company: "Stem Inc", url: "https://api.lever.co/v0/postings/stem-inc?mode=json", sector: "battery_storage", ats: "lever" },
  { company: "Watershed", url: "https://api.lever.co/v0/postings/watershedclimate?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "LanzaTech", url: "https://api.lever.co/v0/postings/lanzatech?mode=json", sector: "saf_efuels", ats: "lever" },
  { company: "Xpansiv", url: "https://api.lever.co/v0/postings/xpansiv?mode=json", sector: "carbon_markets", ats: "lever" },
  { company: "Antora Energy", url: "https://api.lever.co/v0/postings/antora?mode=json", sector: "battery_storage", ats: "lever" },
  { company: "Palmetto", url: "https://api.lever.co/v0/postings/palmettocleantech?mode=json", sector: "solar", ats: "lever" },
  { company: "Samsara", url: "https://api.lever.co/v0/postings/samsara?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Inari Agriculture", url: "https://api.lever.co/v0/postings/inari?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Pachama", url: "https://api.lever.co/v0/postings/pachama?mode=json", sector: "carbon_markets", ats: "lever" },
  { company: "Arcadia Power", url: "https://api.lever.co/v0/postings/arcadiapower?mode=json", sector: "clean_energy", ats: "lever" },
  { company: "Ampere Energy", url: "https://api.lever.co/v0/postings/ampere?mode=json", sector: "battery_storage", ats: "lever" },
  { company: "Sunrun", url: "https://api.lever.co/v0/postings/sunrun?mode=json", sector: "solar", ats: "lever" },
  { company: "Sunnova", url: "https://api.lever.co/v0/postings/sunnova?mode=json", sector: "solar", ats: "lever" },
  { company: "Departure Energy", url: "https://api.lever.co/v0/postings/departure-energy?mode=json", sector: "clean_energy", ats: "lever" },
  { company: "Terraformation", url: "https://api.lever.co/v0/postings/terraformation?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Rho Impact", url: "https://api.lever.co/v0/postings/rhoimpact?mode=json", sector: "climate_finance", ats: "lever" },
  { company: "Invenergy", url: "https://api.lever.co/v0/postings/invenergy?mode=json", sector: "wind_energy", ats: "lever" },
  { company: "Amp Robotics", url: "https://api.lever.co/v0/postings/amprobotics?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Brightcore Energy", url: "https://api.lever.co/v0/postings/brightcoreenergy?mode=json", sector: "solar", ats: "lever" },
  { company: "Rewiring America", url: "https://api.lever.co/v0/postings/rewiringamerica?mode=json", sector: "energy_efficiency", ats: "lever" },
  { company: "Rocky Mountain Institute", url: "https://api.lever.co/v0/postings/rmi?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Clean Energy Capital", url: "https://api.lever.co/v0/postings/cleanenergycapital?mode=json", sector: "climate_finance", ats: "lever" },
  { company: "Posigen", url: "https://api.lever.co/v0/postings/posigen?mode=json", sector: "solar", ats: "lever" },
  { company: "Ørsted", url: "https://api.lever.co/v0/postings/orsted?mode=json", sector: "wind_energy", ats: "lever" },
  { company: "Avantus", url: "https://api.lever.co/v0/postings/avantus?mode=json", sector: "solar", ats: "lever" },
  { company: "Canary Media", url: "https://api.lever.co/v0/postings/canarymedia?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Kraken Technologies", url: "https://api.lever.co/v0/postings/kraken123?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Granular Energy", url: "https://api.lever.co/v0/postings/Granular?mode=json", sector: "clean_energy", ats: "lever" },
  { company: "Cascade Climate", url: "https://api.lever.co/v0/postings/cascade-climate?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Spark Climate Solutions", url: "https://api.lever.co/v0/postings/SparkClimateSolutions?mode=json", sector: "climate_tech", ats: "lever" },
  { company: "Trio Energy", url: "https://api.lever.co/v0/postings/trio?mode=json", sector: "energy_efficiency", ats: "lever" },
];
const CAREERS_PAGES_FULL = [
  { company: "IONITY", url: "https://www.ionity.eu/ionity/careers", sector: "ev_charging", ats: "web" },
  { company: "WeaveGrid", url: "https://weavegrid.com/careers", sector: "ev_charging", ats: "web" },
  { company: "ChargePoint", url: "https://www.chargepoint.com/about/opportunities/", sector: "ev_charging", ats: "web" },
  { company: "Blink Charging", url: "https://blinkcharging.com/careers", sector: "ev_charging", ats: "web" },
  { company: "EVgo", url: "https://evgo.com/careers/", sector: "ev_charging", ats: "web" },
  { company: "Fermata Energy", url: "https://fermataenergy.com/careers", sector: "ev_charging", ats: "web" },
  { company: "Form Energy", url: "https://formenergy.com/careers/", sector: "battery_storage", ats: "web" },
  { company: "Redwood Materials", url: "https://redwoodmaterials.com/careers/", sector: "battery_storage", ats: "web" },
  { company: "Antora Energy", url: "https://www.antoraenergy.com/careers", sector: "battery_storage", ats: "web" },
  { company: "Fluence", url: "https://fluenceenergy.com/careers/", sector: "battery_storage", ats: "web" },
  { company: "QuantumScape", url: "https://quantumscape.com/careers/", sector: "battery_storage", ats: "web" },
  { company: "Electric Hydrogen", url: "https://eh2.com/join-the-team/", sector: "green_hydrogen", ats: "web" },
  { company: "Verdagy", url: "https://www.verdagy.com/careers", sector: "green_hydrogen", ats: "web" },
  { company: "Plug Power", url: "https://plugpower.com/careers/", sector: "green_hydrogen", ats: "web" },
  { company: "Bloom Energy", url: "https://bloomenergy.com/careers/", sector: "green_hydrogen", ats: "web" },
  { company: "Palmetto", url: "https://palmetto.com/careers", sector: "solar", ats: "web" },
  { company: "Sunrun", url: "https://sunrun.com/careers", sector: "solar", ats: "web" },
  { company: "Nextracker", url: "https://nextracker.com/careers/", sector: "solar", ats: "web" },
  { company: "First Solar", url: "https://firstsolar.com/en/careers/", sector: "solar", ats: "web" },
  { company: "Vestas", url: "https://vestas.com/en/careers", sector: "wind_energy", ats: "web" },
  { company: "Orsted", url: "https://orsted.com/en/careers", sector: "wind_energy", ats: "web" },
  { company: "Last Energy", url: "https://lastenergy.com/careers", sector: "nuclear_technologies", ats: "web" },
  { company: "Commonwealth Fusion", url: "https://cfs.energy/careers/", sector: "nuclear_technologies", ats: "web" },
  { company: "Helion Energy", url: "https://helionenergy.com/careers/", sector: "nuclear_technologies", ats: "web" },
  { company: "TerraPower", url: "https://terrapower.com/careers/", sector: "nuclear_technologies", ats: "web" },
  { company: "LanzaJet", url: "https://lanzajet.com/careers/", sector: "saf_efuels", ats: "web" },
  { company: "Joby Aviation", url: "https://jobyaviation.com/careers/", sector: "electric_aviation", ats: "web" },
  { company: "Archer Aviation", url: "https://archer.com/careers", sector: "electric_aviation", ats: "web" },
  { company: "Beta Technologies", url: "https://beta.team/careers/", sector: "electric_aviation", ats: "web" },
  { company: "Xpansiv", url: "https://xpansiv.com/careers/", sector: "carbon_markets", ats: "web" },
  { company: "Pachama", url: "https://pachama.com/careers/", sector: "carbon_markets", ats: "web" },
  { company: "Watershed", url: "https://watershed.com/careers", sector: "climate_tech", ats: "web" },
  { company: "Climeworks", url: "https://climeworks.com/careers/", sector: "direct_air_capture", ats: "web" },
  { company: "Fervo Energy", url: "https://fervoenergy.com/careers/", sector: "geothermal", ats: "web" },
  { company: "Boston Metal", url: "https://bostonmetal.com/careers/", sector: "industrial_decarbonization", ats: "web" },
  { company: "Generate Capital", url: "https://generatecapital.com/careers/", sector: "climate_finance", ats: "web" },
  { company: "Breakthrough Energy", url: "https://breakthroughenergy.org/careers/", sector: "climate_finance", ats: "web" },
];

// Additional companies on Greenhouse's public board API. Slugs are best-effort;
// any that don't return 200 are skipped automatically. Add/remove freely.
const GREENHOUSE_PAGES = [
  { company: "Rivian", slug: "rivian", sector: "electric_vehicles" },
  { company: "Redwood Materials", slug: "redwoodmaterials", sector: "battery_storage" },
  { company: "Sila Nanotechnologies", slug: "silanano", sector: "battery_storage" },
  { company: "Aurora Solar", slug: "aurorasolar", sector: "solar" },
  { company: "Persefoni", slug: "persefoni", sector: "climate_tech" },
  { company: "Span", slug: "span", sector: "energy_efficiency" },
  { company: "Dandelion Energy", slug: "dandelionenergy", sector: "geothermal" },
  { company: "BlocPower", slug: "blocpower", sector: "energy_efficiency" },
  { company: "Charm Industrial", slug: "charmindustrial", sector: "carbon_markets" },
  { company: "Sublime Systems", slug: "sublimesystems", sector: "industrial_decarbonization" },
  { company: "Lucid Motors", slug: "lucidmotors", sector: "electric_vehicles" },
  { company: "Zola Electric", slug: "zolaelectric", sector: "clean_energy" },
  { company: "Nuvve", slug: "nuvve", sector: "ev_charging" },
  { company: "Wallbox", slug: "wallbox", sector: "ev_charging" },
  { company: "Ampds", slug: "ampd", sector: "battery_storage" },
  { company: "Moxion Power", slug: "moxionpower", sector: "battery_storage" },
  { company: "Electric Hydrogen", slug: "electrichydrogen", sector: "green_hydrogen" },
  { company: "Koloma", slug: "koloma", sector: "green_hydrogen" },
  { company: "Fervo Energy", slug: "fervoenergy", sector: "geothermal" },
  { company: "Crusoe", slug: "crusoeenergy", sector: "data_center_energy" },
  { company: "Lila Sciences", slug: "lilasciences", sector: "climate_tech" },
  { company: "Mill", slug: "mill", sector: "waste" },
  { company: "Aemetis", slug: "aemetis", sector: "saf_efuels" },
  { company: "Ascend Elements", slug: "ascendelements", sector: "battery_storage" },
  { company: "Verdox", slug: "verdox", sector: "direct_air_capture" },
];

async function fetchLeverJobs(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  const jobs = await res.json();
  console.log(`  Lever API: found ${jobs.length} jobs`);
  return jobs.map(j => ({
    title: j.text,
    location: j.categories?.location || 'Unknown',
    type: j.categories?.commitment || 'Full-time',
    apply_url: j.hostedUrl || url,
  }));
}

async function fetchGreenhouseJobs(slug) {
  const url = `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  const data = await res.json();
  const jobs = data.jobs || [];
  console.log(`  Greenhouse API: found ${jobs.length} jobs`);
  return jobs.map(j => ({
    title: j.title,
    location: j.location?.name || 'Unknown',
    type: 'Full-time',
    apply_url: j.absolute_url || `https://boards.greenhouse.io/${slug}`,
  }));
}

// --- Company resolution ---------------------------------------------------
// Preloaded once in main(); maps normalized directory names -> company id so
// scraped jobs reliably link to a company (which is what the hiring signal and
// the "potentially raising" panel read from).
let COMPANY_INDEX = null;
const normName = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '')
    .replace(/(incorporated|inc|ltd|limited|llc|corporation|corp|company|co|group|holdings|technologies|technology|energy|power|inc)$/g, '');

async function loadCompanyIndex() {
  const idx = new Map();
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const { data } = await supabase.from('companies').select('id, name').range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    for (const c of data) {
      const n = normName(c.name);
      if (n && !idx.has(n)) idx.set(n, c.id);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  COMPANY_INDEX = idx;
  console.log(`Loaded ${idx.size} companies for name matching.\n`);
}

function resolveCompanyId(company) {
  if (!COMPANY_INDEX) return null;
  const n = normName(company);
  return COMPANY_INDEX.get(n) || null;
}

async function fetchWebPage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(15000),
  });
  const html = await res.text();
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12000);
}

async function extractJobsWithClaude(company, url, sector, pageText) {
  const prompt = `Extract job listings from this careers page for ${company} (sector: ${sector}).
URL: ${url}
Page content:
${pageText}

Return ONLY a JSON array. Each object must have:
- title (string)
- location (string)
- type ("Full-time", "Part-time", or "Contract")
- apply_url (string, use ${url} if no specific URL)

If no jobs found return []. Return ONLY the JSON array.`;

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
  console.log('  Claude says:', text.slice(0, 150));
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  return JSON.parse(match[0]);
}

const LINKED_COMPANY_IDS = new Set(); // companies that got fresh jobs this run

async function insertJobs(jobs, company, sector) {
  if (jobs.length === 0) return 0;

  const companyId = resolveCompanyId(company);
  if (companyId) LINKED_COMPANY_IDS.add(companyId);
  else console.log(`  (no directory match for "${company}" — jobs stored without company_id)`);

  const { data: existing } = await supabase
    .from('job_listings')
    .select('title')
    .eq('company', company);

  const existingTitles = new Set((existing || []).map(j => j.title.toLowerCase()));

  const newRows = jobs
    .filter(job => job.title && !existingTitles.has(job.title.toLowerCase()))
    .map(job => ({
      title: job.title,
      company: company,
      company_id: companyId,
      location: job.location || 'Unknown',
      type: job.type || 'Full-time',
      sector: sector,
      apply_url: job.apply_url || null,
      status: 'published',
    }));

  if (newRows.length === 0) {
    console.log(`  No new jobs for ${company}`);
    return 0;
  }

  const { error } = await supabase.from('job_listings').insert(newRows);
  if (error) {
    console.log(`  Insert error for ${company}: ${error.message}`);
    return 0;
  }
  return newRows.length;
}

async function main() {
  await loadCompanyIndex();

  // Build one unified worklist: existing Lever pages + Greenhouse pages.
  const leverPages = CAREERS_PAGES.map(p => ({ ...p, ats: p.ats || 'lever' }));
  const ghPages = GREENHOUSE_PAGES.map(p => ({ company: p.company, slug: p.slug, sector: p.sector, ats: 'greenhouse' }));
  const worklist = [...leverPages, ...ghPages];
  console.log(`Starting job scraper for ${worklist.length} companies (${leverPages.length} Lever, ${ghPages.length} Greenhouse)...\n`);
  let total = 0;

  for (const { company, url, slug, sector, ats, limit } of worklist) {
    console.log(`Scraping ${company}...`);
    let jobs = [];

    try {
      if (ats === 'lever') {
        jobs = await fetchLeverJobs(url) || [];
      } else if (ats === 'greenhouse') {
        jobs = await fetchGreenhouseJobs(slug) || [];
      } else {
        const pageText = await fetchWebPage(url);
        console.log(`  Page text length: ${pageText?.length || 0}`);
        if (pageText) {
          jobs = await extractJobsWithClaude(company, url, sector, pageText);
        }
      }
    } catch (e) {
      console.log(`  Error scraping ${company}: ${e.message}`);
    }

    if (limit) jobs = jobs.slice(0, limit);
    console.log(`  Found ${jobs.length} jobs`);
    const inserted = await insertJobs(jobs, company, sector);
    console.log(`  Inserted ${inserted} new jobs`);
    total += inserted;

    await new Promise(r => setTimeout(r, 1200));
  }

  // Reflect real hiring activity onto company records — powers the hiring
  // signal and the "Hiring" badge on profiles / the jobs board. Additive only.
  if (LINKED_COMPANY_IDS.size) {
    const ids = [...LINKED_COMPANY_IDS];
    const { error } = await supabase.from('companies').update({ is_hiring: true }).in('id', ids);
    console.log(`\nMarked ${ids.length} companies is_hiring=true${error ? ` (warn: ${error.message})` : ''}.`);
  }

  console.log(`\nDone. Total jobs inserted: ${total}. Linked companies: ${LINKED_COMPANY_IDS.size}.`);
}

main();