/**
 * backfill-company-slugs.mjs
 *
 * Generates slug = slugify(name) + '-' + id  for every company.
 * Format: "natron-energy-1552" — name for trust/SEO, id guarantees uniqueness.
 * Idempotent: re-running recomputes the same slug. Safe.
 *
 *   node --env-file=.env.local backfill-company-slugs.mjs           # all
 *   node --env-file=.env.local backfill-company-slugs.mjs --only-empty   # only rows missing a slug
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const onlyEmpty = process.argv.includes('--only-empty');

// Same slugify the NGO onboarding uses, for consistency.
function slugify(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function makeSlug(name, id) {
  const base = slugify(name);
  return base ? `${base}-${id}` : `company-${id}`;
}

async function main() {
  let query = supabase.from('companies').select('id, name, slug');
  if (onlyEmpty) query = query.is('slug', null);
  const { data: companies, error } = await query;
  if (error) { console.error(error.message); process.exit(1); }

  console.log(`Processing ${companies.length} companies${onlyEmpty ? ' (missing slug)' : ''}.`);

  let updated = 0;
  // Update each row individually — only the slug column is touched, nothing else.
  for (const c of companies) {
    const slug = makeSlug(c.name, c.id);
    const { error: upErr } = await supabase
      .from('companies')
      .update({ slug })
      .eq('id', c.id);
    if (upErr) { console.error(`\n  id ${c.id}: ${upErr.message}`); continue; }
    updated += 1;
    if (updated % 50 === 0) process.stdout.write(`\r  updated ${updated}/${companies.length}`);
  }
  console.log(`\nDONE. Set slugs on ${updated} companies.`);
  console.log('Sample:');
  companies.slice(0, 5).forEach((c) => console.log(`  ${c.id}  ${makeSlug(c.name, c.id)}`));
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
