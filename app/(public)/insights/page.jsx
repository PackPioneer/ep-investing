"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Globe, TrendingUp, Search } from "lucide-react";

const SECTORS = ["All", "green_hydrogen", "nuclear_technologies", "battery_storage", "electric_aviation", "solar", "carbon_credits", "industrial_decarb", "ev_charging"];
const GEOGRAPHIES = ["All", "United States", "Europe", "Global", "Asia Pacific", "Middle East"];

function ReportCard({ report }) {
  return (
    <Link href={`/insights/${report.slug}`}
      className="bg-[#111518] border border-[#1e2428] rounded-xl p-7 flex flex-col gap-4 hover:border-[#c8f560] hover:bg-[#171c20] transition-all group">
      
      {/* Sector + geography badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {report.sector && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#1e2e24] bg-[#151d18] text-[#c8f560]">
            {report.sector.replace(/_/g, " ")}
          </span>
        )}
        {report.geography && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#1e2428] bg-[#111518] text-[#6b7a72] flex items-center gap-1">
            <Globe size={8} /> {report.geography}
          </span>
        )}
        {report.published_at && (
          <span className="text-[10px] font-mono text-[#4a5550] ml-auto">
            {new Date(report.published_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      <div>
        <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#e8ede8] leading-snug group-hover:text-[#c8f560] transition-colors mb-1">
          {report.title}
        </h3>
        {report.subtitle && (
          <p className="text-sm text-[#6b7a72] font-light">{report.subtitle}</p>
        )}
      </div>

      {report.summary && (
        <p className="text-xs text-[#6b7a72] leading-relaxed line-clamp-3 font-light">{report.summary}</p>
      )}

      {/* Market stats */}
      {(report.market_value || report.expected_growth) && (
        <div className="flex gap-4 pt-3 border-t border-[#1e2428]">
          {report.market_value && (
            <div>
              <div className="text-[10px] font-mono text-[#4a5550] uppercase tracking-wider mb-0.5">Market Size</div>
              <div className="text-sm font-semibold text-[#e8ede8]">{report.market_value}</div>
            </div>
          )}
          {report.expected_growth && (
            <div>
              <div className="text-[10px] font-mono text-[#4a5550] uppercase tracking-wider mb-0.5">Growth</div>
              <div className="text-sm font-semibold text-[#c8f560]">{report.expected_growth}</div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-[#c8f560] font-mono mt-auto group-hover:gap-2 transition-all">
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
    <div className="min-h-screen bg-[#0a0d0f] text-[#e8ede8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 text-[#c8f560] text-xs font-mono tracking-widest uppercase border border-[#1e2e24] bg-[#151d18] rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8f560]" />
            EP Investment Intelligence
          </div>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl text-[#e8ede8] mb-3">
                Industry Reports
              </h1>
              <p className="text-[#6b7a72] text-base max-w-xl leading-relaxed font-light">
                In-depth analysis of climate and energy sectors — covering capital flows, key players, and investment signals by geography.
              </p>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#c8f560]">{reports.length}</div>
              <div className="text-xs font-mono text-[#4a5550]">reports published</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-[#111518] border border-[#252c32] rounded-xl px-4 py-3 mb-6 focus-within:border-[#c8f560] transition-all max-w-xl">
          <Search size={14} className="text-[#4a5550]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="flex-1 bg-transparent text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none" />
        </div>

        {/* Sector filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SECTORS.map(s => (
            <button key={s} onClick={() => setSector(s)}
              className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
                sector === s
                  ? "border-[#c8f560] bg-[rgba(200,245,96,0.1)] text-[#c8f560]"
                  : "border-[#1e2e24] bg-[#151d18] text-[#6b7a72] hover:border-[#c8f560] hover:text-[#c8f560]"
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
                  ? "border-[#c8f560] bg-[rgba(200,245,96,0.1)] text-[#c8f560]"
                  : "border-[#1e2428] bg-[#111518] text-[#6b7a72] hover:border-[#c8f560] hover:text-[#c8f560]"
              }`}>
              <Globe size={9} /> {g}
            </button>
          ))}
        </div>

        {/* Reports grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-[#111518] border border-[#1e2428] rounded-xl p-7 h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(report => <ReportCard key={report.id} report={report} />)}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-[#1e2428] rounded-2xl">
            <FileText size={32} className="text-[#252c32] mx-auto mb-4" />
            <p className="text-[#4a5550] font-mono text-sm">No reports found</p>
            <p className="text-[#4a5550] text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}

      </div>
    </div>
  );
}
