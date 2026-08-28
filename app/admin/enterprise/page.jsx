"use client";

import { useEffect, useState } from "react";

const INTEREST_LABEL = {
  network: "Network access",
  investor_intro: "Investor intros",
  partner_intro: "Partnership intros",
  deal_flow: "Deal-flow placement",
  rfp: "RFP priority",
  other: "Other",
};
const STATUS = {
  new: "bg-amber-50 text-amber-700 border-amber-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};
const when = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

function Row({ row, onChange }) {
  const [notes, setNotes] = useState(row.admin_notes || "");
  const [busy, setBusy] = useState(false);
  const patch = async (body) => {
    setBusy(true);
    await fetch("/api/admin/enterprise", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: row.id, ...body }) });
    setBusy(false); onChange();
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS[row.status] || STATUS.new}`}>{row.status}</span>
            <span className="text-sm font-semibold text-gray-900">{row.company_name || "—"}</span>
            <span className="text-xs text-gray-400">{when(row.created_at)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-1">
            {(row.interests || []).map((i) => <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{INTEREST_LABEL[i] || i}</span>)}
          </div>
          {row.note && <div className="text-sm text-gray-600 mt-1">{row.note}</div>}
          <div className="text-xs text-gray-500 mt-1">{row.contact_name || "—"} · {row.contact_email || "—"}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {row.status !== "in_progress" && <button disabled={busy} onClick={() => patch({ status: "in_progress" })} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50">Working</button>}
          {row.status !== "closed" && <button disabled={busy} onClick={() => patch({ status: "closed" })} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">Close</button>}
          {row.status !== "new" && <button disabled={busy} onClick={() => patch({ status: "new" })} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1">Reopen</button>}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes…" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-400" />
        <button disabled={busy} onClick={() => patch({ admin_notes: notes })} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Save</button>
      </div>
    </div>
  );
}

export default function AdminEnterprise() {
  const [tab, setTab] = useState("new");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = (status) => { setLoading(true); fetch(`/api/admin/enterprise?status=${status}`).then((r) => r.json()).then((d) => { setRows(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(tab); }, [tab]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Enterprise inquiries</h1>
      <p className="text-sm text-slate-500 mb-4">Companies who asked to talk to sales — facilitated intros, deal-flow placement, RFP priority.</p>
      <div className="flex gap-2 mb-5">
        {["new", "in_progress", "closed", "all"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded-full border ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{t.replace("_", " ")}</button>
        ))}
      </div>
      {loading ? <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
        : rows.length === 0 ? <p className="text-sm text-slate-400 py-8">Nothing here.</p>
        : <div className="flex flex-col gap-3">{rows.map((r) => <Row key={r.id} row={r} onChange={() => load(tab)} />)}</div>}
    </div>
  );
}
