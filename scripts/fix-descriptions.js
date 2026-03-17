/**
 * EP Investing — Fix Company Descriptions
 *
 * Removes first-person pronouns from company descriptions.
 * Uses Claude Haiku to rewrite descriptions in third-person.
 *
 * Usage:
 *   node scripts/fix-descriptions.js              # all companies with pronoun issues
 *   LIMIT=50 node scripts/fix-descriptions.js     # limit batch size
 *   NODE_ENV=dry node scripts/fix-descriptions.js # dry run (shows before/after)
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
const LIMIT = parseInt(process.env.LIMIT || '2000');
const BATCH_SIZE = 20;

// ─── Detect descriptions with personal pronouns ───────────────────────────────

const PRONOUN_PATTERN = /\b(we|our|us|we're|we've|we'll|we'd|let's|i |i'm|my |mine)\b/i;

function hasPronouns(text) {
  if (!text) return false;
  return PRONOUN_PATTERN.test(text);
}

// ─── Rewrite batch via Claude ─────────────────────────────────────────────────

async function rewriteBatch(companies) {
  const list = companies.map((c, i) =>
    `${i + 1}. Company: "${c.name}"\n   Description: "${c.description}"`
  ).join('\n\n');

  const prompt = `Rewrite each company description below in third-person, removing all first-person pronouns (we, our, us, I, my etc).

Rules:
- Replace "We build" → "[Company name] builds" or just "Builds"
- Replace "Our mission" → "Its mission" or "The company's mission"
- Keep the same meaning and length — do not add or remove information
- Keep it factual and professional
- Return ONLY a JSON array of rewritten description strings in the same order, no markdown

Companies:
${list}

Return format: ["rewritten description 1", "rewritten description 2", ...]`;

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
        max_tokens: 4000,
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

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n✏️  EP Investing — Fix Descriptions${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, description')
    .not('description', 'is', null)
    .limit(LIMIT);

  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

  const needsFix = companies.filter(c => hasPronouns(c.description));

  console.log(`📊 Total companies checked: ${companies.length}`);
  console.log(`⚠️  Descriptions with pronouns: ${needsFix.length}\n`);

  if (needsFix.length === 0) { console.log('✅ All descriptions look good!'); return; }

  let fixed = 0, failed = 0;
  const totalBatches = Math.ceil(needsFix.length / BATCH_SIZE);

  for (let i = 0; i < needsFix.length; i += BATCH_SIZE) {
    const batch = needsFix.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`\r  Batch ${batchNum}/${totalBatches} — fixed ${fixed} so far...`);

    const results = await rewriteBatch(batch);

    if (!results) { failed += batch.length; continue; }

    for (let j = 0; j < batch.length; j++) {
      const company = batch[j];
      const newDesc = results[j]?.trim();

      if (!newDesc || newDesc.length < 10) { failed++; continue; }

      if (DRY_RUN) {
        console.log(`\n  ${company.name}`);
        console.log(`    BEFORE: ${company.description.slice(0, 120)}...`);
        console.log(`    AFTER:  ${newDesc.slice(0, 120)}...`);
        fixed++;
      } else {
        const { error: updateError } = await supabase
          .from('companies')
          .update({ description: newDesc })
          .eq('id', company.id);

        if (updateError) { failed++; } else { fixed++; }
      }
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n\n${'─'.repeat(45)}`);
  console.log(`✅ Fixed:  ${fixed}`);
  console.log(`✗  Failed: ${failed}`);
  if (DRY_RUN) console.log('\n(Dry run — no changes made)');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
