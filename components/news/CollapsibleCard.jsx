"use client";
/**
 * components/news/CollapsibleCard.jsx
 *
 * Shared collapsible card. Click to expand; shows summary + actions
 * below when expanded. All the per-widget state (expanded? handlers?)
 * lives here so individual widgets stay thin.
 *
 * Props:
 *   meta       - JSX for the top meta row (source, badges, time)
 *   title      - the headline
 *   summary    - body text shown when expanded (optional)
 *   href       - external link URL (rendered as "Read on source →" when expanded)
 *   readLabel  - custom label for the external link (default "Read source →")
 *   onSave     - optional save handler — shows "Save" action when expanded
 *   onDismiss  - optional dismiss handler — shows "Dismiss" action when expanded
 *   dense      - use smaller fonts (for signal widgets in 2x2 grid)
 */

import { useState } from "react";

export default function CollapsibleCard({
  meta,
  title,
  summary,
  href,
  readLabel = "Read source",
  onSave,
  onDismiss,
  dense = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [saved, setSaved] = useState(false);

  if (dismissed) return null;

  const titleSize = dense ? "text-xs" : "text-sm";
  const metaSize = dense ? "text-[10px]" : "text-[11px]";
  const summarySize = dense ? "text-[11px]" : "text-xs";
  const iconSize = dense ? 10 : 12;
  const borderColor = expanded ? "border-[#2d6a4f]" : "border-[#e2e6ed]";

  function handleToggle() {
    setExpanded((v) => !v);
  }

  async function handleSave(e) {
    e.stopPropagation();
    if (saved || !onSave) return;
    setSaved(true);
    await onSave();
  }

  async function handleDismiss(e) {
    e.stopPropagation();
    if (!onDismiss) return;
    setDismissed(true);
    await onDismiss();
  }

  function handleExternal(e) {
    // Let the link work normally, just log the click-out
    e.stopPropagation();
  }

  return (
    <div
      className={`bg-white border ${borderColor} rounded-lg transition-colors cursor-pointer`}
      onClick={handleToggle}
    >
      {/* Collapsed row (always visible) */}
      <div className={`flex items-center gap-2 ${dense ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-1.5 ${metaSize} text-[#718096] mb-0.5 flex-wrap`}>
            {meta}
          </div>
          <div
            className={`${titleSize} font-medium text-[#0f1a14] ${
              expanded ? "" : "whitespace-nowrap overflow-hidden text-ellipsis"
            }`}
          >
            {title}
          </div>
        </div>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#a0aec0"
          strokeWidth="2"
          className="flex-shrink-0"
        >
          {expanded ? (
            <polyline points="18 15 12 9 6 15" />
          ) : (
            <polyline points="6 9 12 15 18 9" />
          )}
        </svg>
      </div>

      {/* Expanded content */}
      {expanded && (summary || href || onSave || onDismiss) && (
        <div
          className={`${dense ? "px-2.5 pb-2" : "px-3 pb-3"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`pt-2 border-t border-[#e2e6ed]`}>
            {summary && (
              <p className={`${summarySize} text-[#4a5568] leading-relaxed mb-2`}>
                {summary}
              </p>
            )}
            <div className={`flex items-center gap-2 ${metaSize} flex-wrap`}>
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  onClick={handleExternal}
                  className="text-[#2d6a4f] font-medium hover:underline"
                >
                  {readLabel} →
                </a>
              )}
              {onSave && (
                <>
                  {href && <span className="text-[#a0aec0]">·</span>}
                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className="text-[#718096] hover:text-[#0f1a14] disabled:text-[#2d6a4f] disabled:font-medium"
                  >
                    {saved ? "Saved" : "Save"}
                  </button>
                </>
              )}
              {onDismiss && (
                <>
                  <span className="text-[#a0aec0]">·</span>
                  <button
                    onClick={handleDismiss}
                    className="text-[#718096] hover:text-[#0f1a14]"
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
