/**
 * EP Investing — AI Company Auto-Discovery v2
 *
 * Usage:
 *   node scripts/auto-discover.js                    # all categories, global
 *   CATEGORY=solar node scripts/auto-discover.js     # one category
 *   GEO=africa node scripts/auto-discover.js         # geography focus
 *   GEO=asia node scripts/auto-discover.js
 *   GEO=latam node scripts/auto-discover.js
 *   NODE_ENV=dry node scripts/auto-discover.js       # dry run
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = existsSync(resolve(root, '.env.local'))
  ? resolve(root, '.env.local') : resolve(root, '.env');

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DRY_RUN = process.env.NODE_ENV === 'dry';
const CATEGORY = process.env.CATEGORY || null;
const GEO = process.env.GEO || null;

const GEO_CONTEXT = {
  africa: 'Focus on companies operating in or serving African markets (Sub-Saharan Africa, East Africa, West Africa, Southern Africa, North Africa).',
  asia: 'Focus on companies in India, Southeast Asia, South Asia, Japan, and Korea.',
  latam: 'Focus on companies in Latin America (Brazil, Mexico, Colombia, Chile, Argentina, Peru).',
  europe: 'Focus on European companies and startups.',
  us: 'Focus on US-based companies and startups.',
};

const CATEGORY_PROMPTS = {
  battery_storage:            'List 50 real startup and scaleup companies working on battery storage, lithium-ion batteries, solid-state batteries, sodium-ion, flow batteries, or grid-scale energy storage.',
  carbon_credits:             'List 50 real startup companies in voluntary carbon markets, carbon offsets, carbon accounting software, nature-based solutions, or carbon project development.',
  clean_cooking:              'List 50 real companies making clean cooking solutions, improved cookstoves, bioethanol stoves, electric cooking, pellet stoves, or clean household energy for developing markets.',
  direct_air_capture:         'List 50 real startup companies doing direct air capture, carbon removal, enhanced weathering, ocean carbon removal, or carbon dioxide removal technology.',
  electric_aviation:          'List 50 real startup companies building electric aircraft, eVTOL air taxis, hybrid-electric planes, hydrogen aircraft, or zero-emission aviation.',
  ev_charging:                'List 50 real startup companies building EV charging networks, charging hardware, smart charging software, fleet charging, or vehicle-to-grid technology.',
  geothermal_energy:          'List 50 real startup companies working on geothermal energy, enhanced geothermal systems, deep drilling for heat, closed-loop geothermal, or geothermal power.',
  green_hydrogen:             'List 50 real startup companies producing green hydrogen, building electrolyzers, green ammonia, hydrogen storage, or hydrogen fueling infrastructure.',
  grid_storage:               'List 50 real startup companies on long-duration grid storage, flow batteries, compressed air, gravity storage, thermal storage, or utility-scale energy storage.',
  industrial_decarbonization: 'List 50 real startup companies decarbonizing industry: green steel, green cement, industrial electrification, process heat decarbonization, or emissions reduction in manufacturing.',
  nuclear_technologies:       'List 50 real startup companies building advanced nuclear reactors, small modular reactors, nuclear fusion, microreactors, or nuclear waste solutions.',
  saf_efuels:                 'List 50 real startup companies producing sustainable aviation fuel, e-fuels, synthetic fuels, power-to-liquid, or renewable fuels for aviation and shipping.',
  solar:                      'List 50 real startup companies in solar energy including solar panels, perovskite, solar installation software, solar financing, agrivoltaics, or community solar.',
  wind_energy:                'List 50 real startup companies in wind energy including wind turbines, offshore wind, floating wind, airborne wind energy, or wind project software.',
};

async function discoverCompanies(category) {
  const basePrompt = CATEGORY_PROMPTS[category];
  const geoContext = GEO ? (GEO_CONTEXT[GEO] || '') : 'Include companies from all geographies.';

  const prompt = `${basePrompt} ${geoContext}

Include their website URLs. Mix of early-stage startups and growth-stage companies. Avoid major corporations (no Shell, BP, Siemens, GE, Exxon etc).

Return ONLY a JSON array, no markdown, no explanation:
[
  { "name": "Company Name", "url": "https://company.com", "description": "One sentence description" },
  ...
]

Return up to 50 companies. Only include companies with real working websites.`;

  console.log(`  🤖 Searching ${category}${GEO ? ` [${GEO}]` : ''}...`);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(90000),
    });

    const data = await res.json();
    const textBlock = data?.content?.find(b => b.type === 'text');
    if (!textBlock?.text) return [];

    const cleaned = textBlock.text.replace(/```[a-z]*\n?|\n?```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    return JSON.parse(jsonMatch[0]).filter(c => c.url && c.name);
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
    return [];
  }
}

async function enrichCompany(company) {
  try {
    const res = await fetch(company.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return company;

    const html = await res.text();
    const root = parse(html);
    const getMeta = (prop) => {
      const el = root.querySelector(`meta[property="${prop}"]`) || root.querySelector(`meta[name="${prop}"]`);
      return el?.getAttribute('content')?.trim() || null;
    };

    const ogDesc = getMeta('og:description') || getMeta('description');
    if (ogDesc && ogDesc.length > 40 && ogDesc.length > (company.description || '').length) {
      company.description = ogDesc;
    }

    const domain = new URL(company.url).hostname;
    try {
      const lr = await fetch(`https://logo.clearbit.com/${domain}`, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (lr.ok) company.logo_url = `https://logo.clearbit.com/${domain}`;
    } catch { /* fallback */ }

    if (!company.logo_url) {
      company.logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  } catch { /* return as-is */ }
  return company;
}

async function main() {
  console.log(`\n🔍 EP Investing — Auto Discovery v2${DRY_RUN ? ' [DRY RUN]' : ''}${GEO ? ` [${GEO.toUpperCase()}]` : ''}\n`);

  const { data: existing } = await supabase.from('companies').select('url');
  const existingHostnames = new Set(
    (existing || []).map(c => {
      try { return new URL(c.url).hostname.replace(/^www\./, ''); } catch { return null; }
    }).filter(Boolean)
  );
  console.log(`📊 ${existingHostnames.size} companies already in DB\n`);

  const categories = CATEGORY ? [CATEGORY] : Object.keys(CATEGORY_PROMPTS);
  let totalAdded = 0, totalSkipped = 0, totalFailed = 0;

  for (const category of categories) {
    console.log(`\n📂 ${category}`);
    const discovered = await discoverCompanies(category);
    console.log(`  📋 Found ${discovered.length}`);

    for (const company of discovered) {
      let hostname;
      try { hostname = new URL(company.url).hostname.replace(/^www\./, ''); }
      catch { totalFailed++; continue; }

      if (existingHostnames.has(hostname)) { totalSkipped++; continue; }

      const enriched = await enrichCompany(company);
      console.log(`  ✓ ${enriched.name}`);

      if (!DRY_RUN) {
        const { error } = await supabase.from('companies').insert({
          name: enriched.name,
          url: enriched.url,
          description: enriched.description?.slice(0, 500) || null,
          logo_url: enriched.logo_url || null,
          industry_tags: [category],
          sector: 'cleantech_company',
          enrichment_provenance: `auto_discovery${GEO ? `_${GEO}` : ''}`,
        });
        if (error) { if (error.code !== '23505') console.log(`    ⚠ ${error.message}`); totalFailed++; }
        else { existingHostnames.add(hostname); totalAdded++; }
      } else { existingHostnames.add(hostname); totalAdded++; }

      await new Promise(r => setTimeout(r, 150));
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`✅ Added:   ${totalAdded}`);
  console.log(`⏭  Skipped: ${totalSkipped}`);
  console.log(`✗  Failed:  ${totalFailed}`);
  if (DRY_RUN) console.log('\n(Dry run — no changes made)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
