/**
 * EP Investing — VC Portfolio Scraper
 *
 * Visits each investor's website, finds their portfolio page,
 * extracts company names + URLs, classifies each into your 14
 * industry tags, and inserts new companies into Supabase.
 *
 * Usage (run from project root):
 *   node scripts/scrape-vc-portfolios.js           # full run
 *   NODE_ENV=dry node scripts/scrape-vc-portfolios.js  # dry run
 *   LIMIT=10 node scripts/scrape-vc-portfolios.js  # test first 10 investors
 *
 * Requires: npm install puppeteer node-html-parser
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';
import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

// ─── Load env ────────────────────────────────────────────────────────────────
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const DRY_RUN = process.env.NODE_ENV === 'dry';
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT) : null;
const TIMEOUT = 20000;

// ─── Your 14 valid industry tags ─────────────────────────────────────────────
const VALID_TAGS = [
  'battery_storage',
  'carbon_credits',
  'clean_cooking',
  'direct_air_capture',
  'electric_aviation',
  'ev_charging',
  'geothermal_energy',
  'green_hydrogen',
  'grid_storage',
  'industrial_decarbonization',
  'nuclear_technologies',
  'saf_efuels',
  'solar',
  'wind_energy',
];

// ─── Keyword → tag mapping for classification ─────────────────────────────
const TAG_KEYWORDS = {
  battery_storage:           ['battery', 'batteries', 'energy storage', 'lithium', 'solid state', 'bess', 'grid storage'],
  carbon_credits:            ['carbon credit', 'carbon offset', 'carbon market', 'voluntary carbon', 'emissions trading', 'redd'],
  clean_cooking:             ['clean cook', 'cookstove', 'biomass cook', 'clean fuel cook', 'lpg cook'],
  direct_air_capture:        ['direct air capture', 'dac', 'carbon capture', 'carbon removal', 'cdr', 'carbon dioxide removal'],
  electric_aviation:         ['electric aircraft', 'electric aviation', 'evtol', 'urban air mobility', 'uam', 'electric plane', 'sustainable aviation fuel', 'zero emission flight'],
  ev_charging:               ['ev charging', 'electric vehicle charging', 'charging station', 'charging network', 'charging infrastructure', 'charge point'],
  geothermal_energy:         ['geothermal', 'enhanced geothermal', 'egs', 'geothermal power', 'geothermal heat'],
  green_hydrogen:            ['green hydrogen', 'hydrogen', 'electrolyzer', 'electrolysis', 'fuel cell', 'h2', 'hydrogen production', 'hydrogen storage'],
  grid_storage:              ['grid storage', 'grid-scale storage', 'utility storage', 'long duration storage', 'flow battery', 'vanadium', 'iron air'],
  industrial_decarbonization:['industrial decarbonization', 'hard to abate', 'steel decarbonization', 'cement', 'industrial emissions', 'green steel', 'green cement', 'process heat'],
  nuclear_technologies:      ['nuclear', 'fission', 'fusion', 'small modular reactor', 'smr', 'advanced nuclear', 'thorium', 'nuclear power'],
  saf_efuels:                ['sustainable aviation fuel', 'saf', 'efuel', 'e-fuel', 'synthetic fuel', 'power to liquid', 'ptl', 'electrofuel'],
  solar:                     ['solar', 'photovoltaic', 'pv', 'solar panel', 'solar energy', 'solar power', 'perovskite', 'thin film solar'],
  wind_energy:               ['wind', 'wind turbine', 'wind farm', 'offshore wind', 'onshore wind', 'wind power', 'wind energy'],
};

// ─── Classify a company based on name + description ──────────────────────────
function classifyCompany(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  const matched = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      matched.push(tag);
    }
  }

  return matched;
}

// ─── Common portfolio page URL patterns ──────────────────────────────────────
const PORTFOLIO_PATHS = [
  '/portfolio',
  '/companies',
  '/investments',
  '/portfolio-companies',
  '/our-portfolio',
  '/startups',
  '/ventures',
];

// ─── Extract links from a page that look like portfolio company links ────────
function extractPortfolioLinks(html, baseUrl) {
  const root = parse(html);
  const links = new Set();

  // Look for links in portfolio-related containers
  const allLinks = root.querySelectorAll('a[href]');

  for (const link of allLinks) {
    const href = link.getAttribute('href');
    if (!href) continue;

    // Skip navigation, social, legal links
    if (/mailto:|tel:|#|linkedin|twitter|facebook|instagram|youtube|privacy|terms|about|contact|blog|news|team|people/i.test(href)) continue;

    try {
      const absolute = new URL(href, baseUrl).href;
      const parsedBase = new URL(baseUrl);
      const parsedLink = new URL(absolute);

      // External links = potential portfolio companies
      if (parsedLink.hostname !== parsedBase.hostname) {
        // Only include if it looks like a company website
        if (parsedLink.hostname.includes('.') && !parsedLink.hostname.includes('google') && !parsedLink.hostname.includes('apple')) {
          links.add(absolute);
        }
      }
    } catch { /* ignore invalid URLs */ }
  }

  return [...links];
}

// ─── Scrape a single page and get text content ───────────────────────────────
async function fetchPage(url, page) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await new Promise(r => setTimeout(r, 1500));
    return await page.content();
  } catch {
    return null;
  }
}

// ─── Get company info from its website ───────────────────────────────────────
async function scrapeCompanyPage(url, page) {
  const html = await fetchPage(url, page);
  if (!html) return null;

  const root = parse(html);
  const getMeta = (prop) => {
    const el = root.querySelector(`meta[property="${prop}"]`) ||
               root.querySelector(`meta[name="${prop}"]`);
    return el?.getAttribute('content')?.trim() || null;
  };

  const rawTitle = getMeta('og:site_name') || getMeta('og:title') ||
    root.querySelector('title')?.text?.trim() || null;

  const name = rawTitle
    ? rawTitle.split(/[|\-–—]/)[0].trim().slice(0, 100)
    : new URL(url).hostname.replace(/^www\./, '').replace(/\.(com|io|co)$/, '');

  const description = getMeta('og:description') || getMeta('description') || null;

  let logoUrl = null;
  try {
    const clearbit = `https://logo.clearbit.com/${new URL(url).hostname}`;
    const res = await fetch(clearbit, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
    if (res.ok) logoUrl = clearbit;
  } catch { /* ignore */ }

  if (!logoUrl) {
    logoUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`;
  }

  return { name, description, logoUrl };
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏢 EP Investing — VC Portfolio Scraper${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  // Get all investors with URLs
  const { data: investors, error } = await supabase
    .from('vc_firms')
    .select('id, name, url')
    .not('url', 'is', null)
    .order('id');

  if (error) throw error;

  const toProcess = LIMIT ? investors.slice(0, LIMIT) : investors;
  console.log(`📋 Processing ${toProcess.length} investors\n`);

  // Get existing company URLs to avoid duplicates
  const { data: existingCompanies } = await supabase
    .from('companies')
    .select('url');
  const existingUrls = new Set(
    (existingCompanies || []).map(c => {
      try { return new URL(c.url).hostname.replace(/^www\./, ''); } catch { return c.url; }
    }).filter(Boolean)
  );

  console.log(`📊 ${existingUrls.size} existing companies in DB\n`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (compatible; EPInvestingBot/1.0)');

  let totalAdded = 0;
  let totalSkipped = 0;
  let totalNoMatch = 0;

  for (const investor of toProcess) {
    console.log(`\n🔍 [${investor.id}] ${investor.name} — ${investor.url}`);

    const baseUrl = investor.url.startsWith('http') ? investor.url : `https://${investor.url}`;
    let portfolioLinks = [];

    // Try common portfolio page paths
    for (const path of PORTFOLIO_PATHS) {
      const portfolioUrl = `${baseUrl.replace(/\/$/, '')}${path}`;
      const html = await fetchPage(portfolioUrl, page);
      if (!html) continue;

      const links = extractPortfolioLinks(html, portfolioUrl);
      if (links.length > 2) {
        console.log(`  📄 Found ${links.length} links at ${path}`);
        portfolioLinks = links;
        break;
      }
    }

    // Fall back to homepage if no portfolio page found
    if (portfolioLinks.length === 0) {
      const html = await fetchPage(baseUrl, page);
      if (html) {
        portfolioLinks = extractPortfolioLinks(html, baseUrl);
        if (portfolioLinks.length > 0) {
          console.log(`  📄 Using homepage links (${portfolioLinks.length})`);
        }
      }
    }

    if (portfolioLinks.length === 0) {
      console.log(`  ⚠ No portfolio links found`);
      continue;
    }

    // Process each portfolio company
    for (const companyUrl of portfolioLinks.slice(0, 30)) { // cap at 30 per investor
      let hostname;
      try {
        hostname = new URL(companyUrl).hostname.replace(/^www\./, '');
      } catch { continue; }

      // Skip if already in DB
      if (existingUrls.has(hostname)) {
        totalSkipped++;
        continue;
      }

      // Scrape company page
      const info = await scrapeCompanyPage(companyUrl, page);
      if (!info || !info.name) continue;

      // Classify into industry tags
      const tags = classifyCompany(info.name, info.description || '');

      if (tags.length === 0) {
        console.log(`  ✗ No industry match: ${info.name} (${hostname})`);
        totalNoMatch++;
        continue;
      }

      console.log(`  ✓ ${info.name} → [${tags.join(', ')}]`);

      if (!DRY_RUN) {
        const { error: insertErr } = await supabase
          .from('companies')
          .insert({
            name: info.name,
            url: companyUrl,
            description: info.description?.slice(0, 500) || null,
            logo_url: info.logoUrl,
            industry_tags: tags,
            sector: 'cleantech_company',
            enrichment_provenance: `scraped_from_vc_portfolio:${investor.name}`,
          });

        if (insertErr) {
          // Likely a duplicate URL — skip
          if (insertErr.code !== '23505') {
            console.log(`    ⚠ DB error: ${insertErr.message}`);
          }
        } else {
          existingUrls.add(hostname);
          totalAdded++;
        }
      } else {
        existingUrls.add(hostname);
        totalAdded++;
      }
    }
  }

  await browser.close();

  console.log('\n─────────────────────────────────');
  console.log(`✅ Added:      ${totalAdded}`);
  console.log(`⏭  Skipped:    ${totalSkipped} (already in DB)`);
  console.log(`✗  No match:   ${totalNoMatch} (not in any of 14 categories)`);
  if (DRY_RUN) console.log('\n(Dry run — no DB changes made)');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
