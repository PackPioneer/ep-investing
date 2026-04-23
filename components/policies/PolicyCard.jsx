"use client";
/**
 * components/policies/PolicyCard.jsx
 *
 * Single policy card. Used in /news/policy list view and the dashboard
 * "Policy digest" widget. Compact prop shrinks padding and hides the
 * plain-English summary preview.
 */

import Link from "next/link";

const STATUS_LABELS = {
  proposed: "Proposed",
  comment_period: "Comment period open",
  enacted: "Enacted",
  enacted_pending_effective: "Enacted — not yet in force",
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

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PolicyCard({ policy, compact = false }) {
  const statusLabel = STATUS_LABELS[policy.status] ?? policy.status;
  const statusColor = STATUS_COLORS[policy.status] ?? STATUS_COLORS.unknown;

  return (
    <Link
      href={`/news/policy/${policy.id}`}
      className={`block bg-white border border-[#e2e6ed] rounded-xl ${compact ? "p-4" : "p-5"} hover:border-[#2d6a4f] transition-colors`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap text-xs text-[#718096]">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
          {policy.jurisdiction && (
            <span className="font-medium">{policy.jurisdiction}</span>
          )}
          {policy.agency && (
            <>
              <span>·</span>
              <span>{policy.agency}</span>
            </>
          )}
          {policy.published_at && (
            <>
              <span>·</span>
              <time dateTime={policy.published_at}>{formatDate(policy.published_at)}</time>
            </>
          )}
        </div>
      </div>

      <h3 className={`${compact ? "text-sm" : "text-base"} font-semibold text-[#0f1a14] leading-snug`}>
        {policy.title}
      </h3>

      {!compact && policy.investor_implications && (
        <p className="mt-2 text-sm text-[#4a5568] line-clamp-2">
          {policy.investor_implications}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#718096]">
        {policy.effective_date && (
          <span>
            Effective: <strong className="text-[#0f1a14]">{formatDate(policy.effective_date)}</strong>
          </span>
        )}
        {policy.comment_deadline && new Date(policy.comment_deadline) > new Date() && (
          <span className="text-amber-700 font-medium">
            Comments close: {formatDate(policy.comment_deadline)}
          </span>
        )}
        {policy.sectors?.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1">
            {policy.sectors.slice(0, 3).map((s) => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2f4f8] text-[#718096] border border-[#e2e6ed]">
                {s.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
