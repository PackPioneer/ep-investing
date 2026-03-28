"use client";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STAGES = ["pre_seed","seed","series_a","series_b","series_c","growth"];
const STAGE_LABELS = { pre_seed:"Pre-Seed", seed:"Seed", series_a:"Series A", series_b:"Series B", series_c:"Series C", growth:"Growth" };

export default function InvestorDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(null);
  const [signalFilter, setSignalFilter] = useState(null);
  const [sectorFilter, setSectorFilter] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    fetch("/api/dashboard/investor")
      .then(r => r.json())
      .then(data => {
        if (!data || data.error) { setLoading(false); return; }
        setProfile(data.profile);
        setCompanies(data.companies || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  const allSectors = useMemo(() => {
    const tags = new Set();
    companies.forEach(c => (c.industry_tags || []).forEach(t => tags.add(t)));
    return [...tags].sort();
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (stageFilter && c.funding_stage !== stageFilter) return false;
      if (signalFilter === "raising" && !c.looking_to_raise) return false;
      if (signalFilter === "hiring" && !c.is_hiring) return false;
      if (signalFilter === "partnerships" && !c.seeking_partnerships) return false;
      if (sectorFilter && !(c.industry_tags || []).includes(sectorFilter)) return false;
      return true;
    });
  }, [companies, search, stageFilter, signalFilter, sectorFilter]);

  const clearFilters = () => {
    setSearch(""); setStageFilter(null); setSignalFilter(null); setSectorFilter(null);
  };

  const hasFilters = search || stageFilter || signalFilter || sectorFilter;

  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-2">
          Investor Dashboard
        </h1>
        <p className="text-sm text-[#4a5568] mb-8">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}. Here's your deal flow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Companies Raising</div>
            <div className="text-3xl font-bold text-[#0f1a14]">{companies.filter(c => c.looking_to_raise).length}</div>
          </div>
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">New This Week</div>
            <div className="text-3xl font-bold text-[#0f1a14]">—</div>
          </div>
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Sectors Tracked</div>
            <div className="text-3xl font-bold text-[#0f1a14]">{profile?.focus ? profile.focus.split(",").length : "—"}</div>
          </div>
        </div>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Company Signal Feed</h2>
            <Link href="/search" className="text-xs text-[#2d6a4f] font-mono hover:underline">Browse all →</Link>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by company name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] mb-3"
          />

          {/* Stage filters */}
          <div className="flex flex-wrap gap-2 mb-2">
            {STAGES.map(s => (
              <button key={s} onClick={() => setStageFilter(stageFilter === s ? null : s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${stageFilter === s ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Signal filters */}
          <div className="flex flex-wrap gap-2 mb-2">
            {[["raising","💰 Raising"],["hiring","🙋 Hiring"],["partnerships","🤝 Partnerships"]].map(([val, label]) => (
              <button key={val} onClick={() => setSignalFilter(signalFilter === val ? null : val)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${signalFilter === val ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Sector filters */}
          {allSectors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {allSectors.map(s => (
                <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${sectorFilter === s ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          )}

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-[#718096] hover:text-[#0f1a14] mb-4 underline">
              Clear filters
            </button>
          )}

          {filtered.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filtered.map(company => (
                <div key={company.id} className="flex items-start justify-between py-3 border-b border-[#e2e6ed] last:border-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={"/companies/" + company.id} className="text-sm font-semibold text-[#0f1a14] hover:text-[#2d6a4f]">
                        {company.name}
                      </Link>
                      {company.funding_stage && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">
                          {STAGE_LABELS[company.funding_stage] || company.funding_stage.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#718096] line-clamp-1">{company.description}</p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      {company.looking_to_raise && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">💰 Raising</span>}
                      {company.is_hiring && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">🙋 Hiring</span>}
                      {company.seeking_partnerships && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">🤝 Partnerships</span>}
                      {(company.industry_tags || []).slice(0, 2).map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">{t.replace(/_/g, " ")}</span>
                      ))}
                    </div>
                  </div>
                  <Link href={"/companies/" + company.id} className="text-xs text-[#2d6a4f] font-mono hover:underline flex-shrink-0 ml-4">
                    View →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#718096] mt-2">{hasFilters ? "No companies match your filters." : "No companies match your focus areas yet."}</p>
          )}
        </div>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
          <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-4">Your Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            {[["Name", profile?.name],["Firm", profile?.firm],["Focus", profile?.focus],["Stage", profile?.stage],["Check size", profile?.check_size]]
              .filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">{k}</div>
                  <div className="text-sm text-[#0f1a14]">{v}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}