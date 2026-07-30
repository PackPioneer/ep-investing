/**
 * lib/alerts/saved-search.js
 *
 * Emails each saved-search owner about new funding_events matching their
 * filters since they were last notified. Called from the daily cron so it
 * runs automatically (no extra cron, to respect the Hobby 2-cron limit).
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const usd = (n) => n == null ? '—' : n >= 1e9 ? '$' + (n / 1e9).toFixed(1) + 'B' : n >= 1e6 ? '$' + (n / 1e6).toFixed(0) + 'M' : '$' + n;

function matches(e, f) {
  if (f.type && e.type !== f.type) return false;
  if (f.sector && e.sector !== f.sector) return false;
  if (f.stage && e.stage !== f.stage) return false;
  if (f.geo && e.geography !== f.geo) return false;
  if (f.q) { const s = (e.company_name + ' ' + (e.counterparty || '')).toLowerCase(); if (!s.includes(f.q.toLowerCase())) return false; }
  return true;
}

export async function sendSavedSearchAlerts() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://epinvesting.com';
  const { data: searches } = await supabase.from('saved_searches').select('*');
  if (!searches?.length) return { checked: 0, emailed: 0 };

  let emailed = 0;
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  for (const s of searches) {
    const { data: evs } = await supabase.from('funding_events')
      .select('company_name, type, stage, sector, amount_usd, geography, counterparty, announced_date, category, is_hidden')
      .eq('category', 'capital').eq('is_hidden', false)
      .gt('created_at', s.last_notified_at || s.created_at)
      .order('announced_date', { ascending: false });
    const hits = (evs || []).filter((e) => matches(e, s.filters || {}));
    if (!hits.length) continue;

    if (resend && s.email) {
      const rows = hits.slice(0, 25).map((e) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${e.company_name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">${usd(e.amount_usd)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666">${(e.type || '').replace(/_/g, ' ')} ${e.stage || ''}</td></tr>`).join('');
      await resend.emails.send({
        from: 'EP Network <noreply@epinvesting.com>', to: s.email,
        subject: `${hits.length} new deal${hits.length > 1 ? 's' : ''} matching "${s.name}"`,
        html: `<div style="font-family:sans-serif;max-width:600px"><h2 style="color:#0f1a14">New deals in your saved search</h2><p style="color:#4a5568">${hits.length} new funding event${hits.length > 1 ? 's' : ''} matched <strong>${s.name}</strong>.</p><table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table><p style="margin-top:20px"><a href="${site}/admin/markets" style="background:#2d6a4f;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px">View in tracker</a></p></div>`,
      });
      emailed++;
    }
    await supabase.from('saved_searches').update({ last_notified_at: new Date().toISOString() }).eq('id', s.id);
  }
  return { checked: searches.length, emailed };
}
