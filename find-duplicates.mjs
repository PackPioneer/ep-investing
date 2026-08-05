/**
 * find-duplicates.mjs — read-only.
 * Scans all live companies and flags likely duplicate profiles by three rules:
 *   1. same website domain          (high confidence)
 *   2. identical normalized name    (high confidence)
 *   3. word-boundary name prefix    (medium — e.g. "Sila" vs "Sila Nanotechnologies")
 * For each pair it picks a suggested KEEP (most complete / claimed) and prints a
 * ready-to-run merge command, plus writes duplicates.csv. Nothing is changed.
 *
 *   node --env-file=.env.local find-duplicates.mjs
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const norm = (s) => (s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '')
  .replace(/(incorporated|inc|ltd|limited|llc|corporation|corp|company|co|group|holdings)$/g, '');
const domain = (u) => {
  if (!u) return null;
  try { return new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, '').toLowerCase(); }
  catch { return null; }
};
const isEmpty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

// Higher = better keeper. Claimed profiles always win; then completeness; then older.
function score(c) {
  let s = 0;
  if (c.claimed_by_clerk_user_id || c.clerk_user_id) s += 1000;
  if (!isEmpty(c.logo_url) && !/s2\/favicons/.test(c.logo_url || '')) s += 5;
  if (!isEmpty(c.description)) s += 4;
  if (!isEmpty(c.core_technology)) s += 2;
  if (!isEmpty(c.industry_tags)) s += 2;
  if (!isEmpty(c.funding_stage)) s += 1;
  s -= (c.id || 0) / 1e12; // tiebreak: prefer lower id (older)
  return s;
}

async function all() {
  let out = [], from = 0;
  for (;;) {
    const { data, error } = await supabase.from('companies')
      .select('id, name, slug, url, description, core_technology, industry_tags, funding_stage, logo_url, clerk_user_id, claimed_by_clerk_user_id, is_hidden')
      .neq('is_hidden', true).range(from, from + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data || !data.length) break;
    out = out.concat(data); if (data.length < 1000) break; from += 1000;
  }
  return out;
}

async function main() {
  const cos = await all();
  console.log(`Scanning ${cos.length} live companies for duplicates...\n`);

  const pairs = new Map(); // "loId|hiId" -> reason

  // Rule 1 + 2: group by domain and by normalized name.
  const byDomain = new Map(), byName = new Map();
  for (const c of cos) {
    const d = domain(c.url); if (d) (byDomain.get(d) || byDomain.set(d, []).get(d)).push(c);
    const n = norm(c.name); if (n) (byName.get(n) || byName.set(n, []).get(n)).push(c);
  }
  const addGroup = (group, reason) => {
    for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
      const [a, b] = [group[i].id, group[j].id].sort((x, y) => x - y);
      if (!pairs.has(`${a}|${b}`)) pairs.set(`${a}|${b}`, reason);
    }
  };
  for (const g of byDomain.values()) if (g.length > 1) addGroup(g, 'same domain');
  for (const g of byName.values()) if (g.length > 1) addGroup(g, 'same name');

  // Rule 3: word-boundary prefix ("Sila" vs "Sila Nanotechnologies").
  for (let i = 0; i < cos.length; i++) for (let j = i + 1; j < cos.length; j++) {
    const a = cos[i].name || '', b = cos[j].name || '';
    if (!a || !b || a.length === b.length) continue;
    const [short, long] = a.length < b.length ? [a, b] : [b, a];
    if (short.length >= 4 && long.toLowerCase().startsWith(short.toLowerCase() + ' ')) {
      const [x, y] = [cos[i].id, cos[j].id].sort((m, n) => m - n);
      if (!pairs.has(`${x}|${y}`)) pairs.set(`${x}|${y}`, 'name prefix');
    }
  }

  const byId = new Map(cos.map((c) => [c.id, c]));
  const rows = [...pairs.entries()].map(([key, reason]) => {
    const [a, b] = key.split('|').map(Number);
    const ca = byId.get(a), cb = byId.get(b);
    const [keep, loser] = score(ca) >= score(cb) ? [ca, cb] : [cb, ca];
    return { keep, loser, reason };
  }).sort((p, q) => (p.reason > q.reason ? 1 : -1));

  if (rows.length === 0) { console.log('No likely duplicates found.'); return; }

  console.log(`Found ${rows.length} likely duplicate pair(s):\n`);
  rows.forEach((r) => {
    console.log(`[${r.reason}]  KEEP ${r.keep.id} "${r.keep.name}"  ·  merge in ${r.loser.id} "${r.loser.name}"`);
    console.log(`   node --env-file=.env.local merge-companies.mjs --keep ${r.keep.id} --loser ${r.loser.id} --write\n`);
  });

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['reason,keep_id,keep_name,loser_id,loser_name,merge_command'];
  rows.forEach((r) => csv.push([
    r.reason, r.keep.id, esc(r.keep.name), r.loser.id, esc(r.loser.name),
    esc(`node --env-file=.env.local merge-companies.mjs --keep ${r.keep.id} --loser ${r.loser.id} --write`),
  ].join(',')));
  writeFileSync('duplicates.csv', csv.join('\n'));
  console.log(`Wrote duplicates.csv (${rows.length} pairs). Review, then run the merge commands for the real ones.`);
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
