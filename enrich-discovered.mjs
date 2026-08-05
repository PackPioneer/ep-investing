/**
 * enrich-discovered.mjs
 *
 * Fleshes out the stub companies added by funding discovery: scrapes each site
 * (fetch-based, no browser), extracts missing profile fields with Sonnet, and
 * writes them straight to the company (these are stubs, so no review queue).
 * Also upgrades favicon logos to a real og:image where available.
 *
 *   node --env-file=.env.local enrich-discovered.mjs           # dry: sample 10
 *   node --env-file=.env.local enrich-discovered.mjs --write   # enrich all stubs
 *   node --env-file=.env.local enrich-discovered.mjs 50 --write
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
const LIMIT = Number(process.argv.find((a) => /^\d+$/.test(a))) || (WRITE ? 500 : 10);
const FIELDS = ['description', 'core_technology', 'target_market', 'business_model', 'key_customers', 'tagline'];

function abs(c, base){ try { return new URL(c, base).href; } catch { return null; } }
function extractLogo(html, base){
  let m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (m) return abs(m[1], base);
  m = html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
  if (m) return abs(m[1], base);
  return null;
}
async function fetchPage(url){
  const res = await fetch(url.startsWith('http') ? url : `https://${url}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
    redirect: 'follow', signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error('fetch ' + res.status);
  const html = await res.text();
  const text = html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
  return { text: text.slice(0, 10000), logo: extractLogo(html, res.url || url) };
}
const PROMPT = (c, text) => `Extract factual profile fields for a climate-tech company directory from this website text for "${c.name}".
Use ONLY info on the site; if unsupported, return null. Return ONLY JSON:
{ "description": "2-3 sentence factual overview", "core_technology": "1-2 sentences on the tech, else null", "target_market": "who they serve, else null", "business_model": "b2b|b2c|b2g|hardware|software|project_developer|marketplace, else null", "key_customers": "comma-separated named customers only if explicitly named, else null", "tagline": "short positioning line if present, else null" }

WEBSITE TEXT:
${text}`;

async function main(){
  const { data: rows, error } = await supabase
    .from('companies').select('id, name, url, description, core_technology, target_market, business_model, key_customers, tagline, logo_url')
    .eq('enrichment_provenance', '"funding_discovery"').is('core_technology', null).limit(LIMIT);
  if (error){ console.error(error.message); process.exit(1); }
  console.log(`${WRITE ? 'Enriching' : 'Sampling'} ${rows.length} stub companies...\n`);

  let done = 0, failed = 0;
  for (const c of rows){
    if (!c.url){ continue; }
    process.stdout.write(`\r  ${done + failed + 1}/${rows.length}  ${c.name.slice(0,32).padEnd(32)}`);
    let page; try { page = await fetchPage(c.url); } catch { failed++; continue; }
    if (page.text.length < 200){ failed++; continue; }
    let d; try {
      const r = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 900, messages: [{ role:'user', content: PROMPT(c, page.text) }] });
      d = JSON.parse((r.content.find((b)=>b.type==='text')?.text || '{}').replace(/```json|```/g,'').trim());
    } catch { failed++; continue; }

    const patch = {};
    for (const f of FIELDS){ if ((c[f] == null || String(c[f]).length < 10) && d[f]) patch[f] = String(d[f]).slice(0, 500); }
    if (page.logo && /s2\/favicons/.test(c.logo_url || '')) patch.logo_url = page.logo;  // upgrade favicon -> real logo
    if (WRITE && Object.keys(patch).length){ await supabase.from('companies').update(patch).eq('id', c.id); }
    if (!WRITE) console.log(`\n  ${c.name}: would set ${Object.keys(patch).join(', ') || '(nothing new)'}`);
    done++;
  }
  console.log(`\n\nDONE. ${done} processed, ${failed} failed (no site / blocked).`);
  console.log(WRITE ? 'Fields written directly to companies.' : 'DRY RUN — add --write to apply.');
}
main().catch((e)=>{ console.error('Unexpected:', e); process.exit(1); });
