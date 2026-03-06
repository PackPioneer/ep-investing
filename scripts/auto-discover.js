/**
 * EP Investing — AI Company Auto-Discovery
 *
 * Uses Claude with web search to find new climate companies
 * for each of your 14 industry categories, then imports them.
 *
 * Run manually or via Vercel cron (see vercel.json).
 *
 * Usage:
 *   node scripts/auto-discover.js                    # all categories
 *   CATEGORY=solar node scripts/auto-discover.js     # one category only
 *   NODE_ENV=dry node scripts/auto-discover.js       # dry run
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

// ─── Load env ────────────────────────────────────────────────────────────────
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

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN  = process.env.NODE_ENV === 'dry';
const CATEGORY = process.env.CATEGORY || null;

// ─── Category search prompts ──────────────────────────────────────────────────
// Each category gets a tailored search prompt to find real startups/companies.
const CATEGORY_PROMPTS = {
  battery_storage:            'List 20 real startup companies working on battery storage, lithium-ion batteries, solid-state batteries, or grid-scale energy storage. Include their website URLs.',
  carbon_credits:             'List 20 real startup companies in the voluntary carbon credit market, carbon offsets, or carbon accounting. Include their website URLs.',
  clean_cooking:              'List 20 real companies making clean cooking solutions, improved cookstoves, or clean household energy for developing markets. Include their website URLs.',
  direct_air_capture:         'List 20 real startup companies doing direct air capture, carbon removal, or carbon dioxide removal technology. Include their website URLs.',
  electric_aviation:          'List 20 real startup companies building electric aircraft, eVTOL air taxis, or zero-emission aviation technology. Include their website URLs.',
  ev_charging:                'List 20 real startup companies building EV charging networks, charging hardware, or smart EV charging software. Include their website URLs.',
  geothermal_energy:          'List 20 real startup companies working on geothermal energy, enhanced geothermal systems, or geothermal power generation. Include their website URLs.',
  green_hydrogen:             'List 20 real startup companies producing green hydrogen, building electrolyzers, or developing hydrogen fuel infrastructure. Include their website URLs.',
  grid_storage:               'List 20 real startup companies working on long-duration grid storage, flow batteries, or utility-scale energy storage. Include their website URLs.',
  industrial_decarbonization: 'List 20 real startup companies decarbonizing heavy industry including green steel, green cement, industrial heat, or manufacturing emissions. Include their website URLs.',
  nuclear_technologies:       'List 20 real startup companies building advanced nuclear reactors, small modular reactors, nuclear fusion, or nuclear microreactors. Include their website URLs.',
  saf_efuels:                 'List 20 real startup companies producing sustainable aviation fuel, e-fuels, synthetic fuels, or renewable fuels for aviation. Include their website URLs.',
  solar:                      'List 20 real startup companies in solar energy including solar panels, solar installation, solar software, or solar financing. Include their website URLs.',
  wind_energy:                'List 20 real startup companies in wind energy including wind turbines, offshore wind, wind software, or wind project development. Include their website URLs.',
};

// ─── Claude API with web search ───────────────────────────────────────────────
async function discoverCompanies(category) {
  const prompt = CATEGORY_PROMPTS[category];
  if (!prompt) return [];

  console.log(`  🤖 Asking Claude to find ${category} companies...`);

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
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `${prompt}

Return ONLY a JSON array of objects, no markdown, no explanation:
[
  { "name": "Company Name", "url": "https://company.com", "description": "One sentence description" },
  ...
]

Only include companies with real, working websites. Focus on funded startups and scaleups, not large corporations.`,
        }],
      }),
      signal: AbortSignal.timeout(60000),
    });

    const data = await res.json();

    // Extract text from response (may include tool use blocks)
    const textBlock = data?.content?.find(b => b.type === 'text');
    if (!textBlock?.text) {
      console.log(`  ⚠ No text response for ${category}`);
      return [];
    }

    // Parse JSON — strip any markdown fences
    const cleaned = textBlock.text.replace(/```[a-z]*\n?|\n?```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`  ⚠ Could not parse JSON for ${category}`);
      return [];
    }

    const companies = JSON.parse(jsonMatch[0]);
    return companies.filter(c => c.url && c.name);
  } catch (err) {
    console.log(`  ✗ Error for ${category}: ${err.message}`);
    return [];
  }
}

// ─── Scrape company page for logo + better description ───────────────────────
async function enrichCompany(company) {
  try {
    const res = await fetch(company.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EPInvestingBot/1.0)' },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return company;

    const html = await res.text();
    const root = parse(html);
    const getMeta = (prop) => {
      const el = root.querySelector(`meta[property="${prop}"]`) ||
                 root.querySelector(`meta[name="${prop}"]`);
      return el?.getAttribute('content')?.trim() || null;
    };

    const ogDescription = getMeta('og:description') || getMeta('description');
    if (ogDescription && ogDescription.length > (company.description || '').length) {
      company.description = ogDescription;
    }

    // Try Clearbit logo
    const domain = new URL(company.url).hostname;
    try {
      const logoRes = await fetch(`https://logo.clearbit.com/${domain}`, {
        method: 'HEAD', signal: AbortSignal.timeout(3000)
      });
      if (logoRes.ok) {
        company.logo_url = `https://logo.clearbit.com/${domain}`;
      }
    } catch { /* use favicon fallback */ }

    if (!company.logo_url) {
      company.logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  } catch { /* return as-is */ }

  return company;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔭 EP Investing — Auto Discovery${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // Get existing company URLs
  const { data: existing } = await supabase.from('companies').select('url, name');
  const existingHostnames = new Set(
    (existing || []).map(c => {
      try { return new URL(c.url).hostname.replace(/^www\./, ''); } catch { return null; }
    }).filter(Boolean)
  );
  console.log(`📊 ${existingHostnames.size} companies already in DB\n`);

  const categories = CATEGORY ? [CATEGORY] : Object.keys(CATEGORY_PROMPTS);
  let totalAdded = 0, totalSkipped = 0, totalFailed = 0;

  for (const category of categories) {
    console.log(`\n📂 Category: ${category}`);

    const discovered = await discoverCompanies(category);
    console.log(`  📋 Found ${discovered.length} companies`);

    for (const company of discovered) {
      let hostname;
      try {
        hostname = new URL(company.url).hostname.replace(/^www\./, '');
      } catch {
        totalFailed++;
        continue;
      }

      if (existingHostnames.has(hostname)) {
        totalSkipped++;
        continue;
      }

      // Enrich with logo + better description
      const enriched = await enrichCompany(company);
      console.log(`  ✓ ${enriched.name} (${hostname})`);

      if (!DRY_RUN) {
        const { error } = await supabase.from('companies').insert({
          name: enriched.name,
          url: enriched.url,
          description: enriched.description?.slice(0, 500) || null,
          logo_url: enriched.logo_url || null,
          industry_tags: [category],
          sector: 'cleantech_company',
          enrichment_provenance: 'auto_discovery',
        });

        if (error) {
          if (error.code !== '23505') console.log(`    ⚠ ${error.message}`);
          totalFailed++;
        } else {
          existingHostnames.add(hostname);
          totalAdded++;
        }
      } else {
        existingHostnames.add(hostname);
        totalAdded++;
      }

      await new Promise(r => setTimeout(r, 200));
    }

    // Rate limit between categories
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Added:   ${totalAdded}`);
  console.log(`⏭  Skipped: ${totalSkipped} (already in DB)`);
  console.log(`✗  Failed:  ${totalFailed}`);
  if (DRY_RUN) console.log('\n(Dry run — no DB changes made)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
