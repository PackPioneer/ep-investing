/**
 * scrape-dormant-raises.mjs
 * Populates the "Likely raising soon" (dormant) panel by finding directory
 * companies whose most recent funding round was ~12-18 months ago and that
 * we don't already have a round for. For each, it web-searches the last raise
 * and inserts a company-linked funding_event so the deal-flow logic can bucket
 * it (12-18mo old -> dormant; newer -> recently raised; both are useful).
 *
 *   node --env-file=.env.local scrape-dormant-raises.mjs --dry        # preview, no writes
 *   node --env-file=.env.local scrape-dormant-raises.mjs 40           # process 40 companies
 *   node --env-file=.env.local scrape-dormant-raises.mjs 40 --dry
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const DRY = process.argv.includes('--dry');
const LIMIT = Number(process.argv.find((a) => /^\d+$/.test(a))) || 40;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const norm = (s) => (s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '');
const monthsBetween = (iso) => (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30.4);

async function all(table, cols, filter) {
  let out = [], from = 0;
  for (;;) {
    let q = supabase.from(table).select(cols).range(from, from + 999);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) { console.error(error.message); process.exit(1); }
    if (!data || !data.length) break;
    out = out.concat(data); if (data.length < 1000) break; from += 1000;
  }
  return out;
}

function extractJson(resp) {
  const txt = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const m = txt.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function lastRaise(company) {
  const prompt = `Research the most recent equity/venture funding round for the climate/energy company "${company.name}"${company.url ? ` (${company.url})` : ''}. Use web search.

Return ONE JSON object, no prose:
{
  "found": true/false,               // false if you cannot verify any round
  "month": "YYYY-MM" or null,        // month of the MOST RECENT round announced
  "amount_usd": integer or null,     // e.g. 25000000 for $25M
  "stage": "seed|series_a|series_b|series_c|series_d|growth|grant|debt|other" or null,
  "lead_investor": string or null,
  "confidence": "high|medium|low"    // low if unsure it's the same company or the date is a guess
}

Rules: only report a round you can actually find evidence for. If the company appears not to have raised, or you can't confirm, set found=false. Do not invent dates or amounts.`;

  const resp = await anthropic.messages.create({
    model: MODEL, max_tokens: 900,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
    messages: [{ role: 'user', content: prompt }],
  });
  return extractJson(resp);
}

async function main() {
  console.log(`Loading directory + existing rounds...`);
  const companies = await all('companies', 'id, name, url, industry_tags, funding_stage, is_hidden',
    (q) => q.neq('is_hidden', true));
  const events = await all('funding_events', 'company_id', (q) => q.eq('category', 'capital').not('company_id', 'is', null));
  const haveRound = new Set(events.map((e) => e.company_id));

  // Target: companies with NO capital round on file. Prioritize ones with a
  // funding_stage set (more likely to have actually raised).
  const targets = companies
    .filter((c) => !haveRound.has(c.id))
    .sort((a, b) => (b.funding_stage ? 1 : 0) - (a.funding_stage ? 1 : 0))
    .slice(0, LIMIT);

  console.log(`${companies.length} companies, ${haveRound.size} already have a round.`);
  console.log(`Checking ${targets.length} without round data${DRY ? '  [DRY RUN]' : ''}...\n`);

  let inserted = 0, dormant = 0, checked = 0;
  for (const c of targets) {
    checked++;
    let r = null;
    try { r = await lastRaise(c); } catch (e) { console.log(`  ! ${c.name}: ${e.message}`); }
    if (!r || !r.found || !r.month || r.confidence === 'low') {
      console.log(`  · ${c.name}: no confident round`);
      await sleep(1500); continue;
    }
    const announced = `${r.month}-01`;
    const age = monthsBetween(announced);
    // Skip stale rounds — anything older than 24mo helps neither the dormant
    // window (12-18mo) nor recently-raised, and just clutters the wire.
    if (age > 24) { console.log(`  · ${c.name}: last round ${r.month} is ${age.toFixed(0)}mo old — too stale, skipping`); await sleep(1200); continue; }
    const isDormant = age >= 12 && age <= 18;
    if (isDormant) dormant++;
    console.log(`  → ${c.name}: ${r.month} ${r.amount_usd ? '$' + (r.amount_usd / 1e6).toFixed(0) + 'M' : ''} ${r.stage || ''} (${age.toFixed(0)}mo${isDormant ? ', DORMANT' : ''})`);

    if (!DRY) {
      const row = {
        source: 'dormant_scrape',
        category: 'capital',
        type: r.stage === 'grant' ? 'grant' : r.stage === 'debt' ? 'debt' : 'venture_equity',
        company_id: c.id,
        company_name: c.name,
        counterparty: r.lead_investor || null,
        amount_usd: r.amount_usd || null,
        stage: r.stage || null,
        sector: (c.industry_tags || [])[0] || null,
        announced_date: announced,
        confidence: r.confidence || 'medium',
        dedup_key: `${norm(c.name)}|${r.amount_usd || 0}|${r.month}`,
      };
      const { error } = await supabase.from('funding_events').insert(row);
      if (error) console.log(`     insert failed: ${error.message}`);
      else inserted++;
    }
    await sleep(1500);
    if (checked % 10 === 0) console.log(`  ...${checked}/${targets.length}`);
  }

  console.log(`\nDONE. ${DRY ? 'Would insert' : 'Inserted'} ${DRY ? dormant + inserted : inserted} rounds; ${dormant} land in the 12-18mo dormant window.`);
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
