/**
 * needs-enrichment.mjs — read-only.
 * Scans all non-hidden companies and ranks the ones most in need of enrichment
 * (missing key fields, weak logo, or a bad/scraped name). Prints the top N with
 * their id + slug so you can paste them straight into the Enrich One admin tool.
 *
 *   node --env-file=.env.local needs-enrichment.mjs           # top 20
 *   node --env-file=.env.local needs-enrichment.mjs 30        # top 30
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const N = Number(process.argv[2]) || 20;

const MODEL_CODES = ['b2b', 'b2c', 'b2g', 'hardware', 'software', 'project_developer', 'marketplace'];
const DOMAIN_NAME = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

// Signals that a name is a scraped page-title, not a company name.
function nameIssue(name) {
  if (!name) return 'no name';
  const n = name.trim();
  if (DOMAIN_NAME.test(n)) return 'name is a domain';
  if (n.length > 45) return 'name too long (scraped title?)';
  if (/\b(home|welcome|the best|building the|new version|page not found|untitled)\b/i.test(n)) return 'name looks like a page title';
  return null;
}

async function main() {
  const { data: rows, error } = await supabase
    .from('companies')
    .select('id, name, slug, url, description, core_technology, business_model, funding_stage, target_market, target_geographies, key_customers, founding_year, logo_url, is_hidden')
    .neq('is_hidden', true);
  if (error) { console.error(error.message); process.exit(1); }

  const scored = rows.map((c) => {
    const missing = [];
    if (isEmpty(c.description)) missing.push('description');
    if (isEmpty(c.core_technology)) missing.push('core_tech');
    if (isEmpty(c.business_model) || !MODEL_CODES.includes(c.business_model)) missing.push('business_model');
    if (isEmpty(c.funding_stage)) missing.push('funding_stage');
    if (isEmpty(c.target_market)) missing.push('target_market');
    if (isEmpty(c.target_geographies)) missing.push('geographies');
    if (isEmpty(c.key_customers)) missing.push('customers');
    if (isEmpty(c.founding_year)) missing.push('founding_year');
    if (isEmpty(c.logo_url) || /s2\/favicons/.test(c.logo_url || '')) missing.push('logo(weak)');
    const nameFlag = nameIssue(c.name);
    // Name problems weigh heavily; each missing field = 1; no url = can't scrape (deprioritize).
    let score = missing.length + (nameFlag ? 4 : 0);
    if (isEmpty(c.url)) score -= 2;
    return { ...c, missing, nameFlag, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, N);

  console.log(`Top ${top.length} companies needing enrichment (of ${rows.length} live):\n`);
  top.forEach((c, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${c.name}  —  id ${c.id}  (${c.slug || 'no-slug'})`);
    if (c.nameFlag) console.log(`      ⚠ NAME: ${c.nameFlag}`);
    console.log(`      url: ${c.url || '(none — add one to scrape)'}`);
    console.log(`      missing: ${c.missing.join(', ') || '—'}`);
    console.log('');
  });
  console.log('Paste each id (or slug) into Enrich One, then Scrape & draft.');

  // Also write the FULL ranked list to CSV so you have a shareable worklist.
  const csvEsc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['rank', 'name', 'id', 'slug', 'url', 'score', 'missing_count', 'name_flag', 'missing_fields'];
  const lines = [header.join(',')];
  scored.forEach((c, i) => {
    lines.push([
      i + 1, csvEsc(c.name), c.id, csvEsc(c.slug || ''), csvEsc(c.url || ''),
      c.score, c.missing.length, csvEsc(c.nameFlag || ''), csvEsc(c.missing.join('; ')),
    ].join(','));
  });
  writeFileSync('enrichment-needs.csv', lines.join('\n'));
  console.log(`\nWrote enrichment-needs.csv — ${scored.length} companies ranked by need.`);
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
