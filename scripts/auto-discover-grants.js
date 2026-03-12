/**
 * EP Investing — Grants Auto-Discovery
 *
 * Uses Claude with web search to find climate/energy grants
 * and insert them into the grants table.
 *
 * Usage:
 *   node scripts/auto-discover-grants.js                     # all categories
 *   FOCUS=eu node scripts/auto-discover-grants.js            # one focus
 *   NODE_ENV=dry node scripts/auto-discover-grants.js        # dry run
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

const FOCUS_PROMPTS = {
  us_federal: 'List 30 real US federal government grants for clean energy, climate tech, or renewable energy startups. Include DOE, EPA, USDA, NSF, ARPA-E grants currently open or recently active.',
  eu: 'List 30 real European Union grants for clean energy, climate tech, or green innovation. Include Horizon Europe, EIC Accelerator, Innovation Fund, and EU Green Deal funding programs.',
  uk: 'List 30 real UK government grants for clean energy startups and climate tech. Include Innovate UK, UKRI, Net Zero Innovation Portfolio grants.',
  emerging_markets: 'List 30 real grants, development finance, or concessional funding programs for clean energy in developing countries and emerging markets. Include World Bank, USAID, GIZ, AFC grants.',
  foundations: 'List 30 real foundation grants for climate tech, clean energy, or environmental solutions. Include Gates Foundation, Bezos Earth Fund, Bloomberg Philanthropies, and other major foundations.',
  accelerators: 'List 30 real grant-based accelerator programs for climate tech startups. Include programs that offer non-dilutive funding alongside acceleration.',
  hydrogen: 'List 30 real grants specifically for green hydrogen, fuel cells, or electrolysis projects from any country or institution.',
  storage: 'List 30 real grants specifically for energy storage, battery technology, or grid-scale storage from any government or institution.',
  carbon: 'List 30 real grants for carbon removal, direct air capture, carbon markets, or carbon accounting technology.',
  africa: 'List 30 real grants or funding programs specifically targeting clean energy, solar, or clean cooking in African countries.',
  asia: 'List 30 real grants or funding programs for clean energy innovation in India, Southeast Asia, or developing Asia.',
  corporate: 'List 30 real corporate grant programs from energy companies, utilities, or foundations funding climate tech and clean energy innovation.',
};

async function discoverGrants(focus) {
  const prompt = `${FOCUS_PROMPTS[focus]}

For each grant include: name, funder, amount, deadline (if known), eligibility, and a direct URL to apply or learn more.

Return ONLY a JSON array, no markdown:
[
  {
    "title": "Grant Name",
    "funder_name": "Organization Name",
    "url": "https://apply.example.com",
    "description": "2-3 sentence description of what this grant funds",
    "amount": "$500,000",
    "deadline_date": "2025-12-31",
    "eligibility": "Early-stage startups in the US",
    "geography": "United States",
    "sector_tags": ["solar", "battery_storage"]
  },
  ...
]

Only include real, active grants with working application URLs. Return up to 30.`;

  console.log(`  🤖 Searching ${focus}...`);

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

    // Log stop reason and content types for debugging
    if (process.env.DEBUG) {
      console.log(`    stop_reason: ${data.stop_reason}`);
      console.log(`    content types: ${data.content?.map(b => b.type).join(', ')}`);
    }

    const textBlock = data?.content?.find(b => b.type === 'text');
    if (!textBlock?.text) {
      console.log(`  ⚠ No text block. stop_reason=${data.stop_reason}, types=${data.content?.map(b=>b.type).join(',')}`);
      return [];
    }

    const cleaned = textBlock.text.replace(/```[a-z]*\n?|\n?```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`  ⚠ No JSON array found. Text preview: ${cleaned.slice(0, 200)}`);
      return [];
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const filtered = parsed.filter(g => g.title && g.funder_name);
      if (parsed.length > 0 && filtered.length === 0) {
        console.log(`  ⚠ Parsed ${parsed.length} items but none had title+funder_name. Keys: ${Object.keys(parsed[0]).join(', ')}`);
      }
      return filtered;
    } catch (parseErr) {
      console.log(`  ⚠ JSON parse error: ${parseErr.message}`);
      return [];
    }
  } catch (err) {
    console.log(`  ✗ ${err.message}`);
    return [];
  }
}

async function main() {
  console.log(`\n💰 EP Investing — Grants Auto Discovery${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  const { data: existing } = await supabase.from('grants').select('title, funder_name');
  const existingKeys = new Set(
    (existing || []).map(g => `${g.title?.toLowerCase()}__${g.funder_name?.toLowerCase()}`)
  );
  console.log(`📊 ${existing?.length || 0} grants already in DB\n`);

  const focuses = FOCUS ? [FOCUS] : Object.keys(FOCUS_PROMPTS);
  let totalAdded = 0, totalSkipped = 0, totalFailed = 0;

  for (const focus of focuses) {
    console.log(`\n📂 ${focus}`);
    const discovered = await discoverGrants(focus);
    console.log(`  📋 Found ${discovered.length}`);

    for (const grant of discovered) {
      const key = `${grant.title?.toLowerCase()}__${grant.funder_name?.toLowerCase()}`;
      if (existingKeys.has(key)) { totalSkipped++; continue; }

      console.log(`  ✓ ${grant.title} — ${grant.funder_name}`);

      if (!DRY_RUN) {
        const descParts = [
          grant.funder_name ? `Funder: ${grant.funder_name}.` : null,
          grant.description || null,
          grant.eligibility ? `Eligibility: ${grant.eligibility}` : null,
        ].filter(Boolean).join(' ');

        const insertData = {
          title: grant.title,
          description: descParts.slice(0, 800) || null,
          url: grant.url || null,
          amount: grant.amount || null,
          source: focus,
          status: 'open',
          tags: (Array.isArray(grant.sector_tags) && grant.sector_tags.length > 0) ? grant.sector_tags : [focus],
        };

        const dl = (grant.deadline_date || '').toLowerCase();
        if (grant.deadline_date && !['ongoing','rolling','tbd','n/a',''].includes(dl)) {
          try { new Date(grant.deadline_date); insertData.deadline = grant.deadline_date; } catch { /* skip */ }
        }

        const { error } = await supabase.from('grants').insert(insertData);
        if (error) { console.log(`    ⚠ ${error.message}`); totalFailed++; }
        else { existingKeys.add(key); totalAdded++; }
      } else { existingKeys.add(key); totalAdded++; }

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
