/**
 * EP Investing — Backfill NGO Bios
 *
 * For NGOs with an empty `bio`: fetches their website, extracts visible text,
 * and uses Claude Haiku to write a third-person 2–4 sentence mission-focused bio.
 * Writes back to Supabase. Mirrors enrich-descriptions-missing.js but tuned for
 * nonprofits (mission, focus areas, geography, impact — not business/funding).
 *
 * Usage:
 *   node scripts/enrich-ngo-bios.js              # all NGOs missing a bio
 *   LIMIT=10 node scripts/enrich-ngo-bios.js     # cap batch size (recommended first run)
 *   IDS=1,2,3 node scripts/enrich-ngo-bios.js    # specific NGO ids
 *   NODE_ENV=dry node scripts/enrich-ngo-bios.js # dry run, print without writing
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
const LIMIT = parseInt(process.env.LIMIT || '500');
const IDS = process.env.IDS ? process.env.IDS.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean) : null;

if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local');
  process.exit(1);
}

// ----------------------------------------------------------------------
// 1. Pick the NGOs to process
// ----------------------------------------------------------------------
async function getNGOs() {
  let query = supabase
    .from('ngos')
    .select('id, name, website_url, short_description, org_type, sector_tags, bio')
    .not('website_url', 'is', null);

  if (IDS) {
    query = query.in('id', IDS);
  }

  query = query.order('id').limit(LIMIT);

  const { data, error } = await query;
  if (error) throw error;
  // Filter to NGOs missing a bio (NULL or empty)
  return (data || []).filter(n => !n.bio || n.bio.trim().length < 30);
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
  } catch {
    return '';
  }
}

// ----------------------------------------------------------------------
// 3. Ask Claude to write the bio
// ----------------------------------------------------------------------
async function generateBio({ name, website_url, short_description, org_type, sector_tags, siteText }) {
  const context = [
    `Organization: ${name}`,
    org_type ? `Type: ${org_type}` : '',
    short_description ? `Tagline: ${short_description}` : '',
    sector_tags?.length ? `Focus areas: ${sector_tags.join(', ')}` : '',
    `Website: ${website_url}`,
  ].filter(Boolean).join('\n');

  let body;
  if (!siteText || siteText.length < 100) {
    body = `(Could not fetch website content. Use your training knowledge of this organization if you have it.)\n\n${context}`;
  } else {
    body = `${context}\n\nWebsite content (first 5000 chars):\n${siteText}`;
  }

  const prompt = `You are writing a concise third-person bio for a climate & energy nonprofit/NGO directory.

${body}

Write a 2–4 sentence bio (max 400 characters) that:
1. States the organization's mission and what it actually does
2. Mentions its primary focus areas and where it operates (geography) if known
3. Notes its approach (advocacy, research, on-the-ground implementation, funding, etc.)
4. Avoids marketing fluff, first-person pronouns ("we", "our"), and vague filler

If you cannot determine what the organization does from the content provided, respond with only: UNKNOWN

Output ONLY the bio text. No preamble, no quotation marks.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
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
async function saveBio(id, bio) {
  if (DRY_RUN) return;
  const { error } = await supabase.from('ngos').update({ bio }).eq('id', id);
  if (error) throw error;
}

// ----------------------------------------------------------------------
// 5. Main loop
// ----------------------------------------------------------------------
async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Fetching NGOs missing bios...`);
  const ngos = await getNGOs();
  console.log(`Found ${ngos.length} NGOs to process.\n`);

  let success = 0, skipped = 0, failed = 0;

  for (let i = 0; i < ngos.length; i++) {
    const n = ngos[i];
    const prefix = `[${i + 1}/${ngos.length}]`;
    try {
      console.log(`${prefix} ${n.name} (id=${n.id})`);
      console.log(`        url: ${n.website_url}`);
      const siteText = await fetchSiteText(n.website_url);
      console.log(`        fetched ${siteText.length} chars`);
      const bio = await generateBio({ ...n, siteText });
      if (!bio || bio.length < 30) {
        console.log(`        ✗ insufficient — skipping`);
        skipped++;
        continue;
      }
      console.log(`        ✓ bio: ${bio}`);
      await saveBio(n.id, bio);
      success++;
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
