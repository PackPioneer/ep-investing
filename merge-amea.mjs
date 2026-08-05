/**
 * merge-amea.mjs
 *
 * Merges the two AMEA Power duplicates.
 *   KEEP  = id 11   (has url, real logo, location, customers, milestones, year)
 *   LOSER = id 1275 (nicer prose in 3 fields)
 *
 * Actions:
 *   1. Copy these fields FROM 1275 INTO 11 (better text):
 *        description, core_technology, target_market
 *   2. Clear id 11's garbled field: unique_technology -> null
 *   3. Hide id 1275 (is_hidden = true). Nothing deleted — reversible.
 *
 * Neither row has child references, so no repointing needed.
 *
 * Dry run:  node --env-file=.env.local merge-amea.mjs
 * Apply:    node --env-file=.env.local merge-amea.mjs --write
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const WRITE = process.argv.includes('--write');

const KEEP = 11;
const LOSER = 1275;
const TAKE_FROM_LOSER = ['description', 'core_technology', 'target_market'];

async function main() {
  const { data: rows, error } = await supabase
    .from('companies').select('*').in('id', [KEEP, LOSER]);
  if (error) { console.error(error.message); process.exit(1); }
  const keep = rows.find((r) => r.id === KEEP);
  const loser = rows.find((r) => r.id === LOSER);
  if (!keep || !loser) { console.error('Could not find both rows.'); process.exit(1); }

  const patch = { unique_technology: null };
  for (const f of TAKE_FROM_LOSER) patch[f] = loser[f];

  console.log(`Merging LOSER ${LOSER} -> KEEP ${KEEP}\n`);
  for (const [f, v] of Object.entries(patch)) {
    const before = keep[f] === null ? '(null)' : String(keep[f]).slice(0, 70);
    const after = v === null ? '(null)' : String(v).slice(0, 70);
    console.log(`  ${f}`);
    console.log(`    was: ${before}`);
    console.log(`    now: ${after}\n`);
  }
  console.log(`  id ${LOSER} -> is_hidden = true\n`);

  if (!WRITE) { console.log('DRY RUN — nothing written. Add --write to apply.'); return; }

  const { error: e1 } = await supabase.from('companies').update(patch).eq('id', KEEP);
  if (e1) { console.error(`update keep: ${e1.message}`); process.exit(1); }
  const { error: e2 } = await supabase.from('companies').update({ is_hidden: true }).eq('id', LOSER);
  if (e2) { console.error(`hide loser: ${e2.message}`); process.exit(1); }

  console.log(`DONE. id ${KEEP} updated, id ${LOSER} hidden.`);
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
