/**
 * outreach-pipeline.mjs
 *
 * Takes the top freshly-raised companies NOT in your directory, uses Claude
 * with web search to find each one's website + press/contact email, and drafts
 * a personalized journalist-outreach email from you. Writes outreach-drafts.md
 * (readable, copy-paste) and outreach-list.csv (for tracking).
 *
 *   node --env-file=.env.local outreach-pipeline.mjs           # top 40
 *   node --env-file=.env.local outreach-pipeline.mjs 60        # top 60
 *
 * Requires web search access on your Anthropic account. Untracked — don't git add.
 */
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { writeFileSync } from 'node:fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';
const N = Number(process.argv.find((a) => /^\d+$/.test(a))) || 40;
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const csv = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;

// --- Edit this to change the voice / who's reaching out ---
const SENDER = `Otto Gunderson, founder of The Energy Pioneer (an independent climate & energy news outlet) and EP Network (a climate-tech company + investor directory). Otto covers the energy transition and wants to feature the company and/or schedule a short intro call.`;

const PROMPT = (c) => `You are helping a climate/energy journalist prepare outreach. Use web search to find the company's OFFICIAL website and, if published anywhere, a press/media email (press@, media@, pr@) or a general contact email.

Then write a short, warm, genuinely personalized outreach email from:
${SENDER}

The hook: the company recently raised funding. Reference what they do and the raise naturally (not salesy). First person, ~90 words, plain and human — no "I hope this finds you well", no buzzwords. Include a subject line.

COMPANY: ${c.company_name}
WHAT THEY DO: ${c.evidence || 'n/a'}
RECENT RAISE: ${c.amount_usd ? '$' + (c.amount_usd/1e6).toFixed(0) + 'M' : 'n/a'} ${c.stage || ''} (${c.type}); ${c.geography || ''}; ${c.announced_date?.slice(0,10) || ''}; lead ${c.counterparty || 'n/a'}

Return ONLY JSON, no prose:
{"website": string|null, "press_email": string|null, "contact_email": string|null, "confidence": "high"|"medium"|"low", "subject": string, "email_body": string}`;

function parseJson(text){ let t=text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''); const i=t.indexOf('{'), j=t.lastIndexOf('}'); if(i!==-1&&j!==-1) t=t.slice(i,j+1); return JSON.parse(t); }

async function enrich(c){
  const r = await anthropic.messages.create({
    model: MODEL, max_tokens: 1200,
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }],
    messages: [{ role:'user', content: PROMPT(c) }],
  });
  const text = r.content.filter((b)=>b.type==='text').map((b)=>b.text).join('\n');
  return parseJson(text);
}

async function main(){
  const { data: rows, error } = await supabase
    .from('funding_events')
    .select('company_name, evidence, amount_usd, stage, type, geography, announced_date, counterparty')
    .eq('category','capital').is('company_id',null).eq('is_hidden',false)
    .not('amount_usd','is',null).order('amount_usd',{ascending:false});
  if (error){ console.error(error.message); process.exit(1); }

  const byCo = new Map();
  for (const r of rows){ const k=norm(r.company_name); if(k && !byCo.has(k)) byCo.set(k,r); }
  const companies = [...byCo.values()].slice(0, N);

  const md = ['# Outreach drafts\n', `Generated ${new Date().toISOString().slice(0,10)} — ${companies.length} companies (top raises not yet in EP).\n`];
  const csvLines = ['company,raise_usd,stage,website,press_email,contact_email,confidence,subject'];
  let found = 0;

  for (let i=0;i<companies.length;i++){
    const c = companies[i];
    process.stdout.write(`\r  ${i+1}/${companies.length}  ${c.company_name.slice(0,40).padEnd(40)}`);
    let d;
    try { d = await enrich(c); } catch(e){ md.push(`## ${c.company_name}\n_(enrich failed: ${e.message})_\n`); continue; }
    if (d.press_email || d.contact_email) found++;
    const amt = c.amount_usd ? '$'+(c.amount_usd/1e6).toFixed(0)+'M' : '—';
    md.push(
`## ${c.company_name}  ·  ${amt} ${c.stage||c.type}
- **Website:** ${d.website || '—'}
- **Email:** ${d.press_email || d.contact_email || '— (none found — check website)'}  ${d.confidence?`(${d.confidence})`:''}
- **What they do:** ${c.evidence || '—'}

**Subject:** ${d.subject || ''}

${d.email_body || ''}

---
`);
    csvLines.push([csv(c.company_name),csv(c.amount_usd),csv(c.stage),csv(d.website),csv(d.press_email),csv(d.contact_email),csv(d.confidence),csv(d.subject)].join(','));
  }
  console.log('');
  writeFileSync('outreach-drafts.md', md.join('\n'));
  writeFileSync('outreach-list.csv', csvLines.join('\n'));
  console.log(`\nDONE. ${companies.length} companies, ${found} with an email found.`);
  console.log('Wrote outreach-drafts.md (read this) and outreach-list.csv (tracking).');
}
main().catch((e)=>{ console.error('Unexpected:', e); process.exit(1); });
