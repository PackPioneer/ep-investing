/**
 * backfill-funding-events.mjs
 *
 * Runs the locked extractor over historical funding articles, reconciles the
 * output (collapses single-deal tranches, dedups the same round across
 * articles), resolves companies against the directory, and populates
 * funding_events. Run funding_events.sql FIRST.
 *
 *   node --env-file=.env.local backfill-funding-events.mjs           # dry run
 *   node --env-file=.env.local backfill-funding-events.mjs --write   # apply
 *   node --env-file=.env.local backfill-funding-events.mjs 40        # limit N articles (dry)
 *
 * --write deletes existing source='news' rows and re-inserts (idempotent;
 * self_reported / sec_form_d events are preserved). Untracked — do not git add.
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
const EXTRACTOR_VERSION = 'v1-2026-07';
const WRITE = process.argv.includes('--write');
const LIMIT = Number(process.argv.find((a) => /^\d+$/.test(a))) || 500;

const VALID_TYPES = new Set(['venture_equity','corporate_strategic','project_finance','debt','grant','fund_raise','m_and_a','ipo_spac','offtake','ppa','market_stat']);

function stripHtml(h){ return (h||'').replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim(); }
function contentOf(a){ const s=a.clean_content||a.raw_content||a.excerpt||''; return (a.clean_content?s:stripHtml(s)).slice(0,12000); }
function norm(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\b(inc|ltd|llc|corp|corporation|co|company|group|technologies|technology|energy|the)\b/g,'').replace(/\s+/g,' ').trim(); }
function amountBucket(n){ if(n==null) return 'na'; const s=String(Math.round(n)); return s.length<=2?s:s.slice(0,2)+'e'+(s.length-2); }
function monthOf(d){ return d ? String(d).slice(0,7) : 'na'; }

const PROMPT = (title, text) => `You extract structured FUNDING and COMMERCIAL events from a climate/energy news article.
Return ONLY JSON: { "events": [ ... ] }. No prose, nothing after the JSON.

Identify EVERY distinct event. A roundup/newsletter often lists many rounds — extract EACH as its own event.
If the article gives an INDUSTRY AGGREGATE/total (e.g. "climate funding rose 55% to $26bn"), do NOT make a company event — output one event with category="context", type="market_stat", amount_usd=the total, company_name=null.
If the article is not about any funding or commercial (offtake/PPA) event, return { "events": [] }.

Each event:
{
  "category": "capital" | "commercial" | "context",
  "type": (capital) "venture_equity"|"corporate_strategic"|"project_finance"|"debt"|"grant"|"fund_raise"|"m_and_a"|"ipo_spac"
        | (commercial) "offtake"|"ppa" | (context) "market_stat",
  "company_name": company/project raising, or the SELLER in a commercial deal (string|null),
  "counterparty": lead investor(s) for capital, or BUYER for offtake/ppa (string|null),
  "investors": array of investor names for capital events (else []),
  "amount_usd": integer USD for THIS event only (approx-convert other currencies), null if not stated,
  "currency_original": e.g. "EUR" if source amount was non-USD, else null,
  "stage": "pre_seed"|"seed"|"series_a"|"series_b"|"series_c"|"series_d"|"growth"|"ipo"|null,
  "instrument": "equity"|"debt"|"grant"|"convertible"|"project_finance"|"mixed"|null,
  "commercial_volume": number for offtake/ppa (else null),
  "commercial_unit": "MW"|"GWh"|"MWh"|"tons"|"units"|null,
  "duration_years": number if stated (else null),
  "geography": country or region (string|null),
  "confidence": "high"|"medium"|"low",
  "evidence": short paraphrase supporting this event, NO double-quote characters, <=120 chars
}

Rules:
- venture_equity vs corporate_strategic: if the lead/only investor is a STRATEGIC OPERATING company (utility, oil major, automaker, industrial) not a financial VC/PE fund, use corporate_strategic.
- grant = government/foundation non-dilutive. project_finance = capital to build a specific asset/plant/farm/factory.
- NEVER log an industry total or multi-company sum as a company round — that is context/market_stat.
- ONE event per distinct raise per company. If a single raise is split into tranches (e.g. $X equity + $Y debt inside one package), emit ONE event with amount_usd = the headline TOTAL and instrument="mixed" — do NOT emit a separate event per tranche. Multiple events only for DISTINCT companies (a roundup).
- Be conservative: confidence "low" if the amount or company is ambiguous.
- STRICT JSON. No double-quotes inside string values.

TITLE: ${title}
ARTICLE:
${text}`;

function parseEvents(raw) {
  let t = (raw||'').trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').trim();
  // repair: cut anything after the last closing brace
  const last = t.lastIndexOf('}'); if (last !== -1) t = t.slice(0, last+1);
  const out = JSON.parse(t);
  return Array.isArray(out.events) ? out.events : [];
}

async function extract(a) {
  const r = await anthropic.messages.create({ model: MODEL, max_tokens: 8000, messages: [{ role:'user', content: PROMPT(a.title||'', contentOf(a)) }] });
  return parseEvents(r.content.find((b)=>b.type==='text')?.text || '{}');
}

// Collapse single-deal tranches within one article (United Solar case).
function collapseTranches(events) {
  const capital = events.filter((e)=>e.category==='capital' && e.company_name && e.amount_usd);
  const other = events.filter((e)=>!(e.category==='capital' && e.company_name && e.amount_usd));
  const byCo = {};
  for (const e of capital) (byCo[norm(e.company_name)] ||= []).push(e);
  const kept = [];
  for (const group of Object.values(byCo)) {
    if (group.length === 1) { kept.push(group[0]); continue; }
    const max = group.reduce((m,e)=> e.amount_usd>m.amount_usd?e:m, group[0]);
    const others = group.filter((e)=>e!==max);
    const sumOthers = others.reduce((s,e)=>s+e.amount_usd,0);
    if (sumOthers > 0.4*max.amount_usd) {           // components of one package -> keep headline
      max.instrument = 'mixed';
      max.investors = [...new Set([...(max.investors||[]), ...others.flatMap((e)=>e.investors||[])])];
      kept.push(max);
    } else kept.push(...group);                       // separate awards -> keep all
  }
  return [...kept, ...other];
}

async function main() {
  const { data: arts, error } = await supabase
    .from('news_articles')
    .select('id, title, published_at, classification, clean_content, raw_content, excerpt')
    .eq('classification','funding').order('published_at',{ascending:false}).limit(LIMIT);
  if (error) { console.error(error.message); process.exit(1); }

  // company resolution map
  const { data: comps } = await supabase.from('companies').select('id, name');
  const compMap = new Map((comps||[]).map((c)=>[norm(c.name), c.id]));

  let all = [];
  let failed = 0;
  for (let i=0;i<arts.length;i++) {
    const a = arts[i];
    process.stdout.write(`\r  extracting ${i+1}/${arts.length}  (events: ${all.length})   `);
    let events;
    try { events = await extract(a); }
    catch { failed++; continue; }
    events = collapseTranches(events).filter((e)=>VALID_TYPES.has(e.type));
    for (const e of events) {
      const announced = a.published_at ? a.published_at.slice(0,10) : null;
      all.push({
        source:'news', source_article_id:a.id, verified:false, extractor_version:EXTRACTOR_VERSION,
        category:e.category, type:e.type,
        company_id: e.company_name ? (compMap.get(norm(e.company_name)) ?? null) : null,
        company_name: e.company_name || null,
        counterparty: e.counterparty || null,
        investors: Array.isArray(e.investors)?e.investors:[],
        amount_usd: Number.isFinite(e.amount_usd)?Math.round(e.amount_usd):null,
        currency_original: e.currency_original||null, stage:e.stage||null, instrument:e.instrument||null,
        commercial_volume: Number.isFinite(e.commercial_volume)?e.commercial_volume:null,
        commercial_unit: e.commercial_unit||null, duration_years: Number.isFinite(e.duration_years)?e.duration_years:null,
        geography: e.geography||null, announced_date: announced,
        confidence: e.confidence||null, evidence: e.evidence||null,
        dedup_key: e.company_name ? `${norm(e.company_name)}|${amountBucket(e.amount_usd)}|${monthOf(announced)}` : `ctx|${e.type}|${amountBucket(e.amount_usd)}|${monthOf(announced)}`,
        is_hidden: e.confidence==='low',
      });
    }
  }
  console.log('');

  // cross-article dedup: keep the richest per dedup_key
  const byKey = new Map();
  for (const e of all) {
    const prev = byKey.get(e.dedup_key);
    if (!prev) { byKey.set(e.dedup_key, e); continue; }
    const score = (x)=> (x.amount_usd?2:0) + (x.investors?.length||0) + (x.evidence?.length||0)/200;
    if (score(e) > score(prev)) byKey.set(e.dedup_key, e);
  }
  const deduped = [...byKey.values()];

  const byType = {};
  for (const e of deduped) byType[e.type]=(byType[e.type]||0)+1;
  console.log(`\nArticles: ${arts.length}  (extract fails: ${failed})`);
  console.log(`Raw events: ${all.length}  →  after dedup: ${deduped.length}  (${all.length-deduped.length} duplicates collapsed)`);
  console.log(`Hidden (low-confidence): ${deduped.filter((e)=>e.is_hidden).length}`);
  console.log(`Company-resolved: ${deduped.filter((e)=>e.company_id).length} / ${deduped.length}`);
  console.log('By type:'); Object.entries(byType).sort((a,b)=>b[1]-a[1]).forEach(([t,c])=>console.log(`  ${t.padEnd(20)} ${c}`));

  if (!WRITE) { console.log('\nDRY RUN — nothing written. Add --write to apply.'); return; }

  await supabase.from('funding_events').delete().eq('source','news');
  for (let i=0;i<deduped.length;i+=200) {
    const chunk = deduped.slice(i,i+200);
    const { error: e } = await supabase.from('funding_events').insert(chunk);
    if (e) { console.error(`insert error: ${e.message}`); process.exit(1); }
  }
  console.log(`\nDONE. Inserted ${deduped.length} funding_events (source=news).`);
}
main().catch((e)=>{ console.error('Unexpected:', e); process.exit(1); });
