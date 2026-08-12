"use client";

import { useEffect, useState } from "react";

export default function VcPortfolioAdmin() {
  const [invAll, setInvAll] = useState([]);
  const [invQuery, setInvQuery] = useState("");
  const [investor, setInvestor] = useState(null);

  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [error, setError] = useState("");

  const [cQuery, setCQuery] = useState("");
  const [cResults, setCResults] = useState([]);

  useEffect(() => { fetch("/api/investors").then((r) => r.json()).then((d) => setInvAll(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const invResults = invQuery.trim() && !investor
    ? invAll.filter((i) => (i.name || "").toLowerCase().includes(invQuery.toLowerCase())).slice(0, 8) : [];

  const loadLinks = (id) => {
    setLoadingLinks(true);
    fetch(`/api/admin/vc-portfolio?investor_id=${id}`).then((r) => r.json()).then((d) => { setLinks(Array.isArray(d.companies) ? d.companies : []); setLoadingLinks(false); }).catch(() => setLoadingLinks(false));
  };

  const pickInvestor = (i) => { setInvestor({ id: i.id, name: i.name }); setInvQuery(i.name); setScrapeResult(null); setError(""); loadLinks(i.id); };

  useEffect(() => {
    if (!cQuery.trim()) { setCResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/companies?q=${encodeURIComponent(cQuery)}&limit=8`).then((r) => r.json()).then((d) => setCResults(Array.isArray(d) ? d : [])).catch(() => setCResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [cQuery]);

  const scrape = async () => {
    if (!investor || !url.trim()) return;
    setScraping(true); setError(""); setScrapeResult(null);
    try {
      const res = await fetch("/api/admin/vc-portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "scrape", investor_id: investor.id, url: url.trim() }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || `Failed (${res.status})`);
      else { setScrapeResult(data); loadLinks(investor.id); }
    } catch (e) { setError(e.message || "Network error"); }
    finally { setScraping(false); }
  };

  const tagCompany = async (c) => {
    await fetch("/api/admin/vc-portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "link", investor_id: investor.id, company_id: c.id }) });
    setCQuery(""); setCResults([]); loadLinks(investor.id);
  };

  const removeLink = async (companyId) => {
    await fetch("/api/admin/vc-portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unlink", investor_id: investor.id, company_id: companyId }) });
    setLinks((prev) => prev.filter((c) => c.id !== companyId));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">VC portfolios</h1>
      <p className="text-sm text-slate-500 mb-6">Look up an investor, then import their portfolio from a page (AI reads it and links companies you already list — new ones go to Portfolio Review), or tag companies by hand. Linked companies appear on the investor's profile and click through to their EP page.</p>

      {/* Investor picker */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Investor</label>
        {investor ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-slate-800">{investor.name}</span>
            <button onClick={() => { setInvestor(null); setInvQuery(""); setLinks([]); setScrapeResult(null); }} className="text-xs text-slate-400 hover:text-red-500">change</button>
          </div>
        ) : (
          <div className="relative">
            <input value={invQuery} onChange={(e) => setInvQuery(e.target.value)} placeholder="Search investors…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
            {invResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                {invResults.map((i) => <button key={i.id} onClick={() => pickInvestor(i)} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{i.name}</button>)}
              </div>
            )}
          </div>
        )}
      </div>

      {investor && (
        <>
          {/* Import from portfolio page */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
            <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Import from portfolio page</label>
            <div className="flex gap-2">
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://vc.com/portfolio" className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
              <button onClick={scrape} disabled={scraping || !url.trim()} className="text-sm font-semibold bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 disabled:opacity-40 flex-shrink-0">{scraping ? "Reading…" : "Import"}</button>
            </div>
            {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">{error}</div>}
            {scrapeResult && (
              <div className="text-xs text-slate-600 mt-3 space-y-1">
                <div>Found {scrapeResult.found ?? 0} · <span className="text-emerald-700 font-medium">Linked {scrapeResult.linked?.length ?? 0}</span> existing · Queued {scrapeResult.pending?.length ?? 0} new (in Portfolio Review)</div>
                {scrapeResult.message && <div className="text-slate-400">{scrapeResult.message}</div>}
                {scrapeResult.pending?.length > 0 && <div className="text-slate-400">New: {scrapeResult.pending.map((p) => p.name).join(", ")}</div>}
              </div>
            )}
          </div>

          {/* Manual tag */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
            <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Tag a company by hand</label>
            <div className="relative">
              <input value={cQuery} onChange={(e) => setCQuery(e.target.value)} placeholder="Search your directory…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
              {cResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {cResults.map((c) => <button key={c.id} onClick={() => tagCompany(c)} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{c.name}</button>)}
                </div>
              )}
            </div>
          </div>

          {/* Current portfolio */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-900">Portfolio ({links.length})</span>
              {loadingLinks && <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />}
            </div>
            {links.length === 0 ? (
              <p className="text-sm text-slate-400">No companies linked yet.</p>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100">
                {links.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <a href={`/companies/${c.slug || c.id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-800 hover:text-emerald-700 truncate">{c.name}</a>
                      {c.is_hidden && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">pending</span>}
                    </div>
                    <button onClick={() => removeLink(c.id)} className="text-xs text-red-500 hover:text-red-600 flex-shrink-0">remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
