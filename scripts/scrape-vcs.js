/**
 * EP Investing — VC Scraper v3
 *
 * Improvements over v2:
 *  - Puppeteer fallback for JS-rendered sites
 *  - Better logo sourcing: Clearbit > Google favicon > og:image
 *  - Manual name overrides for known firms
 *  - Dry-run mode: NODE_ENV=dry node scripts/scrape-vcs.js
 *
 * Usage (run from project root):
 *   node scripts/scrape-vcs.js                    # full run
 *   NODE_ENV=dry node scripts/scrape-vcs.js        # dry run (no DB writes)
 *   ONLY_BAD_NAMES=1 node scripts/scrape-vcs.js   # only fix bad-name records
 *
 * Install deps first:
 *   npm install puppeteer node-html-parser he
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';
import he from 'he';
import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

// ─── Load env from project root (no dotenv needed) ──────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envLocal = resolve(root, '.env.local');
const envFile  = resolve(root, '.env');
const envPath  = existsSync(envLocal) ? envLocal : existsSync(envFile) ? envFile : null;

if (!envPath) {
  console.error('❌ No .env.local or .env file found in project root.');
  process.exit(1);
}

// Parse the env file manually — no dotenv dependency required
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (key && !(key in process.env)) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error(`   Looked in: ${envLocal}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DRY_RUN       = process.env.NODE_ENV === 'dry';
const ONLY_BAD_NAMES = process.env.ONLY_BAD_NAMES === '1';
const CONCURRENCY   = 5;
const PUPPETEER_TIMEOUT = 15000;

// ─── Manual name overrides ──────────────────────────────────────────────────
// Key = lowercase domain (no www), Value = correct display name

const NAME_OVERRIDES = {
  'sequoiacap.com':          'Sequoia Capital',
  'a16z.com':                'Andreessen Horowitz',
  'lightspeedvp.com':        'Lightspeed Venture Partners',
  'lsvp.com':                'Lightspeed Venture Partners',
  'accel.com':               'Accel',
  'nea.com':                 'New Enterprise Associates',
  'greylock.com':            'Greylock',
  'indexventures.com':       'Index Ventures',
  'generalatlantic.com':     'General Atlantic',
  'generalcatalyst.com':     'General Catalyst',
  'kpcb.com':                'Kleiner Perkins',
  'kleinerperkins.com':      'Kleiner Perkins',
  'firstround.com':          'First Round Capital',
  'foundationcapital.com':   'Foundation Capital',
  'usv.com':                 'Union Square Ventures',
  'bvp.com':                 'Bessemer Venture Partners',
  'battery.com':             'Battery Ventures',
  'ycombinator.com':         'Y Combinator',
  '500.co':                  '500 Startups',
  'techstars.com':           'Techstars',
  // Add more as needed
};

// ─── Logo overrides ─────────────────────────────────────────────────────────
// Force a specific logo for firms whose og:image is a hero image

const LOGO_OVERRIDES = {};

// ─── Helpers ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function domainFromUrl(url) {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`)
      .hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

const BAD_NAME_PATTERNS = [
  /^https?:\/\//i,
  /^www\./i,
  /home|upcoming events|menu|skip to/i,
  /\.(com|io|co|vc)$/i,
  /^[\W\d]+$/,
];

function isBadName(name) {
  if (!name || name.trim().length < 2) return true;
  if (name.trim().length > 60) return true;
  return BAD_NAME_PATTERNS.some(p => p.test(name.trim()));
}

// ─── Logo resolution ─────────────────────────────────────────────────────────

async function resolveLogo(domain, ogImage) {
  if (LOGO_OVERRIDES[domain]) return LOGO_OVERRIDES[domain];

  // 1. Clearbit (best quality logos)
  const clearbit = `https://logo.clearbit.com/${domain}`;
  try {
    const res = await fetch(clearbit, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    if (res.ok) return clearbit;
  } catch { /* ignore */ }

  // 2. og:image only if it looks like an actual logo
  if (ogImage) {
    const lower = ogImage.toLowerCase();
    if (lower.includes('logo') || lower.includes('icon') || lower.includes('brand')) {
      return ogImage;
    }
  }

  // 3. Google favicon as reliable fallback
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// ─── HTML parsing ────────────────────────────────────────────────────────────

function parseHtml(html, url) {
  const root = parse(html);
  const getMeta = (prop) => {
    const el = root.querySelector(`meta[property="${prop}"]`) ||
               root.querySelector(`meta[name="${prop}"]`);
    return el?.getAttribute('content')?.trim() || null;
  };

  const rawTitle =
    getMeta('og:site_name') ||
    getMeta('og:title') ||
    root.querySelector('title')?.text?.trim() ||
    null;

  const name = rawTitle
    ? he.decode(rawTitle.split(/[|\-–—]/)[0].trim())
    : null;

  const description = getMeta('og:description') || getMeta('description') || null;

  let ogImage = getMeta('og:image') || null;
  if (ogImage) {
    try { ogImage = new URL(ogImage, url).href; } catch { /* keep as-is */ }
  }

  return { name, description, ogImage };
}

// ─── Fetch scraper ───────────────────────────────────────────────────────────

async function scrapeWithFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EPInvestingBot/1.0)' },
    signal: AbortSignal.timeout(8000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseHtml(await res.text(), url);
}

// ─── Puppeteer scraper ───────────────────────────────────────────────────────

let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browser;
}

async function scrapeWithPuppeteer(url) {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (compatible; EPInvestingBot/1.0)');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PUPPETEER_TIMEOUT });
    await new Promise(r => setTimeout(r, 2000)); // let JS render
    return parseHtml(await page.content(), url);
  } finally {
    await page.close();
  }
}

// ─── Core scrape logic ───────────────────────────────────────────────────────

async function scrapeVC(record) {
  const url = record.url;
  if (!url) return null;

  const domain = domainFromUrl(url);
  if (!domain) return null;

  const fullUrl = url.startsWith('http') ? url : `https://${url}`;
  let name = NAME_OVERRIDES[domain] || null;
  let description = null;
  let ogImage = null;
  let usedPuppeteer = false;

  if (!name || isBadName(record.name)) {
    try {
      const result = await scrapeWithFetch(fullUrl);
      name = name || result.name;
      description = result.description;
      ogImage = result.ogImage;

      if (isBadName(name)) {
        console.log(`  ⚡ Fetch got bad name, trying Puppeteer: ${domain}`);
        const pr = await scrapeWithPuppeteer(fullUrl);
        if (!isBadName(pr.name)) {
          name = pr.name;
          description = pr.description || description;
          ogImage = pr.ogImage || ogImage;
          usedPuppeteer = true;
        }
      }
    } catch (err) {
      try {
        console.log(`  ⚡ Fetch failed (${err.message}), trying Puppeteer: ${domain}`);
        const pr = await scrapeWithPuppeteer(fullUrl);
        if (!isBadName(pr.name)) {
          name = pr.name;
          description = pr.description;
          ogImage = pr.ogImage;
          usedPuppeteer = true;
        }
      } catch (puppErr) {
        console.log(`  ✗ Both methods failed for ${domain}: ${puppErr.message}`);
      }
    }
  }

  // Domain-based name fallback
  if (isBadName(name)) {
    name = domain
      .replace(/\.(com|io|co|vc|capital|fund|ventures?)$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  return {
    id: record.id,
    name: name.trim(),
    description: description?.slice(0, 500) || null,
    logo: await resolveLogo(domain, ogImage),
    _usedPuppeteer: usedPuppeteer,
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 EP Investing VC Scraper v3${DRY_RUN ? ' [DRY RUN]' : ''}${ONLY_BAD_NAMES ? ' [BAD NAMES ONLY]' : ''}\n`);

  let query = supabase.from('vc_firms').select('id, name, url, logo_url').order('id');
  const { data: firms, error } = await query;
  if (error) throw error;

  const toProcess = firms.filter(f => {
    if (!f.url) return false;
    if (ONLY_BAD_NAMES && !isBadName(f.name)) return false;
    return true;
  });

  console.log(`📋 ${toProcess.length} records to process out of ${firms.length} total\n`);

  let updated = 0, failed = 0;

  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const batch = toProcess.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(r => scrapeVC(r)));

    for (let j = 0; j < results.length; j++) {
      const record = batch[j];
      const r = results[j];

      if (r.status === 'rejected' || !r.value) {
        console.log(`  ✗ [${record.id}] ${record.url} — ${r.reason?.message || 'no result'}`);
        failed++;
        continue;
      }

      const res = r.value;
      console.log(`  ✓ [${res.id}] ${res.name}${res._usedPuppeteer ? ' (puppeteer)' : ''}`);

      if (!DRY_RUN) {
        const { error: err } = await supabase
          .from('vc_firms')
          .update({ name: res.name, description: res.description, logo_url: res.logo })
          .eq('id', res.id);
        if (err) { console.log(`    ⚠ DB: ${err.message}`); failed++; }
        else updated++;
      } else {
        updated++;
      }
    }

    const done = Math.min(i + CONCURRENCY, toProcess.length);
    console.log(`\n[${done}/${toProcess.length}]\n`);
    if (i + CONCURRENCY < toProcess.length) await sleep(500);
  }

  if (browser) await browser.close();

  console.log('─────────────────────────────────');
  console.log(`✅ Updated: ${updated}  ✗ Failed: ${failed}`);
  if (DRY_RUN) console.log('(Dry run — no DB changes were made)');
}

main().catch(err => {
  console.error('Fatal:', err);
  if (browser) browser.close();
  process.exit(1);
});
