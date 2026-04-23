"use client";
/**
 * components/news/ComingSoonWidgets.jsx
 *
 * Grayed-out placeholder cards for future industry-intelligence modules
 * (IPO tracker, M&A pulse, major hires, market movements). Renders a
 * reserved layout grid so that adding a real module later doesn't shift
 * the dashboard around.
 */

const PLACEHOLDERS = [
  {
    title: "IPO tracker",
    body: "Climate & energy IPOs, direct listings, and pre-IPO filings.",
  },
  {
    title: "M&A pulse",
    body: "Recent acquisitions, mergers, and strategic partnerships in your sector.",
  },
  {
    title: "Policy digest",
    body: "Federal, state, and international policy changes affecting your markets.",
  },
  {
    title: "Market movements",
    body: "Stock price moves, commodity prices, and sector index changes.",
  },
];

export default function ComingSoonWidgets() {
  return (
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">
            Industry signals
          </div>
          <p className="text-xs text-[#718096] mt-0.5">Modules launching in the coming weeks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLACEHOLDERS.map((p) => (
          <div
            key={p.title}
            className="border border-dashed border-[#d0d6e0] rounded-xl p-4 bg-[#f8f9fb] opacity-70"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-semibold text-[#4a5568]">{p.title}</div>
              <span className="text-[10px] font-mono text-[#a0aec0] uppercase tracking-wide">
                Coming soon
              </span>
            </div>
            <p className="text-xs text-[#718096]">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
