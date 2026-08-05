"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const CAT_LABEL = { partnership: "Partnership", raise_open: "Raise — open", raise_close: "Raise — closed", product: "New product", award: "Award / grant", hire: "Key hire", milestone: "Milestone", expansion: "Expansion", other: "Other" };
const usd = (n) => (n == null || n === "" ? null : "$" + Number(n).toLocaleString());

function meta(a) {
  const m = a.meta || {};
  const bits = [];
  if (m.partner_name) bits.push(`Partner: ${m.partner_name}`);
  if (m.round_type) bits.push(m.round_type);
  if (m.amount_usd) bits.push(usd(m.amount_usd));
  if (m.amount_target_usd) bits.push(`target ${usd(m.amount_target_usd)}`);
  if (m.lead_investor) bits.push(`lead: ${m.lead_investor}`);
  if (m.close_date) bits.push(m.close_date);
  if (m.product_name) bits.push(m.product_name);
  if (m.award_name) bits.push(m.award_name);
  if (m.grantor) bits.push(`by ${m.grantor}`);
  return bits.join(" · ");
}

export default function AdminAnnouncements() {
  const [tab, setTab] = useState("published");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = (status) => { setLoading(true); fetch(`/api/admin/announcements?status=${status}`).then((r) => r.json()).then((d) => { setRows(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(tab); }, [tab]);

  const act = async (id, action, review_note) => {
    setBusy(id);
    await fetch("/api/admin/announcements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, review_note }) });
    setBusy(null);
    load(tab);
  };
  const takedown = (id) => { const note = prompt("Reason (shown to the company):"); if (note !== null) act(id, "takedown", note); };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Announcements — moderation</h1>
      <p className="text-sm text-slate-500 mb-4">Announcements from vetted companies publish instantly. Moderate here — take down anything off-base, or boost the best ones.</p>

      <div className="flex gap-2 mb-5">
        {["published", "rejected", "all"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded-full border ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{t}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="animate-spin text-emerald-600" /></div>
        : rows.length === 0 ? <p className="text-sm text-slate-400 py-8">Nothing here.</p>
        : (
          <div className="flex flex-col gap-3">
            {rows.map((a) => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{CAT_LABEL[a.category] || a.category}</span>
                      <span className="text-sm font-semibold text-slate-900">{a.company?.name || "—"}</span>
                      {a.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Boosted</span>}
                    </div>
                    <div className="text-sm text-slate-800">{a.title}</div>
                    {meta(a) && <div className="text-xs text-slate-500 mt-0.5">{meta(a)}</div>}
                    {a.body && <div className="text-xs text-slate-500 mt-1">{a.body}</div>}
                    {a.link_url && <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 hover:underline mt-1 inline-block">{a.link_url}</a>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {a.status === "published" && (
                      <>
                        <button disabled={busy === a.id} onClick={() => act(a.id, a.is_featured ? "unfeature" : "feature")} className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 border border-violet-200 text-violet-700 hover:bg-violet-50">{a.is_featured ? "Un-boost" : "Boost"}</button>
                        <button disabled={busy === a.id} onClick={() => takedown(a.id)} className="text-xs text-red-500 hover:text-red-600 px-3 py-1">Take down</button>
                      </>
                    )}
                    {a.status === "rejected" && (
                      <button disabled={busy === a.id} onClick={() => act(a.id, "restore")} className="text-xs text-emerald-600 hover:text-emerald-700 px-3 py-1">Restore</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
