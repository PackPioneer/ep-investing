/**
 * backfill-logos.mjs
 *
 * Replaces Google-favicon placeholder logos with Clearbit logos (by domain).
 * Targets only companies whose logo_url is a google favicon (s2/favicons),
 * extracts the domain from their `url`, and sets logo_url to
 *   https://logo.clearbit.com/<domain>
 *
 * Does NOT touch companies that already have a real logo.
 * Idempotent. Run:
 *   node --env-file=.env.local backfill-logos.mjs --dry    # preview, no writes
 *   node --env-file=.env.local backfill-logos.mjs          # apply
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const DRY = process.argv.includes('--dry');

// Extract a clean root domain from a url (strip protocol, www, path).
function domainFrom(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

// Supabase 1000-row cap — paginate.
async function fetchAll() {
  const all = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, url, logo_url')
      .like('logo_url', '%s2/favicons%')
      .range(from, from + PAGE - 1);
    if (error) { console.error(error.message); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function main() {
  const companies = await fetchAll();
  console.log(`Found ${companies.length} companies with favicon-placeholder logos.\n`);

  let updated = 0, skipped = 0;
  for (const c of companies) {
    const domain = domainFrom(c.url);
    if (!domain) { skipped += 1; console.log(`  SKIP (no domain): ${c.name}`); continue; }
    const newLogo = `https://logo.clearbit.com/${domain}`;

    if (DRY) {
      console.log(`  ${c.name}  →  ${newLogo}`);
      updated += 1;
      continue;
    }

    const { error } = await supabase.from('companies').update({ logo_url: newLogo }).eq('id', c.id);
    if (error) { console.error(`  FAIL ${c.name}: ${error.message}`); skipped += 1; continue; }
    updated += 1;
    if (updated % 50 === 0) process.stdout.write(`\r  updated ${updated}/${companies.length}`);
  }

  console.log(`\n\n${DRY ? 'DRY RUN — ' : ''}Would set ${updated} Clearbit logos${skipped ? `, skipped ${skipped} (no domain)` : ''}.`);
  if (DRY) console.log('Re-run without --dry to apply.');
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
