"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Search, Clock, DollarSign, FileText, ExternalLink } from "lucide-react";

const CATEGORIES = ["All", "direct_air_capture", "green_hydrogen", "nuclear_technologies", "battery_storage", "solar", "wind_energy", "ev_charging", "industrial_decarb", "carbon_credits"];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function DeadlineBadge({ date }) {
  if (!date) return null;
  const days = daysUntil(date);
  const label = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (days < 0) return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f5f5f3] border border-[#e2e6ed] text-[#718096]">Closed</span>
  );
  if (days <= 14) return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 flex items-center gap-1">
      <Clock size={9} /> {days}d left
    </span>
  );
  return (
    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] border border-[#e2e6ed] text-[#4a5568]">
      Due {label}
    </span>
  );
}

function GrantCard({ grant }) {
  const days = grant.deadline_date ? daysUntil(grant.deadline_date) : null;
  const isUrgent = days !== null && days >= 0 && days <= 14;
  const isClosed = days !== null && days < 0;

  return (
    <div className={`bg-white border rounded-xl p-6 flex flex-col gap-4 hover:shadow-sm transition-all group ${
      isUrgent ? "border-orange-200 hover:border-orange-300" :
      isClosed ? "border-[#e2e6ed] opacity-60" :
      "border-[#e2e6ed] hover:border-[#2d6a4f]"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#0f1a14] text-sm leading-snug group-hover:text-[#2d6a4f] transition-colors mb-1">
            {grant.title || grant.name}
          </h3>
          {grant.funder && (
            <p className="text-xs text-[#718096] font-mono">{grant.funder}</p>
          )}
        </div>
        <DeadlineBadge date={grant.deadline_date} />
      </div>

      {grant.description && (
        <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-3 font-light">
          {grant.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {grant.amount && (
          <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(45,106,79,0.08)] border border-[#c8d8cc] text-[#2d6a4f]">
            <DollarSign size={9} /> {grant.amount}
          </span>
        )}
        {grant.category && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] border border-[#e2e6ed] text-[#4a5568]">
            {grant.category.replace(/_/g, " ")}
          </span>
        )}
        {grant.geography && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] border border-[#e2e6ed] text-[#4a5568]">
            {grant.geography}
          </span>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-[#e2e6ed]">
        {grant.url ? (
          <a href={grant.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#2d6a4f] font-medium hover:underline">
            View grant <ExternalLink size={11} />
          </a>
        ) : (
          <span className="text-xs text-[#718096] font-mono">No link available</span>
        )}
      </div>
    </div>
  );
}

export default function GrantsPage() {
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    fetch("/api/grants")
      .then(r => r.json())
      .then(data => { setGrants(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = grants.filter(g => {
    const days = g.deadline_date ? daysUntil(g.deadline_date) : null;
    const isClosed = days !== null && days < 0;
    if (!showClosed && isClosed) return false;
    const matchSearch = !search ||
      (g.title || g.name || "").toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase()) ||
      g.funder?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || g.category === category;
    return matchSearch && matchCategory;
  });

  const urgentCount = grants.filter(g => {
    const days = g.deadline_date ? daysUntil(g.deadline_date) : null;
    return days !== null && days >= 0 && days <= 14;
  }).length;

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
              Non-dilutive funding
            </div>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl text-[#0f1a14] mb-2">
              Grants & Awards
            </h1>
            <p className="text-[#4a5568] text-base font-light max-w-xl">
              Government grants, prize competitions, and non-dilutive funding for climate and energy companies.
            </p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <div style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#2d6a4f]">{grants.length}</div>
              <div className="text-xs font-mono text-[#718096]">grants tracked</div>
            </div>
            {urgentCount > 0 && (
              <div>
                <div style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-orange-500">{urgentCount}</div>
                <div className="text-xs font-mono text-[#718096]">closing soon</div>
              </div>
            )}
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 bg-white border border-[#d0d6e0] rounded-xl px-4 py-3 focus-within:border-[#2d6a4f] transition-all max-w-md">
            <Search size={14} className="text-[#718096]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search grants, funders…"
              className="flex-1 bg-transparent text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none" />
          </div>
          <button onClick={() => setShowClosed(!showClosed)}
            className={`text-xs font-mono px-3 py-2 rounded-lg border transition-all ${
              showClosed
                ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                : "border-[#e2e6ed] bg-white text-[#4a5568]"
            }`}>
            {showClosed ? "Hiding closed" : "Show closed"}
          </button>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
                category === c
                  ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                  : "border-[#e2e6ed] bg-white text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
              }`}>
              {c === "All" ? "All categories" : c.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-xs font-mono text-[#718096] mb-5">
            {filtered.length} grant{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#e2e6ed] rounded-xl p-6 h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#e2e6ed] rounded-2xl bg-white">
            <FileText size={32} className="text-[#d0d6e0] mx-auto mb-3" />
            <p className="text-[#718096] text-sm">No grants found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(grant => <GrantCard key={grant.id} grant={grant} />)}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 bg-white border border-[#e2e6ed] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-1">
              Looking for non-dilutive funding?
            </h3>
            <p className="text-sm text-[#4a5568] font-light">
              Get matched to grants relevant to your technology and stage.
            </p>
          </div>
          <Link href="/get-matched"
            className="flex-shrink-0 flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
            Get matched <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}
