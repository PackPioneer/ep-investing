"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function ResearcherRow({ r }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-900">{r.name || "Unnamed"}</span>
          </div>
          <div className="text-sm text-slate-500 mt-0.5">{r.email}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>
      {expanded && r.notes && (
        <div className="border-t border-slate-100 p-5 bg-slate-50">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">Details</div>
          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{r.notes}</pre>
        </div>
      )}
    </div>
  );
}

export default function ResearchersAdmin() {
  const [researchers, setResearchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/researcher-applications")
      .then(r => r.json())
      .then(data => { setResearchers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = researchers.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Researchers</h1>
          <p className="text-sm text-slate-500 mt-1">{researchers.length} total signups</p>
        </div>
      </div>
      <input
        placeholder="Search by name or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-6 outline-none focus:border-slate-400"
      />
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No researchers found.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => <ResearcherRow key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}