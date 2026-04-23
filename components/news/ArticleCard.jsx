"use client";
/**
 * components/news/ArticleCard.jsx
 *
 * Shared article card. Used in both the dashboard "For You" feed and the
 * /news page. Save + dismiss buttons only render when `showActions` is
 * true (turned off for unauthenticated users and the /news chronological
 * view by default).
 *
 * Styled to match the existing dashboard aesthetic (same colors, borders,
 * typography as investor/company dashboards).
 */

import { useState } from "react";
import Link from "next/link";
import { Bookmark, X } from "lucide-react";

function formatRelative(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffHours = (now - d) / (1000 * 60 * 60);
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`;
  if (diffHours < 24 * 7) return `${Math.round(diffHours / 24)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CLASSIFICATION_LABELS = {
  funding: "Funding",
  policy: "Policy",
  m_and_a: "M&A",
  product: "Product",
  regulatory: "Regulatory",
  market: "Market",
  partnership: "Partnership",
  other: null,
};

export default function ArticleCard({ article, showActions = false, onDismiss, onSave, compact = false }) {
  const [dismissed, setDismissed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(null);

  const source = article.source ?? {
    name: article.source_name,
    slug: article.source_slug,
    homepage_url: article.source_homepage_url,
    attribution_label: article.source_attribution_label,
    credibility_tier: article.source_credibility_tier,
  };

  async function logInteraction(action) {
    try {
      await fetch("/api/news/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: article.id, action }),
      });
    } catch (err) {
      console.error("Interaction failed:", err);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy("save");
    await logInteraction("save");
    setSaved(true);
    setBusy(null);
    onSave?.(article);
  }

  async function handleDismiss(e) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy("dismiss");
    await logInteraction("dismiss");
    setDismissed(true);
    setBusy(null);
    onDismiss?.(article);
  }

  async function handleClickOut() {
    // Log click-outs without blocking navigation
    logInteraction("click_out");
  }

  if (dismissed) return null;

  const classLabel = CLASSIFICATION_LABELS[article.classification];

  return (
    <article className={`bg-white border border-[#e2e6ed] rounded-xl ${compact ? "p-4" : "p-5"} hover:border-[#2d6a4f] transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#718096] mb-1.5 flex-wrap">
            {source?.homepage_url ? (
              <Link href={source.homepage_url} target="_blank" rel="noopener" className="font-medium hover:text-[#0f1a14]">
                {source?.name}
              </Link>
            ) : (
              <span className="font-medium">{source?.name}</span>
            )}
            {source?.attribution_label && (
              <span className="inline-flex items-center rounded-full bg-[#eef1f6] px-2 py-0.5 text-[10px] font-medium text-[#2d6a4f] border border-[#c8d8cc]">
                {source.attribution_label}
              </span>
            )}
            {classLabel && (
              <span className="inline-flex items-center rounded-full bg-[#f2f4f8] px-2 py-0.5 text-[10px] font-medium text-[#4a5568] border border-[#e2e6ed]">
                {classLabel}
              </span>
            )}
            <span>·</span>
            <time dateTime={article.published_at}>{formatRelative(article.published_at)}</time>
          </div>

          <h3 className={`${compact ? "text-sm" : "text-base"} font-semibold leading-snug text-[#0f1a14]`}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener"
              onClick={handleClickOut}
              className="hover:text-[#2d6a4f]"
            >
              {article.title}
            </a>
          </h3>

          {(article.summary_factual || article.excerpt) && (
            <p className={`mt-1.5 ${compact ? "text-xs" : "text-sm"} text-[#4a5568] line-clamp-2`}>
              {article.summary_factual || article.excerpt}
            </p>
          )}

          {article.sector_tags?.length > 0 && !compact && (
            <div className="mt-2 flex flex-wrap gap-1">
              {article.sector_tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2f4f8] text-[#718096] border border-[#e2e6ed]">
                  {tag.replace(/-/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={busy !== null || saved}
              aria-label={saved ? "Saved" : "Save article"}
              className={`p-1.5 rounded-md transition-colors ${saved ? "bg-[#eef1f6]" : "hover:bg-[#f2f4f8]"} disabled:opacity-50`}
            >
              <Bookmark
                size={16}
                className={saved ? "fill-[#2d6a4f] text-[#2d6a4f]" : "text-[#a0aec0]"}
              />
            </button>
            <button
              onClick={handleDismiss}
              disabled={busy !== null}
              aria-label="Dismiss"
              className="p-1.5 rounded-md hover:bg-[#f2f4f8] transition-colors disabled:opacity-50"
            >
              <X size={16} className="text-[#a0aec0] hover:text-[#4a5568]" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
