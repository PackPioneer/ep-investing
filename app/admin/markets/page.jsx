"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Loader2, X, Bookmark, Bell } from "lucide-react";

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

const REGION = new Set(["africa", "asia", "europe", "global", "mena", "latam", "oceania", "middle east", "north america", "south america", "apac", "worldwide", "international", "eu", "emea"]);
const CTRY_ALIAS = { usa: "United States", us: "United States", "u.s.": "United States", "u.s.a.": "United States", "united states of america": "United States", uk: "United Kingdom", "u.k.": "United Kingdom", "great britain": "United Kingdom", britain: "United Kingdom", england: "United Kingdom", scotland: "United Kingdom", wales: "United Kingdom" };
function normCountry(g) {
  if (!g) return null;
  let s = String(g).trim();
  if (s.includes(",")) s = s.split(",").pop().trim();   // "Louisiana, USA" -> "USA"
  const low = s.toLowerCase();
  if (REGION.has(low)) return null;                      // drop continents / regions
  return CTRY_ALIAS[low] || s;
}

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
  const [saved, setSaved] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [wireQ, setWireQ] = useState("");
  const [wireOpen, setWireOpen] = useState(false);
  const [range, setRange] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const { user } = useUser();

  useEffect(() => {
    fetch("/api/admin/markets").then((r) => r.json()).then((d) => { setEvents(d.events || []); setMeta(d.meta || {}); setLoading(false); }).catch(() => setLoading(false));
    fetch("/api/admin/markets/quotes").then((r) => r.json()).then((d) => setQuotes(Array.isArray(d) ? d : [])).catch(() => {});
    loadSaved();
  }, []);

  const loadSaved = () => fetch("/api/admin/saved-searches").then((r) => r.json()).then((d) => setSaved(Array.isArray(d) ? d : [])).catch(() => {});
  const currentFilters = () => ({ type, sector, stage, geo, q, range });
  const filterName = () => [TYPE_LABELS[type] || type, sector && label(sector), stage && label(stage), geo, q, range !== "all" && range].filter(Boolean).join(" · ") || "All events";
  const saveSearch = async () => {
    await fetch("/api/admin/saved-searches", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: filterName(), filters: currentFilters(), email: user?.primaryEmailAddress?.emailAddress }) });
    loadSaved();
  };
  const applySearch = (f) => { setType(f.type || ""); setSector(f.sector || ""); setStage(f.stage || ""); setGeo(f.geo || ""); setQ(f.q || ""); setRange(f.range || "all"); };
  const deleteSearch = async (id) => { await fetch(`/api/admin/saved-searches?id=${id}`, { method: "DELETE" }); loadSaved(); };

  const opts = useMemo(() => {
    const uniq = (k) => [...new Set(events.map((e) => e[k]).filter(Boolean))].sort();
    return { types: uniq("type"), sectors: uniq("sector"), stages: uniq("stage"), geos: [...new Set(events.map((e) => normCountry(e.geography)).filter(Boolean))].sort() };
  }, [events]);

  const filtered = useMemo(() => events.filter((e) => {
    if (type && e.type !== type) return false;
    if (sector && e.sector !== sector) return false;
    if (stage && e.stage !== stage) return false;
    if (geo && normCountry(e.geography) !== geo) return false;
    if (range !== "all") {
      const d = e.announced_date ? new Date(e.announced_date) : null;
      if (!d) return false;
      if (range === "ytd") { if (d < new Date(new Date().getFullYear(), 0, 1)) return false; }
      else { const days = range === "90d" ? 90 : 365; if ((Date.now() - d.getTime()) / 864e5 > days) return false; }
    }
    if (q) { const s = (e.company_name + " " + (e.counterparty || "") + " " + (e.investors || []).join(" ")).toLowerCase(); if (!s.includes(q.toLowerCase())) return false; }
    return true;
  }), [events, type, sector, stage, geo, q, range]);

  const agg = useMemo(() => {
    const cap = filtered.filter((e) => e.category === "capital" && e.amount_usd);
    const sum = (a) => a.reduce((s, r) => s + (r.amount_usd || 0), 0);
    const grp = (arr, key) => { const m = {}; for (const r of arr) { const k = r[key] || "unknown"; (m[k] ||= { count: 0, capital: 0 }); m[k].count++; m[k].capital += r.amount_usd || 0; } return Object.entries(m).map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.capital - a.capital); };
    const amts = cap.map((r) => r.amount_usd).sort((a, b) => a - b);
    return {
      capital: sum(cap), deals: cap.length, events: filtered.length,
      avg: cap.length ? Math.round(sum(cap) / cap.length) : null,
      median: amts.length ? amts[Math.floor(amts.length / 2)] : null,
      byType: grp(cap, "type"), bySector: grp(cap, "sector").slice(0, 12),
      byGeo: grp(cap.map((r) => ({ ...r, _c: normCountry(r.geography) })).filter((r) => r._c), "_c").slice(0, 12),
    };
  }, [filtered]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

  const active = type || sector || stage || geo || q || range !== "all";
  const wireBase = wireQ ? filtered.filter((e) => (e.company_name || "").toLowerCase().includes(wireQ.toLowerCase())) : filtered;
  const wireRows = sortBy === "amount" ? [...wireBase].sort((a, b) => (b.amount_usd || 0) - (a.amount_usd || 0)) : wireBase;
  const wireShown = wireOpen ? wireRows.slice(0, 400) : wireRows.slice(0, 8);
  const quoteAsOf = quotes.map((x) => x.updated_at).filter(Boolean).sort().slice(-1)[0];
  const stat = (l, v, s, tip) => (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
        {l}
        {tip && (
          <span className="relative group cursor-help">
            <span className="text-slate-300">ⓘ</span>
            <span className="pointer-events-none absolute left-0 top-6 z-30 hidden group-hover:block w-60 rounded-lg bg-slate-800 text-white text-[11px] leading-snug font-normal normal-case tracking-normal px-3 py-2 shadow-lg">{tip}</span>
          </span>
        )}
      </p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{v}</p>
      {s && <p className="text-xs text-slate-400 mt-0.5">{s}</p>}
    </div>
  );
  const maxT = Math.max(...agg.byType.map((r) => r.capital), 1);
  const maxS = Math.max(...agg.bySector.map((r) => r.capital), 1);
  const maxG = Math.max(...agg.byGeo.map((r) => r.capital), 1);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold text-slate-900">Markets — funding tracker</h1>
      </div>
      <p className="text-sm text-slate-500 mb-4">Every climate & energy funding event we track — filter by type, sector, stage, date, or geography and it all recomputes.</p>

      {quotes.filter((q) => q.price).length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">EP Climate basket — public markets{quoteAsOf && <span className="ml-2 normal-case tracking-normal text-slate-300">prices as of {new Date(quoteAsOf).toLocaleDateString()}</span>}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quotes.filter((q) => q.price).map((q) => (
              <div key={q.ticker} className="flex-shrink-0 bg-white border border-slate-200 rounded-lg px-3 py-2 min-w-[110px]">
                <div className="text-xs font-semibold text-slate-800">{q.ticker}</div>
                <div className="text-sm font-mono text-slate-900">${Number(q.price).toFixed(2)}</div>
                <div className={`text-xs font-mono ${q.change_pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>{q.change_pct >= 0 ? "+" : ""}{Number(q.change_pct ?? 0).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search company or investor…" className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-56 focus:outline-none focus:border-emerald-400" />
        <Select value={type} onChange={setType} options={opts.types} placeholder="All types" />
        <Select value={sector} onChange={setSector} options={opts.sectors} placeholder="All sectors" />
        <Select value={stage} onChange={setStage} options={opts.stages} placeholder="All stages" />
        <Select value={geo} onChange={setGeo} options={opts.geos} placeholder="All geographies" />
        <select value={range} onChange={(e) => setRange(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-emerald-400">
          <option value="all">All time</option>
          <option value="90d">Last 90 days</option>
          <option value="ytd">Year to date</option>
          <option value="12mo">Last 12 months</option>
        </select>
        {active && <button onClick={() => { setType(""); setSector(""); setStage(""); setGeo(""); setQ(""); setRange("all"); }} className="text-xs text-slate-500 hover:text-red-600 inline-flex items-center gap-1"><X size={12} /> Clear</button>}
        {active && <button onClick={saveSearch} className="text-xs text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"><Bookmark size={12} /> Save search + alert</button>}
      </div>
      {!active && <p className="text-[11px] text-slate-400 mb-5">Tip: apply a filter, then <span className="text-emerald-700">Save search + alert</span> to get emailed when new matching deals land.</p>}

      {saved.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 inline-flex items-center gap-1"><Bell size={11} /> Saved</span>
          {saved.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full pl-3 pr-1.5 py-1">
              <button onClick={() => applySearch(s.filters)} className="hover:underline">{s.name}</button>
              <button onClick={() => deleteSearch(s.id)} className="text-emerald-400 hover:text-red-500"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {stat("Capital tracked", usd(agg.capital), `across ${agg.deals} deals`)}
        {stat("Median round", usd(agg.median), "midpoint deal size")}
        {stat("Events shown", agg.events, active ? "filtered" : `${meta.marketStat || 0} market-wide totals set aside`)}
        {stat("In our database", filtered.filter((e) => e.company_id).length, `of ${filtered.length} deals shown`)}
      </div>

      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <Bars rows={agg.byType} max={maxT} title="Capital by type" />
        <Bars rows={agg.bySector} max={maxS} title="Capital by sector" />
      </div>
      <div className="mb-5">
        <Bars rows={agg.byGeo} max={maxG} title="Capital by geography" />
        <p className="text-[11px] text-slate-400 mt-1">Country-tagged deals only — region-wide events (e.g. "Europe") are excluded, so this won't sum to total capital.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Funding wire ({wireRows.length})</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
              <span>sort</span>
              <button onClick={() => setSortBy("date")} className={sortBy === "date" ? "text-emerald-700" : "hover:text-slate-600"}>date</button>
              <span>·</span>
              <button onClick={() => setSortBy("amount")} className={sortBy === "amount" ? "text-emerald-700" : "hover:text-slate-600"}>amount</button>
            </div>
            <input value={wireQ} onChange={(e) => setWireQ(e.target.value)} placeholder="Search companies…" className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:border-emerald-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr><th className="px-3 py-2 font-medium">Date</th><th className="px-3 py-2 font-medium">Company</th><th className="px-3 py-2 font-medium text-right">Amount</th><th className="px-3 py-2 font-medium">Type</th><th className="px-3 py-2 font-medium">Sector</th><th className="px-3 py-2 font-medium">Stage</th><th className="px-3 py-2 font-medium">Lead / buyer</th><th className="px-3 py-2 font-medium">Geo</th></tr>
            </thead>
            <tbody>
              {wireShown.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400 font-mono whitespace-nowrap">{e.announced_date?.slice(0, 10) || "—"}</td>
                  <td className="px-3 py-2 text-slate-800 font-medium">
                    {e.company_id
                      ? <Link href={`/companies/${e.company_id}`} className="hover:text-emerald-700 hover:underline">{e.company_name || "—"}<span className="ml-1 text-emerald-600" title="view profile">›</span></Link>
                      : (e.company_name || "—")}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700 whitespace-nowrap">{e.amount_usd ? usd(e.amount_usd) : (e.commercial_volume ? `${e.commercial_volume} ${e.commercial_unit || ""}` : "—")}</td>
                  <td className="px-3 py-2"><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: (TYPE_COLOR[e.type] || "#64748b") + "22", color: TYPE_COLOR[e.type] || "#64748b" }}>{TYPE_LABELS[e.type] || e.type}</span></td>
                  <td className="px-3 py-2 text-slate-500">{label(e.sector) || "—"}</td>
                  <td className="px-3 py-2 text-slate-500">{e.stage || "—"}</td>
                  <td className="px-3 py-2 text-slate-500 max-w-[160px] truncate">{e.counterparty || (e.investors || []).join(", ") || "—"}</td>
                  <td className="px-3 py-2 text-slate-400">{normCountry(e.geography) || e.geography || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {wireRows.length > 8 && (
          <button onClick={() => setWireOpen((v) => !v)} className="w-full text-xs text-emerald-700 hover:bg-slate-50 py-2.5 border-t border-slate-100">
            {wireOpen ? "Show less" : `Show ${wireRows.length - 8} more`}
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-4">Sources: EP news wire, SEC filings, and companies self-reporting on EP. Aggregates and low-confidence rows are excluded.</p>
    </div>
  );
}
