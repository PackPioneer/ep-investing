"use client";

import { useEffect, useState } from "react";
import { Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/companies?limit=2000");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch companies");
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/companies/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      setCompanies(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  const filtered = companies.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.url?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500 mt-1">{companies.length} total</p>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 mb-6 focus-within:border-slate-400 transition-colors">
        <Search size={16} className="text-slate-400" />
        <input
          placeholder="Search by name or URL..."
          className="flex-1 bg-transparent text-sm outline-none text-slate-900 placeholder-slate-400"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">Clear</button>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left p-4 font-medium text-slate-600">Company</th>
              <th className="text-left p-4 font-medium text-slate-600">Stage</th>
              <th className="text-left p-4 font-medium text-slate-600">Tags</th>
              <th className="text-left p-4 font-medium text-slate-600">Linked user</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No companies found</td></tr>
            ) : paginated.map(c => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 flex-shrink-0 overflow-hidden">
                      {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain p-0.5" /> : (c.name?.[0] || "?")}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{c.name || "Unnamed"}</div>
                      {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-slate-600">{c.url.replace(/https?:\/\//, "")}</a>}
                    </div>
                  </div>
                </td>
                <td className="p-4 text-slate-600">{c.funding_stage?.replace(/_/g, " ") || "—"}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {(c.industry_tags || []).slice(0, 2).map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{t.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-xs text-slate-400 font-mono">{c.clerk_user_id ? "✓ linked" : "—"}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDelete(c.id, c.name)} className="text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">Showing {(page-1)*limit+1}–{Math.min(page*limit, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}