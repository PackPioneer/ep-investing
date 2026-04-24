"use client";
/**
 * components/widgets/SignalWidget.jsx
 *
 * Phase 7: uses CollapsibleCard (dense mode) so cards scan fast.
 * Layout optimized for 2x2 grid — narrower cards, smaller text.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import CollapsibleCard from "@/components/news/CollapsibleCard";

function formatRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffHours = (Date.now() - d) / (1000 * 60 * 60);
  if (diffHours < 1) return "now";
  if (diffHours < 24) return `${Math.round(diffHours)}h`;
  if (diffHours < 24 * 7) return `${Math.round(diffHours / 24)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDealSize(n) {
  if (!n) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function SignalWidget({
  classification,
  title,
  subtitle,
  emptyTitle = "No recent activity",
  emptyBody = "Check back after more news is ingested.",
  showDealSize = false,
  limit = 4,
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/news/by-classification/${classification}?limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setArticles(data.articles ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classification, limit]);

  return (
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[11px] font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">
            {title}
          </div>
        </div>
        <Link
          href={`/news?classification=${classification}`}
          className="text-[10px] text-[#2d6a4f] font-mono hover:underline flex-shrink-0 ml-3"
        >
          See all →
        </Link>
      </div>
      {subtitle && (
        <p className="text-[11px] text-[#718096] mb-3">{subtitle}</p>
      )}

      {loading ? (
        <div className="py-4 flex justify-center">
          <div className="w-4 h-4 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-4 text-xs text-[#718096]">Couldn't load this.</div>
      ) : articles.length === 0 ? (
        <div className="py-4 text-center border border-dashed border-[#e2e6ed] rounded-lg">
          <p className="text-xs text-[#0f1a14] font-medium mb-0.5">{emptyTitle}</p>
          <p className="text-[11px] text-[#718096]">{emptyBody}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {articles.map((a) => {
            const sourceName = a.source?.name;
            const dealSize = showDealSize ? formatDealSize(a.deal_size_usd) : null;
            return (
              <CollapsibleCard
                key={a.id}
                dense
                meta={
                  <>
                    <span className="font-medium">{sourceName}</span>
                    <span>{formatRelative(a.published_at)}</span>
                    {dealSize && (
                      <span className="font-mono font-semibold text-[#2d6a4f]">
                        {dealSize}
                      </span>
                    )}
                  </>
                }
                title={a.title}
                summary={a.summary_factual || a.excerpt}
                href={a.url}
                readLabel={`Read on ${sourceName}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
