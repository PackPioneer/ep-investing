"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Trash2, Edit3, ExternalLink } from "lucide-react";

function formatUSD(min, max) {
  if (!min && !max) return null;
  const fmt = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function GrantsList() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/ngos/me/grants")
      .then(r => r.json())
      .then(d => { setGrants(d.grants ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!confirm("Delete this grant program? This cannot be undone.")) return;
    const res = await fetch(`/api/ngos/me/grants/${id}`, { method: "DELETE" });
    if (res.ok) {
      setGrants(prev => prev.filter(g => g.id !== id));
    } else {
      alert("Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">Grant programs</h2>
          <p className="text-sm text-[#718096] mt-1">{grants.length} published</p>
        </div>
        <Link href="/dashboard/ngo/grants/new"
          className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#235a40] transition-colors">
          <Plus size={13} /> New grant
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-[#718096]">Loading...</div>
      ) : grants.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#e2e6ed] rounded-2xl bg-white">
          <FileText size={32} className="text-[#d0d6e0] mx-auto mb-4" />
          <p className="text-sm text-[#4a5568] mb-1">No grant programs yet</p>
          <p className="text-xs text-[#718096] mb-5">Publish your first grant to get applications from climate companies.</p>
          <Link href="/dashboard/ngo/grants/new"
            className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#235a40] transition-colors">
            <Plus size={13} /> Publish a grant
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {grants.map(g => (
            <div key={g.id} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#0f1a14] mb-1">{g.title}</div>
                  <div className="flex items-center gap-3 text-[11px] text-[#718096] flex-wrap">
                    {formatUSD(g.amount_min_usd, g.amount_max_usd) && (
                      <span className="font-mono font-semibold text-[#2d6a4f]">
                        {formatUSD(g.amount_min_usd, g.amount_max_usd)}
                      </span>
                    )}
                    {g.deadline_date && <span>Deadline: {formatDate(g.deadline_date)}</span>}
                    {g.country && <span>{g.country}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {g.application_url && (
                    <a href={g.application_url} target="_blank" rel="noopener noreferrer"
                      className="text-[#718096] hover:text-[#2d6a4f] p-2 rounded-lg hover:bg-[#f8f9fb] transition-colors" title="Open application URL">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <Link href={`/dashboard/ngo/grants/${g.id}/edit`}
                    className="text-[#718096] hover:text-[#2d6a4f] p-2 rounded-lg hover:bg-[#f8f9fb] transition-colors" title="Edit">
                    <Edit3 size={14} />
                  </Link>
                  <button onClick={() => handleDelete(g.id)}
                    className="text-[#718096] hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
