/**
 * revert-logos.mjs
 *
 * Reverts the Clearbit logos we just set back to Google favicon placeholders.
 * Targets companies whose logo_url is a clearbit url, extracts the domain,
 * and restores logo_url to the original favicon format.
 *
 *   node --env-file=.env.local revert-logos.mjs --dry   # preview
 *   node --env-file=.env.local revert-logos.mjs         # apply
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const DRY = process.argv.includes('--dry');

function domainFrom(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch { return null; }
}

async function fetchAll() {
  const all = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, url, logo_url')
      .like('logo_url', '%logo.clearbit.com%')
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
  console.log(`Found ${companies.length} companies with Clearbit logos to revert.\n`);

  let updated = 0, skipped = 0;
  for (const c of companies) {
    // Prefer the domain embedded in the clearbit url itself; fall back to c.url
    let domain = null;
    const m = c.logo_url.match(/logo\.clearbit\.com\/(.+)$/);
    if (m) domain = m[1];
    if (!domain) domain = domainFrom(c.url);
    if (!domain) { skipped += 1; continue; }

    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    if (DRY) { console.log(`  ${c.name}  →  ${favicon}`); updated += 1; continue; }

    const { error } = await supabase.from('companies').update({ logo_url: favicon }).eq('id', c.id);
    if (error) { console.error(`  FAIL ${c.name}: ${error.message}`); skipped += 1; continue; }
    updated += 1;
    if (updated % 50 === 0) process.stdout.write(`\r  reverted ${updated}/${companies.length}`);
  }
  console.log(`\n\n${DRY ? 'DRY RUN — ' : ''}Reverted ${updated}${skipped ? `, skipped ${skipped}` : ''}.`);
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
