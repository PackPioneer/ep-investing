/**
 * insert-companies.mjs
 *
 * Adds a curated set of geothermal + industrial-decarbonization companies so
 * those two industry filters aren't empty. Data researched + verified July 2026.
 * Matches the schema the admin add-company route uses.
 *
 * Skips any company whose domain already exists (safe to re-run).
 *
 * Dry run:  node --env-file=.env.local insert-companies.mjs
 * Apply:    node --env-file=.env.local insert-companies.mjs --write
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const WRITE = process.argv.includes('--write');

// funding_stage: pre_seed|seed|series_a|series_b|series_c|growth|public (null = unknown)
// business_model: b2b|b2c|b2g|hardware|software|project_developer|marketplace
// target_geographies: us|europe|asia|africa|latam|mena|global
const COMPANIES = [
  // ---------------- GEOTHERMAL ----------------
  { name: 'Fervo Energy', url: 'https://fervoenergy.com', tags: ['geothermal_energy'],
    stage: 'growth', model: 'project_developer', geos: ['us'], year: 2017,
    city: 'Houston', country: 'United States',
    desc: 'Enhanced geothermal systems (EGS) company applying horizontal drilling and fiber-optic sensing from oil and gas to deliver 24/7 carbon-free power. Its flagship Cape Station in Utah is set to be the world’s largest next-generation geothermal project.' },
  { name: 'Quaise Energy', url: 'https://quaise.com', tags: ['geothermal_energy'],
    stage: 'series_b', model: 'hardware', geos: ['us', 'global'], year: 2018,
    city: 'Cambridge', country: 'United States',
    desc: 'MIT spinout developing millimeter-wave drilling to reach superhot rock miles underground, unlocking geothermal energy almost anywhere. Building Project Obsidian in Oregon, aiming for the world’s first commercial superhot geothermal plant.' },
  { name: 'Sage Geosystems', url: 'https://sagegeosystems.com', tags: ['geothermal_energy'],
    stage: 'series_b', model: 'project_developer', geos: ['us'], year: 2020,
    city: 'Houston', country: 'United States',
    desc: 'Develops geopressured geothermal systems and subsurface energy storage that use heat and pressure to generate and store power. Partnering with Meta to deliver up to 150 MW of geothermal baseload for data centers.' },
  { name: 'Eavor Technologies', url: 'https://eavor.com', tags: ['geothermal_energy'],
    stage: 'growth', model: 'project_developer', geos: ['global', 'europe', 'us'], year: 2017,
    city: 'Calgary', country: 'Canada',
    desc: 'Closed-loop geothermal ("Eavor-Loop") that circulates fluid through sealed underground pipes to extract heat without a natural reservoir, enabling scalable geothermal power almost anywhere.' },
  { name: 'Dandelion Energy', url: 'https://dandelionenergy.com', tags: ['geothermal_energy'],
    stage: 'series_b', model: 'b2c', geos: ['us'], year: 2017,
    city: 'Mount Kisco', country: 'United States',
    desc: 'Residential geothermal heating and cooling company spun out of Google X. Installs ground-source heat pumps for homes and offers a "Geo-as-a-Service" leasing model for homebuilders.' },
  { name: 'Zanskar', url: 'https://zanskar.com', tags: ['geothermal_energy'],
    stage: 'series_c', model: 'software', geos: ['us'], year: 2019,
    city: 'Salt Lake City', country: 'United States',
    desc: 'Uses AI and geoscience models to discover and develop untapped geothermal resources, de-risking exploration — historically the biggest cost and failure point in new geothermal development.' },
  { name: 'XGS Energy', url: 'https://xgsenergy.com', tags: ['geothermal_energy'],
    stage: 'series_a', model: 'hardware', geos: ['us'], year: 2019,
    city: 'Palo Alto', country: 'United States',
    desc: 'Next-generation geothermal company whose closed-loop, dry-rock system uses a thermally conductive material to deliver round-the-clock power with minimal water use. Partnering with Meta on a 150 MW project in New Mexico.' },
  { name: 'Baseload Capital', url: 'https://baseloadcap.com', tags: ['geothermal_energy'],
    stage: 'growth', model: 'project_developer', geos: ['global'], year: 2018,
    city: 'Stockholm', country: 'Sweden',
    desc: 'Investment and project development company that builds, finances, and operates geothermal heat and power plants worldwide, scaling baseload renewable energy through a platform approach.' },

  // ---------------- INDUSTRIAL DECARBONIZATION ----------------
  { name: 'Boston Metal', url: 'https://bostonmetal.com', tags: ['industrial_decarbonization'],
    stage: 'growth', model: 'hardware', geos: ['us', 'global'], year: 2013,
    city: 'Woburn', country: 'United States',
    desc: 'Uses Molten Oxide Electrolysis (MOE) to produce steel and critical metals from ore with zero direct emissions, replacing coal-based blast furnaces. Backed by Breakthrough Energy Ventures, BHP and Tata Steel.' },
  { name: 'Electra', url: 'https://electra.earth', tags: ['industrial_decarbonization'],
    stage: 'series_b', model: 'hardware', geos: ['us'], year: 2020,
    city: 'Boulder', country: 'United States',
    desc: 'Produces zero-emissions clean iron from ore using a low-temperature electrochemical process powered by renewable electricity, enabling green steel. Backed by Breakthrough Energy Ventures and Temasek.' },
  { name: 'Rondo Energy', url: 'https://rondo.com', tags: ['industrial_decarbonization'],
    stage: 'growth', model: 'hardware', geos: ['us', 'global'], year: 2020,
    city: 'Alameda', country: 'United States',
    desc: 'Makes the Rondo Heat Battery, which stores intermittent renewable electricity as high-temperature heat (>1000°C) in brick to deliver continuous industrial heat and steam, decarbonizing heavy industry.' },
  { name: 'Antora Energy', url: 'https://antoraenergy.com', tags: ['industrial_decarbonization'],
    stage: 'series_b', model: 'hardware', geos: ['us'], year: 2018,
    city: 'San Jose', country: 'United States',
    desc: 'Thermal energy storage that heats solid carbon blocks with renewable electricity to deliver zero-carbon industrial heat and on-demand power for heavy industry.' },
  { name: 'Sublime Systems', url: 'https://sublime-systems.com', tags: ['industrial_decarbonization'],
    stage: 'series_a', model: 'hardware', geos: ['us'], year: 2020,
    city: 'Somerville', country: 'United States',
    desc: 'Electrochemical cement company making a "true-zero" Portland cement replacement at ambient temperature without fossil-fired kilns. Signed a major offtake agreement with Microsoft.' },
  { name: 'Brimstone', url: 'https://brimstone.com', tags: ['industrial_decarbonization'],
    stage: 'series_a', model: 'hardware', geos: ['us'], year: 2019,
    city: 'Oakland', country: 'United States',
    desc: 'Makes carbon-negative Portland cement from calcium silicate rock instead of limestone, co-producing supplementary cementitious material and alumina. Amazon signed an offtake agreement.' },
  { name: 'Fortera', url: 'https://forteraglobal.com', tags: ['industrial_decarbonization'],
    stage: null, model: 'hardware', geos: ['us'], year: 2019,
    city: 'San Jose', country: 'United States',
    desc: 'Captures CO2 from cement kilns and mineralizes it into "ReCarb" low-carbon cement, cutting emissions up to 70%. Operates a first-of-its-kind industrial-scale plant in Redding, California.' },
  { name: 'CarbonCure Technologies', url: 'https://carboncure.com', tags: ['industrial_decarbonization'],
    stage: 'growth', model: 'software', geos: ['global', 'us'], year: 2012,
    city: 'Halifax', country: 'Canada',
    desc: 'Retrofits concrete plants with technology that injects captured CO2 into fresh concrete, where it mineralizes and is permanently stored while improving strength. Deployed at hundreds of plants worldwide.' },
];

function domainOf(url) {
  return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
}
function slugify(s) {
  return (s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function main() {
  let inserted = 0, skipped = 0;
  for (const c of COMPANIES) {
    const domain = domainOf(c.url);
    const { data: existing, error: exErr } = await supabase
      .from('companies').select('id, name').ilike('url', `%${domain}%`).limit(1);
    if (exErr) { console.error(`  ${c.name}: lookup error ${exErr.message}`); continue; }
    if (existing?.length) {
      console.log(`  SKIP  ${c.name.padEnd(22)} already exists (id ${existing[0].id})`);
      skipped++;
      continue;
    }

    const payload = {
      name: c.name,
      url: c.url,
      description: c.desc.slice(0, 500),
      logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      industry_tags: c.tags,
      sector: 'cleantech_company',
      business_model: c.model,
      target_geographies: c.geos,
      founding_year: c.year,
      headquarters_city: c.city,
      headquarters_country: c.country,
      enrichment_provenance: 'curated_seed_2026_07',
      is_hidden: false,
    };
    if (c.stage) payload.funding_stage = c.stage;

    console.log(`  ADD   ${c.name.padEnd(22)} ${c.tags[0]}  ${c.stage || '(no stage)'}  ${c.geos.join('/')}`);
    if (!WRITE) continue;

    const slug = `${slugify(c.name)}`; // id appended after insert
    const { data: row, error } = await supabase
      .from('companies').insert(payload).select('id').single();
    if (error) { console.error(`  ${c.name}: INSERT error ${error.message}`); continue; }
    await supabase.from('companies').update({ slug: `${slug}-${row.id}` }).eq('id', row.id);
    inserted++;
  }

  console.log('');
  if (!WRITE) console.log(`DRY RUN — would add ${COMPANIES.length - skipped}, skip ${skipped}. Add --write to apply.`);
  else console.log(`DONE. Inserted ${inserted}, skipped ${skipped}.`);
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
