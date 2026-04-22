/**
 * scripts/ingest-news-once.js
 *
 * Run the ingestion pipeline once from the command line. Useful for:
 *   - Local testing after seeding sources
 *   - First production run after deploy (before cron's first tick)
 *   - Debugging a specific feed's parse behavior
 *
 * Run with:
 *   node scripts/ingest-news-once.js
 *
 * To ingest only one source:
 *   node scripts/ingest-news-once.js canary-media
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { ingestAllSources, ingestSource } from '../lib/news/ingestion.js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function main() {
  const slug = process.argv[2];

  if (slug) {
    const { data: source, error } = await supabase
      .from('news_sources')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !source) {
      console.error(`Source '${slug}' not found. Run seed first.`);
      process.exit(1);
    }

    console.log(`Ingesting single source: ${source.name}\n`);
    const result = await ingestSource(source, supabase);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Ingesting all active sources…\n');
  const result = await ingestAllSources(supabase);

  console.log(`Attempted: ${result.sources_attempted}`);
  console.log(`Succeeded: ${result.sources_succeeded}`);
  console.log(`Articles inserted: ${result.articles_inserted}`);
  console.log(`Articles skipped (duplicate): ${result.articles_skipped_duplicate}`);

  if (result.errors?.length > 0) {
    console.log('\nErrors:');
    for (const e of result.errors) {
      console.log(`  - ${e.source}: ${e.message}`);
    }
  }
}

main().catch((err) => {
  console.error('Ingestion script failed:', err);
  process.exit(1);
});
