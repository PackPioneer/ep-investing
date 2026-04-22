/**
 * scripts/seed-news-sources.js
 *
 * Upserts Phase 1 news sources into Supabase. Validates every feed URL by
 * fetching it first — broken feeds are reported but still inserted as
 * inactive so you can fix the URL later without re-running the full seed.
 *
 * Run with:
 *   node scripts/seed-news-sources.js
 *
 * Env vars required (from .env.local, matching existing pattern):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import { PHASE_1_SOURCES } from './news-sources-data.js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const parser = new Parser({
  timeout: 15000,
  headers: {
    // Some feeds 403 the default Node user-agent
    'User-Agent': 'EPInvestingNewsBot/0.1 (+https://epinvesting.com/news)',
  },
});

/**
 * Attempts to fetch + parse a feed. Returns { ok, itemCount, error }.
 */
async function validateFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    const itemCount = feed?.items?.length ?? 0;
    return { ok: itemCount > 0, itemCount, error: itemCount === 0 ? 'empty feed' : null };
  } catch (err) {
    return { ok: false, itemCount: 0, error: err.message };
  }
}

async function seed() {
  console.log(`Seeding ${PHASE_1_SOURCES.length} news sources…\n`);

  const results = { inserted: 0, updated: 0, inactive: 0, errors: [] };

  for (const source of PHASE_1_SOURCES) {
    process.stdout.write(`  ${source.slug.padEnd(32)} `);

    const validation = await validateFeed(source.feed_url);

    const row = {
      slug: source.slug,
      name: source.name,
      feed_url: source.feed_url,
      feed_type: source.feed_type,
      homepage_url: source.homepage_url ?? null,
      region: source.region ?? null,
      category: source.category ?? null,
      language: source.language ?? 'en',
      credibility_tier: source.credibility_tier ?? 2,
      is_secondary_source: source.is_secondary_source ?? false,
      attribution_label: source.attribution_label ?? null,
      notes: source.notes ?? null,
      active: validation.ok,
      last_error: validation.ok ? null : validation.error,
    };

    const { error } = await supabase
      .from('news_sources')
      .upsert(row, { onConflict: 'slug' });

    if (error) {
      console.log(`✗ DB error: ${error.message}`);
      results.errors.push({ slug: source.slug, error: error.message });
      continue;
    }

    if (validation.ok) {
      console.log(`✓ ${validation.itemCount} items`);
      results.inserted += 1;
    } else {
      console.log(`⚠ inactive — ${validation.error}`);
      results.inactive += 1;
    }
  }

  console.log(`\nDone. Active: ${results.inserted}  Inactive: ${results.inactive}  Errors: ${results.errors.length}`);

  if (results.inactive > 0) {
    console.log('\nInactive sources have been saved with active=false and their');
    console.log('error in last_error. Fix feed_url in news-sources-data.js and re-run');
    console.log('this script, or toggle active=true manually in Supabase once fixed.');
  }
}

seed().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
