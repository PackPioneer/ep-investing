/**
 * EP Investing — Company URL Importer
 *
 * Reads a list of URLs from company-urls.txt (one per line),
 * scrapes each one, classifies into your 14 industry tags,
 * and inserts into Supabase. Skips duplicates automatically.
 *
 * Usage (run from project root):
 *   node scripts/import-companies.js              # full run
 *   NODE_ENV=dry node scripts/import-companies.js # dry run (no DB writes)
 *
 * Setup:
 *   1. Create company-urls.txt in your project root
 *   2. Add one URL per line (blank lines and # comments are ignored)
 *   3. Run the script
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';
import puppeteer from 'puppeteer';
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
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.env.NODE_ENV === 'dry';
const FORCE_ACCEPT = process.env.FORCE_ACCEPT === '1';

// ─── Your 14 industry tags + keyword map ────────────────────────────────────
const TAG_KEYWORDS = {
  battery_storage: [
    'battery', 'batteries', 'energy storage', 'lithium', 'solid state', 'bess',
    'lithium-ion', 'li-ion', 'sodium ion', 'zinc battery', 'redox', 'anode',
    'cathode', 'cell chemistry', 'fast charging', 'battery management', 'kwh storage',
  ],
  carbon_credits: [
    'carbon credit', 'carbon offset', 'carbon market', 'voluntary carbon',
    'emissions trading', 'redd', 'carbon registry', 'carbon accounting',
    'ghg accounting', 'scope 3', 'carbon removal credit', 'nature based solution',
    'carbon finance', 'carbon standard',
  ],
  clean_cooking: [
    'clean cook', 'cookstove', 'biomass cook', 'clean fuel cook', 'lpg cook',
    'improved cookstove', 'household energy', 'cooking fuel', 'clean kitchen',
  ],
  direct_air_capture: [
    'direct air capture', 'dac ', 'carbon capture', 'carbon removal', ' cdr ',
    'carbon dioxide removal', 'point source capture', 'carbon sequestration',
    'co2 capture', 'co2 removal', 'mineralization', 'enhanced weathering',
    'bioenergy carbon', 'beccs', 'ocean carbon', 'atmospheric carbon',
  ],
  electric_aviation: [
    'electric aircraft', 'electric aviation', 'evtol', 'urban air mobility',
    'uam', 'electric plane', 'zero emission flight', 'hybrid aircraft',
    'electric motor aircraft', 'aviation electrification', 'air taxi',
    'electric propulsion aircraft', 'zero-emission aircraft', 'electric jet',
  ],
  ev_charging: [
    'ev charging', 'electric vehicle charging', 'charging station',
    'charging network', 'charging infrastructure', 'charge point',
    'dc fast charge', 'level 2 charging', 'vehicle to grid', 'v2g',
    'smart charging', 'charging software', 'charge management', 'ev infrastructure',
  ],
  geothermal_energy: [
    'geothermal', 'enhanced geothermal', 'egs', 'geothermal power',
    'geothermal heat', 'ground source heat', 'deep drilling energy',
    'hot dry rock', 'hydrothermal energy', 'geothermal well',
  ],
  green_hydrogen: [
    'green hydrogen', 'hydrogen energy', 'electrolyzer', 'electrolysis',
    'fuel cell', 'hydrogen production', 'hydrogen storage', 'hydrogen fuel',
    'proton exchange membrane', 'pem electrolyzer', 'alkaline electrolyzer',
    'hydrogen pipeline', 'green ammonia', 'power-to-gas', 'h2 fuel',
    'hydrogen economy', 'clean hydrogen',
  ],
  grid_storage: [
    'grid storage', 'grid-scale storage', 'utility storage', 'long duration storage',
    'flow battery', 'vanadium flow', 'iron air battery', 'compressed air energy',
    'pumped hydro', 'grid flexibility', 'demand response', 'grid balancing',
    'utility scale battery', 'long-duration energy', 'ldes',
  ],
  industrial_decarbonization: [
    'industrial decarbonization', 'hard to abate', 'green steel', 'green cement',
    'process heat', 'industrial electrification', 'green chemicals',
    'low carbon manufacturing', 'industrial heat pump', 'electric arc furnace',
    'low carbon concrete', 'decarbonize industry', 'industrial carbon',
    'manufacturing emissions', 'heavy industry', 'industrial efficiency',
  ],
  nuclear_technologies: [
    'nuclear', 'fission', 'fusion', 'small modular reactor', 'smr',
    'advanced nuclear', 'thorium reactor', 'nuclear power', 'molten salt reactor',
    'reactor design', 'nuclear fuel', 'microreactor', 'advanced reactor',
    'inertial confinement', 'tokamak', 'plasma energy', 'nuclear startup',
  ],
  saf_efuels: [
    'sustainable aviation fuel', ' saf ', 'efuel', 'e-fuel', 'synthetic fuel',
    'power to liquid', 'electrofuel', 'drop-in fuel', 'renewable fuel',
    'biofuel aviation', 'renewable diesel', 'hydroprocessed fuel',
    'alcohol to jet', 'synthetic kerosene', 'green jet fuel',
  ],
  solar: [
    'solar', 'photovoltaic', ' pv ', 'solar panel', 'solar energy', 'solar power',
    'perovskite', 'thin film solar', 'solar cell', 'solar module', 'solar inverter',
    'solar farm', 'rooftop solar', 'concentrated solar', ' csp ', 'solar thermal',
    'bifacial solar', 'solar installation', 'solar developer',
  ],
  wind_energy: [
    'wind energy', 'wind turbine', 'wind farm', 'offshore wind', 'onshore wind',
    'wind power', 'wind project', 'wind blade', 'wind developer',
    'floating offshore wind', 'airborne wind', 'wind software', 'wind asset',
  ],
};

// ─── AI-powered classification via Claude API ────────────────────────────────
// Uses keyword matching first (fast), falls back to Claude API for no-matches.

function classifyByKeywords(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  const matched = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw.toLowerCase()))) matched.push(tag);
  }
  return matched;
}

async function classifyWithClaude(name, description) {
  const validTags = Object.keys(TAG_KEYWORDS).join(', ');
  const prompt = `You are classifying a climate/energy company into industry tags.

Company name: ${name}
Description: ${description || 'No description available'}

Valid tags (pick 1-3 that best apply):
${validTags}

Respond with ONLY a JSON array of matching tags, e.g. ["solar", "battery_storage"]
If the company does not clearly fit any tag, respond with ["industrial_decarbonization"] as a catch-all.`;

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
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    const raw = data?.content?.[0]?.text?.trim() || '[]';
    const text = raw.replace(/```[a-z]*\n?|\n?```/g, '').trim();
    const tags = JSON.parse(text);
    // Validate — only return tags that exist in our list
    const validTagSet = new Set(Object.keys(TAG_KEYWORDS));
    return tags.filter(t => validTagSet.has(t));
  } catch (err) {
    console.log(`      ⚠ Claude API error: ${err.message} — using industrial_decarbonization`);
    return ['industrial_decarbonization'];
  }
}

async function classifyCompany(name, description) {
  // Try keywords first (free, instant)
  const keywordTags = classifyByKeywords(name, description);
  if (keywordTags.length > 0) return keywordTags;

  // Fall back to Claude API for accurate classification
  return await classifyWithClaude(name, description);
}

function isBroadlyClimate(name, description) {
  // Kept for compatibility but no longer used for filtering
  return true;
}

// ─── Scrape a company page ───────────────────────────────────────────────────
async function scrapeCompany(url, browser) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (compatible; EPInvestingBot/1.0)');

    // Try fast fetch first
    let html = null;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EPInvestingBot/1.0)' },
        signal: AbortSignal.timeout(8000),
        redirect: 'follow',
      });
      if (res.ok) html = await res.text();
    } catch { /* fall through to puppeteer */ }

    // Puppeteer fallback for JS-rendered sites
    if (!html) {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise(r => setTimeout(r, 2000));
      html = await page.content();
    } else {
      // Also check if fetch result looks like a JS app (very little text content)
      const root = parse(html);
      const bodyText = root.querySelector('body')?.text?.trim() || '';
      if (bodyText.length < 200) {
        // Likely a JS-rendered app, use Puppeteer
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000));
        html = await page.content();
      }
    }

    if (!html) return null;

    const root = parse(html);
    const getMeta = (prop) => {
      const el = root.querySelector(`meta[property="${prop}"]`) ||
                 root.querySelector(`meta[name="${prop}"]`);
      return el?.getAttribute('content')?.trim() || null;
    };

    // Name — fall back to domain if title looks generic
    const BAD_TITLES = /^(home|homepage|index|welcome|home page|home \(new version\)|untitled)$/i;
    const rawTitle = getMeta('og:site_name') || getMeta('og:title') ||
      root.querySelector('title')?.text?.trim() || null;
    const cleanTitle = rawTitle ? rawTitle.split(/[|\-\u2013\u2014]/)[0].trim().slice(0, 100) : null;
    const domainName = new URL(url).hostname.replace(/^www\./, '').replace(/\.(com|io|co|net|org)$/, '')
      .replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const name = (cleanTitle && !BAD_TITLES.test(cleanTitle)) ? cleanTitle : domainName;

    // Description
    const description = getMeta('og:description') || getMeta('description') || null;

    // Logo
    const domain = new URL(url).hostname;
    let logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    try {
      const clearbit = `https://logo.clearbit.com/${domain}`;
      const r = await fetch(clearbit, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      if (r.ok) logoUrl = clearbit;
    } catch { /* use favicon fallback */ }

    return { name, description, logoUrl };
  } catch (err) {
    return null;
  } finally {
    await page.close();
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏢 EP Investing — Company Importer${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // Read URLs from file
  const urlFile = resolve(root, 'company-urls.txt');
  if (!existsSync(urlFile)) {
    console.error('❌ company-urls.txt not found in project root.');
    console.error('   Create it with one URL per line and re-run.');
    process.exit(1);
  }

  const urls = readFileSync(urlFile, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))  // skip blanks and comments
    .map(l => l.startsWith('http') ? l : `https://${l}`);

  console.log(`📋 ${urls.length} URLs to process\n`);

  // Get existing company URLs to avoid duplicates
  const { data: existing } = await supabase.from('companies').select('url, name');
  const existingHostnames = new Set(
    (existing || []).map(c => {
      try { return new URL(c.url).hostname.replace(/^www\./, ''); } catch { return null; }
    }).filter(Boolean)
  );
  console.log(`📊 ${existingHostnames.size} companies already in DB\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let added = 0, skipped = 0, noMatch = 0, failed = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    let hostname;
    try {
      hostname = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      console.log(`  ✗ [${i + 1}/${urls.length}] Invalid URL: ${url}`);
      failed++;
      continue;
    }

    // Skip duplicates
    if (existingHostnames.has(hostname)) {
      console.log(`  ⏭  [${i + 1}/${urls.length}] Already in DB: ${hostname}`);
      skipped++;
      continue;
    }

    console.log(`  🔍 [${i + 1}/${urls.length}] Scraping: ${url}`);
    const info = await scrapeCompany(url, browser);

    if (!info) {
      console.log(`      ✗ Failed to scrape`);
      failed++;
      continue;
    }

    // Classify
    const tags = await classifyCompany(info.name, info.description || '');
    const broadClimate = isBroadlyClimate(info.name, info.description || '');

    if (tags.length === 0) {
      if (broadClimate || FORCE_ACCEPT) {
        // Accept with industrial_decarbonization as catch-all
        tags.push('industrial_decarbonization');
        const reason = FORCE_ACCEPT ? 'force accept' : 'broad climate match';
        console.log(`      ⚠ No specific tag — using industrial_decarbonization (${reason})`);
      } else {
        console.log(`      ✗ No industry tag match: "${info.name}" — skipping`);
        noMatch++;
        continue;
      }
    }

    console.log(`      ✓ ${info.name} → [${tags.join(', ')}]`);

    if (!DRY_RUN) {
      const { error } = await supabase.from('companies').insert({
        name: info.name,
        url,
        description: info.description?.slice(0, 500) || null,
        logo_url: info.logoUrl,
        industry_tags: tags,
        sector: 'cleantech_company',
        enrichment_provenance: 'manual_url_import',
      });

      if (error) {
        if (error.code === '23505') {
          console.log(`      ⏭  Duplicate (DB constraint)`);
          skipped++;
        } else {
          console.log(`      ⚠ DB error: ${error.message}`);
          failed++;
        }
      } else {
        existingHostnames.add(hostname);
        added++;
      }
    } else {
      existingHostnames.add(hostname);
      added++;
    }
  }

  await browser.close();

  console.log('\n─────────────────────────────────');
  console.log(`✅ Added:    ${added}`);
  console.log(`⏭  Skipped:  ${skipped} (already in DB)`);
  console.log(`✗  No match: ${noMatch} (not climate-related)`);
  console.log(`✗  Failed:   ${failed} (scrape errors)`);
  if (DRY_RUN) console.log('\n(Dry run — no DB changes made)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
