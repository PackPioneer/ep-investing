/**
 * inspect-amea.mjs  — read-only, writes nothing.
 * Dumps every AMEA Power row in full + counts what references each id,
 * so we can decide the field-by-field merge before touching anything.
 *
 *   node --env-file=.env.local inspect-amea.mjs
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// child tables that reference a company by id
const REFS = [
  ['user_saved_companies', 'company_id'],
  ['company_updates', 'company_id'],
  ['company_feed_items', 'company_id'],
  ['company_enrichment_drafts', 'company_id'],
  ['company_duplicate_flags', 'company_id_a'],
  ['company_duplicate_flags', 'company_id_b'],
];

async function countRef(table, col, id) {
  const { count, error } = await supabase
    .from(table).select('*', { count: 'exact', head: true }).eq(col, id);
  if (error) return `(n/a: ${error.message.slice(0, 40)})`;
  return count;
}

async function main() {
  const { data: rows, error } = await supabase
    .from('companies').select('*')
    .or('name.ilike.%amea%,url.ilike.%amea%')
    .order('id');
  if (error) { console.error(error.message); process.exit(1); }

  console.log(`Found ${rows.length} AMEA row(s).\n`);

  for (const r of rows) {
    console.log('='.repeat(60));
    console.log(`id ${r.id}`);
    for (const [k, v] of Object.entries(r)) {
      const val = v === null ? '(null)' : Array.isArray(v) ? `[${v.join(', ')}]` : String(v);
      console.log(`  ${k.padEnd(22)} ${val.length > 90 ? val.slice(0, 90) + '…' : val}`);
    }
    console.log('  --- references ---');
    for (const [table, col] of REFS) {
      const c = await countRef(table, col, r.id);
      if (c) console.log(`  ${table}.${col}: ${c}`);
    }
    console.log('');
  }
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
