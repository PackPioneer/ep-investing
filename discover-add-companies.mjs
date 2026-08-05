/**
 * discover-add-companies.mjs
 *
 * For every company that raised but isn't in your directory: web-search its
 * official site + press email, ADD it to `companies` (linking its funding
 * events so the tracker resolves), and draft an outreach email. One pass does
 * the directory-add + the weekend outreach list.
 *
 *   node --env-file=.env.local discover-add-companies.mjs           # dry: list scope, no API
 *   node --env-file=.env.local discover-add-companies.mjs --write   # do it (web search + inserts)
 *   node --env-file=.env.local discover-add-companies.mjs 250 --write
 *
 * Writes outreach-drafts.md + outreach-list.csv. Skips companies already in the
 * directory. Untracked — do not `git add`.
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
const WRITE = process.argv.includes('--write');
const N = Number(process.argv.find((a) => /^\d+$/.test(a))) || 400;

const CANON = ['solar','wind_energy','battery_storage','grid_storage','green_hydrogen','nuclear_technologies','geothermal_energy','ev_charging','electric_aviation','saf_efuels','carbon_credits','direct_air_capture','industrial_decarbonization','clean_cooking','energy_generation','energy_efficiency'];
// Names that are clearly NOT an operating company we'd add to the directory.
const NON_COMPANY = /\b(fund|facility|foundation|programme|program|initiative|investments?|capital|partners|holdings|ventures?|sovereign|authority|bank|ministry|department|government|coalition|alliance)\b| \/ |\b(plant|works|project|jv|joint venture)\b/i;
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const domainOf = (u) => { try { return new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; } };
const csv = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
const mapStage = (st, type) => { const m = { series_d: 'growth', series_e: 'growth', ipo: 'public' }; if (st) return m[st] || st; if (type === 'project_finance' || type === 'debt') return 'growth'; return null; };

const SENDER = `Otto Gunderson, founder of The Energy Pioneer (an independent climate & energy news outlet) and EP Network. Otto covers the energy transition and wants to feature the company and/or schedule a short intro call.`;
const PROMPT = (c) => `Use web search to research this climate/energy company that recently raised funding.

Return ONLY JSON:
{
 "is_operating_company": true only if this is a real operating COMPANY (a startup or business) that belongs in a climate-tech company directory; false if it is actually an investor/fund, a government body or facility, a joint venture, or a specific project/plant rather than a company,
 "website": official homepage URL or null,
 "press_email": press/media email if published (press@, media@, pr@) or null,
 "contact_email": general contact email or null,
 "description": a 1-2 sentence factual description of what they do,
 "industry_tag": ONE of [${CANON.join(', ')}] that best fits, or null,
 "hq_country": country of HQ or null,
 "subject": outreach email subject line,
 "email_body": ~90 word warm, personalized outreach email from ${SENDER} referencing their raise and what they do. First person, plain, no buzzwords, no "hope this finds you well",
 "confidence": "high"|"medium"|"low"
}

COMPANY: ${c.company_name}
KNOWN CONTEXT: ${c.evidence || ''}
RAISE: ${c.amount_usd ? '$' + (c.amount_usd/1e6).toFixed(0) + 'M' : 'n/a'} ${c.stage || ''} (${c.type}); ${c.geography || ''}`;

function parseJson(t){ let s=t.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''); const i=s.indexOf('{'),j=s.lastIndexOf('}'); if(i!==-1&&j!==-1) s=s.slice(i,j+1); return JSON.parse(s); }

async function research(c){
  const r = await anthropic.messages.create({ model: MODEL, max_tokens: 1400,
    tools: [{ type:'web_search_20250305', name:'web_search', max_uses: 4 }],
    messages: [{ role:'user', content: PROMPT(c) }] });
  return parseJson(r.content.filter((b)=>b.type==='text').map((b)=>b.text).join('\n'));
}

async function main(){
  const { data: rows, error } = await supabase
    .from('funding_events')
    .select('company_name, evidence, amount_usd, stage, type, geography, sector, announced_date, counterparty')
    .eq('category','capital').is('company_id',null).eq('is_hidden',false).not('amount_usd','is',null)
    .neq('type','fund_raise')
    .order('amount_usd',{ascending:false});
  if (error){ console.error(error.message); process.exit(1); }
  const byCo = new Map();
  for (const r of rows){ const k=norm(r.company_name); if(k && !NON_COMPANY.test(r.company_name) && !byCo.has(k)) byCo.set(k,r); }
  const companies = [...byCo.values()].slice(0, N);

  if (!WRITE){
    console.log(`${companies.length} companies to discover + add (dry run — no API calls, no writes).\nTop 25:`);
    companies.slice(0,25).forEach((c)=>console.log(`  $${((c.amount_usd||0)/1e6).toFixed(0).padStart(5)}M  ${(c.sector||'?').padEnd(20)} ${c.company_name}`));
    console.log('\nAdd --write to research, add to directory, and draft outreach.');
    return;
  }

  const md = ['# Outreach drafts\n'];
  const csvLines = ['company,raise_usd,stage,website,press_email,contact_email,confidence,subject,added_to_directory'];
  let added=0, foundEmail=0, skipped=0;

  for (let i=0;i<companies.length;i++){
    const c = companies[i];
    process.stdout.write(`\r  ${i+1}/${companies.length}  added:${added} email:${foundEmail}   ${c.company_name.slice(0,32).padEnd(32)}`);
    let d; try { d = await research(c); } catch(e){ md.push(`## ${c.company_name}\n_(research failed: ${e.message})_\n`); continue; }
    if (d.is_operating_company === false) { skipped++; continue; }   // fund / project / gov body — not a company
    if (d.press_email || d.contact_email) foundEmail++;

    let addedThis = false;
    const domain = d.website ? domainOf(d.website) : null;
    if (domain){
      const { data: exists } = await supabase.from('companies').select('id').ilike('url', `%${domain}%`).limit(1);
      if (exists?.length){
        skipped++;
        await supabase.from('funding_events').update({ company_id: exists[0].id }).is('company_id',null).ilike('company_name', c.company_name);
      } else {
        const tag = CANON.includes(d.industry_tag) ? d.industry_tag : (CANON.includes(c.sector) ? c.sector : null);
        const payload = {
          name: c.company_name, url: `https://${domain}`,
          description: (d.description || c.evidence || '').slice(0,500),
          logo_url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          industry_tags: tag ? [tag] : [], sector: 'cleantech_company',
          funding_stage: mapStage(c.stage, c.type), headquarters_country: d.hq_country || null,
          enrichment_provenance: 'funding_discovery', is_hidden: false,
        };
        const { data: ins, error: insErr } = await supabase.from('companies').insert(payload).select('id').single();
        if (!insErr && ins){
          await supabase.from('companies').update({ slug: `${slugify(c.company_name)}-${ins.id}` }).eq('id', ins.id);
          await supabase.from('funding_events').update({ company_id: ins.id }).is('company_id',null).ilike('company_name', c.company_name);
          added++; addedThis = true;
        }
      }
    }

    const amt = c.amount_usd ? '$'+(c.amount_usd/1e6).toFixed(0)+'M' : '—';
    md.push(`## ${c.company_name}  ·  ${amt} ${c.stage||c.type}${addedThis?'  ✅ added':''}
- **Website:** ${d.website || '—'}
- **Email:** ${d.press_email || d.contact_email || '— (check website)'} ${d.confidence?`(${d.confidence})`:''}
- **What they do:** ${d.description || c.evidence || '—'}

**Subject:** ${d.subject || ''}

${d.email_body || ''}

---
`);
    csvLines.push([csv(c.company_name),csv(c.amount_usd),csv(c.stage),csv(d.website),csv(d.press_email),csv(d.contact_email),csv(d.confidence),csv(d.subject),csv(addedThis?'yes':'existing/no')].join(','));
  }
  console.log('');
  writeFileSync('outreach-drafts.md', md.join('\n'));
  writeFileSync('outreach-list.csv', csvLines.join('\n'));
  console.log(`\nDONE. ${companies.length} processed · ${added} added to directory · ${skipped} already existed · ${foundEmail} with an email.`);
  console.log('Wrote outreach-drafts.md and outreach-list.csv.');
}
main().catch((e)=>{ console.error('Unexpected:', e); process.exit(1); });
