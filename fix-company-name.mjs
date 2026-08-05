/**
 * fix-company-name.mjs
 *
 * Fixes a company whose scraped name is a domain (e.g. "itm-power.com")
 * instead of the real name. Updates name + regenerates slug.
 * Reusable — pass the id (or a name to match) and the correct name.
 *
 * Dry run (shows the change, writes nothing):
 *   node --env-file=.env.local fix-company-name.mjs --match "itm-power.com" --name "ITM Power"
 *   node --env-file=.env.local fix-company-name.mjs --id 1234 --name "ITM Power"
 *
 * Apply it — add --write:
 *   node --env-file=.env.local fix-company-name.mjs --match "itm-power.com" --name "ITM Power" --write
 *
 * Untracked on purpose — do not `git add` this file.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}
const WRITE = process.argv.includes('--write');
const ID = arg('--id');
const MATCH = arg('--match');
const NEW_NAME = arg('--name');

if (!NEW_NAME || (!ID && !MATCH)) {
  console.error('Usage: --name "Correct Name" and either --id <n> or --match "<current name>"');
  process.exit(1);
}

function slugify(s) {
  return (s || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function main() {
  let q = supabase.from('companies').select('id, name, tagline, slug, is_hidden, claim_status');
  q = ID ? q.eq('id', Number(ID)) : q.ilike('name', MATCH);
  const { data: rows, error } = await q;
  if (error) { console.error(error.message); process.exit(1); }

  if (!rows.length) { console.log('No matching rows. Nothing to do.'); return; }

  console.log(`Found ${rows.length} matching row(s):\n`);
  for (const r of rows) {
    const newSlug = `${slugify(NEW_NAME)}-${r.id}`;
    console.log(`  id ${r.id}`);
    console.log(`    name:   "${r.name}"  ->  "${NEW_NAME}"`);
    console.log(`    slug:   "${r.slug}"  ->  "${newSlug}"`);
    console.log(`    hidden: ${r.is_hidden}   claim_status: ${r.claim_status}\n`);
  }

  if (!WRITE) { console.log('DRY RUN — no changes written. Add --write to apply.'); return; }

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
