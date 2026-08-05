/**
 * fix-company-names-batch.mjs
 *
 * One-time cleanup of the 65 companies whose scraped name was a raw domain.
 * Names below are the real company names (hand-mapped), not naive prettify.
 *
 * Lines marked  // REVIEW  are best-guess — eyeball these before/after.
 * Three domains were LEFT OUT on purpose because the domain IS the real brand:
 *   2084 Sistema.bio, 2251 Puro.earth, 2305 d.light
 * Two government domains left out — likely bad entries, handle separately:
 *   1528 utah.gov, 1529 hawaii.gov
 *
 * Dry run:  node --env-file=.env.local fix-company-names-batch.mjs
 * Apply:    node --env-file=.env.local fix-company-names-batch.mjs --write
 *
 * Untracked on purpose — do not `git add`.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const WRITE = process.argv.includes('--write');

const CORRECTIONS = {
  1270: 'Electric Hydrogen',
  1271: 'Hy24',                          // REVIEW
  1273: 'Verde Hydrogen',               // REVIEW
  1276: 'Linde',
  1278: 'Lhyfe',
  1281: 'Plug Power',
  1283: 'NEOM Green Hydrogen Company',
  1286: 'First Hydrogen',
  1290: 'Hysata',
  1291: 'Ohmium',
  1292: 'Verdagy',
  1293: 'H2 Green Steel',
  1295: 'Sunfire',
  1296: 'Enapter',
  1298: 'Hy2gen',
  1300: 'Ceres Power',
  1324: 'Firefly Fusion',                // REVIEW
  1326: 'Avalanche Energy',              // REVIEW
  1327: 'Focused Energy',
  1331: 'Renaissance Fusion',
  1332: 'Commonwealth Fusion Systems',
  1335: 'NuScale Power',
  1338: 'TerraPower',
  1339: 'ThorCon Power',
  1340: 'Flibe Energy',
  1341: 'Seaborg Technologies',
  1345: 'Centrus Energy',
  1355: 'Tokamak Energy',
  1357: 'The Nuclear Company',
  1371: 'Curio',
  1391: 'X-energy',
  1478: 'Kitepower',
  1485: 'Offshore Wind',                 // REVIEW — may be a portal, not a company
  1522: 'PLN',
  1523: 'Energy Development Corporation',
  1550: 'Altris',
  1557: 'Elestor',
  1631: 'Wisk Aero',
  1634: 'BETA Technologies',
  1637: 'Heart Aerospace',
  1639: 'Bye Aerospace',
  1641: 'magniX',
  1644: 'H55',
  1645: 'Elroy Air',
  1649: 'ASKA',
  1655: 'VoltAero',
  1662: 'NEVA Aerospace',                // REVIEW
  1664: 'Transcend Air',
  1668: 'Opener',
  1680: 'MTU Aero Engines',
  1695: 'Cora',
  1700: 'Kitty Hawk',
  1704: 'REGENT',
  1705: 'Supernal',
  1711: 'Flyv',                          // REVIEW
  1767: 'Group14 Technologies',
  1772: 'Nano One Materials',
  1885: 'TwingTec',
  1888: 'Seawind Ocean Technology',
  1990: 'Becaps',                        // REVIEW
};

function slugify(s) {
  return (s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

async function main() {
  const ids = Object.keys(CORRECTIONS).map(Number);
  const { data: rows, error } = await supabase
    .from('companies').select('id, name, slug').in('id', ids);
  if (error) { console.error(error.message); process.exit(1); }
  const byId = Object.fromEntries(rows.map((r) => [r.id, r]));

  console.log(`Applying ${ids.length} corrections:\n`);
  for (const id of ids) {
    const cur = byId[id];
    if (!cur) { console.log(`  id ${id}  (not found, skipping)`); continue; }
    console.log(`  id ${String(id).padEnd(6)} "${cur.name}"  ->  "${CORRECTIONS[id]}"`);
  }
  console.log('');

  if (!WRITE) { console.log('DRY RUN — nothing written. Add --write to apply.'); return; }

  let updated = 0;
  for (const id of ids) {
    if (!byId[id]) continue;
    const name = CORRECTIONS[id];
    const slug = `${slugify(name)}-${id}`;
    const { error: upErr } = await supabase
      .from('companies').update({ name, slug }).eq('id', id);
    if (upErr) { console.error(`  id ${id}: ${upErr.message}`); continue; }
    updated++;
  }
  console.log(`DONE. Updated ${updated}/${ids.length} companies.`);
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
