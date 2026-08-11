"use client";

import { useEffect, useState } from "react";

export default function AdminJobs() {
  const [cQuery, setCQuery] = useState("");
  const [cResults, setCResults] = useState([]);
  const [selectedCo, setSelectedCo] = useState(null);
  const [url, setUrl] = useState("");
  const [sector, setSector] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cQuery.trim() || (selectedCo && selectedCo.name === cQuery)) { setCResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/companies?q=${encodeURIComponent(cQuery)}&limit=8`).then((r) => r.json()).then((d) => setCResults(Array.isArray(d) ? d : [])).catch(() => setCResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [cQuery, selectedCo]);

  const scrape = async () => {
    if (!selectedCo || !url.trim()) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/admin/company-jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: selectedCo.id, url: url.trim(), sector: sector.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || `Failed (${res.status})`); }
      else setResult(data);
    } catch (e) { setError(e.message || "Network error"); }
    finally { setBusy(false); }
  };

  const reset = () => { setSelectedCo(null); setCQuery(""); setUrl(""); setSector(""); setResult(null); setError(""); };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Jobs — scrape a careers page</h1>
      <p className="text-sm text-slate-500 mb-6">Pick a company, paste its careers-page or ATS URL (Lever, Greenhouse, and Ashby links are read directly; anything else is parsed with AI). Jobs are published to the board and the company profile, linked back to the original posting.</p>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        {/* Company picker */}
        <div className="relative">
          <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Company</label>
          {selectedCo ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-800">{selectedCo.name}</span>
              <button onClick={() => { setSelectedCo(null); setCQuery(""); }} className="text-xs text-slate-400 hover:text-red-500">change</button>
              <a href={`/companies/${selectedCo.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 hover:underline ml-auto">view profile →</a>
            </div>
          ) : (
            <>
              <input value={cQuery} onChange={(e) => setCQuery(e.target.value)} placeholder="Search company…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
              {cResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {cResults.map((c) => (
                    <button key={c.id} onClick={() => { setSelectedCo({ id: c.id, name: c.name }); setCResults([]); setCQuery(c.name); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{c.name}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* URL */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Careers page / ATS URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://jobs.lever.co/acme  ·  https://boards.greenhouse.io/acme  ·  https://acme.com/careers" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
        </div>

        {/* Sector override */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Sector (optional — defaults to the company's)</label>
          <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. green_hydrogen" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
        </div>

        {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex gap-2">
          <button onClick={scrape} disabled={busy || !selectedCo || !url.trim()} className="text-sm font-semibold bg-emerald-600 text-white rounded-lg px-5 py-2 hover:bg-emerald-700 disabled:opacity-40">
            {busy ? "Scraping…" : "Scrape jobs"}
          </button>
          {(result || error) && <button onClick={reset} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2">Reset</button>}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-sm font-semibold text-slate-900">{result.company?.name}</span>
            <span className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{result.method === "ai" ? "AI-parsed" : result.method}</span>
            <span className="text-xs text-slate-500 ml-auto">Found {result.found} · <span className="text-emerald-700 font-medium">Added {result.inserted}</span> · Skipped {result.skipped} (already listed)</span>
          </div>
          {result.jobs?.length > 0 ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {result.jobs.map((j, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm text-slate-800 truncate">{j.title}</div>
                    <div className="text-xs text-slate-400">{j.location}</div>
                  </div>
                  {j.apply_url && <a href={j.apply_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 hover:underline flex-shrink-0">posting →</a>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{result.message || "No new jobs added."}</p>
          )}
          <div className="mt-4 flex gap-4">
            <a href={`/companies/${result.company?.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-700 hover:underline">View on company profile →</a>
            <a href="/jobs" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-emerald-700 hover:underline">View jobs board →</a>
          </div>
        </div>
      )}
    </div>
  );
}
