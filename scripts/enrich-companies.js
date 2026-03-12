/**
 * EP Investing — Company Enrichment Script
 *
 * Enriches existing companies with 4 new fields:
 *   - funding_stage       (pre_seed/seed/series_a/series_b/series_c/growth/public/unknown)
 *   - business_model      (b2b/b2c/b2g/hardware/software/project_developer/marketplace/mixed)
 *   - target_geographies  (text[]: us/europe/asia/africa/latam/mena/global/oceania)
 *   - customer_segment    (text[]: utilities/corporates/government/consumers/developers/industry/mixed)
 *
 * SETUP: Run this SQL in Supabase first:
 *   alter table companies add column if not exists funding_stage text;
 *   alter table companies add column if not exists business_model text;
 *   alter table companies add column if not exists target_geographies text[];
 *   alter table companies add column if not exists customer_segment text[];
 *
 * Usage:
 *   node scripts/enrich-companies.js              # all companies missing fields
 *   LIMIT=50 node scripts/enrich-companies.js     # limit batch size
 *   NODE_ENV=dry node scripts/enrich-companies.js # dry run (prints classifications)
 */

import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = existsSync(resolve(root, '.env.local'))
  ? resolve(root, '.env.local') : resolve(root, '.env');

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const DRY_RUN = process.env.NODE_ENV === 'dry';
const LIMIT = parseInt(process.env.LIMIT || '1500');
const BATCH_SIZE = 10;

const VALID = {
  funding_stage: ['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'public', 'unknown'],
  business_model: ['b2b', 'b2c', 'b2g', 'hardware', 'software', 'project_developer', 'marketplace', 'mixed'],
  target_geographies: ['us', 'europe', 'asia', 'africa', 'latam', 'mena', 'global', 'oceania'],
  customer_segment: ['utilities', 'corporates', 'government', 'consumers', 'developers', 'industry', 'mixed'],
};

async function scrapeContext(url) {
  try {
    const res = await fetch(url.startsWith('http') ? url : `https://${url}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(7000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = await res.text();
    const metaDesc = html.match(/<meta[^>]+(?:name="description"|property="og:description")[^>]+content="([^"]{20,300})"/i)?.[1] || '';
    const title = html.match(/<title>([^<]{2,100})<\/title>/i)?.[1] || '';
    return [title, metaDesc].filter(Boolean).join(' — ').slice(0, 400);
  } catch {
    return null;
  }
}

async function classifyBatch(companies) {
  const companyList = companies.map((c, i) =>
    `${i + 1}. Name: ${c.name || 'Unknown'}
   Tags: ${(c.industry_tags || []).join(', ')}
   Description: ${c.description || c.website_context || 'No description'}`
  ).join('\n\n');

  const prompt = `Classify each company. Return ALL 4 fields for each:

1. funding_stage: pre_seed | seed | series_a | series_b | series_c | growth | public | unknown
2. business_model: b2b | b2c | b2g | hardware | software | project_developer | marketplace | mixed
3. target_geographies: array from [us, europe, asia, africa, latam, mena, global, oceania]
4. customer_segment: array from [utilities, corporates, government, consumers, developers, industry, mixed]

Companies:
${companyList}

Return ONLY a JSON array with exactly ${companies.length} objects in the same order, no markdown:
[{"funding_stage":"seed","business_model":"b2b","target_geographies":["us"],"customer_segment":["corporates"]},...]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    const cleaned = text.replace(/```[a-z]*\n?|\n?```/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const results = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(results) || results.length !== companies.length) return null;
    return results;
  } catch (err) {
    console.log(`  ✗ Claude error: ${err.message}`);
    return null;
  }
}

function cleanResult(result) {
  if (!result || typeof result !== 'object') return {};
  const cleaned = {};

  if (VALID.funding_stage.includes(result.funding_stage)) {
    cleaned.funding_stage = result.funding_stage;
  }
  if (VALID.business_model.includes(result.business_model)) {
    cleaned.business_model = result.business_model;
  }
  if (Array.isArray(result.target_geographies)) {
    const valid = result.target_geographies.filter(g => VALID.target_geographies.includes(g));
    if (valid.length > 0) cleaned.target_geographies = valid;
  }
  if (Array.isArray(result.customer_segment)) {
    const valid = result.customer_segment.filter(s => VALID.customer_segment.includes(s));
    if (valid.length > 0) cleaned.customer_segment = valid;
  }

  return cleaned;
}

async function main() {
  console.log(`\n🔬 EP Investing — Company Enrichment${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, url, description, industry_tags, funding_stage, business_model, target_geographies, customer_segment')
    .or('funding_stage.is.null,business_model.is.null,target_geographies.is.null,customer_segment.is.null')
    .limit(LIMIT);

  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

  console.log(`📊 Found ${companies.length} companies needing enrichment\n`);
  if (companies.length === 0) { console.log('✅ All companies already enriched!'); return; }

  let totalUpdated = 0, totalFailed = 0, totalSkipped = 0;
  const totalBatches = Math.ceil(companies.length / BATCH_SIZE);

  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    if (!DRY_RUN) {
      process.stdout.write(`\r  Batch ${batchNum}/${totalBatches} — enriched ${totalUpdated} so far...`);
    }

    // Scrape for companies with missing/short descriptions
    const enrichedBatch = await Promise.all(batch.map(async (company) => {
      if (!company.description || company.description.length < 50) {
        const context = await scrapeContext(company.url);
        return { ...company, website_context: context };
      }
      return company;
    }));

    const results = await classifyBatch(enrichedBatch);

    if (!results) {
      totalFailed += batch.length;
      continue;
    }

    for (let j = 0; j < batch.length; j++) {
      const company = batch[j];
      const updates = cleanResult(results[j]);

      if (Object.keys(updates).length === 0) {
        totalSkipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  ${company.name || company.url}`);
        console.log(`    funding_stage:      ${updates.funding_stage || '—'}`);
        console.log(`    business_model:     ${updates.business_model || '—'}`);
        console.log(`    target_geographies: ${(updates.target_geographies || []).join(', ') || '—'}`);
        console.log(`    customer_segment:   ${(updates.customer_segment || []).join(', ') || '—'}`);
        totalUpdated++;
      } else {
        const { error: updateError } = await supabase
          .from('companies')
          .update(updates)
          .eq('id', company.id);

        if (updateError) {
          totalFailed++;
        } else {
          totalUpdated++;
        }
      }
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n\n${'─'.repeat(45)}`);
  console.log(`✅ Enriched: ${totalUpdated}`);
  console.log(`⏭  Skipped:  ${totalSkipped}`);
  console.log(`✗  Failed:   ${totalFailed}`);
  if (DRY_RUN) console.log('\n(Dry run — no changes made)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
