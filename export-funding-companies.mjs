/**
 * export-funding-companies.mjs — read-only.
 * Pulls every company that RAISED (a real capital event) but is NOT yet in your
 * directory, and writes a CSV: name, what they do, amount, stage, geography,
 * date. This is both your "companies to add" list and your outreach
 * personalization database. The scrape step then finds each one's URL + email.
 *
 *   node --env-file=.env.local export-funding-companies.mjs
 *
 * Writes companies-to-add.csv in the repo folder. Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const csvCell = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

async function main() {
  const { data: rows, error } = await supabase
    .from('funding_events')
    .select('company_name, type, amount_usd, stage, geography, announced_date, evidence, counterparty')
    .eq('category', 'capital')
    .is('company_id', null)
    .eq('is_hidden', false)
    .not('company_name', 'is', null)
    .order('announced_date', { ascending: false });
  if (error) { console.error(error.message); process.exit(1); }

  // one row per company — keep the largest / most recent raise
  const byCo = new Map();
  for (const r of rows) {
    const k = norm(r.company_name);
    if (!k) continue;
    const prev = byCo.get(k);
    if (!prev || (r.amount_usd || 0) > (prev.amount_usd || 0)) byCo.set(k, r);
  }
  const companies = [...byCo.values()].sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0));

  const header = ['company', 'what_they_do', 'latest_raise_usd', 'type', 'stage', 'lead_investor', 'geography', 'date'];
  const lines = [header.join(',')];
  for (const c of companies) {
    lines.push([
      csvCell(c.company_name), csvCell(c.evidence), csvCell(c.amount_usd),
      csvCell(c.type), csvCell(c.stage), csvCell(c.counterparty),
      csvCell(c.geography), csvCell(c.announced_date?.slice(0, 10)),
    ].join(','));
  }
  writeFileSync('companies-to-add.csv', lines.join('\n'));

  console.log(`${companies.length} companies that raised but aren't in your directory.\n`);
  console.log('Top 20 by raise size:');
  companies.slice(0, 20).forEach((c) => {
    const amt = c.amount_usd ? '$' + (c.amount_usd / 1e6).toFixed(0) + 'M' : '—';
    console.log(`  ${amt.padStart(8)}  ${(c.stage || c.type).padEnd(14)} ${c.company_name}  [${c.geography || '—'}]`);
  });
  console.log(`\nWrote companies-to-add.csv (${companies.length} rows).`);
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
