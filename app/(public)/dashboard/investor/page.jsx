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
  const [saved, setSaved] = useState([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    fetch("/api/dashboard/investor")
      .then(r => r.json())
      .then(data => {
        if (!data || data.error) { setLoading(false); return; }
        setProfile(data.profile);
        setProfileForm({
          name: data.profile?.name || "",
          firm: data.profile?.firm || "",
          focus: data.profile?.focus || "",
          stage: data.profile?.stage || "",
          check_size: data.profile?.check_size || "",
          thesis: data.profile?.thesis || "",
          linkedin: data.profile?.linkedin || "",
          website: data.profile?.website || "",
        });
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

  const saveProfile = async () => {
    setSavingProfile(true);
    await fetch("/api/dashboard/investor", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    setProfile(p => ({ ...p, ...profileForm }));
    setSavingProfile(false);
    setEditingProfile(false);
  };

  const filtered = useMemo(() => {
    let list = activeTab === "saved" ? companies.filter(c => saved.includes(c.id)) : companies;
    return list.filter(c => {
      if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (stageFilter && c.funding_stage !== stageFilter) return false;
      if (signalFilter === "raising" && !c.looking_to_raise) return false;
      if (signalFilter === "hiring" && !c.is_hiring) return false;
      if (signalFilter === "partnerships" && !c.seeking_partnerships) return false;
      return true;
    });
  }, [companies, search, stageFilter, signalFilter, saved, activeTab]);

  const formatFocus = (focus) => focus?.split(",").map(f => f.trim().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");

  const inputClass = "w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]";
  const labelClass = "text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block";

  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

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

      <div className="flex-1 bg-[#f2f4f8] p-4 md:p-8 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <button className="md:hidden text-[#0f1a14] flex-shrink-0" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
            {activeTab === "saved" ? "Saved Companies" : activeTab === "profile" ? "Your Profile" : "Deal Flow"}
          </h1>
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && profileForm && (
          <div className="flex flex-col gap-4">
            {/* Avatar + name card */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#eef1f6] border border-[#e2e6ed] flex items-center justify-center text-2xl font-semibold text-[#2d6a4f] flex-shrink-0">
                {profile?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-[#0f1a14]">{profile?.name}</div>
                <div className="text-sm text-[#718096]">{profile?.firm}</div>
                {profile?.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2d6a4f] hover:underline mt-1 block">
                    LinkedIn
                  </a>
                )}
              </div>
              <button onClick={() => setEditingProfile(v => !v)}
                className="text-xs font-semibold border border-[#2d6a4f] text-[#2d6a4f] px-3 py-1.5 rounded-lg hover:bg-[#eef1f6] transition-colors flex-shrink-0">
                {editingProfile ? "Cancel" : "Edit"}
              </button>
            </div>

            {editingProfile ? (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Name</label><input value={profileForm.name} onChange={e => setProfileForm(p => ({...p, name: e.target.value}))} className={inputClass} /></div>
                  <div><label className={labelClass}>Firm</label><input value={profileForm.firm} onChange={e => setProfileForm(p => ({...p, firm: e.target.value}))} className={inputClass} /></div>
                  <div><label className={labelClass}>Focus sectors</label><input value={profileForm.focus} onChange={e => setProfileForm(p => ({...p, focus: e.target.value}))} placeholder="solar, battery_storage..." className={inputClass} /></div>
                  <div><label className={labelClass}>Stage</label><input value={profileForm.stage} onChange={e => setProfileForm(p => ({...p, stage: e.target.value}))} placeholder="Seed, Series A..." className={inputClass} /></div>
                  <div><label className={labelClass}>Check size</label><input value={profileForm.check_size} onChange={e => setProfileForm(p => ({...p, check_size: e.target.value}))} placeholder="$250K–$2M" className={inputClass} /></div>
                  <div><label className={labelClass}>LinkedIn</label><input value={profileForm.linkedin} onChange={e => setProfileForm(p => ({...p, linkedin: e.target.value}))} placeholder="https://linkedin.com/in/..." className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Investment thesis</label>
                  <textarea rows={4} value={profileForm.thesis} onChange={e => setProfileForm(p => ({...p, thesis: e.target.value}))}
                    placeholder="What are you looking for? What makes a company a fit for you?..."
                    className={inputClass + " resize-none"} />
                </div>
                <button onClick={saveProfile} disabled={savingProfile}
                  className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 w-fit">
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Focus", formatFocus(profile?.focus)],
                  ["Stage", profile?.stage],
                  ["Check size", profile?.check_size],
                ].filter(([,v]) => v).map(([k, v]) => (
                  <div key={k} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2">{k}</div>
                    <div className="text-sm text-[#0f1a14]">{v}</div>
                  </div>
                ))}
                {profile?.thesis && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5 md:col-span-2">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2">Investment thesis</div>
                    <div className="text-sm text-[#0f1a14] leading-relaxed">{profile.thesis}</div>
                  </div>
                )}
                {saved.length > 0 && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5 md:col-span-2">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3">Saved companies</div>
                    <div className="flex flex-col gap-2">
                      {companies.filter(c => saved.includes(c.id)).slice(0, 5).map(c => (
                        <Link key={c.id} href={`/companies/${c.id}`} className="text-sm text-[#2d6a4f] hover:underline">{c.name}</Link>
                      ))}
                    </div>
                    {saved.length > 5 && (
                      <button onClick={() => setActiveTab("saved")} className="text-xs text-[#718096] mt-2 hover:underline">
                        View all {saved.length} saved
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DEAL FLOW + SAVED TABS */}
        {(activeTab === "feed" || activeTab === "saved") && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Companies Raising</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{companies.filter(c => c.looking_to_raise).length}</div>
              </div>
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Saved</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{saved.length}</div>
              </div>
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Total Companies</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{companies.length}</div>
              </div>
            </div>

            {/* Compact filters */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-4 mb-4">
              <input type="text" placeholder="Search companies..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-[#f8f9fb] focus:outline-none focus:border-[#2d6a4f] mb-3" />
              <div className="flex flex-wrap gap-2">
                {STAGES.map(s => (
                  <button key={s} onClick={() => setStageFilter(stageFilter === s ? null : s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${stageFilter === s ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0]"}`}>
                    {STAGE_LABELS[s]}
                  </button>
                ))}
                {[["raising","Raising"],["hiring","Hiring"],["partnerships","Partnerships"]].map(([val, label]) => (
                  <button key={val} onClick={() => setSignalFilter(signalFilter === val ? null : val)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${signalFilter === val ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0]"}`}>
                    {label}
                  </button>
                ))}
                {(search || stageFilter || signalFilter) && (
                  <button onClick={() => { setSearch(""); setStageFilter(null); setSignalFilter(null); }}
                    className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-500 bg-white">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Company list */}
            <div className="flex flex-col gap-3">
              {filtered.length > 0 ? filtered.map(company => (
                <div key={company.id} className="bg-white border border-[#e2e6ed] rounded-xl p-4 flex items-start justify-between hover:border-[#2d6a4f] transition-colors">
                  <div className="flex gap-3 items-start flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#eef1f6] flex items-center justify-center text-sm font-semibold text-[#2d6a4f] flex-shrink-0">
                      {company.name?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link href={`/companies/${company.id}`} className="text-sm font-semibold text-[#0f1a14] hover:text-[#2d6a4f]">
                          {company.name}
                        </Link>
                        {company.funding_stage && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">
                            {STAGE_LABELS[company.funding_stage] || company.funding_stage.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      {company.description && <p className="text-xs text-[#718096] line-clamp-1 mb-1.5">{company.description}</p>}
                      <div className="flex gap-1.5 flex-wrap">
                        {company.looking_to_raise && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Raising</span>}
                        {company.is_hiring && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">Hiring</span>}
                        {company.seeking_partnerships && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Partnerships</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
                    <button onClick={() => toggleSave(company.id)}
                      className={`text-lg ${saved.includes(company.id) ? "text-[#2d6a4f]" : "text-[#d0d6e0]"}`}>
                      {saved.includes(company.id) ? "★" : "☆"}
                    </button>
                    <Link href={`/companies/${company.id}`} className="text-xs text-[#2d6a4f] font-mono">View</Link>
                  </div>
                </div>
              )) : (
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-8 text-center">
                  <p className="text-sm text-[#718096]">
                    {activeTab === "saved" ? "No saved companies yet. Star companies to save them." : "No companies match your filters."}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}