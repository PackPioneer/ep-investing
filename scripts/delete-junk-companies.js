/**
 * EP Investing — Delete Junk Company Records
 *
 * Removes companies where name is:
 *   - A number or HTTP error code (403, 404, 500, etc.)
 *   - Just whitespace or empty
 *   - A single character
 *   - Common junk values (null, undefined, test, etc.)
 *
 * Usage:
 *   node scripts/delete-junk-companies.js              # dry run (default)
 *   CONFIRM=yes node scripts/delete-junk-companies.js  # actually delete
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
const CONFIRM = process.env.CONFIRM === 'yes';

function isJunkName(name) {
  if (!name || name.trim().length === 0) return true;
  const trimmed = name.trim();

  // Pure number (e.g. "403", "404", "500", "200")
  if (/^\d+$/.test(trimmed)) return true;

  // Single character
  if (trimmed.length === 1) return true;

  // Common junk values
  const junk = ['null', 'undefined', 'test', 'n/a', 'na', 'none', 'unknown', '-', '--'];
  if (junk.includes(trimmed.toLowerCase())) return true;

  // Looks like a raw URL (has :// or starts with www.)
  if (trimmed.includes('://') || trimmed.toLowerCase().startsWith('www.')) return true;

  // HTTP status phrases
  const httpErrors = ['not found', 'forbidden', 'unauthorized', 'bad gateway', 'internal server error', 'service unavailable', 'access denied', 'just a moment', 'attention required'];
  if (httpErrors.some(e => trimmed.toLowerCase().includes(e))) return true;

  return false;
}

async function main() {
  console.log(`\n🗑️  EP Investing — Junk Company Cleanup${CONFIRM ? '' : ' [DRY RUN]'}\n`);

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, url')
    .order('id', { ascending: true });

  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

  const junk = companies.filter(c => isJunkName(c.name));

  console.log(`📊 Total companies: ${companies.length}`);
  console.log(`🗑️  Junk records found: ${junk.length}\n`);

  if (junk.length === 0) {
    console.log('✅ No junk records found!');
    return;
  }

  console.log('Records to delete:');
  for (const c of junk) {
    console.log(`  [${c.id}] name="${c.name}" url=${c.url}`);
  }

  if (!CONFIRM) {
    console.log(`\n⚠️  Dry run — run with CONFIRM=yes to actually delete these ${junk.length} records.`);
    return;
  }

  const ids = junk.map(c => c.id);
  const { error: deleteError } = await supabase
    .from('companies')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('❌ Delete error:', deleteError.message);
  } else {
    console.log(`\n✅ Deleted ${junk.length} junk records.`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
