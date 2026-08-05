/**
 * fix-elementl-name.mjs
 *
 * Fixes the Elementl Power company record where the scraper stored the
 * domain ("elementlpower.io") as the company name instead of "Elementl Power".
 * Updates name + regenerates slug (same slugify the rest of the app uses).
 *
 *   node --env-file=.env.local fix-elementl-name.mjs          # dry run: shows matches, no writes
 *   node --env-file=.env.local fix-elementl-name.mjs --write  # applies the fix
 *
 * Untracked on purpose — do not `git add` this file.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const WRITE = process.argv.includes('--write');
const NEW_NAME = 'Elementl Power';

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function main() {
  // Match the bad rows: name looks like the domain (elementlpower.io / .com / etc.)
  const { data: rows, error } = await supabase
    .from('companies')
    .select('id, name, tagline, slug, is_hidden, claim_status')
    .ilike('name', 'elementlpower%');

  if (error) { console.error(error.message); process.exit(1); }

  if (!rows.length) {
    console.log('No rows with name starting "elementlpower" found. Nothing to do.');
    console.log('(If the name differs, tell me the exact value and I\'ll adjust the match.)');
    return;
  }

  console.log(`Found ${rows.length} matching row(s):\n`);
  for (const r of rows) {
    const newSlug = `${slugify(NEW_NAME)}-${r.id}`;
    console.log(`  id ${r.id}`);
    console.log(`    name:    "${r.name}"  ->  "${NEW_NAME}"`);
    console.log(`    slug:    "${r.slug}"  ->  "${newSlug}"`);
    console.log(`    hidden:  ${r.is_hidden}   claim_status: ${r.claim_status}`);
    console.log('');
  }

  if (!WRITE) {
    console.log('DRY RUN — no changes written. Re-run with --write to apply.');
    return;
  }

  for (const r of rows) {
    const newSlug = `${slugify(NEW_NAME)}-${r.id}`;
    const { error: upErr } = await supabase
      .from('companies')
      .update({ name: NEW_NAME, slug: newSlug })
      .eq('id', r.id);
    if (upErr) { console.error(`  id ${r.id}: ${upErr.message}`); continue; }
    console.log(`  ✓ id ${r.id} updated -> "${NEW_NAME}" (${newSlug})`);
  }
  console.log('\nDONE.');
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
