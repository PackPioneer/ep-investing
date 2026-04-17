"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Briefcase, Search, LayoutDashboard } from "lucide-react";
import { usePaywall } from "@/components/PaywallModal";

export default function ExpertDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { triggerPaywall } = usePaywall();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const EXPERTISE_OPTIONS = [
    "Solar & Wind", "Battery Storage", "Green Hydrogen", "Nuclear",
    "Carbon Markets", "Energy Efficiency", "EV & Mobility", "SAF / Efuels",
    "Electric Aviation", "Project Development", "Engineering",
    "Climate Finance", "M&A / Due Diligence", "Project Finance",
    "Policy & Regulation", "ESG & Sustainability", "Operations",
    "Marketing & Communications", "Brand & Design", "Web Development",
    "AI & Data Science", "Product Management", "Sales & BD",
    "Executive Coaching", "Fundraising Advisory", "Legal & Compliance", "Other"
  ];

  const AVAILABILITY_OPTIONS = [
    "Available now", "Available in 1 month", "Limited availability", "Advisory only"
  ];

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    fetch("/api/dashboard/expert")
      .then(r => r.json())
      .then(data => {
        setExpert(data.expert);
        if (data.expert) {
          setForm({
            name: data.expert.name || "",
            bio: data.expert.bio || "",
            expertise_areas: data.expert.expertise_areas || [],
            hourly_rate: data.expert.hourly_rate || "",
            availability: data.expert.availability || "",
            linkedin_url: data.expert.linkedin_url || "",
            website_url: data.expert.website_url || "",
            location: data.expert.location || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  const saveProfile = async () => {
    setSaving(true);
    triggerPaywall();
    const res = await fetch("/api/dashboard/expert", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setExpert(data);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const inputClass = "w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]";
  const labelClass = "text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block";

  const NAV = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: User },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!expert) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8 max-w-md text-center">
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-3">No expert profile found</h2>
        <p className="text-sm text-[#718096] mb-6">Apply to join the EP Investing expert network.</p>
        <Link href="/onboarding/expert" className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40]">
          Apply as an expert
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed md:relative z-30 w-56 bg-[#0f1a14] flex flex-col gap-1 px-3 py-6 flex-shrink-0 h-full min-h-screen transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <div style={{ fontFamily: "Georgia, serif" }} className="text-white text-base">
            EP <span className="text-[#2d6a4f]">Investing</span>
          </div>
          <button className="md:hidden text-[#9ca8a0]" onClick={() => setSidebarOpen(false)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-2 mb-4">
          <div className="text-xs font-mono text-[#4a6a54] uppercase tracking-widest mb-1">Expert</div>
          <div className="text-sm font-semibold text-white truncate">{expert?.name || user?.firstName || "Your account"}</div>
          {expert?.availability && <div className="text-xs text-[#9ca8a0] truncate">{expert.availability}</div>}
        </div>

        <div className="h-px bg-[#1a2e20] mx-2 mb-4" />

        {NAV.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={"flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors w-full " + (activeTab === item.id ? "bg-[#1a2e20] text-white" : "text-[#9ca8a0] hover:text-white")}>
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="h-px bg-[#1a2e20] mx-2 my-3" />
        <Link href="/search" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#9ca8a0] hover:text-white transition-colors">
          <Search size={15} /><span>Browse directory</span>
        </Link>
      </div>

      {/* Main */}
      <div className="flex-1 bg-[#f2f4f8] p-4 md:p-8 overflow-auto">
        <div className="flex items-center gap-3 mb-6">
          <button className="md:hidden text-[#0f1a14]" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
            {NAV.find(n => n.id === activeTab)?.label || "Dashboard"}
          </h1>
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Status</div>
                <div className={`text-sm font-semibold capitalize ${expert.status === "approved" ? "text-[#2d6a4f]" : "text-amber-600"}`}>
                  {expert.status === "approved" ? "Active" : "Pending review"}
                </div>
              </div>
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Availability</div>
                <div className="text-sm font-semibold text-[#0f1a14]">{expert.availability || "—"}</div>
              </div>
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Rate</div>
                <div className="text-sm font-semibold text-[#0f1a14]">{expert.hourly_rate || "—"}</div>
              </div>
            </div>

            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">Your expertise</div>
                <button onClick={() => setActiveTab("profile")} className="text-xs text-[#2d6a4f] font-mono hover:underline">Edit →</button>
              </div>
              {expert.expertise_areas?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {expert.expertise_areas.map(a => (
                    <span key={a} className="text-xs px-3 py-1 rounded-full bg-[#eef1f6] text-[#2d6a4f] border border-[#c8d8cc]">{a}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#718096]">No expertise areas added yet.</p>
              )}
            </div>

            {expert.bio && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-3">Bio</div>
                <p className="text-sm text-[#4a5568] leading-relaxed">{expert.bio}</p>
              </div>
            )}

            {!expert.bio && (
              <div className="bg-white border border-dashed border-[#c8d8cc] rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#0f1a14] mb-1">Complete your profile</div>
                  <div className="text-xs text-[#718096]">Add your bio, rate, and expertise to get discovered by companies.</div>
                </div>
                <button onClick={() => { setActiveTab("profile"); setEditing(true); }}
                  className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] flex-shrink-0 ml-4">
                  Complete profile
                </button>
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && form && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#eef1f6] border border-[#e2e6ed] flex items-center justify-center text-2xl font-semibold text-[#2d6a4f] flex-shrink-0">
                {expert?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold text-[#0f1a14]">{expert?.name || "Your Name"}</div>
                <div className="text-sm text-[#718096]">{expert?.location || "Location not set"}</div>
                {expert?.linkedin_url && <a href={expert.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2d6a4f] hover:underline mt-1 block">LinkedIn</a>}
              </div>
              <button onClick={() => setEditing(v => !v)}
                className="text-xs font-semibold border border-[#2d6a4f] text-[#2d6a4f] px-3 py-1.5 rounded-lg hover:bg-[#eef1f6] transition-colors flex-shrink-0">
                {editing ? "Cancel" : "Edit profile"}
              </button>
            </div>

            {editing ? (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelClass}>Name</label><input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={inputClass} /></div>
                  <div><label className={labelClass}>Location</label><input value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} placeholder="San Francisco, CA" className={inputClass} /></div>
                  <div><label className={labelClass}>Hourly rate</label><input value={form.hourly_rate} onChange={e => setForm(p => ({...p, hourly_rate: e.target.value}))} placeholder="$200/hr" className={inputClass} /></div>
                  <div>
                    <label className={labelClass}>Availability</label>
                    <select value={form.availability} onChange={e => setForm(p => ({...p, availability: e.target.value}))} className={inputClass}>
                      <option value="">Select...</option>
                      {AVAILABILITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className={labelClass}>LinkedIn</label><input value={form.linkedin_url} onChange={e => setForm(p => ({...p, linkedin_url: e.target.value}))} placeholder="https://linkedin.com/in/..." className={inputClass} /></div>
                  <div><label className={labelClass}>Website</label><input value={form.website_url} onChange={e => setForm(p => ({...p, website_url: e.target.value}))} placeholder="https://..." className={inputClass} /></div>
                </div>
                <div>
                  <label className={labelClass}>Bio</label>
                  <textarea rows={4} value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))}
                    placeholder="Tell companies about your background and what you offer..."
                    className={inputClass + " resize-none"} />
                </div>
                <div>
                  <label className={labelClass}>Expertise areas</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {EXPERTISE_OPTIONS.map(o => (
                      <button key={o} type="button" onClick={() => setForm(p => ({
                        ...p,
                        expertise_areas: p.expertise_areas.includes(o)
                          ? p.expertise_areas.filter(a => a !== o)
                          : [...p.expertise_areas, o]
                      }))}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${form.expertise_areas.includes(o) ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={saveProfile} disabled={saving}
                    className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50">
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  {saved && <span className="text-sm text-[#2d6a4f] font-medium">Saved</span>}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Location", expert?.location],
                  ["Rate", expert?.hourly_rate],
                  ["Availability", expert?.availability],
                  ["LinkedIn", expert?.linkedin_url],
                  ["Website", expert?.website_url],
                ].filter(([,v]) => v).map(([k, v]) => (
                  <div key={k} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2">{k}</div>
                    <div className="text-sm text-[#0f1a14]">{v}</div>
                  </div>
                ))}
                {expert?.bio && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5 md:col-span-2">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2">Bio</div>
                    <div className="text-sm text-[#0f1a14] leading-relaxed">{expert.bio}</div>
                  </div>
                )}
                {expert?.expertise_areas?.length > 0 && (
                  <div className="bg-white border border-[#e2e6ed] rounded-xl p-5 md:col-span-2">
                    <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3">Expertise areas</div>
                    <div className="flex flex-wrap gap-2">
                      {expert.expertise_areas.map(a => (
                        <span key={a} className="text-xs px-3 py-1 rounded-full bg-[#eef1f6] text-[#2d6a4f] border border-[#c8d8cc]">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}