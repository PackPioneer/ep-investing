"use client";
/**
 * components/policies/PolicyDigestWidget.jsx
 *
 * Dashboard widget showing top N personalized policies. Lives in the For
 * You tab alongside ForYouFeed. This is the widget that fills the
 * "Policy digest" Coming Soon slot from Phase 3C.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import PolicyCard from "./PolicyCard";

export default function PolicyDigestWidget({ limit = 3, userType = "investor" }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/policies/for-you?limit=${limit}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setPolicies(data.policies ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [limit]);

  const heading = userType === "company"
    ? "Policy changes affecting your sector"
    : "Policy changes for your thesis";

  return (
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">
            {heading}
          </div>
          <p className="text-xs text-[#718096] mt-0.5">
            Climate and energy policy developments ranked for relevance.
          </p>
        </div>
        <Link href="/news/policy" className="text-xs text-[#2d6a4f] font-mono hover:underline flex-shrink-0 ml-4">
          See all →
        </Link>
      </div>

      {loading ? (
        <div className="py-6 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-6 text-sm text-[#718096]">
          Couldn't load policies right now.
        </div>
      ) : policies.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-[#e2e6ed] rounded-xl">
          <p className="text-sm text-[#0f1a14] font-medium mb-1">No matching policies yet</p>
          <p className="text-xs text-[#718096] max-w-sm mx-auto">
            Add sector focus to your profile to start seeing relevant regulatory developments.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {policies.map((p) => (
            <PolicyCard key={p.id} policy={p} compact />
          ))}
        </div>
      )}
    </div>
  );
}
