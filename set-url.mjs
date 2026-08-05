/**
 * set-url.mjs — manually correct a company's website URL.
 *
 *   node --env-file=.env.local set-url.mjs --match "Elevra" --url "https://www.elevra.com"
 *   node --env-file=.env.local set-url.mjs --id 1234 --url "https://www.elevra.com" --write
 *
 * Dry run by default; add --write to apply. Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
function arg(f) { const i = process.argv.indexOf(f); return i !== -1 ? process.argv[i + 1] : undefined; }
const WRITE = process.argv.includes('--write');
const ID = arg('--id');
const MATCH = arg('--match');
const URL_IN = arg('--url');

if (!URL_IN || (!ID && !MATCH)) {
  console.error('Usage: --url "https://..." and either --id <n> or --match "<name>"');
  process.exit(1);
}
let normUrl = URL_IN.trim();
if (!/^https?:\/\//i.test(normUrl)) normUrl = `https://${normUrl}`;
try { normUrl = new URL(normUrl).href; } catch { console.error('Invalid URL'); process.exit(1); }

async function main() {
  let q = supabase.from('companies').select('id, name, url');
  q = ID ? q.eq('id', Number(ID)) : q.ilike('name', `%${MATCH}%`);
  const { data: rows, error } = await q;
  if (error) { console.error(error.message); process.exit(1); }
  if (!rows.length) { console.log('No matching companies.'); return; }

  console.log(`${rows.length} match(es):\n`);
  for (const r of rows) {
    console.log(`  id ${r.id}  ${r.name}`);
    console.log(`    url: "${r.url}"  ->  "${normUrl}"\n`);
  }
  if (!WRITE) { console.log('DRY RUN — add --write to apply.'); return; }

  for (const r of rows) {
    const { error: upErr } = await supabase.from('companies').update({ url: normUrl }).eq('id', r.id);
    if (upErr) { console.error(`  id ${r.id}: ${upErr.message}`); continue; }
    console.log(`  ✓ id ${r.id} updated`);
  }
  console.log('\nDONE.');
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
