/**
 * diagnose-job-links.mjs — read-only.
 * Answers: of the companies we scraped jobs for, how many link to the directory,
 * and for the ones that DON'T, is it a matching bug (a close directory name
 * exists) or genuine low overlap (no candidate at all)?
 *
 *   node --env-file=.env.local diagnose-job-links.mjs
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const norm = (s) => (s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '')
  .replace(/(incorporated|inc|ltd|limited|llc|corporation|corp|company|co|group|holdings|technologies|technology|energy|power)$/g, '');

async function all(table, cols) {
  let out = [], from = 0;
  for (;;) {
    const { data } = await supabase.from(table).select(cols).range(from, from + 999);
    if (!data || !data.length) break;
    out = out.concat(data); if (data.length < 1000) break; from += 1000;
  }
  return out;
}

async function main() {
  const jobs = await all('job_listings', 'company, company_id');
  const cos = await all('companies', 'id, name');

  // Directory index (normalized) + a token set for loose candidate detection.
  const dirNorm = new Map();
  for (const c of cos) { const n = norm(c.name); if (n) dirNorm.set(n, c.name); }

  const byCompany = new Map();
  for (const j of jobs) {
    const k = j.company || '(blank)';
    const e = byCompany.get(k) || { count: 0, linked: false };
    e.count++; if (j.company_id) e.linked = true;
    byCompany.set(k, e);
  }

  let linked = 0, bug = 0, overlap = 0;
  const bugs = [], missing = [];
  for (const [company, e] of byCompany) {
    if (e.linked) { linked++; continue; }
    const n = norm(company);
    // Loose candidate: a directory name whose normalized form contains or is contained by this one (len>=4).
    let cand = dirNorm.get(n);
    if (!cand) {
      for (const [dn, name] of dirNorm) {
        if (dn.length >= 4 && (dn.includes(n) || n.includes(dn))) { cand = name; break; }
      }
    }
    if (cand) { bug++; bugs.push(`${company}  →  directory has "${cand}"`); }
    else { overlap++; missing.push(company); }
  }

  console.log(`\nDistinct companies with scraped jobs: ${byCompany.size}`);
  console.log(`  linked to directory:      ${linked}`);
  console.log(`  UNLINKED, but a close directory name exists (fixable):  ${bug}`);
  console.log(`  UNLINKED, no directory candidate (not in directory):    ${overlap}`);
  if (bugs.length) { console.log(`\n-- Fixable (matching gap) --`); bugs.slice(0, 40).forEach((b) => console.log('  ' + b)); }
  if (missing.length) { console.log(`\n-- Not in directory (${missing.length}) --`); console.log('  ' + missing.slice(0, 40).join(', ')); }
  console.log('');
}
main().catch((e) => { console.error(e); process.exit(1); });
