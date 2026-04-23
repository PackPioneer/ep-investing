"use client";
/**
 * app/news/policy/page.jsx
 *
 * The policy tracker. Grouped by status so "what needs attention now"
 * bubbles up top. Filters for jurisdiction / sector / agency / search.
 *
 * URL params drive filter state so users can share filtered views:
 *   /news/policy?jurisdiction=US&status=proposed
 *   /news/policy?sector=solar
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PolicyCard from "@/components/policies/PolicyCard";

// Display order for status groups. Active/upcoming stuff at top, historical below.
const STATUS_GROUP_ORDER = [
  { key: "comment_period",            label: "Comment period open" },
  { key: "proposed",                  label: "Proposed" },
  { key: "enacted_pending_effective", label: "Enacted — pending effective date" },
  { key: "enacted",                   label: "Recently enacted" },
  { key: "amended",                   label: "Amended" },
  { key: "in_force",                  label: "In force" },
  { key: "implemented",               label: "Implemented" },
  { key: "notice",                    label: "Notices" },
  { key: "withdrawn",                 label: "Withdrawn" },
  { key: "expired",                   label: "Expired" },
  { key: "superseded",                label: "Superseded" },
  { key: "unknown",                   label: "Status unknown" },
];

const JURISDICTIONS = ["US", "EU", "UK"];
const AGENCIES = [
  "US EPA",
  "US Department of Energy",
  "US FERC",
  "US Nuclear Regulatory Commission",
  "UK DESNZ",
];

function PolicyTrackerContent() {
  const router = useRouter();
  const params = useSearchParams();

  const activeJurisdiction = params.get("jurisdiction") ?? null;
  const activeStatus = params.get("status") ?? null;
  const activeSector = params.get("sector") ?? null;
  const activeAgency = params.get("agency") ?? null;
  const activeQ = params.get("q") ?? "";

  const [policies, setPolicies] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(activeQ);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const qs = new URLSearchParams({ limit: "100" });
    if (activeJurisdiction) qs.set("jurisdiction", activeJurisdiction);
    if (activeStatus) qs.set("status", activeStatus);
    if (activeSector) qs.set("sector", activeSector);
    if (activeAgency) qs.set("agency", activeAgency);
    if (activeQ) qs.set("q", activeQ);

    (async () => {
      try {
        const res = await fetch(`/api/policies?${qs.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setPolicies(data.policies ?? []);
        setStatusCounts(data.counts_by_status ?? {});
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeJurisdiction, activeStatus, activeSector, activeAgency, activeQ]);

  // Group policies by status so we can render section headers
  const byStatus = {};
  for (const p of policies) {
    const s = p.status ?? "unknown";
    (byStatus[s] ??= []).push(p);
  }

  function setParam(key, value) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    router.push(`/news/policy${next.toString() ? `?${next.toString()}` : ""}`);
  }

  function clearFilters() {
    router.push("/news/policy");
    setSearchInput("");
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setParam("q", searchInput.trim() || null);
  }

  const hasFilters = Boolean(activeJurisdiction || activeStatus || activeSector || activeAgency || activeQ);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <header className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[#718096] mb-2">
          <Link href="/news" className="hover:text-[#2d6a4f]">News</Link>
          <span>/</span>
          <span className="text-[#4a5568]">Policy tracker</span>
        </div>
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">
          Climate & energy policy tracker
        </h1>
        <p className="mt-1 text-sm text-[#718096]">
          US, UK, and EU policy developments with plain-English analysis for investors. Updated daily from primary sources.
        </p>
      </header>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search policies by title or impact..."
          className="w-full text-sm px-4 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]"
        />
      </form>

      {/* Filter chip rows */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#718096] uppercase tracking-wide mr-1">Jurisdiction</span>
          {JURISDICTIONS.map((j) => (
            <button
              key={j}
              onClick={() => setParam("jurisdiction", activeJurisdiction === j ? null : j)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeJurisdiction === j
                  ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                  : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"
              }`}
            >
              {j}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#718096] uppercase tracking-wide mr-1">Agency</span>
          {AGENCIES.map((a) => (
            <button
              key={a}
              onClick={() => setParam("agency", activeAgency === a ? null : a)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeAgency === a
                  ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                  : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"
              }`}
            >
              {a.replace("US ", "").replace("Department of ", "")}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="self-start text-xs text-[#2d6a4f] hover:underline mt-1"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Status summary bar */}
      {!loading && Object.keys(statusCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 text-xs text-[#4a5568]">
          {STATUS_GROUP_ORDER.filter((g) => statusCounts[g.key]).slice(0, 4).map((g) => (
            <button
              key={g.key}
              onClick={() => setParam("status", activeStatus === g.key ? null : g.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${
                activeStatus === g.key
                  ? "border-[#2d6a4f] bg-[#2d6a4f]/5 text-[#2d6a4f]"
                  : "border-[#e2e6ed] bg-white hover:border-[#2d6a4f]"
              }`}
            >
              <span>{g.label}</span>
              <span className="font-mono text-[#718096]">{statusCounts[g.key]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : policies.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[#e2e6ed] rounded-xl">
          <p className="text-sm text-[#0f1a14] font-medium mb-2">No policies match your filters</p>
          <p className="text-xs text-[#718096] mb-4">Try loosening some filters or browsing the full tracker.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-[#2d6a4f] font-semibold hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {STATUS_GROUP_ORDER.map((group) => {
            const items = byStatus[group.key];
            if (!items || items.length === 0) return null;
            return (
              <section key={group.key}>
                <div className="flex items-baseline justify-between mb-3">
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">
                    {group.label}
                  </h2>
                  <span className="text-xs text-[#718096] font-mono">{items.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((p) => <PolicyCard key={p.id} policy={p} />)}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PolicyTrackerPage() {
  return (
    <Suspense fallback={
      <div className="py-12 text-center text-sm text-[#718096]">Loading…</div>
    }>
      <PolicyTrackerContent />
    </Suspense>
  );
}
