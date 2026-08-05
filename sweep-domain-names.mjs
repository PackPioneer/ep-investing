/**
 * sweep-domain-names.mjs
 *
 * Finds every company whose NAME is actually a domain (e.g. "ameapower.com",
 * "itm-power.com") — the scraper fallback bug — and proposes a cleaned name.
 * Cleaning: strip the TLD, split on . - _ , Title-Case each word.
 *   "itm-power.com"    -> "Itm Power"
 *   "ameapower.com"    -> "Ameapower"
 *   "elementlpower.io" -> "Elementlpower"
 *
 * These won't always get acronym casing right (AMEA, ITM). The point is to
 * kill the raw ".com" names in bulk so search works; then fix the handful of
 * acronym ones with fix-company-name.mjs.
 *
 * Dry run (lists everything, writes nothing):
 *   node --env-file=.env.local sweep-domain-names.mjs
 * Apply:
 *   node --env-file=.env.local sweep-domain-names.mjs --write
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

// A name that is really a domain: no spaces, and ends in .tld
const DOMAIN_NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;

function slugify(s) {
  return (s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function prettify(hostname) {
  const base = hostname.replace(/^www\./i, '').replace(/\.[a-z]{2,}(\.[a-z]{2})?$/i, '');
  return base.split(/[.\-_]+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function main() {
  const { data: rows, error } = await supabase
    .from('companies')
    .select('id, name, slug, is_hidden')
    .order('id');
  if (error) { console.error(error.message); process.exit(1); }

  const bad = rows.filter((r) => r.name && DOMAIN_NAME.test(r.name.trim()));
  if (!bad.length) { console.log('No domain-style company names found. All clean.'); return; }

  console.log(`Found ${bad.length} companies whose name is a domain:\n`);
  for (const r of bad) {
    const newName = prettify(r.name.trim());
    console.log(`  id ${String(r.id).padEnd(6)} "${r.name}"  ->  "${newName}"`);
  }
  console.log('');

  if (!WRITE) {
    console.log('DRY RUN — nothing written. Add --write to apply.');
    console.log('After applying, fix acronym casing (e.g. "Itm Power" -> "ITM Power") with:');
    console.log('  node --env-file=.env.local fix-company-name.mjs --id <id> --name "Correct Name" --write');
    return;
  }

  let updated = 0;
  for (const r of bad) {
    const newName = prettify(r.name.trim());
    const newSlug = `${slugify(newName)}-${r.id}`;
    const { error: upErr } = await supabase
      .from('companies').update({ name: newName, slug: newSlug }).eq('id', r.id);
    if (upErr) { console.error(`  id ${r.id}: ${upErr.message}`); continue; }
    updated++;
  }
  console.log(`DONE. Updated ${updated}/${bad.length} companies.`);
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
