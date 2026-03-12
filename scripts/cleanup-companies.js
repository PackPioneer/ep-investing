/**
 * EP Investing — Company Data Cleanup
 *
 * Finds companies with bad names (URLs) or junk descriptions,
 * re-scrapes them with improved extraction logic, and updates Supabase.
 *
 * Usage:
 *   node scripts/cleanup-companies.js              # full run
 *   NODE_ENV=dry node scripts/cleanup-companies.js # dry run
 *   LIMIT=50 node scripts/cleanup-companies.js     # limit records
 */

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = existsSync(resolve(root, '.env.local'))
  ? resolve(root, '.env.local')
  : resolve(root, '.env');

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const DRY_RUN = process.env.NODE_ENV === 'dry';
const LIMIT = parseInt(process.env.LIMIT || '500');

// ─── Junk detection ──────────────────────────────────────────────────────────

function isUrlLikeName(name, url) {
  if (!name) return true;
  const domain = extractDomain(url);
  // Name looks like a URL
  if (name.includes('.com') || name.includes('.io') || name.includes('.net') || name.includes('.org') || name.includes('://')) return true;
  // Name is just the domain without extension
  if (domain && name.toLowerCase().trim() === domain.toLowerCase().trim()) return true;
  return false;
}

function isJunkDescription(desc) {
  if (!desc) return true;
  if (desc.length < 30) return true;
  // Contains phone numbers
  if (/\+?\d[\d\s\-().]{7,}\d/.test(desc)) return true;
  // Contains email addresses
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(desc)) return true;
  // Starts with navigation-like text
  if (/^(home|menu|skip to|toggle|navigation|cookie|privacy|terms|copyright|all rights)/i.test(desc.trim())) return true;
  // Generic/useless
  const junkPhrases = [
    'page not found', '404', 'access denied', 'just a moment',
    'cloudflare', 'please enable javascript', 'loading...', 'enable cookies',
    'please wait', 'redirecting', 'this page', 'click here', 'learn more',
    'contact us', 'about us', 'home page',
  ];
  const lower = desc.toLowerCase();
  if (junkPhrases.some(p => lower.includes(p))) return true;
  // Too many capital letters (ALL CAPS junk)
  const words = desc.split(' ');
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (capsWords.length / words.length > 0.5) return true;
  return false;
}

function extractDomain(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    return u.hostname.replace('www.', '').split('.')[0];
  } catch { return null; }
}

// ─── Improved scraping ───────────────────────────────────────────────────────

const BAD_TITLES = [
  'home', 'homepage', 'welcome', 'index', 'untitled', 'new tab', 'loading',
  '404', 'not found', 'error', 'access denied', 'just a moment', 'attention required',
  'cloudflare', 'website', 'page', 'default',
];

function isBadTitle(title) {
  if (!title || title.trim().length < 2) return true;
  const lower = title.toLowerCase().trim();
  if (BAD_TITLES.some(t => lower === t || lower.startsWith(t + ' '))) return true;
  if (lower.includes('.com') || lower.includes('.io') || lower.includes('://')) return true;
  return false;
}

function cleanText(text) {
  return text?.replace(/\s+/g, ' ').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim() || '';
}

async function scrapeCompany(url, browser) {
  let page;
  try {
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(20000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.goto(url.startsWith('http') ? url : 'https://' + url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    const data = await page.evaluate(() => {
      const getMeta = (name) => {
        const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"]`);
        return el?.getAttribute('content')?.trim() || '';
      };

      // Name candidates
      const ogTitle = getMeta('og:title') || getMeta('title');
      const pageTitle = document.title?.trim();
      const h1 = document.querySelector('h1')?.innerText?.trim();
      const h2 = document.querySelector('h2')?.innerText?.trim();

      // Description candidates
      const metaDesc = getMeta('description') || getMeta('og:description');
      const firstParagraphs = Array.from(document.querySelectorAll('p'))
        .map(p => p.innerText?.trim())
        .filter(t => t && t.length > 50 && t.length < 600)
        .slice(0, 5);

      // Logo
      const ogImage = getMeta('og:image');
      const favicon = document.querySelector('link[rel*="icon"]')?.href || '';

      return { ogTitle, pageTitle, h1, h2, metaDesc, firstParagraphs, ogImage, favicon };
    });

    // Pick best name
    let name = null;
    for (const candidate of [data.ogTitle, data.h1, data.pageTitle, data.h2]) {
      if (candidate && !isBadTitle(candidate)) {
        // Strip site suffix like " | Acme Corp" or " - Acme Corp"
        const cleaned = candidate.split(/\s*[\|\-–—]\s*/)[0].trim();
        if (cleaned.length >= 2 && cleaned.length <= 80) {
          name = cleaned;
          break;
        }
      }
    }
    if (!name) name = null; // will fall back to domain

    // Pick best description
    let description = null;
    if (data.metaDesc && !isJunkDescription(data.metaDesc) && data.metaDesc.length >= 50) {
      description = cleanText(data.metaDesc);
    } else {
      for (const para of data.firstParagraphs) {
        if (!isJunkDescription(para)) {
          description = cleanText(para);
          break;
        }
      }
    }

    return { name, description, logo_url: data.ogImage || null };
  } catch (err) {
    return { name: null, description: null, logo_url: null, error: err.message };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🧹 EP Investing — Company Cleanup${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // Fetch all companies
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, url, description, logo_url')
    .order('id', { ascending: true })
    .limit(LIMIT);

  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

  // Find bad ones
  const bad = companies.filter(c =>
    isUrlLikeName(c.name, c.url) || isJunkDescription(c.description)
  );

  console.log(`📊 Total: ${companies.length} | Bad name: ${companies.filter(c => isUrlLikeName(c.name, c.url)).length} | Bad description: ${companies.filter(c => isJunkDescription(c.description)).length}`);
  console.log(`🔧 Will attempt to fix: ${bad.length} companies\n`);

  if (bad.length === 0) { console.log('✅ Nothing to fix!'); return; }

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  let fixed = 0, failed = 0, skipped = 0;

  for (const company of bad) {
    process.stdout.write(`  Scraping ${company.url}… `);
    const scraped = await scrapeCompany(company.url, browser);

    if (scraped.error) {
      console.log(`❌ ${scraped.error}`);
      failed++;
      continue;
    }

    const domain = extractDomain(company.url);
    const updates = {};

    // Fix name
    if (isUrlLikeName(company.name, company.url)) {
      if (scraped.name) {
        updates.name = scraped.name;
      } else if (domain) {
        // Capitalize domain as fallback
        updates.name = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }

    // Fix description
    if (isJunkDescription(company.description)) {
      if (scraped.description) {
        updates.description = scraped.description;
      }
    }

    // Fix logo if missing
    if (!company.logo_url && scraped.logo_url) {
      updates.logo_url = scraped.logo_url;
    }

    if (Object.keys(updates).length === 0) {
      console.log(`⏭  No improvement found`);
      skipped++;
      continue;
    }

    console.log(`✓ ${updates.name || company.name}`);
    if (updates.description) console.log(`    📝 ${updates.description.slice(0, 80)}…`);

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', company.id);
      if (updateError) {
        console.error(`    ❌ Update failed: ${updateError.message}`);
        failed++;
        continue;
      }
    }
    fixed++;
  }

  await browser.close();

  console.log(`\n${'─'.repeat(45)}`);
  console.log(`✅ Fixed:   ${fixed}`);
  console.log(`⏭  Skipped: ${skipped}`);
  console.log(`❌ Failed:  ${failed}`);
  if (DRY_RUN) console.log(`\n(Dry run — no changes made)`);
}

main().catch(console.error);
