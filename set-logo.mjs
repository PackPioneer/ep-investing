/**
 * set-logo.mjs
 *
 * Fixes a company logo that won't render (usually because the source site
 * blocks hotlinking). Defaults to Google's favicon proxy derived from the
 * company's own url — the same reliable source backfill-logos.mjs uses.
 *
 *   # use google favicon proxy (default):
 *   node --env-file=.env.local set-logo.mjs --id 11
 *   node --env-file=.env.local set-logo.mjs --id 11 --write
 *
 *   # or set an explicit logo URL:
 *   node --env-file=.env.local set-logo.mjs --id 11 --url "https://.../logo.png" --write
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
function arg(f) { const i = process.argv.indexOf(f); return i !== -1 ? process.argv[i + 1] : undefined; }
const WRITE = process.argv.includes('--write');
const ID = arg('--id');
const EXPLICIT = arg('--url');

if (!ID) { console.error('Need --id <companyId>'); process.exit(1); }

function faviconFor(url) {
  const u = new URL(url.startsWith('http') ? url : `https://${url}`);
  const domain = u.hostname.replace(/^www\./, '').toLowerCase();
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

async function main() {
  const { data: rows, error } = await supabase
    .from('companies').select('id, name, url, logo_url').eq('id', Number(ID));
  if (error) { console.error(error.message); process.exit(1); }
  const c = rows[0];
  if (!c) { console.error(`No company with id ${ID}`); process.exit(1); }

  let newLogo = EXPLICIT;
  if (!newLogo) {
    if (!c.url) { console.error('Company has no url; pass --url explicitly.'); process.exit(1); }
    newLogo = faviconFor(c.url);
  }

  console.log(`id ${c.id}  ${c.name}`);
  console.log(`  logo_url was: ${c.logo_url}`);
  console.log(`  logo_url now: ${newLogo}\n`);

  if (!WRITE) { console.log('DRY RUN — nothing written. Add --write to apply.'); return; }

  const { error: upErr } = await supabase.from('companies').update({ logo_url: newLogo }).eq('id', c.id);
  if (upErr) { console.error(upErr.message); process.exit(1); }
  console.log('DONE.');
}

main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
