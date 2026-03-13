/**
 * EP Investing — Fix Company Names
 *
 * Fixes two problems:
 *   1. Names ending in .com/.io/.co etc (URL-as-name)
 *   2. Names longer than 3 words
 *
 * Strategy:
 *   - For URL-as-name: extract clean name from domain (e.g. "plugpower.com" → "Plug Power")
 *   - For long names: use Claude Haiku to shorten to the core brand name
 *
 * Usage:
 *   node scripts/fix-company-names.js              # all bad names
 *   LIMIT=50 node scripts/fix-company-names.js     # limit batch size
 *   NODE_ENV=dry node scripts/fix-company-names.js # dry run (shows before/after)
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

// ─── Detect bad names ─────────────────────────────────────────────────────────

function isTld(str) {
  return /\.(com|io|co|net|org|energy|tech|ai|app|de|fr|uk|eu|au)$/i.test(str);
}

function wordCount(str) {
  return str.trim().split(/\s+/).length;
}

function isBadName(name) {
  if (!name) return true;
  const trimmed = name.trim();
  if (isTld(trimmed)) return true;             // ends in .com etc
  if (wordCount(trimmed) > 3) return true;     // more than 3 words
  return false;
}

// ─── Clean domain → name ─────────────────────────────────────────────────────

function domainToName(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    let domain = u.hostname.replace(/^www\./, '');
    // Remove TLD
    domain = domain.replace(/\.[a-z]{2,}$/i, '');
    // Split on dots/hyphens
    const parts = domain.split(/[.\-_]/);
    // Title case each part
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  } catch {
    return null;
  }
}

// ─── Use Claude to shorten long names ────────────────────────────────────────

async function shortenNames(companies) {
  const list = companies.map((c, i) =>
    `${i + 1}. Current name: "${c.name}" | URL: ${c.url || ''} | Description: ${(c.description || '').slice(0, 120)}`
  ).join('\n');

  const prompt = `For each company below, return the SHORT brand name only (1-3 words max).
Rules:
- Use the actual brand/company name, not a description
- Remove legal suffixes (Inc, Ltd, Corp, GmbH, etc.)
- Remove taglines or descriptions
- Keep acronyms as-is (e.g. "ENGIE", "BP", "GE")
- If it's a URL-as-name like "plugpower.com", return "Plug Power"

${list}

Return ONLY a JSON array of strings in the same order, e.g.: ["Plug Power", "ENGIE", "Tesla"]`;

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
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
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
  console.log(`\n✏️  EP Investing — Fix Company Names${DRY_RUN ? ' [DRY RUN]' : ''}\n`);

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, url, description')
    .limit(LIMIT);

  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

  const bad = companies.filter(c => isBadName(c.name));
  console.log(`📊 Total companies: ${companies.length}`);
  console.log(`⚠️  Bad names found: ${bad.length}\n`);

  if (bad.length === 0) { console.log('✅ All names look good!'); return; }

  // Split into two groups
  const urlAsName = bad.filter(c => c.name && isTld(c.name.trim()));
  const longName  = bad.filter(c => c.name && !isTld(c.name.trim()) && wordCount(c.name) > 3);

  console.log(`  URL-as-name: ${urlAsName.length}`);
  console.log(`  Long names:  ${longName.length}\n`);

  let fixed = 0, failed = 0;
  const BATCH = 20;

  // ── Fix URL-as-name: use domain parsing first, Claude as fallback ──
  for (let i = 0; i < urlAsName.length; i += BATCH) {
    const batch = urlAsName.slice(i, i + BATCH);
    const needsClaude = [];

    for (const company of batch) {
      const fromDomain = company.url ? domainToName(company.url) : null;

      // If domain parsing gives a simple 1-2 word name, use it directly
      if (fromDomain && wordCount(fromDomain) <= 3 && fromDomain.length > 1) {
        if (DRY_RUN) {
          console.log(`  "${company.name}" → "${fromDomain}" (domain parse)`);
        } else {
          const { error: e } = await supabase.from('companies').update({ name: fromDomain }).eq('id', company.id);
          if (e) failed++; else fixed++;
        }
        if (DRY_RUN) fixed++;
      } else {
        needsClaude.push(company);
      }
    }

    // For the rest, use Claude
    if (needsClaude.length > 0) {
      const results = await shortenNames(needsClaude);
      if (results) {
        for (let j = 0; j < needsClaude.length; j++) {
          const company = needsClaude[j];
          const newName = results[j]?.trim();
          if (!newName || newName.length < 2) { failed++; continue; }

          if (DRY_RUN) {
            console.log(`  "${company.name}" → "${newName}" (Claude)`);
            fixed++;
          } else {
            const { error: e } = await supabase.from('companies').update({ name: newName }).eq('id', company.id);
            if (e) failed++; else fixed++;
          }
        }
      } else {
        failed += needsClaude.length;
      }
    }

    await new Promise(r => setTimeout(r, 300));
  }

  // ── Fix long names: use Claude ──
  for (let i = 0; i < longName.length; i += BATCH) {
    const batch = longName.slice(i, i + BATCH);
    process.stdout.write(`\r  Fixing long names: ${i}/${longName.length}...`);

    const results = await shortenNames(batch);
    if (!results) { failed += batch.length; continue; }

    for (let j = 0; j < batch.length; j++) {
      const company = batch[j];
      const newName = results[j]?.trim();
      if (!newName || newName.length < 2) { failed++; continue; }

      if (DRY_RUN) {
        console.log(`  "${company.name}" → "${newName}" (Claude)`);
        fixed++;
      } else {
        const { error: e } = await supabase.from('companies').update({ name: newName }).eq('id', company.id);
        if (e) failed++; else fixed++;
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
