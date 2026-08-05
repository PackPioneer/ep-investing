/**
 * enrich-dac.mjs — targeted profile enrichment for Direct Air Capture companies.
 *
 * For each DAC company missing one or more profile fields:
 *   1. Scrape its website (homepage + an about/tech page if linked) via puppeteer.
 *   2. Ask Sonnet to extract ONLY the missing fields, strictly from site text,
 *      with a per-field confidence and explicit "return null if not stated".
 *   3. Write per-field drafts to company_enrichment_drafts (status='pending')
 *      for your review — nothing touches the live companies row here.
 * Also flags likely duplicate company rows for your review (no auto-delete).
 *
 * Run from repo root:
 *   node --env-file=.env.local enrich-dac.mjs            # all sparse DAC companies
 *   node --env-file=.env.local enrich-dac.mjs --limit 5  # test on a few first
 *
 * Cost: ~$1-2 for the full DAC batch (Sonnet). Re-runnable: upserts drafts.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';

const SONNET_MODEL = 'claude-sonnet-4-6';
const INDUSTRY = 'direct_air_capture';
const FIELDS = ['description', 'core_technology', 'target_market', 'key_customers', 'business_model'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const argLimit = (() => {
  const i = process.argv.indexOf('--limit');
  return i !== -1 ? parseInt(process.argv[i + 1], 10) : null;
})();

// ---- scraping -------------------------------------------------------------

async function scrapeSite(browser, url) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (compatible; EPInvestingBot/1.0)');
  let homeText = '';
  let extraText = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // small settle for client-side rendered content
    await new Promise((r) => setTimeout(r, 1500));
    homeText = await page.evaluate(() => document.body.innerText).catch(() => '');

    // Try to also pull an about / technology page for richer extraction.
    // Any failure here must NOT lose the homepage text we already have.
    try {
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a'))
          .map((a) => a.href)
          .filter((h) => /about|technolog|product|solution|how-it-works/i.test(h))
      );
      if (links.length > 0) {
        await page.goto(links[0], { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise((r) => setTimeout(r, 1000));
        extraText = await page.evaluate(() => document.body.innerText).catch(() => '');
      }
    } catch { /* secondary page failed — keep homeText only */ }

    return (homeText + '\n\n' + extraText).slice(0, 12000);
  } catch (e) {
    // If the initial load got us some text before failing, use it; else rethrow.
    if (homeText && homeText.length > 200) return homeText.slice(0, 12000);
    throw e;
  } finally {
    await page.close();
  }
}

// ---- extraction -----------------------------------------------------------

async function extractFields(company, siteText, missing) {
  const prompt = `You are extracting factual profile fields for a climate-tech company directory. Below is text scraped from the website of "${company.name}".

Extract values for ONLY these missing fields: ${missing.join(', ')}.

STRICT RULES:
- Use ONLY information explicitly stated on the website. Do NOT infer, guess, or invent.
- If the website does not clearly support a field, return null for that field.
- Keep each value concise and factual, matching how a company directory would phrase it.
- "key_customers": a comma-separated list of named customers/partners, ONLY if explicitly named on the site. Otherwise null.
- "core_technology": one or two sentences on the actual technology/approach.
- "target_market": who they sell to / serve, as stated.
- "business_model": how they make money / their model, as stated.
- "description": 2-3 sentence factual overview of what the company does.
- For each field also give a confidence: "high" (directly stated), "medium" (clearly implied), "low" (weakly supported).

Return ONLY valid JSON, no prose, in this exact shape:
{
  "fields": {
    ${missing.map((f) => `"${f}": { "value": <string or null>, "confidence": "high|medium|low" }`).join(',\n    ')}
  }
}

WEBSITE TEXT:
${siteText}`;

  const res = await anthropic.messages.create({
    model: SONNET_MODEL,
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content.find((b) => b.type === 'text')?.text || '';
  const jsonStr = text.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr);
}

// ---- duplicate flagging ---------------------------------------------------

function normUrl(u) {
  if (!u) return '';
  return u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').trim();
}
function fullnessScore(c) {
  return FIELDS.filter((f) => c[f] != null && String(c[f]).length > 0).length;
}
function isClaimed(c) {
  return !!(c.clerk_organization_id || c.claimed_by_clerk_user_id || c.clerk_user_id);
}

async function flagDuplicates(companies) {
  const byUrl = new Map();
  const byName = new Map();
  const pairs = [];
  for (const c of companies) {
    const u = normUrl(c.url);
    const n = (c.name || '').toLowerCase().replace(/\b(inc|ltd|technologies|technology|home)\b/g, '').replace(/\s+/g, ' ').trim();
    if (u && byUrl.has(u)) pairs.push([byUrl.get(u), c, 'same normalized url']);
    else if (u) byUrl.set(u, c);
    if (n && byName.has(n)) pairs.push([byName.get(n), c, 'similar name']);
    else if (n) byName.set(n, c);
  }
  for (const [a, b, reason] of pairs) {
    const sparser = fullnessScore(a) <= fullnessScore(b) ? a : b;
    await supabase.from('company_duplicate_flags').upsert({
      company_id_a: a.id, company_id_b: b.id, reason,
      sparser_id: sparser.id,
      a_is_claimed: isClaimed(a), b_is_claimed: isClaimed(b),
      status: 'pending',
    }, { onConflict: 'company_id_a,company_id_b', ignoreDuplicates: true });
  }
  return pairs.length;
}

// ---- main -----------------------------------------------------------------

async function main() {
  console.log('Loading DAC companies...');
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .contains('industry_tags', [INDUSTRY]);
  if (error) { console.error(error.message); process.exit(1); }

  const sparse = companies.filter((c) => c.url && FIELDS.some((f) => c[f] == null || String(c[f]).length === 0));
  const batch = argLimit ? sparse.slice(0, argLimit) : sparse;
  console.log(`${companies.length} DAC companies, ${sparse.length} sparse, processing ${batch.length}.\n`);

  console.log('Flagging duplicates...');
  const dupCount = await flagDuplicates(companies);
  console.log(`Flagged ${dupCount} duplicate pair(s).\n`);

  const browser = await puppeteer.launch();
  let drafted = 0, failed = 0;
  for (const c of batch) {
    const missing = FIELDS.filter((f) => c[f] == null || String(c[f]).length === 0);
    process.stdout.write(`${c.name} (${missing.length} missing) ... `);
    try {
      const siteText = await scrapeSite(browser, c.url.startsWith('http') ? c.url : `https://${c.url}`);
      if (!siteText || siteText.length < 200) { console.log('site too thin, skipped'); failed++; continue; }

      const result = await extractFields(c, siteText, missing);
      const rows = [];
      for (const f of missing) {
        const fld = result.fields?.[f];
        if (fld && fld.value != null && String(fld.value).trim().length > 0) {
          rows.push({
            company_id: c.id, field_name: f,
            current_value: c[f] ?? null,
            drafted_value: String(fld.value).trim(),
            source_url: c.url, confidence: fld.confidence ?? null,
            status: 'pending',
          });
        }
      }
      if (rows.length > 0) {
        await supabase.from('company_enrichment_drafts')
          .upsert(rows, { onConflict: 'company_id,field_name' });
        drafted += rows.length;
        console.log(`drafted ${rows.length} field(s)`);
      } else {
        console.log('nothing extractable');
      }
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
      failed++;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  await browser.close();

  console.log(`\nDONE. Drafted ${drafted} field(s) across ${batch.length} companies. ${failed} failed/skipped.`);
  console.log('Review them in the admin enrichment queue (Part 2).');
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
