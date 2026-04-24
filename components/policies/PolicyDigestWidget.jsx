"use client";
/**
 * components/policies/PolicyDigestWidget.jsx
 *
 * Phase 7: kept the status-badge-forward layout since status is the
 * key scannable signal for a policy (comment open vs enacted vs in force).
 * Slightly tightened padding and reduced summary preview to one line.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

const STATUS_LABELS = {
  proposed: "Proposed",
  comment_period: "Comment open",
  enacted: "Enacted",
  enacted_pending_effective: "Enacted",
  in_force: "In force",
  implemented: "Implemented",
  amended: "Amended",
  withdrawn: "Withdrawn",
  expired: "Expired",
  superseded: "Superseded",
  notice: "Notice",
  unknown: "Unknown",
};

const STATUS_COLORS = {
  proposed: "bg-blue-50 text-blue-700 border-blue-200",
  comment_period: "bg-amber-50 text-amber-800 border-amber-200",
  enacted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  enacted_pending_effective: "bg-emerald-50 text-emerald-800 border-emerald-200",
  in_force: "bg-[#eef1f6] text-[#2d6a4f] border-[#c8d8cc]",
  implemented: "bg-[#eef1f6] text-[#2d6a4f] border-[#c8d8cc]",
  amended: "bg-purple-50 text-purple-700 border-purple-200",
  withdrawn: "bg-gray-50 text-gray-600 border-gray-200",
  expired: "bg-gray-50 text-gray-500 border-gray-200",
  superseded: "bg-gray-50 text-gray-500 border-gray-200",
  notice: "bg-slate-50 text-slate-600 border-slate-200",
  unknown: "bg-slate-50 text-slate-500 border-slate-200",
};

function formatDateShort(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PolicyRow({ policy }) {
  const statusLabel = STATUS_LABELS[policy.status] ?? policy.status;
  const statusColor = STATUS_COLORS[policy.status] ?? STATUS_COLORS.unknown;

  return (
    <Link
      href={`/news/policy/${policy.id}`}
      className="block bg-white border border-[#e2e6ed] rounded-lg px-3 py-2.5 hover:border-[#2d6a4f] transition-colors"
    >
      <div className="flex items-center gap-1.5 text-[11px] text-[#718096] mb-0.5 flex-wrap">
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${statusColor}`}>
          {statusLabel}
        </span>
        {policy.agency && <span>{policy.agency}</span>}
        {policy.published_at && (
          <>
            <span>·</span>
            <time dateTime={policy.published_at}>{formatDateShort(policy.published_at)}</time>
          </>
        )}
      </div>
      <div className="text-sm font-medium text-[#0f1a14] whitespace-nowrap overflow-hidden text-ellipsis">
        {policy.title}
      </div>
    </Link>
  );
}

export default function PolicyDigestWidget({ limit = 3, userType = "investor" }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/policies/for-you?limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setPolicies(data.policies ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  const heading = userType === "company"
    ? "Policy changes affecting your sector"
    : "Policy changes for your thesis";

  return (
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">
            {heading}
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Climate and energy policy developments ranked for relevance.
          </p>
        </div>
        <Link href="/news/policy" className="text-xs text-[#2d6a4f] font-mono hover:underline flex-shrink-0 ml-4">
          See all →
        </Link>
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-6 text-sm text-[#718096]">Couldn't load policies.</div>
      ) : policies.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-[#e2e6ed] rounded-xl">
          <p className="text-sm text-[#0f1a14] font-medium mb-1">No matching policies yet</p>
          <p className="text-xs text-[#718096] max-w-sm mx-auto">
            Add sector focus to your profile to start seeing relevant regulatory developments.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {policies.map((p) => <PolicyRow key={p.id} policy={p} />)}
        </div>
      )}
    </div>
  );
}
