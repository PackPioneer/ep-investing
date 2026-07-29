"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";

function usd(n) {
  if (n == null) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
}
const TYPE_LABELS = {
  venture_equity: "Venture", corporate_strategic: "Strategic", project_finance: "Project finance",
  debt: "Debt", grant: "Grant", fund_raise: "Fund close", m_and_a: "M&A", ipo_spac: "IPO / SPAC",
  offtake: "Offtake", ppa: "PPA",
};
const TYPE_COLOR = {
  venture_equity: "#7c3aed", corporate_strategic: "#0ea5e9", project_finance: "#2d6a4f",
  debt: "#d97706", grant: "#059669", fund_raise: "#db2777", m_and_a: "#4f46e5",
  ipo_spac: "#e11d48", offtake: "#0d9488", ppa: "#0891b2",
};

function Bars({ rows, max, label }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">{label}</p>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2 text-xs">
            <span className="w-28 truncate text-slate-600 capitalize">{TYPE_LABELS[r.key] || r.key}</span>
            <div className="flex-1 bg-slate-100 rounded h-4 overflow-hidden">
              <div className="h-4 rounded" style={{ width: `${Math.max(2, (r.capital / max) * 100)}%`, background: TYPE_COLOR[r.key] || "#2d6a4f" }} />
            </div>
            <span className="w-14 text-right font-mono text-slate-700">{usd(r.capital)}</span>
            <span className="w-10 text-right font-mono text-slate-400">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminMarketsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/markets").then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (!data || data.error) return <div className="p-6 text-sm text-red-600">Error: {data?.error || "no data"}</div>;

  const t = data.totals;
  const maxType = Math.max(...data.byType.map((r) => r.capital), 1);
  const maxGeo = Math.max(...data.byGeo.map((r) => r.capital), 1);
  const maxMonth = Math.max(...data.monthly.map((r) => r.capital), 1);

  const stat = (label, val, sub) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{val}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={18} className="text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Markets — funding tracker</h1>
        <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">admin preview</span>
      </div>
      <p className="text-sm text-slate-500 mb-5">Structured funding + commercial events from the news pipeline. Aggregates and low-confidence rows are excluded from the wire.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {stat("Capital tracked", usd(t.capitalUsd), `${t.dealCount} deals`)}
        {stat("Avg round", usd(t.avgRound), `median ${usd(t.medianRound)}`)}
        {stat("Total events", t.events, `${t.marketStat} aggregates hidden`)}
        {stat("Company-linked", `${t.resolved}`, `${t.unresolved} to add`)}
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-5">
        <Bars rows={data.byType} max={maxType} label="Capital by type" />
        <Bars rows={data.byGeo} max={maxGeo} label="Capital by geography" />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Capital + deals by month</p>
        <div className="flex items-end gap-1.5 h-32">
          {data.monthly.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${Math.max(2, (m.capital / maxMonth) * 100)}%` }} title={`${usd(m.capital)} · ${m.count} deals`} />
              <span className="text-[9px] text-slate-400 font-mono rotate-0">{m.month.slice(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400 px-4 pt-4 pb-2">Funding wire ({data.wire.length})</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium text-right">Amount</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium">Lead / buyer</th>
                <th className="px-3 py-2 font-medium">Geo</th>
              </tr>
            </thead>
            <tbody>
              {data.wire.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400 font-mono whitespace-nowrap">{e.announced_date?.slice(0, 10) || "—"}</td>
                  <td className="px-3 py-2 text-slate-800 font-medium">
                    {e.company_name || "—"}
                    {e.company_id && <span className="ml-1 text-emerald-600" title="linked to directory">•</span>}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700 whitespace-nowrap">
                    {e.amount_usd ? usd(e.amount_usd) : (e.commercial_volume ? `${e.commercial_volume} ${e.commercial_unit || ""}` : "—")}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: (TYPE_COLOR[e.type] || "#64748b") + "22", color: TYPE_COLOR[e.type] || "#64748b" }}>{TYPE_LABELS[e.type] || e.type}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-500">{e.stage || "—"}</td>
                  <td className="px-3 py-2 text-slate-500 max-w-[180px] truncate">{e.counterparty || (e.investors || []).join(", ") || "—"}</td>
                  <td className="px-3 py-2 text-slate-400">{e.geography || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
