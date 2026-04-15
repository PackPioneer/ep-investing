"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePaywall } from "@/components/PaywallModal";

const STAGE_OPTIONS = ["pre_seed","seed","series_a","series_b","series_c","growth","public","unknown"];
const STAGE_LABELS = { pre_seed:"Pre-Seed", seed:"Seed", series_a:"Series A", series_b:"Series B", series_c:"Series C", growth:"Growth", public:"Public", unknown:"Unknown" };
const MODEL_OPTIONS = ["b2b","b2c","b2g","hardware","software","project_developer","marketplace","mixed"];
const MODEL_LABELS = { b2b:"B2B", b2c:"B2C", b2g:"B2G", hardware:"Hardware", software:"Software", project_developer:"Project Dev", marketplace:"Marketplace", mixed:"Mixed" };

function AutoRedirect() {
  const router = useRouter();
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/dashboard/company");
      const data = await res.json();
      if (data && !data.error) {
        clearInterval(interval);
        router.refresh();
      }
    }, 2000);
    setTimeout(() => clearInterval(interval), 30000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-md text-center">
        <div className="w-10 h-10 rounded-full border-2 border-[#2d6a4f] border-t-transparent animate-spin mx-auto mb-6" />
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-3">Setting up your dashboard</h2>
        <p className="text-[#4a5568] text-sm">Your company profile is being linked to your account. This usually takes just a moment.</p>
      </div>
    </div>
  );
}

export default function CompanyDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({ title: "", location: "", type: "", contact_email: "", description: "" });
  const [submittingJob, setSubmittingJob] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: "", body: "", link: "", type: "milestone" });
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [fundingForm, setFundingForm] = useState({ raise_target: "", raise_current: "", raise_close_date: "", min_check_size: "" });
  const [savingFunding, setSavingFunding] = useState(false);
  const [savedFunding, setSavedFunding] = useState(false);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [deckUrl, setDeckUrl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [matchedInvestors, setMatchedInvestors] = useState([]);
  const [matchedExperts, setMatchedExperts] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const { triggerPaywall, hasPayment } = usePaywall();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/"); return; }
    fetch("/api/dashboard/company")
      .then(r => r.json())
      .then(data => {
        if (!data || data.error) { setLoading(false); return; }
        setCompany(data);
        setForm({
          description: data.description || "",
          funding_stage: data.funding_stage || "unknown",
          business_model: data.business_model || "",
          looking_to_raise: data.looking_to_raise || false,
          is_hiring: data.is_hiring || false,
          seeking_partnerships: data.seeking_partnerships || false,
          industry_tags: (data.industry_tags || []).join(", "),
          show_contact: data.show_contact ?? true,
          primary_contact_name: data.primary_contact_name || "",
          primary_contact_email: data.primary_contact_email || "",
          secondary_contact_name: data.secondary_contact_name || "",
          secondary_contact_email: data.secondary_contact_email || "",
        });
        setFundingForm({
          raise_target: data.raise_target || "",
          raise_current: data.raise_current || "",
          raise_close_date: data.raise_close_date || "",
          min_check_size: data.min_check_size || "",
        });
        setDeckUrl(data.pitch_deck_url || null);
        setLogoUrl(data.logo_url || null);
        setLoading(false);
        fetch("/api/dashboard/jobs").then(r => r.json()).then(d => setJobs(Array.isArray(d.jobs) ? d.jobs : []));
        fetch("/api/companies/" + data.id + "/updates").then(r => r.json()).then(u => setUpdates(Array.isArray(u) ? u : []));
        fetch("/api/dashboard/matched-investors?company_id=" + data.id).then(r => r.json()).then(d => setMatchedInvestors(Array.isArray(d) ? d : []));
        fetch("/api/dashboard/matched-experts?company_id=" + data.id).then(r => r.json()).then(d => setMatchedExperts(Array.isArray(d) ? d : []));
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  async function saveProfile(e) {
    e.preventDefault();
    triggerPaywall(); // shows nudge but doesn't block
    setSaving(true);
    const payload = { ...form, industry_tags: form.industry_tags.split(",").map(t => t.trim()).filter(Boolean) };
    await fetch("/api/dashboard/company", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  async function submitJob(e) {
    e.preventDefault();
    triggerPaywall();
    if (!hasPayment) return;
    setSubmittingJob(true);
    const res = await fetch("/api/dashboard/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(jobForm) });
    if (res.ok) { const j = await res.json(); setJobs(prev => [j, ...prev]); setJobForm({ title: "", location: "", type: "", contact_email: "", description: "" }); setShowJobForm(false); }
    setSubmittingJob(false);
  }

  async function deleteJob(id) {
    await fetch("/api/dashboard/jobs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  async function submitUpdate(e) {
    e.preventDefault();
    setSubmittingUpdate(true);
    const res = await fetch("/api/companies/" + company.id + "/updates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateForm) });
    if (res.ok) { const u = await res.json(); setUpdates(prev => [u, ...prev]); setUpdateForm({ title: "", body: "", link: "", type: "milestone" }); setShowUpdateForm(false); }
    setSubmittingUpdate(false);
  }

  async function saveFunding(e) {
    triggerPaywall();
    if (!hasPayment) return;
    e.preventDefault();
    setSavingFunding(true);
    await fetch("/api/dashboard/company", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fundingForm) });
    setSavingFunding(false); setSavedFunding(true); setTimeout(() => setSavedFunding(false), 3000);
  }

  async function uploadDeck(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDeck(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/dashboard/pitch-deck", { method: "POST", body: formData });
    if (res.ok) { const { url } = await res.json(); setDeckUrl(url); }
    setUploadingDeck(false);
  }

  async function uploadLogo(e) {
  const file = e.target.files[0];
  if (!file) return;
  setUploadingLogo(true);
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/dashboard/logo", { method: "POST", body: formData });
  if (res.ok) { const { url } = await res.json(); setLogoUrl(url); }
  setUploadingLogo(false);
}

  const profileChecks = form ? [
    { label: "Description added", done: !!form.description },
    { label: "Funding stage set", done: form.funding_stage !== "unknown" },
    { label: "Industry tags added", done: form.industry_tags.length > 0 },
    { label: "Pitch deck uploaded", done: !!deckUrl },
    { label: "Funding round details filled in", done: !!fundingForm.raise_target },
  ] : [];

  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!loading && !company) return <AutoRedirect />;

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "profile", label: "Profile" },
    { id: "funding", label: "Funding Round" },
    { id: "jobs", label: "Jobs" },
    { id: "updates", label: "Updates" },
    { id: "investors", label: "Investors" },
    { id: "experts", label: "Experts" }, 
  ];

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
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={"flex items-center px-3 py-2 rounded-lg text-sm text-left transition-colors w-full " + (activeTab === item.id ? "bg-[#1a2e20] text-white" : "text-[#9ca8a0] hover:text-white")}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-[#f2f4f8] p-4 md:p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <button className="md:hidden mr-3 text-[#0f1a14]" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
            {company?.name || "Company Dashboard"}
          </h1>
          {company?.id && (
            <a href={"/companies/" + company.id} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold border border-[#2d6a4f] text-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#eef1f6] transition-colors">
              Preview public profile
            </a>
          )}
        </div>

        {activeTab === "overview" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Open Jobs</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{jobs.length}</div>
              </div>
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Updates Posted</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">{updates.length}</div>
              </div>
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Profile Views</div>
                <div className="text-2xl font-semibold text-[#0f1a14]">--</div>
              </div>
            </div>

            <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
              <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-4">Quick Actions</div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => setActiveTab("jobs")}
                  className="text-sm border border-[#2d6a4f] text-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#eef1f6] transition-colors">
                  Add job posting
                </button>
                <button onClick={() => { setActiveTab("updates"); setShowUpdateForm(true); }}
                  className="text-sm border border-[#2d6a4f] text-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#eef1f6] transition-colors">
                  Post an update
                </button>
                <button onClick={() => setActiveTab("funding")}
                  className="text-sm border border-[#2d6a4f] text-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#eef1f6] transition-colors">
                  Upload pitch deck
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#e2e6ed] rounded-xl p-6">
              <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-4">Profile Completeness</div>
              <div className="flex flex-col gap-3">
                {profileChecks.map(({ label, done }) => (
                  <div key={label} className={"flex items-center gap-2.5 text-sm " + (done ? "text-[#2d6a4f]" : "text-[#718096]")}>
                    <div className={"w-5 h-5 rounded-full border flex items-center justify-center text-xs flex-shrink-0 " + (done ? "bg-[#2d6a4f] border-[#2d6a4f] text-white" : "border-[#d0d6e0]")}>
                      {done ? "✓" : ""}
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">Recent Jobs</div>
                  <button onClick={() => setActiveTab("jobs")} className="text-xs text-[#2d6a4f] font-mono hover:underline">View all</button>
                </div>
                {jobs.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {jobs.slice(0, 3).map(job => (
                      <div key={job.id} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-[#0f1a14]">{job.title}</div>
                          <div className="text-xs text-[#718096]">{job.location}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-[#718096]">Views</div>
                          <div className="text-sm font-semibold text-[#0f1a14]">{job.views ?? 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#718096]">No jobs posted yet.</p>
                )}
              </div>

              <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide">Recent Updates</div>
                  <button onClick={() => setActiveTab("updates")} className="text-xs text-[#2d6a4f] font-mono hover:underline">View all</button>
                </div>
                {updates.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {updates.slice(0, 3).map(u => (
                      <div key={u.id}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] capitalize">{u.type}</span>
                          <span className="text-xs text-[#718096]">{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        </div>
                        <p className="text-sm font-medium text-[#0f1a14]">{u.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#718096]">No updates yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && ( 
           form ? (<>
          <form onSubmit={saveProfile} className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
            <div className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-6">Profile Settings</div>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none"
                  placeholder="Describe your company..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Funding Stage</label>
                  <select value={form.funding_stage} onChange={e => setForm(p => ({ ...p, funding_stage: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    {STAGE_OPTIONS.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Business Model</label>
                  <select value={form.business_model} onChange={e => setForm(p => ({ ...p, business_model: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="">Select...</option>
                    {MODEL_OPTIONS.map(m => <option key={m} value={m}>{MODEL_LABELS[m]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Industry Tags (comma separated)</label>
                <input type="text" value={form.industry_tags} onChange={e => setForm(p => ({ ...p, industry_tags: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]"
                  placeholder="solar, battery_storage, b2b..." />
              </div>
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3 block">Signals</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: "looking_to_raise", label: "Looking to Raise" },
                    { key: "is_hiring", label: "Hiring" },
                    { key: "seeking_partnerships", label: "Seeking Partnerships" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="w-4 h-4 accent-[#2d6a4f]" />
                      <span className="text-sm text-[#0f1a14]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {/* Point of contact */}
              <div className="border-t border-[#e2e6ed] pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide block mb-0.5">Point of contact</label>
                    <p className="text-xs text-[#718096]">Let investors contact you directly from your profile</p>
                  </div>
                  <button type="button" onClick={() => setForm(p => ({ ...p, show_contact: !p.show_contact }))}
                    className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.show_contact ? "bg-[#2d6a4f]" : "bg-[#d0d6e0]"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.show_contact ? "left-6" : "left-1"}`} />
                  </button>
                </div>
                {form.show_contact && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Primary contact name</label>
                      <input value={form.primary_contact_name || ""} onChange={e => setForm(p => ({ ...p, primary_contact_name: e.target.value }))}
                        placeholder="Your name" className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Primary contact email</label>
                      <input type="email" value={form.primary_contact_email || ""} onChange={e => setForm(p => ({ ...p, primary_contact_email: e.target.value }))}
                        placeholder="you@company.com" className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Secondary contact name (optional)</label>
                      <input value={form.secondary_contact_name || ""} onChange={e => setForm(p => ({ ...p, secondary_contact_name: e.target.value }))}
                        placeholder="Team member" className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    </div>
                    <div>
                      <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Secondary contact email (optional)</label>
                      <input type="email" value={form.secondary_contact_email || ""} onChange={e => setForm(p => ({ ...p, secondary_contact_email: e.target.value }))}
                        placeholder="teammate@company.com" className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    </div>
                  </div>
                )}
              </div>

            <div className="flex items-center gap-3 mt-6">
              <button type="submit" disabled={saving} className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save changes"}
              </button>
              {saved && <span className="text-sm text-[#2d6a4f] font-medium">Saved</span>}
            </div>
          </form>
          <div className="mt-6 pt-6 border-t border-[#e2e6ed]">
            <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3 block">Company Logo</label>
            {logoUrl && (
              <img src={logoUrl} alt="Company logo" className="w-16 h-16 object-contain rounded-lg border border-[#e2e6ed] mb-3" />
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 border border-[#d0d6e0] text-sm text-[#4a5568] px-4 py-2.5 rounded-lg hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
              {uploadingLogo ? "Uploading..." : logoUrl ? "Replace logo" : "Upload logo"}
              <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" disabled={uploadingLogo} />
            </label>
            <p className="text-xs text-[#718096] mt-2">PNG, JPG, or SVG. Shown on your public profile.</p>
          </div>
          </>
        ) : (
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 text-center">
      <p className="text-[#718096] text-sm mb-4">Your company profile is being set up. This can take a few minutes after your account is created.</p>
      <button onClick={() => window.location.reload()} className="text-sm bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40]">
        Refresh
      </button>
    </div>
  )
)}

        {activeTab === "funding" && (
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
            <div className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-2">Funding Round</div>
            <p className="text-xs text-[#718096] mb-6">Only visible to verified investors.</p>
            <form onSubmit={saveFunding} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Target Raise</label>
                  <input type="text" placeholder="e.g. 2000000" value={fundingForm.raise_target}
                    onChange={e => setFundingForm(p => ({ ...p, raise_target: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Raised So Far</label>
                  <input type="text" placeholder="e.g. 500000" value={fundingForm.raise_current}
                    onChange={e => setFundingForm(p => ({ ...p, raise_current: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Round Close Date</label>
                  <input type="date" value={fundingForm.raise_close_date}
                    onChange={e => setFundingForm(p => ({ ...p, raise_close_date: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Min Check Size</label>
                  <input type="text" placeholder="e.g. 25000" value={fundingForm.min_check_size}
                    onChange={e => setFundingForm(p => ({ ...p, min_check_size: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingFunding} className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors">
                  {savingFunding ? "Saving..." : "Save funding details"}
                </button>
                {savedFunding && <span className="text-sm text-[#2d6a4f] font-medium">Saved</span>}
              </div>
            </form>
            <div className="mt-6 pt-6 border-t border-[#e2e6ed]">
              <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3 block">Pitch Deck (PDF)</label>
              {deckUrl && (
                <a href={deckUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#2d6a4f] hover:underline block mb-3">
                  View current pitch deck
                </a>
              )}
              <label className="cursor-pointer inline-flex items-center gap-2 border border-[#d0d6e0] text-sm text-[#4a5568] px-4 py-2.5 rounded-lg hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                {uploadingDeck ? "Uploading..." : deckUrl ? "Replace pitch deck" : "Upload pitch deck"}
                <input type="file" accept=".pdf" onChange={uploadDeck} className="hidden" disabled={uploadingDeck} />
              </label>
        <p className="text-xs text-[#718096] mt-2">PDF only. Only visible to verified investors.</p>
            </div>
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Job Postings</div>
              <button onClick={() => setShowJobForm(v => !v)} className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] transition-colors">
                + Add role
              </button>
            </div>
            {showJobForm && (
              <form onSubmit={submitJob} className="mb-6 flex flex-col gap-3 bg-[#f8f9fb] rounded-xl p-4 border border-[#e2e6ed]">
                <input required placeholder="Job title *" value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Location" value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))}
                    className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  <select value={jobForm.type} onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))}
                    className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="">Type...</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <input placeholder="Contact email *" value={jobForm.contact_email} onChange={e => setJobForm(p => ({ ...p, contact_email: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                <textarea placeholder="Job description" rows={3} value={jobForm.description} onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowJobForm(false)} className="text-xs text-[#718096] px-3 py-1.5 rounded-lg hover:bg-[#e2e6ed]">Cancel</button>
                  <button type="submit" disabled={submittingJob} className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-1.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50">
                    {submittingJob ? "Posting..." : "Post job"}
                  </button>
                </div>
              </form>
            )}
            {jobs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {jobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between py-3 border-b border-[#e2e6ed] last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-[#0f1a14]">{job.title}</div>
                      <div className="text-xs text-[#718096] mt-0.5">{job.location} · {job.type?.replace(/_/g, " ")}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs font-mono text-[#718096] uppercase tracking-wide">Views</div>
                        <div className="text-sm font-semibold text-[#0f1a14]">{job.views ?? 0}</div>
                      </div>
                      <button onClick={() => deleteJob(job.id)} className="text-xs text-red-500 hover:text-red-700 font-mono">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#718096]">No open roles yet.</p>
            )}
          </div>
        )}

        {activeTab === "updates" && (
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Recent Updates</div>
              <button onClick={() => setShowUpdateForm(v => !v)} className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] transition-colors">
                + Add update
              </button>
            </div>
            {showUpdateForm && (
              <form onSubmit={submitUpdate} className="mb-6 flex flex-col gap-3 bg-[#f8f9fb] rounded-xl p-4 border border-[#e2e6ed]">
                <input required placeholder="Title *" value={updateForm.title} onChange={e => setUpdateForm(p => ({ ...p, title: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                <textarea placeholder="Details (optional)" rows={2} value={updateForm.body} onChange={e => setUpdateForm(p => ({ ...p, body: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
                <input placeholder="Link (optional)" value={updateForm.link} onChange={e => setUpdateForm(p => ({ ...p, link: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                <select value={updateForm.type} onChange={e => setUpdateForm(p => ({ ...p, type: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                  <option value="milestone">Milestone</option>
                  <option value="hiring">Hiring</option>
                  <option value="funding">Funding</option>
                  <option value="product">Product</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowUpdateForm(false)} className="text-xs text-[#718096] px-3 py-1.5 rounded-lg hover:bg-[#e2e6ed]">Cancel</button>
                  <button type="submit" disabled={submittingUpdate} className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-1.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50">
                    {submittingUpdate ? "Posting..." : "Post update"}
                  </button>
                </div>
              </form>
            )}
            {updates.length > 0 ? (
              <div className="flex flex-col gap-4">
                {updates.map(u => (
                  <div key={u.id} className="border-b border-[#e2e6ed] last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] capitalize">{u.type}</span>
                      <span className="text-xs text-[#718096]">{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0f1a14]">{u.title}</p>
                    {u.body && <p className="text-xs text-[#4a5568] mt-1">{u.body}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#718096]">No updates yet.</p>
            )}
          </div>
        )}
        {activeTab === "investors" && (
  <div className="flex flex-col gap-4">
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
      <div className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-1">Matched Investors</div>
      <p className="text-xs text-[#718096] mb-5">Investors on EP Investing whose focus matches your sector and stage.</p>
      {matchedInvestors.length > 0 ? (
        <div className="flex flex-col gap-3">
          {matchedInvestors.map(inv => (
            <div key={inv.id} className="border border-[#e2e6ed] rounded-xl p-4 flex items-start justify-between hover:border-[#2d6a4f] transition-colors">
              <div>
                <div className="text-sm font-semibold text-[#0f1a14]">{inv.name}</div>
                {inv.firm && <div className="text-xs text-[#718096] mt-0.5">{inv.firm}</div>}
                {inv.focus && <div className="text-xs text-[#2d6a4f] mt-1">{inv.focus}</div>}
                {inv.stage && <div className="text-xs text-[#718096] mt-0.5">Stage: {inv.stage}</div>}
                {inv.check_size && <div className="text-xs text-[#718096] mt-0.5">Check: {inv.check_size}</div>}
              </div>
              {inv.show_contact && inv.primary_contact_email && (
                <a href={`mailto:${inv.primary_contact_email}?subject=Introduction via EP Investing`}
                  className="text-xs bg-[#2d6a4f] text-white px-3 py-1.5 rounded-lg hover:bg-[#235a40] flex-shrink-0 ml-4">
                  Contact
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#718096]">No matched investors yet. Make sure your sector and funding stage are filled in on your profile.</p>
      )}
    </div>
  </div>
)}

{activeTab === "experts" && (
  <div className="flex flex-col gap-4">
    <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
      <div className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-1">Available Experts</div>
      <p className="text-xs text-[#718096] mb-5">Climate and energy experts available for consulting, advisory, and fractional roles.</p>
      {matchedExperts.length > 0 ? (
        <div className="flex flex-col gap-3">
          {matchedExperts.map(exp => (
            <div key={exp.id} className="border border-[#e2e6ed] rounded-xl p-4 flex items-start justify-between hover:border-[#2d6a4f] transition-colors">
              <div>
                <div className="text-sm font-semibold text-[#0f1a14]">{exp.name}</div>
                {exp.location && <div className="text-xs text-[#718096] mt-0.5">{exp.location}</div>}
                {exp.expertise_areas?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.expertise_areas.slice(0, 3).map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">{a}</span>
                    ))}
                  </div>
                )}
                {exp.hourly_rate && <div className="text-xs text-[#718096] mt-1">{exp.hourly_rate}</div>}
                {exp.availability && <div className="text-xs text-[#2d6a4f] mt-0.5">{exp.availability}</div>}
              </div>
              {exp.email && (
                <a href={`mailto:${exp.email}?subject=Expert inquiry via EP Investing`}
                  className="text-xs bg-[#2d6a4f] text-white px-3 py-1.5 rounded-lg hover:bg-[#235a40] flex-shrink-0 ml-4">
                  Contact
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#718096]">No experts available yet. Check back after our April 15 launch.</p>
      )}
    </div>
  </div>
)}
      </div>
    </div>
  );
}