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
  const [saved, setSaved] = useState([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    const s = JSON.parse(localStorage.getItem("ep_saved") || "[]");
    setSaved(s);
  }, [isLoaded, user]);

  const toggleSave = (id) => {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("ep_saved", JSON.stringify(next));
      return next;
    });
  };

  const allSectors = useMemo(() => {
    const tags = new Set();
    companies.forEach(c => (c.industry_tags || []).forEach(t => tags.add(t)));
    return [...tags].sort();
  }, [companies]);

  const filtered = useMemo(() => {
    let list = activeTab === "saved" ? companies.filter(c => saved.includes(c.id)) : companies;
    return list.filter(c => {
      if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (stageFilter && c.funding_stage !== stageFilter) return false;
      if (signalFilter === "raising" && !c.looking_to_raise) return false;
      if (signalFilter === "hiring" && !c.is_hiring) return false;
      if (signalFilter === "partnerships" && !c.seeking_partnerships) return false;
      if (sectorFilter && !(c.industry_tags || []).includes(sectorFilter)) return false;
      return true;
    });
  }, [companies, search, stageFilter, signalFilter, sectorFilter, saved, activeTab]);

  const clearFilters = () => { setSearch(""); setStageFilter(null); setSignalFilter(null); setSectorFilter(null); };
  const hasFilters = search || stageFilter || signalFilter || sectorFilter;

  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative z-30 w-56 bg-[#0f1a14] flex flex-col gap-1 px-3 py-6 flex-shrink-0 h-full min-h-screen transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between mb-6 px-2">
          <div style={{ fontFamily: "Georgia, serif" }} className="text-white text-base">
            EP <span className="text-[#2d6a4f]">Investing</span>
          </div>
          <button className="md:hidden text-[#9ca8a0]" onClick={() => setSidebarOpen(false)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {[
          { id: "feed", label: "Deal Flow" },
          { id: "saved", label: "Saved" },
          { id: "profile", label: "Profile" },
        ].map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            className={"flex items-center px-3 py-2 rounded-lg text-sm text-left transition-colors w-full " + (activeTab === item.id ? "bg-[#1a2e20] text-white" : "text-[#9ca8a0] hover:text-white")}>
            {item.label}
          </button>
        ))}
        <Link href="/companies" className="flex items-center px-3 py-2 rounded-lg text-sm text-left transition-colors w-full text-[#9ca8a0] hover:text-white">
          Browse All
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 bg-[#f2f4f8] p-4 md:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <button className="md:hidden mr-3 text-[#0f1a14]" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
            {activeTab === "saved" ? "Saved Companies" : activeTab === "profile" ? "Your Profile" : "Deal Flow"}
          </h1>
          <span className="text-sm text-[#718096] hidden md:block">Welcome back{profile?.name ? `, ${profile.name}` : ""}</span>
        </div>

        {activeTab === "profile" ? (
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[["Name", profile?.name],["Firm", profile?.firm],["Focus", profile?.focus],["Stage", profile?.stage],["Check size", profile?.check_size]]
                .filter(([,v]) => v).map(([k,v]) => (
                  <div key={k}>
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">{k}</div>
                    <div className="text-sm text-[#0f1a14]">{v}</div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Companies Raising</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{companies.filter(c => c.looking_to_raise).length}</div>
                <div className="text-xs text-[#2d6a4f] mt-1">Active opportunities</div>
              </div>
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Saved</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{saved.length}</div>
                <div className="text-xs text-[#2d6a4f] mt-1 cursor-pointer" onClick={() => setActiveTab("saved")}>View saved</div>
              </div>
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Sectors</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{profile?.focus ? profile.focus.split(",").length : "--"}</div>
                <div className="text-xs text-[#718096] mt-1">{profile?.focus?.split(",").slice(0,2).join(" · ")}</div>
              </div>
            </div>

            {/* Feed */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <input type="text" placeholder="Search by company name..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-[#f8f9fb] focus:outline-none focus:border-[#2d6a4f] mb-3" />

              <div className="flex flex-wrap gap-2 mb-2">
                {STAGES.map(s => (
                  <button key={s} onClick={() => setStageFilter(stageFilter === s ? null : s)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${stageFilter === s ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                    {STAGE_LABELS[s]}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {[["raising","Raising"],["hiring","Hiring"],["partnerships","Partnerships"]].map(([val, label]) => (
                  <button key={val} onClick={() => setSignalFilter(signalFilter === val ? null : val)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${signalFilter === val ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {allSectors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {allSectors.map(s => (
                    <button key={s} onClick={() => setSectorFilter(sectorFilter === s ? null : s)}
                      className={`text-xs px-3 py-1 rounded-full border transition-colors ${sectorFilter === s ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              )}

              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-[#718096] hover:text-[#0f1a14] mb-4 underline block">
                  Clear filters
                </button>
              )}

              <div className="flex flex-col gap-3 mt-2">
                {filtered.length > 0 ? filtered.map(company => (
                  <div key={company.id} className="border border-[#e2e6ed] rounded-xl p-4 flex items-start justify-between hover:border-[#2d6a4f] transition-colors bg-[#fafbfc]">
                    <div className="flex gap-3 items-start">
                      <div className="w-9 h-9 rounded-lg bg-[#eef1f6] border border-[#e2e6ed] flex items-center justify-center text-sm font-semibold text-[#2d6a4f] flex-shrink-0">
                        {company.name?.[0] || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link href={`/companies/${company.id}`} className="text-sm font-semibold text-[#0f1a14] hover:text-[#2d6a4f]">
                            {company.name}
                          </Link>
                          {company.funding_stage && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">
                              {STAGE_LABELS[company.funding_stage] || company.funding_stage.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#718096] mb-2 line-clamp-1">{company.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          {company.looking_to_raise && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Raising</span>}
                          {company.is_hiring && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Hiring</span>}
                          {company.seeking_partnerships && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Partnerships</span>}
                          {(company.industry_tags || []).slice(0,2).map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">{t.replace(/_/g, " ")}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 flex-shrink-0 ml-4">
                      <button onClick={() => toggleSave(company.id)}
                        className={`text-lg transition-colors ${saved.includes(company.id) ? "text-[#2d6a4f]" : "text-[#d0d6e0] hover:text-[#2d6a4f]"}`}>
                        {saved.includes(company.id) ? "★" : "☆"}
                      </button>
                      {company.raise_target && (
                        <div className="text-right">
                          <div className="text-xs font-mono text-[#718096]">Target</div>
                          <div className="text-sm font-semibold text-[#0f1a14]">{company.raise_target}</div>
                        </div>
                      )}
                      <Link href={`/companies/${company.id}`} className="text-xs text-[#2d6a4f] font-mono hover:underline">
                        View
                      </Link>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-[#718096] py-4">
                    {activeTab === "saved" ? "No saved companies yet." : hasFilters ? "No companies match your filters." : "No companies found."}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}