/**
 * EP Investing — VC URL Backfill
 *
 * Finds vc_firms records where url IS NULL and fills them in via:
 *   1. MANUAL_URLS map below (always checked first, free)
 *   2. SerpAPI search if SERPAPI_KEY is in .env.local (100 free/month)
 *
 * Usage (run from project root):
 *   node scripts/backfill-vc-urls.js            # apply manual + search
 *   node scripts/backfill-vc-urls.js --manual   # only apply MANUAL_URLS
 *   NODE_ENV=dry node scripts/backfill-vc-urls.js  # dry run
 */

import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

// ─── Load env from project root (no dotenv needed) ──────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envLocal = resolve(root, '.env.local');
const envFile  = resolve(root, '.env');
const envPath  = existsSync(envLocal) ? envLocal : existsSync(envFile) ? envFile : null;

if (!envPath) {
  console.error('❌ No .env.local or .env found in project root.');
  process.exit(1);
}

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (key && !(key in process.env)) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error(`   These should be in: ${envLocal}`);
  process.exit(1);
}

const supabase    = createClient(SUPABASE_URL, SUPABASE_KEY);
const SERPAPI_KEY  = process.env.SERPAPI_KEY;
const DRY_RUN     = process.env.NODE_ENV === 'dry';
const MANUAL_ONLY = process.argv.includes('--manual');

// ─── Manual URL map ──────────────────────────────────────────────────────────
// Key = firm name lowercase (exactly as stored in DB), Value = website URL

const MANUAL_URLS = {
  'sequoia capital':             'https://www.sequoiacap.com',
  'andreessen horowitz':         'https://a16z.com',
  'y combinator':                'https://www.ycombinator.com',
  'ycombinator':                 'https://www.ycombinator.com',
  'techstars':                   'https://www.techstars.com',
  'first round capital':         'https://firstround.com',
  '500 startups':                'https://500.co',
  'lightspeed venture partners': 'https://lsvp.com',
  'accel':                       'https://www.accel.com',
  'accel partners':              'https://www.accel.com',
  'index ventures':              'https://www.indexventures.com',
  'general catalyst':            'https://www.generalcatalyst.com',
  'general atlantic':            'https://www.generalatlantic.com',
  'bessemer venture partners':   'https://www.bvp.com',
  'battery ventures':            'https://www.battery.com',
  'union square ventures':       'https://www.usv.com',
  'greylock':                    'https://greylock.com',
  'greylock partners':           'https://greylock.com',
  'nea':                         'https://www.nea.com',
  'new enterprise associates':   'https://www.nea.com',
  'kleiner perkins':             'https://www.kleinerperkins.com',
  'khosla ventures':             'https://www.khoslaventures.com',
  'benchmark':                   'https://www.benchmark.com',
  'redpoint ventures':           'https://www.redpoint.com',
  'founders fund':               'https://foundersfund.com',
  'social capital':              'https://www.socialcapital.com',
  'spark capital':               'https://www.sparkcapital.com',
  'felicis ventures':            'https://www.felicis.com',
  'lowercase capital':           'https://lowercase.com',
  'lerer hippeau':               'https://lererhippeau.com',
  'nextview ventures':           'https://nextviewventures.com',
  'sv angel':                    'https://svangel.com',
  'village global':              'https://villageglobal.vc',
  'initialized capital':         'https://initialized.com',
  'cowboy ventures':             'https://cowboy.vc',
  'homebrew':                    'https://homebrew.co',
  'box group':                   'https://www.boxgroup.com',
  'betaworks':                   'https://betaworks.com',
  'jumpstart':                   'https://www.jumpstartfund.com',
};

// ─── SerpAPI search ──────────────────────────────────────────────────────────

async function searchForUrl(name) {
  if (!SERPAPI_KEY) return null;
  const q = encodeURIComponent(`${name} venture capital firm official website`);
  try {
    const res = await fetch(`https://serpapi.com/search.json?q=${q}&num=3&api_key=${SERPAPI_KEY}`, {
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    const link = data?.organic_results?.[0]?.link;
    if (link) {
      const parsed = new URL(link);
      return `${parsed.protocol}//${parsed.hostname}`;
    }
  } catch (err) {
    console.log(`  Search error for "${name}": ${err.message}`);
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔗 VC URL Backfill${DRY_RUN ? ' [DRY RUN]' : ''}${MANUAL_ONLY ? ' [MANUAL ONLY]' : ''}\n`);

  const { data: firms, error } = await supabase
    .from('vc_firms')
    .select('id, name, url')
    .is('url', null)
    .order('id');

  if (error) throw error;
  console.log(`📋 ${firms.length} records with null URL\n`);

  let updated = 0, notFound = 0;

  for (const firm of firms) {
    const key = firm.name?.toLowerCase().trim();
    let foundUrl = MANUAL_URLS[key] || null;

    if (!foundUrl && !MANUAL_ONLY) {
      foundUrl = await searchForUrl(firm.name);
    }

    if (foundUrl) {
      if (!DRY_RUN) {
        const { error: err } = await supabase
          .from('vc_firms').update({ url: foundUrl }).eq('id', firm.id);
        if (err) {
          console.log(`  ⚠ [${firm.id}] DB error: ${err.message}`);
        } else {
          console.log(`  ✓ [${firm.id}] "${firm.name}" → ${foundUrl}`);
          updated++;
        }
      } else {
        console.log(`  ✓ [${firm.id}] "${firm.name}" → ${foundUrl} (dry)`);
        updated++;
      }
    } else {
      console.log(`  - [${firm.id}] "${firm.name}" — no URL found`);
      notFound++;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Updated:   ${updated}`);
  console.log(`❓ Not found: ${notFound}`);
  if (!SERPAPI_KEY && !MANUAL_ONLY && notFound > 0) {
    console.log('\n💡 Add SERPAPI_KEY to .env.local to auto-search remaining URLs');
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
