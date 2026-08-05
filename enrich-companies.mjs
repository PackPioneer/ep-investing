/**
 * enrich-companies.mjs — targeted profile enrichment for a CURATED LIST of companies.
 *
 * Unlike the DAC version (which took a whole industry tag), this takes an explicit
 * list of company IDs — so you enrich exactly your chosen targets, skipping giants
 * and junk. Includes bad-scrape detection: if a site returns spam / redirect /
 * wrong-topic content, the company is flagged 'needs_url_fix' instead of being
 * enriched from garbage.
 *
 * Provide IDs via a file (one id per line) or inline:
 *   node --env-file=.env.local enrich-companies.mjs --ids 2696,1550,1551,...
 *   node --env-file=.env.local enrich-companies.mjs --file battery-targets.txt
 *   add --limit 3 to test on the first few.
 *
 * Writes per-field drafts to company_enrichment_drafts (pending) for review.
 * Re-runnable: upserts on (company_id, field_name).
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';

const SONNET_MODEL = 'claude-sonnet-4-6';
const FIELDS = ['description', 'core_technology', 'target_market', 'key_customers', 'business_model'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---- args -----------------------------------------------------------------
function getArg(name) { const i = process.argv.indexOf(name); return i !== -1 ? process.argv[i + 1] : null; }
const limit = getArg('--limit') ? parseInt(getArg('--limit'), 10) : null;
let ids = [];
if (getArg('--ids')) ids = getArg('--ids').split(',').map((s) => parseInt(s.trim(), 10)).filter(Boolean);
else if (getArg('--file')) ids = readFileSync(getArg('--file'), 'utf8').split('\n').map((s) => parseInt(s.trim(), 10)).filter(Boolean);
if (ids.length === 0) { console.error('Provide --ids 1,2,3 or --file path.txt'); process.exit(1); }

// ---- bad-scrape detection -------------------------------------------------
// If scraped text matches these, the URL is junk — flag, don't enrich.
const JUNK_SIGNALS = [
  /kupon kodi|1win|bet365|casino|gambling|deposit bonus/i,   // gambling spam
  /redirecting\.\.\.|page not found|404|domain (is )?for sale|buy this domain/i,
  /warehouse listing|shopping experience|popular destinations/i, // wrong-site scrapes
];
function looksLikeJunk(text) {
  if (!text || text.length < 200) return true;
  return JUNK_SIGNALS.some((re) => re.test(text));
}

// ---- scraping -------------------------------------------------------------
async function scrapeSite(browser, url) {
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (compatible; EPInvestingBot/1.0)');
  let homeText = '', extraText = '';
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    homeText = await page.evaluate(() => document.body.innerText).catch(() => '');
    try {
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a')).map((a) => a.href)
          .filter((h) => /about|technolog|product|solution|how-it-works/i.test(h)));
      if (links.length > 0) {
        await page.goto(links[0], { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise((r) => setTimeout(r, 1000));
        extraText = await page.evaluate(() => document.body.innerText).catch(() => '');
      }
    } catch { /* keep homeText */ }
    return (homeText + '\n\n' + extraText).slice(0, 12000);
  } catch (e) {
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
- If the text does not appear to be about this company at all (wrong site, parked domain, unrelated content), return null for ALL fields.
- Keep each value concise and factual.
- "key_customers": comma-separated named customers/partners, ONLY if explicitly named. Else null.
- "core_technology": one or two sentences on the actual technology/approach.
- "target_market": who they sell to / serve, as stated.
- "business_model": how they make money / their model, as stated.
- "description": 2-3 sentence factual overview.
- For each field give a confidence: "high"/"medium"/"low".

Return ONLY valid JSON:
{ "fields": { ${missing.map((f) => `"${f}": { "value": <string|null>, "confidence": "high|medium|low" }`).join(', ')} } }

WEBSITE TEXT:
${siteText}`;
  const res = await anthropic.messages.create({ model: SONNET_MODEL, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
  const text = res.content.find((b) => b.type === 'text')?.text || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// ---- main -----------------------------------------------------------------
async function main() {
  const { data: companies, error } = await supabase
    .from('companies').select('*').in('id', ids);
  if (error) { console.error(error.message); process.exit(1); }

  const batch = limit ? companies.slice(0, limit) : companies;
  console.log(`Enriching ${batch.length} companies.\n`);

  const browser = await puppeteer.launch();
  let drafted = 0, junk = [], failed = [], nothingNew = [];
  for (const c of batch) {
    const missing = FIELDS.filter((f) => c[f] == null || String(c[f]).length === 0);
    if (missing.length === 0) { console.log(`${c.name}: already full, skipped`); continue; }
    process.stdout.write(`${c.name} (${missing.length} missing) ... `);
    if (!c.url) { console.log('NO URL'); failed.push(c.name); continue; }
    try {
      const siteText = await scrapeSite(browser, c.url.startsWith('http') ? c.url : `https://${c.url}`);
      if (looksLikeJunk(siteText)) { console.log('JUNK SITE — needs URL fix'); junk.push({ id: c.id, name: c.name, url: c.url }); continue; }

      const result = await extractFields(c, siteText, missing);
      const rows = [];
      for (const f of missing) {
        const fld = result.fields?.[f];
        if (fld && fld.value != null && String(fld.value).trim().length > 0) {
          rows.push({ company_id: c.id, field_name: f, current_value: c[f] ?? null,
            drafted_value: String(fld.value).trim(), source_url: c.url,
            confidence: fld.confidence ?? null, status: 'pending' });
        }
      }
      if (rows.length) {
        await supabase.from('company_enrichment_drafts').upsert(rows, { onConflict: 'company_id,field_name' });
        drafted += rows.length;
        console.log(`drafted ${rows.length}`);
      } else { console.log('no new data found (site fine, fields stay empty)'); nothingNew.push(c.name); }
    } catch (e) { console.log(`FAILED: ${e.message}`); failed.push({ name: c.name, url: c.url, err: e.message }); }
    await new Promise((r) => setTimeout(r, 500));
  }
  await browser.close();

  console.log(`\nDONE. Drafted ${drafted} fields.`);
  if (junk.length) { console.log(`\n${junk.length} companies have JUNK sites (gambling/redirect/parked — need URL fix):`); junk.forEach((j) => console.log(`  ${j.id}  ${j.name}  →  ${j.url}`)); }
  if (nothingNew.length) { console.log(`\n${nothingNew.length} had working sites but no new data to add (fine, no action needed): ${nothingNew.join(', ')}`); }
  if (failed.length) { console.log(`\n${failed.length} failed (DNS/timeout):`); failed.forEach((f) => console.log(`  ${typeof f === 'string' ? f : f.name + ' (' + f.url + ')'}`)); }
  console.log('\nReview drafts in the enrichment queue.');
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
