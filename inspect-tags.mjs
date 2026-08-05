/**
 * inspect-tags.mjs — read-only.
 * Dumps industry_tags / is_hidden / sector for the existing geothermal +
 * industrial-decarb companies, to see why the filters return nothing.
 *
 *   node --env-file=.env.local inspect-tags.mjs
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const IDS = [992, 2731, 2732, 1501, 1513, 2734, 2733,      // geothermal
             974, 982, 990, 991, 978, 979, 975];            // industrial decarb

async function main() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, industry_tags, is_hidden, sector, funding_stage')
    .in('id', IDS).order('id');
  if (error) { console.error(error.message); process.exit(1); }
  for (const r of data) {
    const tags = Array.isArray(r.industry_tags) ? `[${r.industry_tags.join(', ')}]` : String(r.industry_tags);
    console.log(`id ${String(r.id).padEnd(6)} ${r.name.padEnd(24)} hidden=${String(r.is_hidden).padEnd(5)} sector=${r.sector}`);
    console.log(`         tags: ${tags}\n`);
  }
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
