"use client";
/**
 * components/news/ForYouFeed.jsx
 *
 * Phase 7: switched from ArticleCard (large, summary-visible) to
 * CollapsibleCard (dense, click to expand). Also removed the "add
 * industry focus" nudge banner — users can find their profile via
 * the sidebar.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import CollapsibleCard from "./CollapsibleCard";

const COPY = {
  investor: {
    heading: "Relevant to your deal pipeline",
    subtitle: "Climate news ranked for your thesis and saved companies.",
    emptyTitle: "No matched news yet",
    emptyBody: "Complete your investor profile and save companies to your pipeline to start seeing relevant news here.",
  },
  company: {
    heading: "Activity in your sector",
    subtitle: "Funding, policy, and market news relevant to your space.",
    emptyTitle: "No sector news yet",
    emptyBody: "Add industry tags and target geographies to your profile to start seeing relevant news here.",
  },
  default: {
    heading: "For you",
    subtitle: "Climate news ranked for your interests.",
    emptyTitle: "Nothing yet",
    emptyBody: "Set up your preferences to start seeing personalized news.",
  },
};

const CLASSIFICATION_LABELS = {
  funding: "Funding",
  fund_close: "Fund close",
  ipo: "IPO",
  earnings: "Earnings",
  leadership_change: "Hiring",
  policy: "Policy",
  m_and_a: "M&A",
  product: "Product",
  regulatory: "Regulatory",
  market: "Market",
  partnership: "Partnership",
};

function formatRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffHours = (Date.now() - d) / (1000 * 60 * 60);
  if (diffHours < 1) return "now";
  if (diffHours < 24) return `${Math.round(diffHours)}h`;
  if (diffHours < 24 * 7) return `${Math.round(diffHours / 24)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ForYouFeed({ userType = "default", limit = 5 }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const copy = COPY[userType] ?? COPY.default;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/news/for-you?limit=${limit}`);
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

  async function logInteraction(articleId, action) {
    try {
      await fetch("/api/news/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleId, action }),
      });
    } catch (err) {
      console.error("Interaction failed:", err);
    }
  }

  function removeFromList(articleId) {
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
  }

  return (
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">
            {copy.heading}
          </div>
          <p className="text-xs text-[#718096] mt-0.5">{copy.subtitle}</p>
        </div>
        <Link href="/news" className="text-xs text-[#2d6a4f] font-mono hover:underline flex-shrink-0 ml-4">
          See all →
        </Link>
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-6 text-sm text-[#718096]">
          Couldn't load news right now. Try again in a moment.
        </div>
      ) : articles.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-[#e2e6ed] rounded-xl">
          <p className="text-sm text-[#0f1a14] font-medium mb-1">{copy.emptyTitle}</p>
          <p className="text-xs text-[#718096] max-w-sm mx-auto">{copy.emptyBody}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {articles.map((a) => {
            const sourceName = a.source_name ?? a.source?.name;
            const classLabel = CLASSIFICATION_LABELS[a.classification];
            return (
              <CollapsibleCard
                key={a.id}
                meta={
                  <>
                    <span className="font-medium">{sourceName}</span>
                    {classLabel && (
                      <span className="inline-flex items-center rounded-full bg-[#f2f4f8] border border-[#e2e6ed] px-1.5 py-0.5 text-[9px] font-medium text-[#4a5568]">
                        {classLabel}
                      </span>
                    )}
                    <span>{formatRelative(a.published_at)}</span>
                  </>
                }
                title={a.title}
                summary={a.summary_factual || a.excerpt}
                href={a.url}
                readLabel={`Read on ${sourceName}`}
                onSave={async () => {
                  await logInteraction(a.id, "save");
                  removeFromList(a.id);
                }}
                onDismiss={async () => {
                  await logInteraction(a.id, "dismiss");
                  removeFromList(a.id);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
