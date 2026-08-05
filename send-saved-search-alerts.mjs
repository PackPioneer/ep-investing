/**
 * send-saved-search-alerts.mjs
 *
 * For each saved search, finds funding_events added since it was last notified
 * that match its filters, and emails the owner. Run on a schedule (e.g. daily
 * cron) — it updates last_notified_at so each event is only alerted once.
 *
 *   node --env-file=.env.local send-saved-search-alerts.mjs           # dry
 *   node --env-file=.env.local send-saved-search-alerts.mjs --write   # send + mark
 *
 * Untracked — do not `git add`.
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }
);
let _resend = null;
const getResend = () => (_resend ||= new Resend(process.env.RESEND_API_KEY));
const WRITE = process.argv.includes('--write');
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://epinvesting.com';
const usd = (n) => n == null ? '—' : n >= 1e9 ? '$' + (n/1e9).toFixed(1) + 'B' : n >= 1e6 ? '$' + (n/1e6).toFixed(0) + 'M' : '$' + n;

function matches(e, f) {
  if (f.type && e.type !== f.type) return false;
  if (f.sector && e.sector !== f.sector) return false;
  if (f.stage && e.stage !== f.stage) return false;
  if (f.geo && e.geography !== f.geo) return false;
  if (f.q) { const s = (e.company_name + ' ' + (e.counterparty || '')).toLowerCase(); if (!s.includes(f.q.toLowerCase())) return false; }
  return true;
}

async function main() {
  const { data: searches } = await supabase.from('saved_searches').select('*');
  if (!searches?.length) { console.log('No saved searches.'); return; }

  for (const s of searches) {
    const { data: evs } = await supabase.from('funding_events')
      .select('company_name, type, stage, sector, amount_usd, geography, counterparty, announced_date, created_at, category, is_hidden')
      .eq('category', 'capital').eq('is_hidden', false)
      .gt('created_at', s.last_notified_at || s.created_at)
      .order('announced_date', { ascending: false });
    const hits = (evs || []).filter((e) => matches(e, s.filters || {}));

    console.log(`"${s.name}" (${s.email || 'no email'}): ${hits.length} new match(es)`);
    if (!hits.length) continue;

    if (WRITE && s.email && process.env.RESEND_API_KEY) {
      const rows = hits.slice(0, 25).map((e) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${e.company_name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">${usd(e.amount_usd)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666">${(e.type||'').replace(/_/g,' ')} ${e.stage||''}</td></tr>`).join('');
      await getResend().emails.send({
        from: 'EP Network <noreply@epinvesting.com>', to: s.email,
        subject: `${hits.length} new deal${hits.length>1?'s':''} matching "${s.name}"`,
        html: `<div style="font-family:sans-serif;max-width:600px"><h2 style="color:#0f1a14">New deals in your saved search</h2><p style="color:#4a5568">${hits.length} new funding event${hits.length>1?'s':''} matched <strong>${s.name}</strong>.</p><table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table><p style="margin-top:20px"><a href="${SITE}/admin/markets" style="background:#2d6a4f;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px">View in tracker</a></p></div>`,
      });
    }
    if (WRITE) await supabase.from('saved_searches').update({ last_notified_at: new Date().toISOString() }).eq('id', s.id);
  }
  console.log(WRITE ? '\nDONE — sent + marked.' : '\nDRY RUN — add --write to send emails.');
}
main().catch((e) => { console.error('Unexpected:', e); process.exit(1); });
