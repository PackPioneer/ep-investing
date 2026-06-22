/**
 * app/api/admin/enrich-one/route.js
 *
 * On-demand single-company enrichment for the admin dashboard.
 *   POST { action: 'load',   idOrSlug }            -> current company data
 *   POST { action: 'scrape', idOrSlug, urlOverride } -> fetch site, draft fields (no save)
 *   POST { action: 'save',   id, fields:{...} }    -> write approved values to the company
 *
 * Scraping uses plain fetch + HTML-strip (serverless-native; no puppeteer).
 * Works for most static/SSR sites; JS-only SPAs may yield little text.
 */

import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SONNET_MODEL = 'claude-sonnet-4-6';
const ENRICHABLE = ['description', 'core_technology', 'target_market', 'key_customers', 'business_model', 'tagline'];

function supa() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

async function loadCompany(supabase, idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const { data } = await supabase.from('companies')
    .select('id, name, slug, url, ' + ENRICHABLE.join(', '))
    .eq(isNumeric ? 'id' : 'slug', idOrSlug).single();
  return data;
}

// Fetch a URL and extract readable text from the HTML.
async function fetchText(url) {
  const target = url.startsWith('http') ? url : `https://${url}`;
  const res = await fetch(target, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EPInvestingBot/1.0)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const html = await res.text();
  // strip scripts/styles, then tags, decode a few entities, collapse whitespace
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.slice(0, 12000);
}

const JUNK = [/kupon kodi|1win|casino|deposit bonus/i, /domain (is )?for sale|buy this domain|page not found|redirecting\.\.\./i];

export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { action } = body;
  const supabase = supa();

  if (action === 'load') {
    const c = await loadCompany(supabase, body.idOrSlug);
    if (!c) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    return NextResponse.json({ company: c });
  }

  if (action === 'scrape') {
    const c = await loadCompany(supabase, body.idOrSlug);
    if (!c) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    const url = (body.urlOverride && body.urlOverride.trim()) || c.url;
    if (!url) return NextResponse.json({ error: 'No URL to scrape (add one in the URL field).' }, { status: 400 });

    let text;
    try { text = await fetchText(url); }
    catch (e) { return NextResponse.json({ error: `Couldn't fetch site: ${e.message}` }, { status: 200, }); }
    if (!text || text.length < 150 || JUNK.some((re) => re.test(text))) {
      return NextResponse.json({ warning: 'Site returned little or junk text — may be a JS-only site or wrong URL.', drafts: {} });
    }

    const prompt = `Extract factual profile fields for a climate-tech company directory from this website text for "${c.name}".
Fields to fill: ${ENRICHABLE.join(', ')}.
RULES: use ONLY info explicitly on the site; if unsupported, return null. Do not invent. If the text is clearly not about this company, return null for all.
- key_customers: comma-separated named customers/partners ONLY if explicitly named, else null.
- core_technology: 1-2 sentences on the actual technology.
- target_market: who they serve, as stated.
- business_model: how they make money, as stated.
- description: 2-3 sentence factual overview.
- tagline: a short positioning line if present, else null.
Return ONLY JSON: { "fields": { ${ENRICHABLE.map((f) => `"${f}": {"value": <string|null>, "confidence": "high|medium|low"}`).join(', ')} } }

WEBSITE TEXT:
${text}`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    let parsed;
    try {
      const r = await anthropic.messages.create({ model: SONNET_MODEL, max_tokens: 1300, messages: [{ role: 'user', content: prompt }] });
      const t = r.content.find((b) => b.type === 'text')?.text || '';
      parsed = JSON.parse(t.replace(/```json|```/g, '').trim());
    } catch (e) {
      return NextResponse.json({ error: `Extraction failed: ${e.message}` }, { status: 200 });
    }

    // shape: { field: { current, drafted, confidence } } only for fields that got a value
    const drafts = {};
    for (const f of ENRICHABLE) {
      const fld = parsed.fields?.[f];
      if (fld && fld.value != null && String(fld.value).trim()) {
        drafts[f] = { current: c[f] ?? '', drafted: String(fld.value).trim(), confidence: fld.confidence || null };
      }
    }
    return NextResponse.json({ company: c, drafts, scrapedFrom: url });
  }

  if (action === 'save') {
    const { id, fields } = body;
    if (!id || !fields || typeof fields !== 'object') return NextResponse.json({ error: 'id and fields required' }, { status: 400 });
    const update = {};
    for (const [k, v] of Object.entries(fields)) {
      if (ENRICHABLE.includes(k) && typeof v === 'string' && v.trim()) update[k] = v.trim();
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields to save' }, { status: 400 });
    const { error } = await supabase.from('companies').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, saved: Object.keys(update) });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
