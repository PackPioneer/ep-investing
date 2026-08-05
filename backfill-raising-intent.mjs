/**
 * backfill-raising-intent.mjs
 * One-off: finds already-enriched articles from the last 180 days that describe
 * a company that is CURRENTLY seeking capital (open round, not closed) and flips
 * their classification to 'raising_intent' so the Deal-flow "Currently raising"
 * panel isn't empty on day one. Existing company entities are left intact, so
 * the dealflow route can match them to the directory.
 *
 * Cheap by design: a regex prefilter narrows the set, then one Haiku call per
 * candidate confirms open-vs-closed. Run AFTER refresh-classification-constraint.sql.
 *
 *   node --env-file=.env.local backfill-raising-intent.mjs
 *   node --env-file=.env.local backfill-raising-intent.mjs --dry   (no writes)
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const DRY = process.argv.includes('--dry');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const HAIKU = 'claude-haiku-4-5-20251001';

// Broad prospective-raise prefilter. Kept loose on purpose — every match is
// gated by the Haiku open-vs-closed confirm below, so false positives here are
// cheap (a few extra Haiku calls) while misses are not.
const INTENT_RE = /\braising\b|\bto raise\b|\bfundrais|\bseeking\b|in talks|in discussions|looking to raise|wants? to raise|hopes? to raise|plans? to raise|planning to raise|aims? to raise|hoping to raise|expected to raise|exploring a (?:raise|round|sale|deal)|in the market for|out raising|opened a (?:round|raise)|targeting (?:a )?\$|capital raise|raise up to|raise as much as/i;

const daysAgoIso = (n) => new Date(Date.now() - n * 864e5).toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function confirm(article) {
  const text = (article.clean_content || article.excerpt || '').slice(0, 4000);
  const prompt = `Decide if this article is about a specific operating company that is CURRENTLY seeking to raise INVESTMENT CAPITAL (equity, venture, growth, or debt financing FROM INVESTORS) and has NOT yet closed the round.

Answer OPEN only if ALL of these hold:
- The subject is one named operating company (a startup/business), not an investor, fund, utility, or government.
- It is actively looking for investment capital right now — the round is open / in progress / announced-but-not-closed.

Answer NO for anything else, including:
- A round that already CLOSED (money raised, secured, landed — past tense).
- Utility rate cases or "rate hikes", regulatory filings, subsidies, payouts, grants, or prizes.
- Government tenders, auctions, or procurement (e.g. "opens tenders for X GW").
- Project proposals, capacity/interconnection queues, or facility announcements.
- Mergers, acquisitions, takeovers, IPOs, insolvency/bankruptcy, or raffles/lotteries.
- General market commentary not about one company raising investment.

Title: ${article.title}
Content: ${text}

Reply with exactly one word: OPEN or NO.`;
  const r = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 5,
    messages: [{ role: 'user', content: prompt }],
  });
  const out = (r.content.find((b) => b.type === 'text')?.text || '').trim().toUpperCase();
  return out.startsWith('OPEN');
}

async function main() {
  // Paginate — Supabase caps a single select at 1000 rows.
  const PAGE = 1000;
  let all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('news_articles')
      .select('id, title, excerpt, clean_content, classification, published_at')
      .eq('enrichment_status', 'done')
      .neq('classification', 'raising_intent')
      .gte('published_at', daysAgoIso(180))
      .order('published_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) { console.error(error.message); process.exit(1); }
    all = all.concat(data || []);
    if (!data || data.length < PAGE) break;
  }

  const candidates = all.filter((a) => INTENT_RE.test(`${a.title} ${a.excerpt || ''} ${a.clean_content || ''}`));
  console.log(`${all.length} recent articles, ${candidates.length} match raise-intent language.${DRY ? '  [DRY RUN]' : ''}`);

  let flipped = 0, checked = 0;
  for (const a of candidates) {
    checked++;
    let open = false;
    try { open = await confirm(a); } catch (e) { console.warn(`  confirm failed ${a.id}: ${e.message}`); }
    if (open) {
      flipped++;
      console.log(`  → raising_intent: "${a.title.slice(0, 80)}"`);
      if (!DRY) {
        await supabase.from('news_articles').update({ classification: 'raising_intent' }).eq('id', a.id);
      }
    }
    if (checked % 20 === 0) process.stdout.write(`  ...${checked}/${candidates.length}\n`);
    await sleep(300);
  }
  console.log(`\nDONE. ${flipped} article(s) ${DRY ? 'would be' : ''} flipped to raising_intent.`);
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
