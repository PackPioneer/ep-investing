"use client";
/**
 * app/news/policy/[id]/page.jsx
 *
 * Policy detail view. Layout (top to bottom):
 *   1. Breadcrumb + title + status badge + key metadata
 *   2. Investor implications (Sonnet prose summary)
 *   3. Status timeline from policy_status_history
 *   4. Official abstract (collapsed, click to expand)
 *   5. Related news articles
 *   6. Link to original source document
 */

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  unknown: "Status unknown",
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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function formatShortDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function PolicyDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAbstract, setShowAbstract] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/policies/${id}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (!cancelled) setData(body);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-[#0f1a14] mb-2">Policy not found</h1>
        <p className="text-sm text-[#718096] mb-4">We couldn't find that policy. It may have been removed or the ID is wrong.</p>
        <Link href="/news/policy" className="text-sm text-[#2d6a4f] font-semibold hover:underline">
          Back to tracker →
        </Link>
      </div>
    );
  }

  const { policy, status_history, related_articles } = data;
  const statusColor = STATUS_COLORS[policy.status] ?? STATUS_COLORS.unknown;
  const statusLabel = STATUS_LABELS[policy.status] ?? policy.status;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#718096] mb-4">
        <Link href="/news" className="hover:text-[#2d6a4f]">News</Link>
        <span>/</span>
        <Link href="/news/policy" className="hover:text-[#2d6a4f]">Policy tracker</Link>
        <span>/</span>
        <span className="text-[#4a5568] truncate max-w-xs">{policy.title}</span>
      </div>

      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
          {policy.jurisdiction && (
            <span className="text-xs font-medium text-[#4a5568]">{policy.jurisdiction}</span>
          )}
          {policy.agency && (
            <>
              <span className="text-xs text-[#718096]">·</span>
              <span className="text-xs text-[#4a5568]">{policy.agency}</span>
            </>
          )}
          {policy.document_type && (
            <>
              <span className="text-xs text-[#718096]">·</span>
              <span className="text-xs text-[#4a5568]">{policy.document_type}</span>
            </>
          )}
          {policy.docket_id && (
            <>
              <span className="text-xs text-[#718096]">·</span>
              <span className="text-xs font-mono text-[#718096]">{policy.docket_id}</span>
            </>
          )}
        </div>
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl md:text-3xl text-[#0f1a14] leading-tight">
          {policy.title}
        </h1>
      </header>

      {/* Key dates strip */}
      <div className="bg-white border border-[#e2e6ed] rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wide">Published</div>
          <div className="text-sm font-medium text-[#0f1a14] mt-1">
            {formatDate(policy.published_at) ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wide">Effective date</div>
          <div className="text-sm font-medium text-[#0f1a14] mt-1">
            {formatDate(policy.effective_date) ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wide">Comment deadline</div>
          <div className={`text-sm font-medium mt-1 ${
            policy.comment_deadline && new Date(policy.comment_deadline) > new Date()
              ? "text-amber-700"
              : "text-[#0f1a14]"
          }`}>
            {formatDate(policy.comment_deadline) ?? "—"}
          </div>
        </div>
      </div>

      {/* Tags */}
      {(policy.sectors?.length > 0 || policy.affected_company_types?.length > 0) && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {policy.sectors?.map((s) => (
            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#eef1f6] text-[#2d6a4f] border border-[#c8d8cc]">
              {s.replace(/-/g, " ")}
            </span>
          ))}
          {policy.affected_company_types?.map((t) => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-white text-[#4a5568] border border-[#d0d6e0]">
              {t.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* AI summary */}
      {policy.investor_implications && (
        <section className="mb-8">
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-3">
            Implications for investors
          </div>
          <div className="bg-white border border-[#e2e6ed] rounded-xl p-6 prose prose-sm max-w-none">
            {policy.investor_implications.split("\n\n").map((para, i) => (
              <p key={i} className="text-[#0f1a14] text-sm leading-relaxed mb-3 last:mb-0">{para}</p>
            ))}
          </div>
          <p className="text-[10px] text-[#a0aec0] mt-2 italic">
            AI-generated summary. Read the full document for authoritative language.
          </p>
        </section>
      )}

      {/* Status timeline */}
      {status_history && status_history.length > 0 && (
        <section className="mb-8">
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-3">
            Status timeline
          </div>
          <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
            <ol className="flex flex-col gap-3">
              {status_history.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#2d6a4f] mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-[#0f1a14]">
                      {h.from_status ? (
                        <>
                          <span className="text-[#718096]">{STATUS_LABELS[h.from_status] ?? h.from_status}</span>
                          {" → "}
                          <span className="font-medium">{STATUS_LABELS[h.to_status] ?? h.to_status}</span>
                        </>
                      ) : (
                        <span className="font-medium">{STATUS_LABELS[h.to_status] ?? h.to_status}</span>
                      )}
                    </div>
                    <div className="text-xs text-[#718096] mt-0.5">{formatShortDate(h.changed_at)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Official abstract (collapsed by default) */}
      {policy.abstract && (
        <section className="mb-8">
          <button
            onClick={() => setShowAbstract((v) => !v)}
            className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-3 flex items-center gap-2 hover:text-[#2d6a4f]"
          >
            <span>{showAbstract ? "▼" : "▶"}</span>
            Official abstract
          </button>
          {showAbstract && (
            <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-xl p-5 text-sm text-[#4a5568] leading-relaxed whitespace-pre-wrap">
              {policy.abstract}
            </div>
          )}
        </section>
      )}

      {/* Related news articles */}
      {related_articles && related_articles.length > 0 && (
        <section className="mb-8">
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-3">
            Related coverage
          </div>
          <div className="flex flex-col gap-2">
            {related_articles.map((a) => (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener"
                className="block bg-white border border-[#e2e6ed] rounded-xl p-4 hover:border-[#2d6a4f] transition-colors"
              >
                <div className="flex items-center gap-2 text-xs text-[#718096] mb-1">
                  <span className="font-medium">{a.source_name}</span>
                  {a.published_at && (
                    <>
                      <span>·</span>
                      <time dateTime={a.published_at}>{formatShortDate(a.published_at)}</time>
                    </>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-[#0f1a14]">{a.title}</h4>
                {a.summary_factual && (
                  <p className="mt-1 text-xs text-[#4a5568] line-clamp-2">{a.summary_factual}</p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Original source */}
      {policy.source_url && (
        <section className="mb-8 pt-6 border-t border-[#e2e6ed]">
          <a
            href={policy.source_url}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#2d6a4f] hover:underline"
          >
            Read the full document on {policy.external_source?.includes("federal-register") || policy.external_source?.startsWith("us-") ? "Federal Register" : "source site"} →
          </a>
        </section>
      )}
    </div>
  );
}
