"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, MessageCircle, Clock, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS = {
  pending: Clock,
  contacted: MessageCircle,
  approved: CheckCircle,
  rejected: XCircle,
};

const PLAN_LABELS = {
  company_listing: "$99/mo — Company Listing",
  company_hiring: "$199/mo — Company + Hiring",
};

function ClaimRow({ claim, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(claim.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const Icon = STATUS_ICONS[claim.status] || Clock;

  const updateStatus = async (status) => {
    setSaving(true);
    await fetch("/api/claim", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: claim.id, status, admin_notes: notes }),
    });
    setSaving(false);
    onUpdate();
  };

  const saveNotes = async () => {
    setSaving(true);
    await fetch("/api/claim", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: claim.id, status: claim.status, admin_notes: notes }),
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>

        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${STATUS_COLORS[claim.status]}`}>
          <Icon size={11} />
          {claim.status}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">{claim.company_name || "No company name"}</span>
            {claim.company_url && (
              <a href={claim.company_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {claim.contact_name} · {claim.contact_email}
            {claim.contact_role && ` · ${claim.contact_role}`}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-xs font-medium text-slate-700">{PLAN_LABELS[claim.plan] || claim.plan}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {new Date(claim.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {expanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5 flex flex-col gap-5">

          {claim.description && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Company description</div>
              <p className="text-sm text-slate-700 leading-relaxed">{claim.description}</p>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Admin notes</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes — not visible to the claimant…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-500 resize-none transition-colors"
            />
            <button onClick={saveNotes} disabled={saving}
              className="mt-2 text-xs text-green-700 font-medium hover:text-green-800 transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save notes"}
            </button>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Update status</div>
            <div className="flex flex-wrap gap-2">
              {["pending", "contacted", "approved", "rejected"].map(s => (
                <button key={s} onClick={() => updateStatus(s)} disabled={saving || claim.status === s}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 ${
                    claim.status === s
                      ? STATUS_COLORS[s]
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <a href={`mailto:${claim.contact_email}?subject=Your EP Investment company claim&body=Hi ${claim.contact_name},%0D%0A%0D%0AThank you for claiming ${claim.company_name} on EP Investment.`}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#235a40] transition-all">
              <MessageCircle size={12} /> Reply via email
            </a>
            {claim.company_url && (
              <a href={claim.company_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all">
                <ExternalLink size={12} /> Visit website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    fetch("/api/claim")
      .then(r => r.json())
      .then(data => { setClaims(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = {
    all: claims.length,
    pending: claims.filter(c => c.status === "pending").length,
    contacted: claims.filter(c => c.status === "contacted").length,
    approved: claims.filter(c => c.status === "approved").length,
    rejected: claims.filter(c => c.status === "rejected").length,
  };

  const filtered = filter === "all" ? claims : claims.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Company Claims</h1>
            <p className="text-sm text-slate-500 mt-1">Manage incoming claim requests</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-[#2d6a4f]">{counts.pending}</div>
              <div className="text-xs text-slate-500">pending review</div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {Object.entries(counts).map(([key, count]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === key
                  ? "bg-[#2d6a4f] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}>
              {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading claims…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 text-sm">No {filter === "all" ? "" : filter} claims yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(claim => (
              <ClaimRow key={claim.id} claim={claim} onUpdate={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
