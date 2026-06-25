"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Search, RotateCcw, Loader2, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/companies?q=${encodeURIComponent(q || "")}`);
      const data = await res.json();
      setCompanies(Array.isArray(data.companies) ? data.companies : []);
    } catch {
      toast.error("Failed to fetch companies");
    }
    setLoading(false);
  }, []);

  // initial load
  useEffect(() => { fetchData(""); }, [fetchData]);

  // debounced server-side search
  useEffect(() => {
    const t = setTimeout(() => { fetchData(search); }, 350);
    return () => clearTimeout(t);
  }, [search, fetchData]);

  const setHidden = async (id, name, hide) => {
    if (hide && !confirm(`Hide "${name}"? It will be removed from listings, search, and the sitemap. You can unhide it later.`)) return;
    try {
      const res = await fetch("/api/admin/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: hide ? "hide" : "unhide" }),
      });
      if (!res.ok) throw new Error();
      toast.success(hide ? "Hidden" : "Restored");
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_hidden: hide } : c));
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
        <p className="text-sm text-slate-500 mt-1">Search the full directory. Hiding removes a company from all public surfaces (reversible).</p>
      </div>

      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 mb-6 focus-within:border-slate-400 transition-colors">
        <Search size={16} className="text-slate-400" />
        <input
          placeholder="Search all companies by name or URL..."
          className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder-slate-400"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading && <Loader2 size={16} className="animate-spin text-slate-400" />}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] gap-4 px-5 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Company</span>
          <span>Actions</span>
        </div>

        {companies.length === 0 && !loading && (
          <div className="px-5 py-8 text-sm text-slate-400 text-center">No companies found.</div>
        )}

        {companies.map(c => (
          <div key={c.id} className={`grid grid-cols-[1fr_auto] gap-4 items-center px-5 py-3 border-b border-slate-50 ${c.is_hidden ? "opacity-50" : ""}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <a href={`/companies/${c.slug || c.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold text-slate-900 hover:text-emerald-600 truncate">
                  {c.name}
                </a>
                <span className="text-xs text-slate-300">#{c.id}</span>
                {c.is_hidden && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Hidden</span>}
                {(c.claimed_by_clerk_user_id || c.clerk_organization_id) && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Claimed</span>}
              </div>
              {c.url && <div className="text-xs text-slate-400 truncate">{c.url}</div>}
            </div>
            <div className="flex items-center gap-2">
              {c.is_hidden ? (
                <button onClick={() => setHidden(c.id, c.name, false)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-slate-50">
                  <RotateCcw size={14} /> Unhide
                </button>
              ) : (
                <button onClick={() => setHidden(c.id, c.name, true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">
                  <Trash2 size={14} /> Hide
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {companies.length >= 100 && (
        <p className="text-xs text-slate-400 mt-3 text-center">Showing first 100 matches — refine your search to narrow results.</p>
      )}
    </div>
  );
}
