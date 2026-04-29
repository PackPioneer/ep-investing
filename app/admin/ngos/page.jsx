"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp, Globe, Mail } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending review" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const ORG_TYPE_LABELS = {
  international_ngo: "International NGO",
  igo: "IGO",
  foundation: "Foundation",
  research_nonprofit: "Research",
  implementation_nonprofit: "Implementation",
  advocacy: "Advocacy",
  other: "Other",
};

function NGORow({ ngo, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function act(action) {
    if (!confirm(`${action === "approve" ? "Approve" : "Reject"} ${ngo.name}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ngos/${ngo.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Failed: ${err.error}`);
      } else {
        onAction();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 p-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-900">{ngo.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {ORG_TYPE_LABELS[ngo.org_type] ?? ngo.org_type}
            </span>
            {ngo.verified && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ domain match
              </span>
            )}
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><Mail size={11} /> {ngo.contact_email}</span>
            {ngo.website_url && (
              <a href={ngo.website_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-700 hover:underline">
                <Globe size={11} /> {ngo.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            )}
            <span>{ngo.headquarters_country}</span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date(ngo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>

        {ngo.status === "pending" && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => act("approve")} disabled={busy}
              className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
              <CheckCircle size={14} /> Approve
            </button>
            <button onClick={() => act("reject")} disabled={busy}
              className="border border-slate-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5">
              <XCircle size={14} /> Reject
            </button>
          </div>
        )}
        {ngo.status === "active" && (
          <Link href={`/ngos/${ngo.slug}`} target="_blank"
            className="text-sm text-emerald-700 hover:underline flex items-center gap-1.5">
            View live <ExternalLink size={12} />
          </Link>
        )}
        {ngo.status === "rejected" && (
          <span className="text-xs font-mono text-slate-500 px-3 py-1 bg-slate-100 rounded-full">Rejected</span>
        )}

        <button onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5 bg-slate-50 grid grid-cols-2 gap-4 text-sm">
          {ngo.short_description && (
            <div className="col-span-2">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-1">Description</div>
              <div className="text-slate-700">{ngo.short_description}</div>
            </div>
          )}
          {ngo.bio && (
            <div className="col-span-2">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-1">Mission</div>
              <div className="text-slate-700 whitespace-pre-line">{ngo.bio}</div>
            </div>
          )}
          {ngo.sector_tags && ngo.sector_tags.length > 0 && (
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-1">Sectors</div>
              <div className="flex flex-wrap gap-1">
                {ngo.sector_tags.map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200">{s}</span>)}
              </div>
            </div>
          )}
          {ngo.geography_focus && ngo.geography_focus.length > 0 && (
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-1">Geography</div>
              <div className="flex flex-wrap gap-1">
                {ngo.geography_focus.map(g => <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200">{g}</span>)}
              </div>
            </div>
          )}
          {ngo.staff_size && (
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-1">Staff</div>
              <div className="text-slate-700">{ngo.staff_size}</div>
            </div>
          )}
          {ngo.annual_grants_budget_usd_range && (
            <div>
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-1">Budget</div>
              <div className="text-slate-700">${ngo.annual_grants_budget_usd_range}</div>
            </div>
          )}
          {ngo.open_to_partnerships && (
            <div className="col-span-2">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-1">Open to partnerships</div>
              <div className="text-slate-700">{ngo.partnership_description || "(no description)"}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NGOsAdmin() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  function load() {
    setLoading(true);
    fetch(`/api/admin/ngos?status=${status}`)
      .then(r => r.json())
      .then(data => { setNgos(Array.isArray(data.ngos) ? data.ngos : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [status]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">NGO submissions</h1>
          <p className="text-sm text-slate-500 mt-1">{ngos.length} {status === "all" ? "total" : status}</p>
        </div>
        <Link href="/admin/ngo-claims" className="text-sm text-emerald-700 hover:underline">
          Claim requests →
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_OPTIONS.map(o => (
          <button key={o.value} onClick={() => setStatus(o.value)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
              status === o.value
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-600"
            }`}>
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : ngos.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          {status === "pending" ? "No submissions awaiting review." : "No matching NGOs."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ngos.map(n => <NGORow key={n.id} ngo={n} onAction={load} />)}
        </div>
      )}
    </div>
  );
}
