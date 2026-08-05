/**
 * tag-funding-sectors.mjs
 *
 * Gives every funding_event a `sector` so investors can filter the wire by
 * industry. Cheap Haiku pass over each event's text — no re-extraction.
 * Run the ALTER TABLE (add sector column) first.
 *
 *   node --env-file=.env.local tag-funding-sectors.mjs           # dry: sample
 *   node --env-file=.env.local tag-funding-sectors.mjs --write   # tag all untagged
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const WRITE = process.argv.includes('--write');

const SECTORS = [
  'solar','wind_energy','battery_storage','grid_storage','green_hydrogen','nuclear_technologies',
  'geothermal_energy','ev_charging','electric_aviation','saf_efuels','carbon_credits',
  'direct_air_capture','industrial_decarbonization','clean_cooking','energy_generation','energy_efficiency',
  'agriculture_food','materials_recycling','other',
];

const PROMPT = (e) => `Classify this climate/energy funding event into ONE sector from this list (return the slug only, nothing else):
${SECTORS.join(', ')}

Rules: pick the closest fit. Use "agriculture_food" for ag/food/protein/crops, "materials_recycling" for recycling/critical-materials/chemicals, "energy_generation" for utility-scale power generation not covered by a specific tech, "other" only if truly none fit.

COMPANY: ${e.company_name || 'n/a'}
CONTEXT: ${e.evidence || ''}
TYPE: ${e.type}`;

async function classify(e) {
  const r = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 20,
    messages: [{ role: 'user', content: PROMPT(e) }],
  });
  const t = (r.content.find((b) => b.type === 'text')?.text || '').trim().toLowerCase().replace(/[^a-z_]/g, '');
  return SECTORS.includes(t) ? t : 'other';
}

async function main() {
  let q = supabase.from('funding_events').select('id, company_name, evidence, type, sector').is('sector', null);
  if (!WRITE) q = q.limit(15);
  const { data: rows, error } = await q;
  if (error) { console.error(error.message); process.exit(1); }
  if (!rows.length) { console.log('All events already have a sector.'); return; }

  console.log(`${WRITE ? 'Tagging' : 'Sampling'} ${rows.length} untagged events...\n`);
  let done = 0;
  for (const e of rows) {
    const sector = await classify(e);
    if (WRITE) { await supabase.from('funding_events').update({ sector }).eq('id', e.id); done++; process.stdout.write(`\r  ${done}/${rows.length}`); }
    else console.log(`  ${sector.padEnd(22)} ${e.company_name || '(no company)'}`);
  }
  console.log(WRITE ? `\nDONE. Tagged ${done} events.` : '\nDRY RUN — add --write to tag all.');
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
