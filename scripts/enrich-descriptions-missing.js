/**
 * EP Investing — Backfill Missing Company Descriptions
 *
 * For companies with NULL or empty description: fetches their website,
 * extracts visible text, and uses Claude Haiku to write a third-person
 * 2–3 sentence description. Writes back to Supabase.
 *
 * Usage:
 *   node scripts/enrich-descriptions-missing.js              # all 171 missing-description companies
 *   LIMIT=20 node scripts/enrich-descriptions-missing.js     # cap batch size (recommended for first run)
 *   IDS=1241,1242,1244 node scripts/enrich-descriptions-missing.js   # specific company ids
 *   NODE_ENV=dry node scripts/enrich-descriptions-missing.js         # dry run, print without writing
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
const LIMIT = parseInt(process.env.LIMIT || '1500');
const IDS = process.env.IDS ? process.env.IDS.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean) : null;

if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local');
  process.exit(1);
}

// ----------------------------------------------------------------------
// 1. Pick the companies to process
// ----------------------------------------------------------------------
async function getCompanies() {
  let query = supabase
    .from('companies')
    .select('id, name, url, description')
    .not('url', 'is', null);

  if (IDS) {
    query = query.in('id', IDS);
  }
  // No SQL filter on description — we filter in JS below to catch NULL, empty, AND short scraper garbage

  query = query.order('id').limit(LIMIT);

  const { data, error } = await query;
  if (error) throw error;
  // Filter to short/missing descriptions (NULL, empty, or < 50 chars of scraper garbage)
  const filtered = (data || []).filter(c => !c.description || c.description.trim().length < 50);
  return filtered;
}

// ----------------------------------------------------------------------
// 2. Fetch website + extract clean text (~5000 chars max)
// ----------------------------------------------------------------------
async function fetchSiteText(url) {
  if (!url) return '';
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EP-Investing-Bot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return '';
    const html = await res.text();

    // Strip scripts, styles, html tags, collapse whitespace
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    return text.slice(0, 5000);
  } catch (err) {
    return '';
  }
}

// ----------------------------------------------------------------------
// 3. Ask Claude to write the description
// ----------------------------------------------------------------------
async function generateDescription({ name, url, siteText }) {
  if (!siteText || siteText.length < 100) {
    // Couldn't fetch the site (anti-bot, JS-heavy, etc.) — let Claude try from name + URL alone.
    // The prompt instructs it to return UNKNOWN if it doesn't have enough confidence.
    siteText = `(Could not fetch website content. Use your training knowledge of this company if you have it.)\n\nCompany name: ${name}\nWebsite URL: ${url || 'unknown'}`;
  }

  const prompt = `You are writing a concise third-person description for a clean energy / climate company directory.

Company: ${name}
Website: ${url}
Website content (first 5000 chars):
${siteText}

Write a 2–3 sentence description (max 280 characters) that:
1. States what the company does in plain language
2. Mentions specifically what technology or sector they work in
3. Avoids marketing fluff, first-person pronouns ("we", "our", "us"), and obvious filler
4. Reads like an analyst's summary, not a brochure

If you cannot determine what the company does from the content provided, respond with only: UNKNOWN

Output ONLY the description text. No preamble, no quotation marks.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim() || '';
  return text === 'UNKNOWN' ? '' : text;
}

// ----------------------------------------------------------------------
// 4. Save to Supabase
// ----------------------------------------------------------------------
async function saveDescription(id, description) {
  if (DRY_RUN) return;
  const { error } = await supabase
    .from('companies')
    .update({ description })
    .eq('id', id);
  if (error) throw error;
}

// ----------------------------------------------------------------------
// 5. Main loop
// ----------------------------------------------------------------------
async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Fetching companies missing descriptions...`);
  const companies = await getCompanies();
  console.log(`Found ${companies.length} companies to process.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < companies.length; i++) {
    const c = companies[i];
    const prefix = `[${i + 1}/${companies.length}]`;

    try {
      console.log(`${prefix} ${c.name} (id=${c.id})`);
      console.log(`        url: ${c.url}`);

      const siteText = await fetchSiteText(c.url);
      console.log(`        fetched ${siteText.length} chars from website`);

      const description = await generateDescription({ name: c.name, url: c.url, siteText });

      if (!description || description.length < 30) {
        console.log(`        ✗ insufficient — skipping`);
        skipped++;
        continue;
      }

      console.log(`        ✓ description: ${description}`);
      await saveDescription(c.id, description);
      success++;

      // Be polite — small delay between requests
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`        ✗ ERROR: ${err.message}`);
      failed++;
    }

    console.log();
  }

  console.log('───────────────────────────────────────');
  console.log(`Success: ${success}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed:  ${failed}`);
  console.log(DRY_RUN ? '(dry run — nothing written)' : 'Done.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
