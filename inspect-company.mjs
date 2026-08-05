/**
 * inspect-company.mjs — read-only. Dumps all companies matching a name/url,
 * field by field, so you can pick keep vs loser before merging.
 *
 *   node --env-file=.env.local inspect-company.mjs --match "quantumscape"
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
function arg(f) { const i = process.argv.indexOf(f); return i !== -1 ? process.argv[i + 1] : undefined; }
const MATCH = arg('--match');
if (!MATCH) { console.error('Usage: --match "<name or domain>"'); process.exit(1); }

const REFS = [
  ['user_saved_companies', 'company_id'],
  ['company_updates', 'company_id'],
  ['company_feed_items', 'company_id'],
  ['company_enrichment_drafts', 'company_id'],
];
async function countRef(table, col, id) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).eq(col, id);
  return error ? null : count;
}

async function main() {
  const { data: rows, error } = await supabase
    .from('companies').select('*')
    .or(`name.ilike.%${MATCH}%,url.ilike.%${MATCH}%`).order('id');
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`Found ${rows.length} row(s) matching "${MATCH}".\n`);

  for (const r of rows) {
    console.log('='.repeat(60));
    console.log(`id ${r.id}`);
    for (const [k, v] of Object.entries(r)) {
      const empty = v === null || (Array.isArray(v) && v.length === 0) || v === '';
      if (empty) continue; // only show fields that HAVE data
      const val = Array.isArray(v) ? `[${v.join(', ')}]` : String(v);
      console.log(`  ${k.padEnd(22)} ${val.length > 80 ? val.slice(0, 80) + '…' : val}`);
    }
    const refs = [];
    for (const [t, c] of REFS) { const n = await countRef(t, c, r.id); if (n) refs.push(`${t}:${n}`); }
    console.log(`  --- refs: ${refs.length ? refs.join('  ') : 'none'}`);
    console.log('');
  }
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
