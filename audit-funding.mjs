/**
 * audit-funding.mjs — read-only.
 * Measures the funding data already sitting in your news pipeline, so we know
 * how rich the market tracker's "funding rounds wire" will be before building it.
 *
 *   node --env-file=.env.local audit-funding.mjs
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const fmtUSD = (n) => n == null ? '—' : '$' + Number(n).toLocaleString();

async function main() {
  // All funding-classified articles.
  const { data: rows, error } = await supabase
    .from('news_articles')
    .select('id, title, deal_size_usd, published_at')
    .eq('classification', 'funding')
    .order('published_at', { ascending: false });
  if (error) { console.error(error.message); process.exit(1); }

  const withAmount = rows.filter((r) => r.deal_size_usd != null && r.deal_size_usd > 0);
  const amounts = withAmount.map((r) => r.deal_size_usd).sort((a, b) => a - b);
  const total = amounts.reduce((s, n) => s + n, 0);
  const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : null;
  const dates = rows.map((r) => r.published_at).filter(Boolean).sort();

  console.log('=== FUNDING DATA AUDIT ===\n');
  console.log(`Funding-classified articles:   ${rows.length}`);
  console.log(`  ...with a dollar amount:     ${withAmount.length}  (${rows.length ? Math.round(withAmount.length / rows.length * 100) : 0}%)`);
  console.log(`Date range:                    ${dates[0]?.slice(0,10) || '—'}  →  ${dates[dates.length-1]?.slice(0,10) || '—'}`);
  console.log(`Total capital (where known):   ${fmtUSD(total)}`);
  console.log(`Median round (where known):    ${fmtUSD(median)}\n`);

  // Monthly volume, last 12 months.
  const byMonth = {};
  for (const r of rows) {
    if (!r.published_at) continue;
    const m = r.published_at.slice(0, 7);
    byMonth[m] = byMonth[m] || { count: 0, sum: 0 };
    byMonth[m].count++;
    if (r.deal_size_usd) byMonth[m].sum += r.deal_size_usd;
  }
  console.log('Monthly volume (recent):');
  Object.keys(byMonth).sort().reverse().slice(0, 12).forEach((m) => {
    console.log(`  ${m}   ${String(byMonth[m].count).padStart(3)} rounds   ${fmtUSD(byMonth[m].sum)}`);
  });
  console.log('');

  // Sample of the 15 most recent, with the company each maps to (via news_entities).
  console.log('15 most recent funding rounds (as the wire would show them):');
  for (const r of rows.slice(0, 15)) {
    const { data: ents } = await supabase
      .from('news_entities')
      .select('entity_name')
      .eq('article_id', r.id)
      .eq('entity_type', 'company')
      .limit(1);
    const company = ents?.[0]?.entity_name || '(no company linked)';
    console.log(`  ${r.published_at?.slice(0,10) || '—'}  ${fmtUSD(r.deal_size_usd).padStart(14)}  ${company}`);
    console.log(`      ${r.title?.slice(0, 90) || ''}`);
  }
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
