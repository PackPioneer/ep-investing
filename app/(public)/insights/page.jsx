"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Globe, TrendingUp, Search } from "lucide-react";

const SECTORS = ["All", "green_hydrogen", "nuclear_technologies", "battery_storage", "electric_aviation", "solar", "carbon_credits", "industrial_decarb", "ev_charging"];
const GEOGRAPHIES = ["All", "United States", "Europe", "Global", "Asia Pacific", "Middle East"];

function ReportCard({ report }) {
  return (
    <Link href={`/insights/${report.slug}`}
      className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-7 flex flex-col gap-4 hover:border-[#2d6a4f] hover:bg-[#f8f9fb] transition-all group">
      
      {/* Sector + geography badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {report.sector && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f]">
            {report.sector.replace(/_/g, " ")}
          </span>
        )}
        {report.geography && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#e2e6ed] bg-[#ffffff] text-[#4a5568] flex items-center gap-1">
            <Globe size={8} /> {report.geography}
          </span>
        )}
        {report.published_at && (
          <span className="text-[10px] font-mono text-[#718096] ml-auto">
            {new Date(report.published_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      <div>
        <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] leading-snug group-hover:text-[#2d6a4f] transition-colors mb-1">
          {report.title}
        </h3>
        {report.subtitle && (
          <p className="text-sm text-[#4a5568] font-light">{report.subtitle}</p>
        )}
      </div>

      {report.summary && (
        <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-3 font-light">{report.summary}</p>
      )}

      {/* Market stats */}
      {(report.market_value || report.expected_growth) && (
        <div className="flex gap-4 pt-3 border-t border-[#e2e6ed]">
          {report.market_value && (
            <div>
              <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-0.5">Market Size</div>
              <div className="text-sm font-semibold text-[#0f1a14]">{report.market_value}</div>
            </div>
          )}
          {report.expected_growth && (
            <div>
              <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-0.5">Growth</div>
              <div className="text-sm font-semibold text-[#2d6a4f]">{report.expected_growth}</div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-[#2d6a4f] font-mono mt-auto group-hover:gap-2 transition-all">
        Read report <ArrowRight size={11} />
      </div>
    </Link>
  );
}

export default function InsightsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState("All");
  const [geography, setGeography] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (sector !== "All") params.set("sector", sector);
    if (geography !== "All") params.set("geography", geography);

    fetch(`/api/reports?${params}`)
      .then(r => r.json())
      .then(data => { setReports(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sector, geography]);

  const filtered = reports.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.summary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
            EP Investment Intelligence
          </div>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl text-[#0f1a14] mb-3">
                Industry Reports
              </h1>
              <p className="text-[#4a5568] text-base max-w-xl leading-relaxed font-light">
                In-depth analysis of climate and energy sectors — covering capital flows, key players, and investment signals by geography.
              </p>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#2d6a4f]">{reports.length}</div>
              <div className="text-xs font-mono text-[#718096]">reports published</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-[#ffffff] border border-[#d0d6e0] rounded-xl px-4 py-3 mb-6 focus-within:border-[#2d6a4f] transition-all max-w-xl">
          <Search size={14} className="text-[#718096]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="flex-1 bg-transparent text-sm text-[#0f1a14] placeholder-[#718096] outline-none" />
        </div>

        {/* Sector filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SECTORS.map(s => (
            <button key={s} onClick={() => setSector(s)}
              className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
                sector === s
                  ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                  : "border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
              }`}>
              {s === "All" ? "All sectors" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Geography filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {GEOGRAPHIES.map(g => (
            <button key={g} onClick={() => setGeography(g)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                geography === g
                  ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                  : "border-[#e2e6ed] bg-[#ffffff] text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
              }`}>
              <Globe size={9} /> {g}
            </button>
          ))}
        </div>

        {/* Reports grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-7 h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(report => <ReportCard key={report.id} report={report} />)}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-[#e2e6ed] rounded-2xl">
            <FileText size={32} className="text-[#d0d6e0] mx-auto mb-4" />
            <p className="text-[#718096] font-mono text-sm">No reports found</p>
            <p className="text-[#718096] text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}

      </div>
    </div>
  );
}
