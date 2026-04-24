"use client";
/**
 * components/widgets/MAPulseWidget.jsx
 *
 * Dashboard widget showing recent climate-sector M&A activity.
 * Uses existing classified news articles — no new data source needed.
 */

import { useState, useEffect } from "react";
import Link from "next/link";

function formatRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffHours = (now - d) / (1000 * 60 * 60);
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  if (diffHours < 24 * 7) return `${Math.round(diffHours / 24)}d ago`;
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
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
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
        <div className="flex flex-col gap-3">
          {articles.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener"
              className="block border border-[#e2e6ed] rounded-xl p-3 hover:border-[#2d6a4f] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#718096] mb-1 flex-wrap">
                    <span className="font-medium">{a.source?.name}</span>
                    <span>·</span>
                    <time>{formatRelative(a.published_at)}</time>
                    {formatDealSize(a.deal_size_usd) && (
                      <>
                        <span>·</span>
                        <span className="font-mono font-semibold text-[#2d6a4f]">
                          {formatDealSize(a.deal_size_usd)}
                        </span>
                      </>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-[#0f1a14] leading-snug">
                    {a.title}
                  </h4>
                  {a.summary_factual && (
                    <p className="mt-1 text-xs text-[#4a5568] line-clamp-2">
                      {a.summary_factual}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
