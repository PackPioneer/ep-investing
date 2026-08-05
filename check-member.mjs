/**
 * check-member.mjs — read-only. Diagnoses why someone isn't in the members tab.
 *
 *   node --env-file=.env.local check-member.mjs --email someone@example.com
 *
 * Shows any experts row for that email, plus the 10 most recent signups so we
 * can spot missing rows or a wrong `type`. Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
function arg(f) { const i = process.argv.indexOf(f); return i !== -1 ? process.argv[i + 1] : undefined; }
const EMAIL = arg('--email');

async function main() {
  if (EMAIL) {
    const { data, error } = await supabase
      .from('experts')
      .select('id, type, name, email, clerk_user_id, role, industries, intent, onboarded_at, status, created_at')
      .ilike('email', EMAIL);
    if (error) { console.error(error.message); process.exit(1); }
    console.log(`=== Rows in "experts" for ${EMAIL} ===`);
    if (!data.length) {
      console.log('  NONE. No experts row exists for this email.');
      console.log('  → They signed up (Clerk account) but the member row was never written.');
      console.log('    Almost always means onboarding (role/industries/intent) was not submitted.\n');
    } else {
      for (const r of data) {
        console.log(JSON.stringify(r, null, 2));
        const inTab = r.type === 'individual' ? 'YES' : `NO (type is "${r.type}", tab needs "individual")`;
        console.log(`  → Shows in members tab? ${inTab}\n`);
      }
    }
  }

  const { data: recent } = await supabase
    .from('experts')
    .select('id, type, email, onboarded_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('=== 10 most recent experts rows (any type) ===');
  for (const r of recent || []) {
    console.log(`  ${r.created_at?.slice(0,16) || '—'}  type=${(r.type||'null').padEnd(11)} onboarded=${r.onboarded_at ? 'yes' : 'NO '}  ${r.email}`);
  }
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
