"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Search, Globe, TrendingUp } from "lucide-react";

const TYPES = ["All", "venture_capital", "private_equity", "family_office", "corporate_vc", "government", "philanthropy"];

function InvestorCard({ investor }) {
  return (
    <div className="bg-white border border-[#e2e6ed] rounded-xl p-6 flex flex-col gap-4 hover:border-[#2d6a4f] hover:shadow-sm transition-all group">
      <div className="flex items-start gap-3">
        {investor.logo ? (
          <img src={investor.logo} alt={investor.name}
            className="w-10 h-10 object-contain rounded-lg border border-[#e2e6ed] p-1 bg-white flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center text-sm font-bold text-[#2d6a4f] flex-shrink-0">
            {(investor.name || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-[#0f1a14] text-sm leading-snug group-hover:text-[#2d6a4f] transition-colors">
            {investor.name}
          </h3>
          {investor.type && (
            <span className="text-[10px] font-mono text-[#718096] capitalize">
              {investor.type.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </div>

      {investor.description && (
        <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-2 font-light">
          {investor.description}
        </p>
      )}

      {investor.focus && investor.focus.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {investor.focus.slice(0, 3).map((f, i) => (
            <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] border border-[#e2e6ed] text-[#4a5568]">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-[#e2e6ed] flex items-center justify-between">
        {investor.website ? (
          <a href={investor.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#2d6a4f] font-medium hover:underline">
            Visit website <ArrowRight size={11} />
          </a>
        ) : (
          <span className="text-xs text-[#718096] font-mono">No website</span>
        )}
        <Link href="/get-matched"
          className="text-[10px] font-mono text-[#718096] hover:text-[#2d6a4f] transition-colors">
          Get intro →
        </Link>
      </div>
    </div>
  );
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  useEffect(() => {
    fetch("/api/investors")
      .then(r => r.json())
      .then(data => { setInvestors(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = investors.filter(inv => {
    const matchSearch = !search ||
      inv.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = type === "All" || inv.type === type;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="flex items-end justify-between gap-6 flex-wrap mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
              Investors
            </div>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl text-[#0f1a14] mb-2">
              Climate Investors
            </h1>
            <p className="text-[#4a5568] text-base font-light max-w-xl">
              VCs, family offices, and institutional investors deploying capital across the energy transition.
            </p>
          </div>
          <div className="text-right">
            <div style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#2d6a4f]">{investors.length}</div>
            <div className="text-xs font-mono text-[#718096]">investors tracked</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex items-center gap-3 flex-1 bg-white border border-[#d0d6e0] rounded-xl px-4 py-3 focus-within:border-[#2d6a4f] transition-all max-w-md">
            <Search size={14} className="text-[#718096]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search investors…"
              className="flex-1 bg-transparent text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none" />
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`text-xs font-mono px-3 py-2 rounded-lg border transition-all ${
                  type === t
                    ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                    : "border-[#e2e6ed] bg-white text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                }`}>
                {t === "All" ? "All types" : t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Result count */}
        {!loading && (
          <p className="text-xs font-mono text-[#718096] mb-5">
            {filtered.length} investor{filtered.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#e2e6ed] rounded-xl p-6 h-44 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#e2e6ed] rounded-2xl bg-white">
            <p className="text-[#718096] text-sm">No investors found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(inv => <InvestorCard key={inv.id} investor={inv} />)}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 bg-white border border-[#e2e6ed] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-1">
              Investing in climate?
            </h3>
            <p className="text-sm text-[#4a5568] font-light">
              Get matched to companies and co-investors aligned to your thesis.
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
