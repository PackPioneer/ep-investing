/**
 * EP Investing — Grants Scraper
 *
 * Fetches climate/energy grants from:
 *  1. Grants.gov API (US federal grants — free, no key needed)
 *  2. EU Horizon Europe API (free, no key needed)
 *
 * Only imports grants that match your 14 industry tags.
 *
 * Usage (run from project root):
 *   node scripts/scrape-grants.js           # full run
 *   NODE_ENV=dry node scripts/scrape-grants.js  # dry run
 *   SOURCE=us node scripts/scrape-grants.js     # US only
 *   SOURCE=eu node scripts/scrape-grants.js     # EU only
 */

import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

// ─── Load env ────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = existsSync(resolve(root, '.env.local'))
  ? resolve(root, '.env.local')
  : resolve(root, '.env');

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.env.NODE_ENV === 'dry';
const SOURCE  = process.env.SOURCE || 'both'; // 'us', 'eu', or 'both'

// ─── Check grants table columns ───────────────────────────────────────────────
// We'll insert: title, description, deadline, amount, url, tags, source, status

// ─── Tag keywords (same as company scraper) ───────────────────────────────────
const TAG_KEYWORDS = {
  battery_storage:            ['battery', 'energy storage', 'lithium', 'grid storage', 'bess'],
  carbon_credits:             ['carbon credit', 'carbon offset', 'carbon market', 'emissions trading'],
  clean_cooking:              ['clean cook', 'cookstove', 'clean fuel'],
  direct_air_capture:         ['direct air capture', 'dac', 'carbon capture', 'carbon removal', 'cdr'],
  electric_aviation:          ['electric aircraft', 'electric aviation', 'evtol', 'urban air mobility', 'zero emission flight'],
  ev_charging:                ['ev charging', 'electric vehicle charging', 'charging station', 'charging network'],
  geothermal_energy:          ['geothermal'],
  green_hydrogen:             ['hydrogen', 'electrolyzer', 'fuel cell', 'h2 production'],
  grid_storage:               ['grid storage', 'long duration storage', 'flow battery'],
  industrial_decarbonization: ['industrial decarbonization', 'hard to abate', 'green steel', 'green cement', 'process heat', 'industrial emissions'],
  nuclear_technologies:       ['nuclear', 'fission', 'fusion', 'small modular reactor', 'smr'],
  saf_efuels:                 ['sustainable aviation fuel', 'saf', 'efuel', 'synthetic fuel', 'power to liquid'],
  solar:                      ['solar', 'photovoltaic', 'pv energy'],
  wind_energy:                ['wind energy', 'wind turbine', 'wind power', 'offshore wind', 'onshore wind'],
};

// Broad climate/energy keywords to pre-filter grants before tag classification
const CLIMATE_KEYWORDS = [
  'clean energy', 'renewable energy', 'energy transition', 'climate', 'decarbonization',
  'net zero', 'zero emission', 'greenhouse gas', 'ghg', 'carbon', 'solar', 'wind',
  'hydrogen', 'nuclear', 'battery', 'storage', 'grid', 'electric vehicle', 'ev ',
  'geothermal', 'bioenergy', 'biomass', 'fuel cell', 'energy efficiency',
  'sustainable energy', 'clean power', 'low carbon', 'emissions reduction',
];

function isClimateRelated(text) {
  const lower = text.toLowerCase();
  return CLIMATE_KEYWORDS.some(kw => lower.includes(kw));
}

function classifyGrant(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const matched = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) matched.push(tag);
  }
  return matched;
}

// ─── Grants.gov API ───────────────────────────────────────────────────────────
// Docs: https://www.grants.gov/web/grants/s2s/grantor/getOpportunitiesDetails.html
// Free API, no key required

async function fetchGrantsGov() {
  console.log('\n🇺🇸 Fetching from Grants.gov...');
  const results = [];

  // Search terms to try
  const searchTerms = [
    'clean energy', 'renewable energy', 'solar energy', 'wind energy',
    'hydrogen', 'nuclear energy', 'carbon capture', 'electric vehicle',
    'energy storage', 'energy efficiency', 'climate', 'decarbonization',
  ];

  for (const term of searchTerms) {
    try {
      const url = `https://apply07.grants.gov/grantsws/rest/opportunities/search/?keyword=${encodeURIComponent(term)}&oppStatuses=posted&rows=50`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.log(`  ⚠ Grants.gov returned ${res.status} for "${term}"`);
        continue;
      }

      const data = await res.json();
      const opps = data?.oppHits || [];
      console.log(`  📄 "${term}": ${opps.length} results`);

      for (const opp of opps) {
        const title = opp.oppTitle || '';
        const description = opp.synopsis || opp.description || '';

        if (!isClimateRelated(`${title} ${description}`)) continue;

        const tags = classifyGrant(title, description);
        if (tags.length === 0) continue;

        results.push({
          title: title.slice(0, 300),
          description: description.slice(0, 1000),
          deadline: opp.closeDate ? new Date(opp.closeDate).toISOString().split('T')[0] : null,
          amount: opp.awardCeiling ? `$${Number(opp.awardCeiling).toLocaleString()}` : null,
          url: `https://www.grants.gov/search-results-detail/${opp.id}`,
          tags,
          source: 'grants_gov',
          status: 'open',
          funder: opp.agencyName || 'US Federal Government',
        });
      }

      await new Promise(r => setTimeout(r, 500)); // rate limit
    } catch (err) {
      console.log(`  ✗ Error for "${term}": ${err.message}`);
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

// ─── EU Horizon Europe API ────────────────────────────────────────────────────
// Docs: https://api.tech.ec.europa.eu/search-api/prod/rest/search
// Free, no key required

async function fetchEUHorizon() {
  console.log('\n🇪🇺 Fetching from EU Horizon Europe...');
  const results = [];

  const topics = [
    'energy', 'climate', 'hydrogen', 'solar', 'wind', 'nuclear',
    'carbon capture', 'battery storage', 'electric mobility',
  ];

  for (const topic of topics) {
    try {
      const url = `https://api.tech.ec.europa.eu/search-api/prod/rest/search?apiKey=SEDIA&text=${encodeURIComponent(topic)}&pageSize=50&pageNumber=1&topic=HEU-calls&language=en`;

      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        console.log(`  ⚠ EU Horizon returned ${res.status} for "${topic}"`);
        continue;
      }

      const data = await res.json();
      const items = data?.results || [];
      console.log(`  📄 "${topic}": ${items.length} results`);

      for (const item of items) {
        const title = item.metadata?.title?.[0] || '';
        const description = item.metadata?.description?.[0] || item.metadata?.teaser?.[0] || '';
        const deadline = item.metadata?.deadlineDate?.[0] || null;
        const identifier = item.metadata?.identifier?.[0] || '';

        if (!isClimateRelated(`${title} ${description}`)) continue;

        const tags = classifyGrant(title, description);
        if (tags.length === 0) continue;

        results.push({
          title: title.slice(0, 300),
          description: description.slice(0, 1000),
          deadline: deadline ? deadline.split('T')[0] : null,
          amount: null, // EU grants vary widely
          url: identifier
            ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${identifier}`
            : 'https://ec.europa.eu/info/funding-tenders/opportunities/portal',
          tags,
          source: 'eu_horizon',
          status: 'open',
          funder: 'European Commission — Horizon Europe',
        });
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`  ✗ Error for "${topic}": ${err.message}`);
    }
  }

  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🎁 EP Investing — Grants Scraper${DRY_RUN ? ' [DRY RUN]' : ''} [${SOURCE.toUpperCase()}]\n`);

  // Get grants table columns first
  const { data: sample } = await supabase.from('grants').select('*').limit(1);
  const existingColumns = sample?.[0] ? Object.keys(sample[0]) : [];
  console.log('Grant columns:', existingColumns.join(', '));

  // Get existing grant URLs to avoid duplicates
  const { data: existingGrants } = await supabase.from('grants').select('url');
  const existingUrls = new Set((existingGrants || []).map(g => g.url).filter(Boolean));
  console.log(`📊 ${existingUrls.size} existing grants in DB\n`);

  let allGrants = [];

  if (SOURCE === 'us' || SOURCE === 'both') {
    const usGrants = await fetchGrantsGov();
    console.log(`  → ${usGrants.length} US grants matched`);
    allGrants = [...allGrants, ...usGrants];
  }

  if (SOURCE === 'eu' || SOURCE === 'both') {
    const euGrants = await fetchEUHorizon();
    console.log(`  → ${euGrants.length} EU grants matched`);
    allGrants = [...allGrants, ...euGrants];
  }

  console.log(`\n📋 Total grants to process: ${allGrants.length}`);

  let added = 0, skipped = 0, failed = 0;

  for (const grant of allGrants) {
    if (existingUrls.has(grant.url)) {
      skipped++;
      continue;
    }

    console.log(`  ✓ ${grant.title.slice(0, 60)}... → [${grant.tags.join(', ')}]`);

    if (!DRY_RUN) {
      // Build insert object using only columns that exist
      const insertData = {
        title: grant.title,
        description: grant.description,
        url: grant.url,
      };

      // Add optional columns if they exist in the table
      if (existingColumns.includes('deadline')) insertData.deadline = grant.deadline;
      if (existingColumns.includes('deadline_date')) insertData.deadline_date = grant.deadline;
      if (existingColumns.includes('amount')) insertData.amount = grant.amount;
      if (existingColumns.includes('max_award')) insertData.max_award = grant.amount;
      if (existingColumns.includes('tags')) insertData.tags = grant.tags;
      if (existingColumns.includes('industry_tags')) insertData.industry_tags = grant.tags;
      if (existingColumns.includes('source')) insertData.source = grant.source;
      if (existingColumns.includes('status')) insertData.status = grant.status;
      if (existingColumns.includes('funder')) insertData.funder = grant.funder;
      if (existingColumns.includes('organization')) insertData.organization = grant.funder;

      const { error } = await supabase.from('grants').insert(insertData);
      if (error) {
        if (error.code !== '23505') console.log(`    ⚠ ${error.message}`);
        failed++;
      } else {
        existingUrls.add(grant.url);
        added++;
      }
    } else {
      added++;
    }
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Added:   ${added}`);
  console.log(`⏭  Skipped: ${skipped} (already in DB)`);
  console.log(`✗  Failed:  ${failed}`);
  if (DRY_RUN) console.log('\n(Dry run — no DB changes made)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
