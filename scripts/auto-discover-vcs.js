/**
 * EP Investing — VC Firm Auto-Discovery
 *
 * Uses Claude with web search to find climate/cleantech VC firms
 * and insert them into the vc_firms table.
 *
 * Usage:
 *   node scripts/auto-discover-vcs.js                    # all categories
 *   FOCUS=energy node scripts/auto-discover-vcs.js       # one focus area
 *   GEO=europe node scripts/auto-discover-vcs.js         # geography focus
 *   NODE_ENV=dry node scripts/auto-discover-vcs.js       # dry run
 */

import { createClient } from '@supabase/supabase-js';
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
const FOCUS = process.env.FOCUS || null;
const GEO = process.env.GEO || null;

const GEO_CONTEXT = {
  africa: 'Focus on VC firms investing in Africa or emerging markets.',
  asia: 'Focus on VC firms investing in Asia, India, or Southeast Asia.',
  latam: 'Focus on VC firms investing in Latin America.',
  europe: 'Focus on European VC firms.',
  us: 'Focus on US-based VC firms.',
};

const FOCUS_PROMPTS = {
  energy: 'List 40 real venture capital firms that invest in clean energy startups including solar, wind, energy storage, and grid technology.',
  climate: 'List 40 real venture capital firms focused on climate tech, carbon removal, climate adaptation, or climate resilience.',
  mobility: 'List 40 real venture capital firms investing in electric vehicles, EV charging, electric aviation, or sustainable mobility.',
  hydrogen: 'List 40 real venture capital firms investing in green hydrogen, fuel cells, electrolyzers, or hydrogen infrastructure.',
  industrial: 'List 40 real venture capital firms investing in industrial decarbonization, green materials, or hard-to-abate sectors.',
  agri: 'List 40 real venture capital firms investing in sustainable agriculture, food systems, or land-use carbon.',
  emerging: 'List 40 real venture capital firms or impact investors focused on emerging markets, developing economies, or frontier markets in clean energy.',
  impact: 'List 40 real impact investing funds, development finance institutions, or blended finance vehicles focused on clean energy.',
  angels: 'List 40 real angel investors and angel networks actively investing in climate tech, clean energy, or sustainability startups. Include individual angels with public profiles and angel syndicates.',
  family_offices: 'List 40 real family offices or private wealth funds actively investing in clean energy, climate tech, or sustainable infrastructure. Include family offices with known sustainability mandates.',
};

async function discoverVCs(focus) {
  const basePrompt = FOCUS_PROMPTS[focus];
  const geoContext = GEO ? (GEO_CONTEXT[GEO] || '') : 'Include firms from all geographies.';

  const prompt = `${basePrompt} ${geoContext}

Include their website URLs. Include their typical investment stage (seed/series A/growth) and fund size if known.

Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "name": "Firm Name",
    "url": "https://firm.com",
    "description": "One sentence about their climate investment thesis",
    "investment_stages": ["seed", "series_a"],
    "fund_size": "$500M"
  },
  ...
]

Return up to 40 firms. Only include real firms with working websites.`;

  console.log(`  🤖 Searching ${focus}${GEO ? ` [${GEO}]` : ''}...`);

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

    return JSON.parse(jsonMatch[0]).filter(f => f.url && f.name);
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
    return [];
  }
}

async function enrichVC(firm) {
  try {
    const domain = new URL(firm.url).hostname;
    try {
      const lr = await fetch(`https://logo.clearbit.com/${domain}`, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (lr.ok) firm.logo_url = `https://logo.clearbit.com/${domain}`;
    } catch { /* fallback */ }
    if (!firm.logo_url) {
      firm.logo_url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  } catch { /* skip */ }
  return firm;
}

async function main() {
  console.log(`\n🏦 EP Investing — VC Auto Discovery${DRY_RUN ? ' [DRY RUN]' : ''}${GEO ? ` [${GEO.toUpperCase()}]` : ''}\n`);

  const { data: existing } = await supabase.from('vc_firms').select('url, name');
  const existingHostnames = new Set(
    (existing || []).map(f => {
      try { return new URL(f.url).hostname.replace(/^www\./, ''); } catch { return null; }
    }).filter(Boolean)
  );
  const existingNames = new Set((existing || []).map(f => f.name?.toLowerCase().trim()));
  console.log(`📊 ${existingHostnames.size} VC firms already in DB\n`);

  const focuses = FOCUS ? [FOCUS] : Object.keys(FOCUS_PROMPTS);
  let totalAdded = 0, totalSkipped = 0, totalFailed = 0;

  for (const focus of focuses) {
    console.log(`\n📂 ${focus}`);
    const discovered = await discoverVCs(focus);
    console.log(`  📋 Found ${discovered.length}`);

    for (const firm of discovered) {
      let hostname;
      try { hostname = new URL(firm.url).hostname.replace(/^www\./, ''); }
      catch { totalFailed++; continue; }

      if (existingHostnames.has(hostname) || existingNames.has(firm.name?.toLowerCase().trim())) {
        totalSkipped++;
        continue;
      }

      const enriched = await enrichVC(firm);
      console.log(`  ✓ ${enriched.name}`);

      if (!DRY_RUN) {
        const { error } = await supabase.from('vc_firms').insert({
          name: enriched.name,
          url: enriched.url,
          description: enriched.description?.slice(0, 500) || null,
          logo_url: enriched.logo_url || null,
          investment_stages: enriched.investment_stages || [],
          fund_size: enriched.fund_size || null,
          climate_focus_areas: [focus],
        });
        if (error) { if (error.code !== '23505') console.log(`    ⚠ ${error.message}`); totalFailed++; }
        else { existingHostnames.add(hostname); existingNames.add(firm.name?.toLowerCase().trim()); totalAdded++; }
      } else { existingHostnames.add(hostname); existingNames.add(firm.name?.toLowerCase().trim()); totalAdded++; }

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
