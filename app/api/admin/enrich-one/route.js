/**
 * app/api/admin/enrich-one/route.js
 *
 * Unified on-demand single-ENTITY enrichment (company | ngo | investor).
 *   POST { action:'load',   entityType, idOrSlug }
 *   POST { action:'scrape', entityType, idOrSlug, urlOverride }
 *   POST { action:'save',   entityType, id, fields:{...} }
 *
 * fetch-based scrape (serverless-native, no puppeteer). Review before save.
 */

import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SONNET_MODEL = 'claude-sonnet-4-6';

// Per-entity config: table, lookup key style, website column, enrichable text fields.
const CONFIG = {
  company: {
    table: 'companies',
    keyByNumericId: true,            // id OR slug
    urlCol: 'url',
    fields: ['description', 'core_technology', 'target_market', 'key_customers', 'business_model', 'tagline'],
    noun: 'climate-tech company',
  },
  ngo: {
    table: 'ngos',
    keyByNumericId: false,           // slug only (numeric falls back to id)
    urlCol: 'website_url',
    fields: ['short_description', 'bio', 'partnership_description', 'staff_size'],
    noun: 'climate NGO / nonprofit',
  },
  investor: {
    table: 'vc_firms',
    keyByNumericId: true,            // id (no slug column)
    urlCol: 'url',
    fields: ['description', 'investment_thesis', 'climate_sectors', 'geographies_focus', 'investment_stages_text'],
    noun: 'climate investor / VC firm',
  },
};

function supa() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

async function loadEntity(supabase, cfg, idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  // company & investor: numeric -> id; ngo: slug unless numeric (then id)
  let col;
  if (cfg.table === 'ngos') col = isNumeric ? 'id' : 'slug';
  else col = isNumeric ? 'id' : 'slug';
  const selectCols = ['id', 'name', 'logo_url', cfg.urlCol, ...cfg.fields];
  if (cfg.table !== 'vc_firms') selectCols.push('slug');
  const { data } = await supabase.from(cfg.table).select([...new Set(selectCols)].join(', ')).eq(col, idOrSlug).single();
  return data;
}

// Resolve a possibly-relative URL against the page's base.
function absolutize(candidate, baseUrl) {
  if (!candidate) return null;
  try { return new URL(candidate, baseUrl).href; } catch { return null; }
}

// Extract the best logo candidate from raw HTML, in priority order.
function extractLogo(html, baseUrl) {
  if (!html) return null;
  // 1. og:image (best brand image)
  let m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
       || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (m && m[1]) return absolutize(m[1], baseUrl);
  // 2. apple-touch-icon (real app icon, higher-res than favicon)
  m = html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
   || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["']/i);
  if (m && m[1]) return absolutize(m[1], baseUrl);
  // 3. a header <img> whose src/alt/class mentions "logo"
  const imgs = [...html.matchAll(/<img[^>]+>/gi)].map((x) => x[0]);
  for (const tag of imgs) {
    if (/logo/i.test(tag)) {
      const src = tag.match(/src=["']([^"']+)["']/i);
      if (src && src[1]) return absolutize(src[1], baseUrl);
    }
  }
  // 4. high-res icon link
  m = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
  if (m && m[1]) return absolutize(m[1], baseUrl);
  return null;
}

async function fetchPage(url) {
  const target = url.startsWith('http') ? url : `https://${url}`;
  const res = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return { text: text.slice(0, 12000), logo: extractLogo(html, res.url || target) };
}

const JUNK = [/kupon kodi|1win|casino|deposit bonus/i, /domain (is )?for sale|buy this domain|page not found|redirecting\.\.\./i];

const FIELD_GUIDE = {
  description: '2-3 sentence factual overview.',
  core_technology: '1-2 sentences on the actual technology.',
  target_market: 'who they serve, as stated.',
  key_customers: 'comma-separated NAMED customers/partners only if explicitly named, else null.',
  business_model: 'how they make money, as stated.',
  tagline: 'a short positioning line if present, else null.',
  short_description: 'one concise sentence on what the organization does.',
  bio: '2-4 sentence overview of the organization, mission, and work.',
  partnership_description: 'what kinds of partnerships/collaboration they seek, if stated, else null.',
  staff_size: 'approximate staff size if stated (e.g. "50-100"), else null.',
  investment_thesis: 'their stated investment thesis / what they look for.',
  climate_sectors: 'climate sectors/areas they invest in, as stated.',
  geographies_focus: 'geographies they invest in, as stated.',
  investment_stages_text: 'stages they invest at (pre-seed, seed, Series A, etc.), as stated.',
};

export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }); }
  const { action, entityType } = body;
  const cfg = CONFIG[entityType];
  if (!cfg) return NextResponse.json({ error: 'Unknown entityType' }, { status: 400 });
  const supabase = supa();

  if (action === 'load') {
    const e = await loadEntity(supabase, cfg, body.idOrSlug);
    if (!e) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ entity: e, urlCol: cfg.urlCol, fields: cfg.fields });
  }

 // Shared extraction: runs Sonnet on whatever text we have (scraped or pasted).
  async function extractDrafts(e, text) {
    const fieldLines = cfg.fields.map((f) => `- ${f}: ${FIELD_GUIDE[f] || 'as stated on the site, else null.'}`).join('\n');
    const prompt = `Extract factual profile fields for a ${cfg.noun} directory from this website text for "${e.name}".
Fields to fill: ${cfg.fields.join(', ')}.
RULES: use ONLY info explicitly on the site; if unsupported, return null. Do not invent. If the text is clearly not about this entity, return null for all.
${fieldLines}
Return ONLY JSON: { "fields": { ${cfg.fields.map((f) => `"${f}": {"value": <string|null>, "confidence": "high|medium|low"}`).join(', ')} } }

WEBSITE TEXT:
${text}`;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const r = await anthropic.messages.create({ model: SONNET_MODEL, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    const t = r.content.find((b) => b.type === 'text')?.text || '';
    const parsed = JSON.parse(t.replace(/```json|```/g, '').trim());
    const drafts = {};
    for (const f of cfg.fields) {
      const fld = parsed.fields?.[f];
      if (fld && fld.value != null && String(fld.value).trim()) {
        drafts[f] = { current: e[f] ?? '', drafted: String(fld.value).trim(), confidence: fld.confidence || null };
      }
    }
    return drafts;
  }

  if (action === 'extract') {
    const e = await loadEntity(supabase, cfg, body.idOrSlug);
    if (!e) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const text = (body.pastedText || '').trim();
    if (!text || text.length < 100) return NextResponse.json({ error: 'Paste more text — too short to extract from.' }, { status: 400 });
    let drafts;
    try { drafts = await extractDrafts(e, text.slice(0, 12000)); }
    catch (err) { return NextResponse.json({ error: `Extraction failed: ${err.message}` }); }
    const currentLogo = e.logo_url || '';
    return NextResponse.json({ entity: e, drafts, source: 'pasted', logo: { found: null, current: currentLogo, needsUpdate: false } });
  }

  if (action === 'scrape') {
    const e = await loadEntity(supabase, cfg, body.idOrSlug);
    if (!e) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const url = (body.urlOverride && body.urlOverride.trim()) || e[cfg.urlCol];
    if (!url) return NextResponse.json({ error: 'No URL to scrape (add one in the URL field).' }, { status: 400 });

    let text, foundLogo = null;
    try { const page = await fetchPage(url); text = page.text; foundLogo = page.logo; }
    catch (err) { return NextResponse.json({ error: `Couldn't fetch site: ${err.message}` }); }
    if (!text || text.length < 150 || JUNK.some((re) => re.test(text))) {
      return NextResponse.json({ warning: 'Site returned little or junk text — may be a JS-only site or wrong URL.', drafts: {} });
    }

    let drafts;
    try { drafts = await extractDrafts(e, text); }
    catch (err) { return NextResponse.json({ error: `Extraction failed: ${err.message}` }); }
    const currentLogo = e.logo_url || '';
    const logoNeedsUpdate = !currentLogo || /s2\/favicons/.test(currentLogo);
    return NextResponse.json({
      entity: e,
      drafts,
      scrapedFrom: url,
      logo: { found: foundLogo, current: currentLogo, needsUpdate: logoNeedsUpdate },
    });
  }

  if (action === 'upload_logo') {
    const { id, dataUrl } = body;
    if (!id || typeof dataUrl !== 'string') return NextResponse.json({ error: 'id and image required' }, { status: 400 });
    const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!m) return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    const contentType = m[1];
    const buffer = Buffer.from(m[2], 'base64');
    if (buffer.length > 3_000_000) return NextResponse.json({ error: 'Image too large (max 3MB)' }, { status: 400 });
    const extMap = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/gif': 'gif' };
    const ext = extMap[contentType] || 'png';
    const BUCKET = 'company-logos';
    // Ensure the public bucket exists (no-op if it already does).
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});
    const path = `${entityType}/${id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: true });
    if (upErr) return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const logo_url = pub?.publicUrl;
    if (!logo_url) return NextResponse.json({ error: 'Could not get public URL' }, { status: 500 });
    const { error: dbErr } = await supabase.from(cfg.table).update({ logo_url }).eq('id', id);
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json({ ok: true, logo_url });
  }

  if (action === 'save') {
    const { id, fields, logo_url, url, name } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const update = {};
    if (fields && typeof fields === 'object') {
      for (const [k, v] of Object.entries(fields)) {
        if (cfg.fields.includes(k) && typeof v === 'string' && v.trim()) update[k] = v.trim();
      }
    }
    if (typeof logo_url === 'string' && logo_url.trim()) update.logo_url = logo_url.trim();
    // Manually correct the name (fixes scraped page-titles). Regenerate slug too.
    if (typeof name === 'string' && name.trim()) {
      update.name = name.trim();
      if (cfg.table !== 'vc_firms') {
        const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
        update.slug = base ? `${base}-${id}` : `company-${id}`;
      }
    }
    // Manually correct the website URL (stored in this entity type's url column).
    if (typeof url === 'string' && url.trim()) {
      let u = url.trim();
      if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
      try { u = new URL(u).href; } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }
      update[cfg.urlCol] = u;
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No valid fields to save' }, { status: 400 });
    const { error } = await supabase.from(cfg.table).update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, saved: Object.keys(update) });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
