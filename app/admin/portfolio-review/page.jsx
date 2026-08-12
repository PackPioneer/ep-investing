"use client";

import { useEffect, useState } from "react";

export default function PortfolioReview() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/portfolio-review").then((r) => r.json()).then((d) => { setRows(Array.isArray(d.companies) ? d.companies : []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setBusy(id);
    await fetch("/api/admin/portfolio-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    setRows((prev) => prev.filter((c) => c.id !== id));
    setBusy(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Portfolio review</h1>
      <p className="text-sm text-slate-500 mb-6">New companies discovered from VC portfolios, hidden until you approve them. Approving makes the company public and keeps its investor link; rejecting deletes it.</p>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-8">Nothing waiting for review.</p>
      ) : (
        <>
          <div className="text-xs font-mono text-slate-400 mb-3">{rows.length} pending</div>
          <div className="flex flex-col gap-3">
            {rows.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  {c.logo_url ? <img src={c.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain border border-slate-100 p-1 flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold text-emerald-700 flex-shrink-0">{(c.name || "?")[0]}</div>}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                      {c.investor_name && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">via {c.investor_name}</span>}
                    </div>
                    {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 hover:underline break-all">{c.url}</a>}
                    {c.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>}
                    {Array.isArray(c.industry_tags) && c.industry_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.industry_tags.map((t) => <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{t.replace(/_/g, " ")}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button disabled={busy === c.id} onClick={() => act(c.id, "approve")} className="text-xs font-semibold bg-emerald-600 text-white rounded-lg px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-40">Approve</button>
                  <button disabled={busy === c.id} onClick={() => act(c.id, "reject")} className="text-xs text-red-500 hover:text-red-600 px-3 py-1">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
