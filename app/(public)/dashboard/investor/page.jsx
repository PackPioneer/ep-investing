"use client";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Bookmark, User, Search, LayoutDashboard, FileText, ArrowRight } from "lucide-react";

const STAGES = ["pre_seed","seed","series_a","series_b","series_c","growth"];
const STAGE_LABELS = { pre_seed:"Pre-Seed", seed:"Seed", series_a:"Series A", series_b:"Series B", series_c:"Series C", growth:"Growth" };
const SECTORS = ["solar","wind_energy","battery_storage","green_hydrogen","nuclear_technologies","ev_charging","carbon_credits","direct_air_capture","saf_efuels","electric_aviation","geothermal_energy","industrial_decarbonization","clean_cooking","grid_storage"];
const GEOS = ["us","europe","asia","africa","latam","mena","global","oceania"];
const GEO_LABELS = { us:"United States", europe:"Europe", asia:"Asia", africa:"Africa", latam:"Latin America", mena:"MENA", global:"Global", oceania:"Oceania" };
const BUSINESS_MODELS = ["b2b","b2c","b2g","hardware","software","project_developer","marketplace","mixed"];
const MODEL_LABELS = { b2b:"B2B", b2c:"B2C", b2g:"B2G", hardware:"Hardware", software:"Software", project_developer:"Project Dev", marketplace:"Marketplace", mixed:"Mixed" };

export default function InvestorDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState(null);
  const [signalFilter, setSignalFilter] = useState(null);
  const [sectorFilter, setSectorFilter] = useState(null);
  const [geoFilter, setGeoFilter] = useState(null);
  const [modelFilter, setModelFilter] = useState(null);
  const [saved, setSaved] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
const [investorLogoUrl, setInvestorLogoUrl] = useState(null);
const [uploadingInvestorLogo, setUploadingInvestorLogo] = useState(false);
const [pipeline, setPipeline] = useState({});
const [changingStage, setChangingStage] = useState(null);
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
          location: data.profile?.location || "",
          point_of_contact: data.profile?.point_of_contact || "",
          previous_investments: data.profile?.previous_investments || "",
          round_preference: data.profile?.round_preference || "",
        });
        setCompanies(data.companies || []);
        setInvestorLogoUrl(data.profile?.logo_url || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/grants?limit=20")
      .then(r => r.json())
      .then(data => setGrants(Array.isArray(data) ? data : []))
      .catch(() => {});
    const s = JSON.parse(localStorage.getItem("ep_saved") || "[]");
    setSaved(s);
    const p = JSON.parse(localStorage.getItem("ep_pipeline") || "{}");
setPipeline(p);
  }, [isLoaded, user]);

  const toggleSave = (id) => {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem("ep_saved", JSON.stringify(next));
      return next;
    });
  };
const setStage = (id, stage) => {
  setPipeline(prev => {
    const next = { ...prev, [id]: stage };
    localStorage.setItem("ep_pipeline", JSON.stringify(next));
    return next;
  });
  setChangingStage(null);
};

const getStageColor = (stage) => {
  if (stage === "contacted") return "#378ADD";
  if (stage === "diligence") return "#EF9F27";
  if (stage === "passed") return "#E24B4A";
  return "#2d6a4f";
};

const getStageLabel = (stage) => {
  if (stage === "contacted") return "Contacted";
  if (stage === "diligence") return "In diligence";
  if (stage === "passed") return "Passed";
  return "Watching";
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
async function uploadInvestorLogo(e) {
  const file = e.target.files[0];
  if (!file) return;
  setUploadingInvestorLogo(true);
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/dashboard/investor-logo", { method: "POST", body: formData });
  if (res.ok) { const { url } = await res.json(); setInvestorLogoUrl(url); }
  setUploadingInvestorLogo(false);
}

  const clearFilters = () => {
    setSearch(""); setStageFilter(null); setSignalFilter(null);
    setSectorFilter(null); setGeoFilter(null); setModelFilter(null);
  };

  const hasFilters = search || stageFilter || signalFilter || sectorFilter || geoFilter || modelFilter;

  const filtered = useMemo(() => {
    let list = activeTab === "saved" ? companies.filter(c => saved.includes(c.id)) : companies;
    return list.filter(c => {
      if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (stageFilter && c.funding_stage !== stageFilter) return false;
      if (signalFilter === "raising" && !c.looking_to_raise) return false;
      if (signalFilter === "hiring" && !c.is_hiring) return false;
      if (signalFilter === "partnerships" && !c.seeking_partnerships) return false;
      if (sectorFilter && !(c.industry_tags || []).includes(sectorFilter)) return false;
      if (geoFilter && !(c.target_geographies || []).includes(geoFilter)) return false;
      if (modelFilter && c.business_model !== modelFilter) return false;
      return true;
    });
  }, [companies, search, stageFilter, signalFilter, sectorFilter, geoFilter, modelFilter, saved, activeTab]);

  const formatFocus = (focus) => focus?.split(",").map(f => f.trim().replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())).join(", ");
  const inputClass = "w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]";
  const labelClass = "text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block";

  const NAV = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "feed", label: "Deal Flow", icon: TrendingUp },
    { id: "saved", label: "Saved", icon: Bookmark, badge: saved.length },
    { id: "grants", label: "Grants", icon: FileText },
    { id: "profile", label: "Profile", icon: User },
  ];

  const FilterRow = ({ label, options, active, setActive, labelMap }) => (
    <div className="mb-3">
      <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button key={o} onClick={() => setActive(active === o ? null : o)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active === o ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
            {labelMap ? labelMap[o] : o.replace(/_/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );

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

      {/* Sidebar */}
      <div className={`fixed md:relative z-30 w-56 bg-[#0f1a14] flex flex-col gap-1 px-3 py-6 flex-shrink-0 h-full min-h-screen transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div style={{ fontFamily: "Georgia, serif" }} className="text-white text-base">
            EP <span className="text-[#2d6a4f]">Investing</span>
          </div>
          <button className="md:hidden text-[#9ca8a0]" onClick={() => setSidebarOpen(false)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-2 mb-4">
          <div className="text-xs font-mono text-[#4a6a54] uppercase tracking-widest mb-1">Investor</div>
          <div className="text-sm font-semibold text-white truncate">{profile?.name || user?.firstName || "Your account"}</div>
          {profile?.firm && <div className="text-xs text-[#9ca8a0] truncate">{profile.firm}</div>}
        </div>

        <div className="h-px bg-[#1a2e20] mx-2 mb-4" />

        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={"flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors w-full " + (activeTab === item.id ? "bg-[#1a2e20] text-white" : "text-[#9ca8a0] hover:text-white")}>
              <div className="flex items-center gap-2.5">
                <Icon size={15} />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="text-xs bg-[#2d6a4f] text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{item.badge}</span>
              )}
            </button>
          );
        })}

        <div className="h-px bg-[#1a2e20] mx-2 my-3" />

        <Link href="/search" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#9ca8a0] hover:text-white transition-colors">
          <Search size={15} />
          <span>Browse directory</span>
        </Link>
        <Link href="/investors" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#9ca8a0] hover:text-white transition-colors">
          <TrendingUp size={15} />
          <span>All investors</span>
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 bg-[#f2f4f8] p-4 md:p-8 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <button className="md:hidden text-[#0f1a14] flex-shrink-0" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
            {NAV.find(n => n.id === activeTab)?.label || "Dashboard"}
          </h1>
        </div>

        {/* OVERVIEW TAB */}
    {activeTab === "overview" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total companies", value: companies.length, sub: "in directory" },
                { label: "Hiring now", value: companies.filter(c => c.is_hiring).length, sub: "open roles" },
                { label: "Seeking partnerships", value: companies.filter(c => c.seeking_partnerships).length, sub: "companies" },
                { label: "Grants tracked", value: grants.length, sub: "opportunities" },
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                  <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">{stat.label}</div>
                  <div className="text-2xl font-semibold text-[#0f1a14]">{stat.value}</div>
                  <div className="text-xs text-[#a0aec0] font-mono mt-0.5">{stat.sub}</div>
                </div>
              ))}
            </div>

            {!profile?.thesis && !profile?.check_size && (
              <div className="bg-white border border-dashed border-[#c8d8cc] rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#0f1a14] mb-1">Complete your investor profile</div>
                  <div className="text-xs text-[#718096]">Add your thesis, check size, and focus areas to get better matches.</div>
                </div>
                <button onClick={() => setActiveTab("profile")}
                  className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] flex-shrink-0 ml-4">
                  Complete profile
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">Recently active companies</div>
                  <button onClick={() => setActiveTab("feed")} className="text-xs text-[#2d6a4f] font-mono hover:underline">View all →</button>
                </div>
                <div className="flex flex-col gap-2">
                  {companies.slice(0, 6).map(c => (
                    <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-[#f2f4f8] last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[#eef1f6] flex items-center justify-center text-xs font-semibold text-[#2d6a4f] flex-shrink-0">
                          {c.name?.[0] || "?"}
                        </div>
                        <Link href={`/companies/${c.id}`} className="text-sm text-[#0f1a14] hover:text-[#2d6a4f]">{c.name}</Link>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {c.looking_to_raise && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">Raising</span>}
                        {c.is_hiring && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">Hiring</span>}
                        <button onClick={() => toggleSave(c.id)} className={`text-base ${saved.includes(c.id) ? "text-[#2d6a4f]" : "text-[#d0d6e0]"}`}>
                          {saved.includes(c.id) ? "★" : "☆"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">Grants closing soon</div>
                  <button onClick={() => setActiveTab("grants")} className="text-xs text-[#2d6a4f] font-mono hover:underline">View all →</button>
                </div>
                <div className="flex flex-col gap-2">
                  {grants.slice(0, 5).map(g => (
                    <div key={g.id} className="py-1.5 border-b border-[#f2f4f8] last:border-0">
                      <div className="text-xs font-medium text-[#0f1a14] mb-1 leading-snug">{g.title}</div>
                      <div className="flex items-center gap-2">
                        {g.deadline_date && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                            {new Date(g.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                        {g.amount_max_usd && (
                          <span className="text-[10px] text-[#718096] font-mono">Up to ${Number(g.amount_max_usd).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {grants.length === 0 && <p className="text-sm text-[#718096]">No grants available.</p>}
                </div>
              </div>
            </div>

            {saved.length > 0 && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">Your pipeline</div>
                  <button onClick={() => setActiveTab("saved")} className="text-xs text-[#2d6a4f] font-mono hover:underline">View all →</button>
                </div>
                <div className="flex gap-4">
                  {[
                    { label: "Watching", key: "watching", color: "#2d6a4f" },
                    { label: "Contacted", key: "contacted", color: "#378ADD" },
                    { label: "In diligence", key: "diligence", color: "#EF9F27" },
                    { label: "Passed", key: "passed", color: "#E24B4A" },
                  ].map(col => (
                    <div key={col.key} className="flex-1 text-center">
                      <div className="text-xl font-semibold text-[#0f1a14]">
                        {companies.filter(c => saved.includes(c.id) && (pipeline[c.id] || "watching") === col.key).length}
                      </div>
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: col.color }}>{col.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && profileForm && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 flex items-center gap-5">
              <div className="relative flex-shrink-0">
  {investorLogoUrl ? (
    <img src={investorLogoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border border-[#e2e6ed]" />
  ) : (
    <div className="w-16 h-16 rounded-full bg-[#eef1f6] border border-[#e2e6ed] flex items-center justify-center text-2xl font-semibold text-[#2d6a4f]">
      {profile?.name?.[0]?.toUpperCase() || "?"}
    </div>
  )}
</div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-[#0f1a14]">{profile?.name || "Your Name"}</div>
                <div className="text-sm text-[#718096]">{profile?.firm || "Your Firm"}</div>
                {profile?.location && <div className="text-xs text-[#718096] mt-0.5">{profile.location}</div>}
              </div>
              <button onClick={() => setEditingProfile(v => !v)}
                className="text-xs font-semibold border border-[#2d6a4f] text-[#2d6a4f] px-3 py-1.5 rounded-lg hover:bg-[#eef1f6] transition-colors flex-shrink-0">
                {editingProfile ? "Cancel" : "Edit profile"}
              </button>
            </div>

            {editingProfile ? (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Name</label><input value={profileForm.name} onChange={e => setProfileForm(p => ({...p, name: e.target.value}))} className={inputClass} /></div>
                  <div><label className={labelClass}>Firm</label><input value={profileForm.firm} onChange={e => setProfileForm(p => ({...p, firm: e.target.value}))} className={inputClass} /></div>
                  <div><label className={labelClass}>Location</label><input value={profileForm.location} onChange={e => setProfileForm(p => ({...p, location: e.target.value}))} placeholder="San Francisco, CA" className={inputClass} /></div>
                  <div><label className={labelClass}>Point of contact</label><input value={profileForm.point_of_contact} onChange={e => setProfileForm(p => ({...p, point_of_contact: e.target.value}))} placeholder="jane@firm.com" className={inputClass} /></div>
                  <div><label className={labelClass}>Focus sectors</label><input value={profileForm.focus} onChange={e => setProfileForm(p => ({...p, focus: e.target.value}))} placeholder="solar, battery_storage..." className={inputClass} /></div>
                  <div><label className={labelClass}>Stage preference</label><input value={profileForm.stage} onChange={e => setProfileForm(p => ({...p, stage: e.target.value}))} placeholder="Seed, Series A..." className={inputClass} /></div>
                  <div><label className={labelClass}>Round preference</label><input value={profileForm.round_preference} onChange={e => setProfileForm(p => ({...p, round_preference: e.target.value}))} placeholder="Lead, Follow, Co-invest..." className={inputClass} /></div>
                  <div><label className={labelClass}>Check size</label><input value={profileForm.check_size} onChange={e => setProfileForm(p => ({...p, check_size: e.target.value}))} placeholder="$250K–$2M" className={inputClass} /></div>
                  <div><label className={labelClass}>LinkedIn</label><input value={profileForm.linkedin} onChange={e => setProfileForm(p => ({...p, linkedin: e.target.value}))} placeholder="https://linkedin.com/in/..." className={inputClass} /></div>
                  <div><label className={labelClass}>Website</label><input value={profileForm.website} onChange={e => setProfileForm(p => ({...p, website: e.target.value}))} placeholder="https://..." className={inputClass} /></div>
                </div>
                <div><label className={labelClass}>Previous investments</label><input value={profileForm.previous_investments} onChange={e => setProfileForm(p => ({...p, previous_investments: e.target.value}))} placeholder="Tesla, Form Energy..." className={inputClass} /></div>
                <div><label className={labelClass}>Investment thesis</label>
                  <textarea rows={4} value={profileForm.thesis} onChange={e => setProfileForm(p => ({...p, thesis: e.target.value}))}
                    placeholder="What are you looking for? What makes a company a fit?"
                    className={inputClass + " resize-none"} />
                </div>
                <div>
  <label className={labelClass}>Logo / Profile photo</label>
  {investorLogoUrl && (
    <img src={investorLogoUrl} alt="Logo" className="w-14 h-14 rounded-full object-cover border border-[#e2e6ed] mb-2" />
  )}
  <label className="cursor-pointer inline-flex items-center gap-2 border border-[#d0d6e0] text-sm text-[#4a5568] px-4 py-2 rounded-lg hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
    {uploadingInvestorLogo ? "Uploading..." : investorLogoUrl ? "Replace photo" : "Upload photo"}
    <input type="file" accept="image/*" onChange={uploadInvestorLogo} className="hidden" disabled={uploadingInvestorLogo} />
  </label>
</div>
                <button onClick={saveProfile} disabled={savingProfile}
                  className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 w-fit">
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Location", profile?.location],
                  ["Point of contact", profile?.point_of_contact],
                  ["Focus sectors", formatFocus(profile?.focus)],
                  ["Stage preference", profile?.stage],
                  ["Round preference", profile?.round_preference],
                  ["Check size", profile?.check_size],
                ].filter(([,v]) => v).map(([k, v]) => (
                  <div key={k} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2">{k}</div>
                    <div className="text-sm text-[#0f1a14]">{v}</div>
                  </div>
                ))}
                {profile?.previous_investments && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5 md:col-span-2">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2">Previous investments</div>
                    <div className="text-sm text-[#0f1a14]">{profile.previous_investments}</div>
                  </div>
                )}
                {profile?.thesis && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5 md:col-span-2">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2">Investment thesis</div>
                    <div className="text-sm text-[#0f1a14] leading-relaxed">{profile.thesis}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* GRANTS TAB */}
        {activeTab === "grants" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-1">Non-dilutive funding</div>
              <p className="text-xs text-[#718096] mb-5">Government grants and funding opportunities relevant to climate and energy companies in your portfolio.</p>
              {grants.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {grants.map(grant => (
                    <div key={grant.id} className="border border-[#e2e6ed] rounded-xl p-4 hover:border-[#2d6a4f] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-[#0f1a14] mb-1">{grant.title}</div>
                          {grant.funder_name && <div className="text-xs text-[#718096] mb-2">{grant.funder_name}</div>}
                          <div className="flex flex-wrap gap-2">
                            {grant.deadline_date && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                Closes {new Date(grant.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                            {grant.amount_max_usd && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#2d6a4f] border border-[#c8d8cc]">
                                Up to ${Number(grant.amount_max_usd).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {grant.url && (
                          <a href={grant.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs bg-[#2d6a4f] text-white px-3 py-1.5 rounded-lg hover:bg-[#235a40] flex-shrink-0 flex items-center gap-1">
                            View <ArrowRight size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#718096]">No grants available right now.</p>
              )}
            </div>
          </div>
        )}

        {/* SAVED / PIPELINE TAB */}
        {activeTab === "saved" && (
          <div className="flex flex-col gap-4">
            {saved.length === 0 ? (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8 text-center">
                <p className="text-sm text-[#718096] mb-2">No saved companies yet.</p>
                <p className="text-xs text-[#a0aec0]">Star companies in Deal Flow to track them here.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                  {[
                    { label: "Watching", key: "watching", color: "#2d6a4f" },
                    { label: "Contacted", key: "contacted", color: "#378ADD" },
                    { label: "In diligence", key: "diligence", color: "#EF9F27" },
                    { label: "Passed", key: "passed", color: "#E24B4A" },
                  ].map(col => (
                    <div key={col.key} className="bg-white border border-[#e2e6ed] rounded-xl p-4" style={{ borderTop: `2px solid ${col.color}` }}>
                      <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">{col.label}</div>
                      <div className="text-2xl font-semibold text-[#0f1a14]">
                        {companies.filter(c => saved.includes(c.id) && (pipeline[c.id] || "watching") === col.key).length}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { label: "Watching", key: "watching", color: "#2d6a4f" },
                    { label: "Contacted", key: "contacted", color: "#378ADD" },
                    { label: "In diligence", key: "diligence", color: "#EF9F27" },
                    { label: "Passed", key: "passed", color: "#E24B4A" },
                  ].map(col => {
                    const colCompanies = companies.filter(c => saved.includes(c.id) && (pipeline[c.id] || "watching") === col.key);
                    return (
                      <div key={col.key} className="bg-white border border-[#e2e6ed] rounded-xl overflow-hidden" style={{ borderTop: `2px solid ${col.color}` }}>
                        <div className="flex items-center justify-between px-3 py-2 border-b border-[#e2e6ed]">
                          <span className="text-xs font-mono font-semibold uppercase tracking-wide" style={{ color: col.color }}>{col.label}</span>
                          <span className="text-xs font-mono text-[#718096]">{colCompanies.length}</span>
                        </div>
                        <div className="p-2 flex flex-col gap-2 min-h-[80px]">
                          {colCompanies.length === 0 ? (
                            <p className="text-xs text-[#a0aec0] font-mono text-center py-4">Empty</p>
                          ) : colCompanies.map(c => (
                            <div key={c.id} className="border border-[#e2e6ed] rounded-lg p-2 bg-[#fafbfc]">
                              <div className="flex items-center justify-between mb-1">
                                <Link href={`/companies/${c.id}`} className="text-xs font-semibold text-[#0f1a14] hover:text-[#2d6a4f] leading-tight">{c.name}</Link>
                                <span className="text-[10px] font-mono text-[#2d6a4f] cursor-pointer ml-1 whitespace-nowrap" onClick={() => window.open(`/companies/${c.id}`, '_blank')}>View →</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                {c.funding_stage && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">{STAGE_LABELS[c.funding_stage] || c.funding_stage}</span>}
                                {(c.industry_tags || []).slice(0,1).map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#eef1f6] text-[#2d6a4f] border border-[#c8d8cc]">{t.replace(/_/g, " ")}</span>)}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: col.color }} />
                                  <span className="text-[10px] font-mono text-[#718096]">{col.label}</span>
                                </div>
                                {changingStage === c.id ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {["watching","contacted","diligence","passed"].filter(s => s !== col.key).map(s => (
                                      <button key={s} onClick={() => setStage(c.id, s)}
                                        className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#e2e6ed] bg-white text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]">
                                        {getStageLabel(s)}
                                      </button>
                                    ))}
                                    <button onClick={() => setChangingStage(null)} className="text-[9px] font-mono text-[#a0aec0] px-1">✕</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setChangingStage(c.id)} className="text-[9px] font-mono text-[#a0aec0] hover:text-[#2d6a4f]">change stage →</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* DEAL FLOW TAB */}
        {activeTab === "feed" && (
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
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Showing</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{filtered.length}</div>
              </div>
            </div>
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-4 mb-4">
              <input type="text" placeholder="Search companies..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-[#f8f9fb] focus:outline-none focus:border-[#2d6a4f] mb-4" />
              <FilterRow label="Stage" options={STAGES} active={stageFilter} setActive={setStageFilter} labelMap={STAGE_LABELS} />
              <FilterRow label="Signals" options={["raising","hiring","partnerships"]} active={signalFilter} setActive={setSignalFilter} labelMap={{ raising:"Raising", hiring:"Hiring", partnerships:"Partnerships" }} />
              <FilterRow label="Sector" options={SECTORS} active={sectorFilter} setActive={setSectorFilter} />
              <FilterRow label="Geography" options={GEOS} active={geoFilter} setActive={setGeoFilter} labelMap={GEO_LABELS} />
              <FilterRow label="Business model" options={BUSINESS_MODELS} active={modelFilter} setActive={setModelFilter} labelMap={MODEL_LABELS} />
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-500 bg-white mt-1">
                  Clear all filters
                </button>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {filtered.length > 0 ? filtered.map(company => (
                <div key={company.id} className="bg-white border border-[#e2e6ed] rounded-xl p-4 flex items-start justify-between hover:border-[#2d6a4f] transition-colors">
                  <div className="flex gap-3 items-start flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#eef1f6] flex items-center justify-center text-sm font-semibold text-[#2d6a4f] flex-shrink-0 overflow-hidden">
                      {company.logo_url
                        ? <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1" onError={e => { e.target.style.display='none'; }} />
                        : company.name?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link href={`/companies/${company.id}`} className="text-sm font-semibold text-[#0f1a14] hover:text-[#2d6a4f]">{company.name}</Link>
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
                        {(company.industry_tags || []).slice(0,2).map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">{t.replace(/_/g, " ")}</span>
                        ))}
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
                  <p className="text-sm text-[#718096]">No companies match your filters.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}