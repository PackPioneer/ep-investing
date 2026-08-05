/**
 * validate-funding-extraction.mjs — READ-ONLY, writes nothing.
 *
 * Runs the new multi-event funding/commercial extractor over your most recent
 * funding-tagged articles and prints what it pulls out, so we can judge quality
 * before building the funding_events table or the markets page.
 *
 *   node --env-file=.env.local validate-funding-extraction.mjs         # 25 articles
 *   node --env-file=.env.local validate-funding-extraction.mjs 40      # more
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';
const N = Number(process.argv[2]) || 25;

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function contentOf(a) {
  const s = a.clean_content || a.raw_content || a.excerpt || '';
  return (a.clean_content ? s : stripHtml(s)).slice(0, 12000);
}

const PROMPT = (title, text) => `You extract structured FUNDING and COMMERCIAL events from a climate/energy news article.
Return ONLY JSON: { "events": [ ... ] }. No prose.

Identify EVERY distinct event. A roundup/newsletter often lists many rounds — extract EACH as its own event.
If the article gives an INDUSTRY AGGREGATE/total (e.g. "climate funding rose 55% to $26bn", "H1 totals"), do NOT make a company event — output one event with category="context", type="market_stat", amount_usd=the total, company_name=null.
If the article is not about any funding or commercial (offtake/PPA) event, return { "events": [] }.

Each event:
{
  "category": "capital" | "commercial" | "context",
  "type": (capital) "venture_equity"|"corporate_strategic"|"project_finance"|"debt"|"grant"|"fund_raise"|"m_and_a"|"ipo_spac"
        | (commercial) "offtake"|"ppa" | (context) "market_stat",
  "company_name": the company/project raising, or the SELLER in a commercial deal (string|null),
  "counterparty": lead investor(s) for capital, or the BUYER for offtake/ppa (string|null),
  "investors": array of investor names for capital events (else []),
  "amount_usd": integer USD for THIS event only (approx-convert other currencies), null if not stated,
  "currency_original": e.g. "EUR" if the source amount was non-USD, else null,
  "stage": "pre_seed"|"seed"|"series_a"|"series_b"|"series_c"|"series_d"|"growth"|"ipo"|null,
  "instrument": "equity"|"debt"|"grant"|"convertible"|"project_finance"|null,
  "commercial_volume": number for offtake/ppa (else null),
  "commercial_unit": "MW"|"GWh"|"MWh"|"tons"|"units"|null,
  "duration_years": number if stated (else null),
  "geography": country or region (string|null),
  "confidence": "high"|"medium"|"low",
  "evidence": short verbatim quote supporting this event (<=120 chars)
}

Rules:
- venture_equity vs corporate_strategic: if the lead/only investor is a STRATEGIC OPERATING company (utility, oil major, automaker, industrial) rather than a financial VC/PE fund, use corporate_strategic.
- grant = government/foundation non-dilutive award. project_finance = capital to build a specific asset/plant/farm/factory (utility-scale, often debt+equity).
- NEVER log an industry total or multi-company sum as a company round — that is context/market_stat.
- amount_usd is the size of THIS event, not a company's cumulative total.
- ONE event per distinct raise per company. If a single raise is split into tranches (e.g. $X equity + $Y debt inside one $Z round), emit ONE event with amount_usd = the headline TOTAL and instrument reflecting the mix — do NOT emit a separate event per tranche. Emit multiple events only for genuinely DISTINCT companies/projects (e.g. a funding roundup listing many companies).
- Be conservative: confidence "low" if the amount or company is ambiguous.
- STRICT JSON ONLY. Do not put double-quote characters inside any string value — paraphrase the "evidence" field and never include embedded quotes. Keep each "evidence" under 120 chars.

TITLE: ${title}
ARTICLE:
${text}`;

function parse(raw) {
  const c = raw.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
  return JSON.parse(c);
}

async function main() {
  const { data: rows, error } = await supabase
    .from('news_articles')
    .select('id, title, published_at, classification, deal_size_usd, clean_content, raw_content, excerpt')
    .eq('classification', 'funding')
    .order('published_at', { ascending: false })
    .limit(N);
  if (error) { console.error(error.message); process.exit(1); }

  const tally = {};
  let aggregatesCaught = 0, articlesWithEvents = 0, totalEvents = 0;

  for (const a of rows) {
    const text = contentOf(a);
    let events = [];
    try {
      const r = await anthropic.messages.create({
        model: MODEL, max_tokens: 8000,
        messages: [{ role: 'user', content: PROMPT(a.title || '', text) }],
      });
      const out = parse(r.content.find((b) => b.type === 'text')?.text || '{}');
      events = Array.isArray(out.events) ? out.events : [];
    } catch (e) { console.log(`  (extract failed: ${e.message})`); }

    console.log('='.repeat(70));
    console.log(`${a.published_at?.slice(0,10)}  ${a.title?.slice(0,80) || ''}`);
    console.log(`  OLD: deal_size_usd=${a.deal_size_usd ?? 'null'}   NEW: ${events.length} event(s)`);
    for (const e of events) {
      tally[e.type] = (tally[e.type] || 0) + 1;
      totalEvents++;
      if (e.type === 'market_stat') aggregatesCaught++;
      const amt = e.amount_usd != null ? '$' + Number(e.amount_usd).toLocaleString() : (e.commercial_volume ? `${e.commercial_volume} ${e.commercial_unit || ''}` : '—');
      console.log(`   • [${e.category}/${e.type}] ${e.company_name || '(no company)'}  ${amt}  ${e.stage || ''} ${e.confidence ? '('+e.confidence+')' : ''}`);
      if (e.counterparty) console.log(`       ↳ ${e.category === 'commercial' ? 'buyer' : 'lead'}: ${e.counterparty}`);
      if (e.evidence) console.log(`       "${e.evidence}"`);
    }
    if (events.length) articlesWithEvents++;
    console.log('');
  }

  console.log('='.repeat(70));
  console.log(`SUMMARY: ${rows.length} articles → ${totalEvents} events (${articlesWithEvents} articles produced ≥1)`);
  console.log(`Aggregates correctly flagged as market_stat: ${aggregatesCaught}`);
  console.log('Events by type:');
  Object.entries(tally).sort((a,b) => b[1]-a[1]).forEach(([t,c]) => console.log(`  ${t.padEnd(20)} ${c}`));
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
