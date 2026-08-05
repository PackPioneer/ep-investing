/**
 * merge-companies.mjs — merge two duplicate company rows.
 *
 * Keeps --keep, fills ONLY its empty fields from --loser (never overwrites a
 * value the keeper already has), then hides --loser (is_hidden = true).
 * Nothing is deleted — fully reversible.
 *
 *   node --env-file=.env.local merge-companies.mjs --keep 111 --loser 222
 *   node --env-file=.env.local merge-companies.mjs --keep 111 --loser 222 --write
 *
 * Pick --keep = the row with the correct NAME + LOGO; --loser = the other.
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
function arg(f) { const i = process.argv.indexOf(f); return i !== -1 ? process.argv[i + 1] : undefined; }
const WRITE = process.argv.includes('--write');
const KEEP = Number(arg('--keep'));
const LOSER = Number(arg('--loser'));
if (!KEEP || !LOSER) { console.error('Usage: --keep <id> --loser <id> [--write]'); process.exit(1); }

// Content / quick-fact fields safe to fill. Identity fields (name, slug, url,
// clerk/stripe ids, timestamps) are deliberately excluded.
const FILLABLE = [
  'description', 'core_technology', 'target_market', 'key_customers', 'business_model',
  'funding_stage', 'production_status', 'target_geographies', 'customer_segment',
  'tagline', 'founding_year', 'headquarters_city', 'headquarters_country', 'location',
  'sector', 'unique_technology', 'recent_milestones', 'total_funding_raised',
  'estimated_revenue_usd', 'employee_count', 'ai_summary', 'logo_url', 'industry_tags',
];
const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

async function main() {
  const { data: rows, error } = await supabase.from('companies').select('*').in('id', [KEEP, LOSER]);
  if (error) { console.error(error.message); process.exit(1); }
  const keep = rows.find((r) => r.id === KEEP);
  const loser = rows.find((r) => r.id === LOSER);
  if (!keep || !loser) { console.error('Could not find both rows.'); process.exit(1); }

  const patch = {};
  for (const f of FILLABLE) {
    if (isEmpty(keep[f]) && !isEmpty(loser[f])) patch[f] = loser[f];
  }

  console.log(`KEEP  id ${KEEP}  "${keep.name}"`);
  console.log(`LOSER id ${LOSER}  "${loser.name}"  (will be hidden)\n`);
  if (Object.keys(patch).length === 0) {
    console.log('Keeper already has all these fields — nothing to fill. Will just hide the loser.');
  } else {
    console.log('Filling these empty keeper fields from the loser:\n');
    for (const [f, v] of Object.entries(patch)) {
      const val = Array.isArray(v) ? `[${v.join(', ')}]` : String(v);
      console.log(`  ${f.padEnd(20)} <- ${val.length > 70 ? val.slice(0, 70) + '…' : val}`);
    }
  }
  console.log('');

  if (!WRITE) { console.log('DRY RUN — nothing written. Add --write to apply.'); return; }

  if (Object.keys(patch).length > 0) {
    const { error: e1 } = await supabase.from('companies').update(patch).eq('id', KEEP);
    if (e1) { console.error(`fill keeper: ${e1.message}`); process.exit(1); }
  }
  // Re-point the loser's deal + job references to the keeper so nothing orphans.
  const { count: fe } = await supabase.from('funding_events').update({ company_id: KEEP }, { count: 'exact' }).eq('company_id', LOSER);
  const { count: jl } = await supabase.from('job_listings').update({ company_id: KEEP }, { count: 'exact' }).eq('company_id', LOSER);
  const { error: e2 } = await supabase.from('companies').update({ is_hidden: true }).eq('id', LOSER);
  if (e2) { console.error(`hide loser: ${e2.message}`); process.exit(1); }
  console.log(`DONE. Filled ${Object.keys(patch).length} field(s) into ${KEEP}, re-pointed ${fe ?? 0} funding events + ${jl ?? 0} jobs, hid ${LOSER}.`);
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
