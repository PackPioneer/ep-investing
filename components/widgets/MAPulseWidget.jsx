"use client";
/**
 * components/widgets/MAPulseWidget.jsx
 *
 * Phase 7: switched to CollapsibleCard. Kept full-width (not dense)
 * since M&A typically has richer context worth reading than signal
 * widget cards.
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

export default function MAPulseWidget({ limit = 5 }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/news/ma-pulse?limit=${limit}`);
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
  }, [limit]);

  return (
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">
            M&amp;A pulse
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Recent acquisitions and strategic partnerships.
          </p>
        </div>
        <Link href="/news?classification=m_and_a" className="text-xs text-[#2d6a4f] font-mono hover:underline flex-shrink-0 ml-4">
          See all →
        </Link>
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-6 text-sm text-[#718096]">
          Couldn't load M&amp;A activity right now.
        </div>
      ) : articles.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-[#e2e6ed] rounded-xl">
          <p className="text-sm text-[#0f1a14] font-medium mb-1">No recent M&amp;A activity</p>
          <p className="text-xs text-[#718096]">Check back after new news is ingested.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {articles.map((a) => {
            const sourceName = a.source?.name;
            const dealSize = formatDealSize(a.deal_size_usd);
            return (
              <CollapsibleCard
                key={a.id}
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
