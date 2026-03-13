/**
 * EP Investing — Logo Backfill Script
 *
 * For every company missing a logo_url, tries these sources in order:
 *   1. Clearbit Logo API (best quality, high res)
 *   2. Brandfetch (good fallback)
 *   3. Google Favicon (always works, lower quality)
 *
 * Usage:
 *   node scripts/backfill-logos.js              # all companies missing logos
 *   LIMIT=100 node scripts/backfill-logos.js    # limit batch size
 *   NODE_ENV=dry node scripts/backfill-logos.js # dry run
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
const DRY_RUN = process.env.NODE_ENV === 'dry';
const LIMIT = parseInt(process.env.LIMIT || '2000');

function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function tryUrl(url, timeout = 4000) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    });
    return res.ok && res.status < 400;
  } catch {
    return false;
  }
}

async function findLogo(url) {
  const domain = extractDomain(url);
  if (!domain) return null;

  // 1. Clearbit — best quality
  const clearbit = `https://logo.clearbit.com/${domain}`;
  if (await tryUrl(clearbit)) return clearbit;

  // 2. Brandfetch CDN
  const brandfetch = `https://cdn.brandfetch.io/${domain}/w/400/h/400`;
  if (await tryUrl(brandfetch)) return brandfetch;

  // 3. DuckDuckGo favicon (higher res than Google)
  const ddg = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  if (await tryUrl(ddg)) return ddg;

  // 4. Google favicon — always returns something but may be generic
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

async function main() {
  console.log(`\n🖼️  EP Investing — Logo Backfill${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, url, logo_url')
    .or('logo_url.is.null,logo_url.eq.')
    .limit(LIMIT);

  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

  console.log(`📊 ${companies.length} companies missing logos\n`);
  if (companies.length === 0) { console.log('✅ All companies have logos!'); return; }

  let found = 0, googleFallback = 0, failed = 0;

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    process.stdout.write(`\r  [${i + 1}/${companies.length}] ${found} found, ${failed} failed...`);

    if (!company.url) { failed++; continue; }

    const logo_url = await findLogo(company.url);

    if (!logo_url) { failed++; continue; }

    const isGoogleFallback = logo_url.includes('google.com/s2/favicons');
    if (isGoogleFallback) googleFallback++;
    else found++;

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url })
        .eq('id', company.id);

      if (updateError) { failed++; }
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n\n${'─'.repeat(45)}`);
  console.log(`✅ High-quality logos: ${found}`);
  console.log(`🔲 Google favicon fallback: ${googleFallback}`);
  console.log(`✗  Failed (no URL):  ${failed}`);
  if (DRY_RUN) console.log('\n(Dry run — no changes made)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
