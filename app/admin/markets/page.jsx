"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, TrendingUp, X } from "lucide-react";

function usd(n) {
  if (n == null) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
}
const TYPE_LABELS = { venture_equity: "Venture", corporate_strategic: "Strategic", project_finance: "Project finance", debt: "Debt", grant: "Grant", fund_raise: "Fund close", m_and_a: "M&A", ipo_spac: "IPO / SPAC", offtake: "Offtake", ppa: "PPA" };
const TYPE_COLOR = { venture_equity: "#7c3aed", corporate_strategic: "#0ea5e9", project_finance: "#2d6a4f", debt: "#d97706", grant: "#059669", fund_raise: "#db2777", m_and_a: "#4f46e5", ipo_spac: "#e11d48", offtake: "#0d9488", ppa: "#0891b2" };
const label = (s) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function Bars({ rows, max, title }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {rows.length === 0 && <p className="text-xs text-slate-400">No data for this filter.</p>}
        {rows.map((r) => (
          <div key={r.key} className="flex items-center gap-2 text-xs">
            <span className="w-28 truncate text-slate-600">{TYPE_LABELS[r.key] || label(r.key)}</span>
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

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-emerald-400">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{TYPE_LABELS[o] || label(o)}</option>)}
    </select>
  );
}

export default function AdminMarketsPage() {
  const [events, setEvents] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [sector, setSector] = useState("");
  const [stage, setStage] = useState("");
  const [geo, setGeo] = useState("");

  useEffect(() => {
    fetch("/api/admin/markets").then((r) => r.json()).then((d) => { setEvents(d.events || []); setMeta(d.meta || {}); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const opts = useMemo(() => {
    const uniq = (k) => [...new Set(events.map((e) => e[k]).filter(Boolean))].sort();
    return { types: uniq("type"), sectors: uniq("sector"), stages: uniq("stage"), geos: uniq("geography") };
  }, [events]);

  const filtered = useMemo(() => events.filter((e) => {
    if (type && e.type !== type) return false;
    if (sector && e.sector !== sector) return false;
    if (stage && e.stage !== stage) return false;
    if (geo && e.geography !== geo) return false;
    if (q) { const s = (e.company_name + " " + (e.counterparty || "") + " " + (e.investors || []).join(" ")).toLowerCase(); if (!s.includes(q.toLowerCase())) return false; }
    return true;
  }), [events, type, sector, stage, geo, q]);

  const agg = useMemo(() => {
    const cap = filtered.filter((e) => e.category === "capital" && e.amount_usd);
    const sum = (a) => a.reduce((s, r) => s + (r.amount_usd || 0), 0);
    const grp = (arr, key) => { const m = {}; for (const r of arr) { const k = r[key] || "unknown"; (m[k] ||= { count: 0, capital: 0 }); m[k].count++; m[k].capital += r.amount_usd || 0; } return Object.entries(m).map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.capital - a.capital); };
    const amts = cap.map((r) => r.amount_usd).sort((a, b) => a - b);
    return {
      capital: sum(cap), deals: cap.length, events: filtered.length,
      avg: cap.length ? Math.round(sum(cap) / cap.length) : null,
      median: amts.length ? amts[Math.floor(amts.length / 2)] : null,
      byType: grp(cap, "type"), bySector: grp(cap, "sector").slice(0, 12), byGeo: grp(cap, "geography").slice(0, 12),
    };
  }, [filtered]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

  const active = type || sector || stage || geo || q;
  const stat = (l, v, s) => (<div className="bg-white border border-slate-200 rounded-xl p-4"><p className="text-xs font-mono uppercase tracking-wider text-slate-400">{l}</p><p className="text-2xl font-semibold text-slate-900 mt-1">{v}</p>{s && <p className="text-xs text-slate-400 mt-0.5">{s}</p>}</div>);
  const maxT = Math.max(...agg.byType.map((r) => r.capital), 1);
  const maxS = Math.max(...agg.bySector.map((r) => r.capital), 1);
  const maxG = Math.max(...agg.byGeo.map((r) => r.capital), 1);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp size={18} className="text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Markets — funding tracker</h1>
        <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">admin preview</span>
      </div>
      <p className="text-sm text-slate-500 mb-4">Filter by type, sector, stage, or geography — everything recomputes. Aggregates and low-confidence rows are excluded.</p>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company or investor…" className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-56 focus:outline-none focus:border-emerald-400" />
        <Select value={type} onChange={setType} options={opts.types} placeholder="All types" />
        <Select value={sector} onChange={setSector} options={opts.sectors} placeholder="All sectors" />
        <Select value={stage} onChange={setStage} options={opts.stages} placeholder="All stages" />
        <Select value={geo} onChange={setGeo} options={opts.geos} placeholder="All geographies" />
        {active && <button onClick={() => { setType(""); setSector(""); setStage(""); setGeo(""); setQ(""); }} className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1"><X size={12} /> Clear</button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {stat("Capital tracked", usd(agg.capital), `${agg.deals} deals`)}
        {stat("Avg round", usd(agg.avg), `median ${usd(agg.median)}`)}
        {stat("Events shown", agg.events, active ? "filtered" : `${meta.marketStat || 0} aggregates hidden`)}
        {stat("Company-linked", filtered.filter((e) => e.company_id).length, `${filtered.filter((e) => !e.company_id).length} to add`)}
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <Bars rows={agg.byType} max={maxT} title="Capital by type" />
        <Bars rows={agg.bySector} max={maxS} title="Capital by sector" />
      </div>
      <div className="mb-5"><Bars rows={agg.byGeo} max={maxG} title="Capital by geography" /></div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400 px-4 pt-4 pb-2">Funding wire ({filtered.length})</p>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left sticky top-0">
              <tr><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Company</th><th className="px-3 py-2 font-medium text-right">Amount</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Sector</th><th className="px-3 py-2 font-medium">Stage</th><th className="px-3 py-2 font-medium">Lead / buyer</th><th className="px-3 py-2 font-medium">Geo</th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 400).map((e) => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400 font-mono whitespace-nowrap">{e.announced_date?.slice(0, 10) || "—"}</td>
                  <td className="px-3 py-2 text-slate-800 font-medium">{e.company_name || "—"}{e.company_id && <span className="ml-1 text-emerald-600" title="linked">•</span>}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700 whitespace-nowrap">{e.amount_usd ? usd(e.amount_usd) : (e.commercial_volume ? `${e.commercial_volume} ${e.commercial_unit || ""}` : "—")}</td>
                  <td className="px-3 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: (TYPE_COLOR[e.type] || "#64748b") + "22", color: TYPE_COLOR[e.type] || "#64748b" }}>{TYPE_LABELS[e.type] || e.type}</span></td>
                  <td className="px-3 py-2 text-slate-500">{label(e.sector) || "—"}</td>
                  <td className="px-3 py-2 text-slate-500">{e.stage || "—"}</td>
                  <td className="px-3 py-2 text-slate-500 max-w-[160px] truncate">{e.counterparty || (e.investors || []).join(", ") || "—"}</td>
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
