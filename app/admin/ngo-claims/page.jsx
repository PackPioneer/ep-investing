"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink, Mail } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function ClaimRow({ claim, onAction }) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  async function act(action) {
    if (action === "reject" && !notes.trim()) {
      const ok = confirm("Reject without notes? Recommend giving a reason.");
      if (!ok) return;
    } else if (!confirm(`${action === "approve" ? "Approve" : "Reject"} this claim for ${claim.ngo?.name}?`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/ngo-claims/${claim.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, admin_notes: notes }),
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
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-900">{claim.ngo?.name ?? "Unknown NGO"}</span>
            <span className="text-xs text-slate-400 font-mono">→</span>
            <span className="text-sm text-slate-700">{claim.claimant_name}</span>
            {claim.email_domain_match && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ domain match
              </span>
            )}
            {!claim.email_domain_match && claim.status === "pending" && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ⚠ no domain match
              </span>
            )}
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><Mail size={11} /> {claim.claimant_email}</span>
            {claim.claimant_role && <span>· {claim.claimant_role}</span>}
            <span className="text-xs text-slate-400 font-mono">
              {new Date(claim.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        </div>

        {claim.status === "pending" && (
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
        {claim.status === "approved" && (
          <span className="text-xs font-mono text-emerald-700 px-3 py-1 bg-emerald-50 rounded-full">Approved</span>
        )}
        {claim.status === "rejected" && (
          <span className="text-xs font-mono text-slate-500 px-3 py-1 bg-slate-100 rounded-full">Rejected</span>
        )}
      </div>

      {claim.message && (
        <div className="bg-slate-50 rounded-lg p-3 mb-3">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-1">Message</div>
          <div className="text-sm text-slate-700 whitespace-pre-line">{claim.message}</div>
        </div>
      )}

      {claim.status === "pending" && (
        <div className="flex items-center gap-3 mt-2">
          <Link href={`/ngos/${claim.ngo?.slug}`} target="_blank"
            className="text-xs text-emerald-700 hover:underline flex items-center gap-1">
            View NGO profile <ExternalLink size={10} />
          </Link>
          {claim.ngo?.website_url && (
            <a href={claim.ngo.website_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-emerald-700 hover:underline flex items-center gap-1">
              Visit org website <ExternalLink size={10} />
            </a>
          )}
          <button onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-slate-500 hover:text-slate-700 ml-auto">
            {showNotes ? "Hide notes" : "Add notes"}
          </button>
        </div>
      )}

      {showNotes && claim.status === "pending" && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes (optional, sent in rejection email)"
          className="w-full mt-2 text-sm border border-slate-200 rounded-lg p-2 outline-none focus:border-emerald-600"
          rows={2}
        />
      )}

      {claim.admin_notes && claim.status !== "pending" && (
        <div className="text-xs text-slate-500 mt-2 italic">Notes: {claim.admin_notes}</div>
      )}
    </div>
  );
}

export default function NGOClaimsAdmin() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  function load() {
    setLoading(true);
    fetch(`/api/admin/ngo-claims?status=${status}`)
      .then(r => r.json())
      .then(data => { setClaims(Array.isArray(data.claims) ? data.claims : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, [status]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">NGO claim requests</h1>
          <p className="text-sm text-slate-500 mt-1">{claims.length} {status === "all" ? "total" : status}</p>
        </div>
        <Link href="/admin/ngos" className="text-sm text-emerald-700 hover:underline">
          ← Back to NGO submissions
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
      ) : claims.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No claims to review.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {claims.map(c => <ClaimRow key={c.id} claim={c} onAction={load} />)}
        </div>
      )}
    </div>
  );
}
