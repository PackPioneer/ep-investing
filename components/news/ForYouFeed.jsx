"use client";
/**
 * components/news/ForYouFeed.jsx
 *
 * Renders the top N personalized news articles for the current user.
 * Used in both investor and company dashboards.
 *
 * Role-aware copy:
 *   userType="investor" → "Relevant to your deal pipeline"
 *   userType="company"  → "Activity in your sector"
 *   (defaults to neutral copy if userType not provided)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import ArticleCard from "./ArticleCard";

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

export default function ForYouFeed({ userType = "default", limit = 5 }) {
  const [articles, setArticles] = useState([]);
  const [hasEmbedding, setHasEmbedding] = useState(null);
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
        setHasEmbedding(data.has_embedding ?? false);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  function removeFromList(article) {
    setArticles((prev) => prev.filter((a) => a.id !== article.id));
  }

  return (
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
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
        <div className="py-8 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-6 text-sm text-[#718096]">
          Couldn't load news right now. Try again in a moment.
        </div>
      ) : articles.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-[#e2e6ed] rounded-xl">
          <p className="text-sm text-[#0f1a14] font-medium mb-1">{copy.emptyTitle}</p>
          <p className="text-xs text-[#718096] max-w-sm mx-auto">{copy.emptyBody}</p>
        </div>
      ) : (
        <>
          {!hasEmbedding && (
            <div className="mb-3 text-xs text-[#718096] bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg px-3 py-2">
              Add industry focus to your profile to improve these rankings.
            </div>
          )}
          <div className="flex flex-col gap-3">
            {articles.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                showActions
                compact
                onDismiss={removeFromList}
                onSave={removeFromList}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
