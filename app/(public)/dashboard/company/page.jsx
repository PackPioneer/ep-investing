"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePaywall } from "@/components/PaywallModal";
import ForYouFeed from "@/components/news/ForYouFeed";
import PolicyDigestWidget from "@/components/policies/PolicyDigestWidget";
import MAPulseWidget from "@/components/widgets/MAPulseWidget";
import SignalWidget from "@/components/widgets/SignalWidget";
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
  const [jobForm, setJobForm] = useState({ title: "", location: "", contact_email: "", type: "", work_mode: "", experience_level: "", salary_min: null, salary_max: null, salary_currency: "USD", equity_offered: false, role_overview: "", responsibilities: "", requirements: "", nice_to_haves: "", sector_tags: [], mission_statement: "", apply_url: "", application_deadline: null });
  const [submittingJob, setSubmittingJob] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: "", body: "", link: "", type: "milestone" });
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [fundingForm, setFundingForm] = useState({ raise_target: "", raise_current: "", raise_close_date: "", min_check_size: "", raise_round_type: "", raise_instrument: "", raise_valuation: "", raise_lead_investor: "", raise_use_of_proceeds: "", raise_revenue_status: "", raise_data_room_url: "", raise_intro_call_url: "" });
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
          url: data.url || "",
          description: data.description || "",
          tagline: data.tagline || "",
          headquarters_city: data.headquarters_city || "",
          headquarters_country: data.headquarters_country || "",
          founding_year: data.founding_year || null,
          employee_count: data.employee_count || "",
          linkedin_url: data.linkedin_url || "",
          twitter_url: data.twitter_url || "",
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
          raise_round_type: data.raise_round_type || "",
          raise_instrument: data.raise_instrument || "",
          raise_valuation: data.raise_valuation || "",
          raise_lead_investor: data.raise_lead_investor || "",
          raise_use_of_proceeds: data.raise_use_of_proceeds || "",
          raise_revenue_status: data.raise_revenue_status || "",
          raise_data_room_url: data.raise_data_room_url || "",
          raise_intro_call_url: data.raise_intro_call_url || "",
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
    setSubmittingJob(true);
    const res = await fetch("/api/dashboard/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(jobForm) });
    if (res.ok) { const j = await res.json(); setJobs(prev => [j, ...prev]); setJobForm({ title: "", location: "", contact_email: "", type: "", work_mode: "", experience_level: "", salary_min: null, salary_max: null, salary_currency: "USD", equity_offered: false, role_overview: "", responsibilities: "", requirements: "", nice_to_haves: "", sector_tags: [], mission_statement: "", apply_url: "", application_deadline: null }); setShowJobForm(false); }
    setSubmittingJob(false);
  }

  async function deleteJob(id) {
    await fetch("/api/dashboard/jobs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setJobs(prev => prev.filter(j => j.id !== id));
  }
  async function deleteUpdate(id) {
    await fetch(`/api/companies/${company.id}/updates/${id}`, { method: "DELETE" });
    setUpdates(prev => prev.filter(u => u.id !== id));
 }

async function deleteLogo() {
  await fetch("/api/dashboard/logo", { method: "DELETE" });
  setLogoUrl(null);
}

async function deleteDeck() {
  await fetch("/api/dashboard/pitch-deck", { method: "DELETE" });
  setDeckUrl(null);
}

  async function submitUpdate(e) {
    e.preventDefault();
    setSubmittingUpdate(true);
    const res = await fetch("/api/companies/" + company.id + "/updates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateForm) });
    if (res.ok) { const u = await res.json(); setUpdates(prev => [u, ...prev]); setUpdateForm({ title: "", body: "", link: "", type: "milestone" }); setShowUpdateForm(false); }
    setSubmittingUpdate(false);
  }

  async function saveFunding(e) {
    e.preventDefault();
    triggerPaywall();
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
    { id: "for-you", label: "For You" },
    { id: "profile", label: "Edit profile" },
    { id: "funding", label: "Raise capital" },
    { id: "jobs", label: "Post a job" },
    { id: "updates", label: "Share an update" },
    { id: "investors", label: "Find investors" },
    { id: "experts", label: "Hire experts" }, 
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
{activeTab === "for-you" && (
          <div className="flex flex-col gap-4">
            <ForYouFeed userType="company" limit={5} />
            <PolicyDigestWidget userType="company" limit={3} />
            <MAPulseWidget limit={5} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SignalWidget
                classification="ipo"
                title="IPO tracker"
                subtitle="Offerings, listings, SPAC mergers."
                emptyTitle="No recent IPOs"
                emptyBody="Climate-sector IPOs will appear here."
                showDealSize
                limit={4}
              />
              <SignalWidget
                classification="fund_close"
                title="Fund closes"
                subtitle="New climate VC & PE fund closes."
                emptyTitle="No recent fund closes"
                emptyBody="Fund announcements will appear here."
                showDealSize
                limit={4}
              />
              <SignalWidget
                classification="leadership_change"
                title="Major hires"
                subtitle="Exec moves and board changes."
                emptyTitle="No recent leadership news"
                emptyBody="Executive moves will appear here."
                limit={4}
              />
              <SignalWidget
                classification="earnings"
                title="Earnings & guidance"
                subtitle="Public company results and guidance."
                emptyTitle="No recent earnings"
                emptyBody="Earnings coverage will appear here."
                limit={4}
              />
            </div>
          </div>
        )}
        {activeTab === "profile" && ( 
           form ? (<>
          <form onSubmit={saveProfile} className="bg-white border border-[#e2e6ed] rounded-2xl p-7">

            <div className="text-base font-semibold text-[#0f1a14] mb-1">Profile settings</div>
            <p className="text-xs text-[#718096] mb-6">Edit how your company appears across the platform.</p>

            {/* SECTION A — IDENTITY */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">Identity</div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Tagline</label>
                  <input type="text" placeholder='e.g. "Climate intelligence for the energy transition"' value={form.tagline || ""}
                    onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Website URL</label>
                  <input type="url" placeholder="https://yourcompany.com" value={form.url}
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Description</label>
                  <textarea rows={4} placeholder="What does your company do? Who are you serving?" value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-vertical" />
                </div>
              </div>
            </div>

            {/* SECTION B — ABOUT */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">About the company</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Founded year</label>
                  <input type="number" placeholder="2024" value={form.founding_year || ""}
                    onChange={e => setForm(p => ({ ...p, founding_year: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Company size</label>
                  <select value={form.employee_count || ""}
                    onChange={e => setForm(p => ({ ...p, employee_count: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Headquarters city</label>
                  <input type="text" placeholder="e.g. San Francisco" value={form.headquarters_city || ""}
                    onChange={e => setForm(p => ({ ...p, headquarters_city: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Headquarters country</label>
                  <input type="text" placeholder="e.g. United States" value={form.headquarters_country || ""}
                    onChange={e => setForm(p => ({ ...p, headquarters_country: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
            </div>

            {/* SECTION C — SECTOR & BUSINESS MODEL */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">Sector & business model</div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Funding stage</label>
                  <select value={form.funding_stage} onChange={e => setForm(p => ({ ...p, funding_stage: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="unknown">Select stage</option>
                    <option value="pre_seed">Pre-seed</option>
                    <option value="seed">Seed</option>
                    <option value="series_a">Series A</option>
                    <option value="series_b">Series B</option>
                    <option value="series_c">Series C+</option>
                    <option value="growth">Growth</option>
                    <option value="public">Public</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Business model</label>
                  <select value={form.business_model} onChange={e => setForm(p => ({ ...p, business_model: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="">Select model</option>
                    <option value="b2b">B2B</option>
                    <option value="b2c">B2C</option>
                    <option value="b2g">B2G</option>
                    <option value="mixed">Mixed</option>
                    <option value="marketplace">Marketplace</option>
                    <option value="hardware">Hardware</option>
                    <option value="services">Services</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Industry tags (comma separated)</label>
                <input type="text" placeholder="e.g. solar, hydrogen, climate-tech" value={form.industry_tags}
                  onChange={e => setForm(p => ({ ...p, industry_tags: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              </div>
            </div>

            {/* SECTION D — SIGNALS */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">Signals</div>
              <p className="text-xs text-[#718096] mb-4">What you're open to. These show up as badges on your public profile and help with discovery.</p>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 text-sm text-[#0f1a14] cursor-pointer">
                  <input type="checkbox" checked={form.looking_to_raise} onChange={e => setForm(p => ({ ...p, looking_to_raise: e.target.checked }))}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  <span>Looking to raise</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-[#0f1a14] cursor-pointer">
                  <input type="checkbox" checked={form.is_hiring} onChange={e => setForm(p => ({ ...p, is_hiring: e.target.checked }))}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  <span>Hiring</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-[#0f1a14] cursor-pointer">
                  <input type="checkbox" checked={form.seeking_partnerships} onChange={e => setForm(p => ({ ...p, seeking_partnerships: e.target.checked }))}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  <span>Seeking partnerships</span>
                </label>
              </div>
            </div>

            {/* SECTION E — ONLINE PRESENCE */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">Online presence</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">LinkedIn URL</label>
                  <input type="url" placeholder="https://linkedin.com/company/..." value={form.linkedin_url || ""}
                    onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">X / Twitter URL</label>
                  <input type="url" placeholder="https://x.com/..." value={form.twitter_url || ""}
                    onChange={e => setForm(p => ({ ...p, twitter_url: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
            </div>

            {/* SECTION F — CONTACT */}
            <div className="mb-6 pb-6 border-b border-[#e2e6ed]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide">Point of contact</div>
                  <p className="text-xs text-[#718096] mt-1">Let investors contact you directly from your profile.</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, show_contact: !p.show_contact }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.show_contact ? 'bg-[#2d6a4f]' : 'bg-[#d0d6e0]'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.show_contact ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {form.show_contact && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Primary contact name</label>
                    <input value={form.primary_contact_name || ""} onChange={e => setForm(p => ({ ...p, primary_contact_name: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Primary contact email</label>
                    <input type="email" value={form.primary_contact_email || ""} onChange={e => setForm(p => ({ ...p, primary_contact_email: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Secondary contact name (optional)</label>
                    <input placeholder="Team member" value={form.secondary_contact_name || ""} onChange={e => setForm(p => ({ ...p, secondary_contact_name: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Secondary contact email (optional)</label>
                    <input type="email" placeholder="teammate@company.com" value={form.secondary_contact_email || ""} onChange={e => setForm(p => ({ ...p, secondary_contact_email: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save profile"}
              </button>
              {saved && <span className="text-sm text-[#2d6a4f] font-medium">Saved</span>}
            </div>
          </form>
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

              {/* SECTION 1 — ROUND BASICS (always visible) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Round Type</label>
                  <select value={fundingForm.raise_round_type || ""}
                    onChange={e => setFundingForm(p => ({ ...p, raise_round_type: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="">Select round type</option>
                    <option value="pre_seed">Pre-seed</option>
                    <option value="seed">Seed</option>
                    <option value="series_a">Series A</option>
                    <option value="series_b">Series B</option>
                    <option value="series_c">Series C+</option>
                    <option value="bridge">Bridge</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Round Close Date</label>
                  <input type="date" value={fundingForm.raise_close_date || ""}
                    onChange={e => setFundingForm(p => ({ ...p, raise_close_date: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Target Raise</label>
                  <input type="text" placeholder="e.g. 2000000" value={fundingForm.raise_target || ""}
                    onChange={e => setFundingForm(p => ({ ...p, raise_target: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Raised So Far</label>
                  <input type="text" placeholder="e.g. 500000" value={fundingForm.raise_current || ""}
                    onChange={e => setFundingForm(p => ({ ...p, raise_current: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>

              {/* SECTION 2 — TERMS (collapsible) */}
              <details className="border-t border-[#e2e6ed] pt-4">
                <summary className="text-xs font-mono uppercase tracking-wide text-[#4a5568] cursor-pointer hover:text-[#2d6a4f] mb-3">Round terms</summary>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Instrument</label>
                    <select value={fundingForm.raise_instrument || ""}
                      onChange={e => setFundingForm(p => ({ ...p, raise_instrument: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                      <option value="">Select instrument</option>
                      <option value="safe">SAFE</option>
                      <option value="priced_equity">Priced equity</option>
                      <option value="convertible_note">Convertible note</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Valuation / Cap</label>
                    <input type="text" placeholder='e.g. "$8M post" or "TBD"' value={fundingForm.raise_valuation || ""}
                      onChange={e => setFundingForm(p => ({ ...p, raise_valuation: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Min Check Size</label>
                    <input type="text" placeholder="e.g. 25000" value={fundingForm.min_check_size || ""}
                      onChange={e => setFundingForm(p => ({ ...p, min_check_size: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Lead Investor</label>
                    <input type="text" placeholder='e.g. "Breakthrough Energy" or "Looking for lead"' value={fundingForm.raise_lead_investor || ""}
                      onChange={e => setFundingForm(p => ({ ...p, raise_lead_investor: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                </div>
              </details>

              {/* SECTION 3 — USE & TRACTION (collapsible) */}
              <details className="border-t border-[#e2e6ed] pt-4">
                <summary className="text-xs font-mono uppercase tracking-wide text-[#4a5568] cursor-pointer hover:text-[#2d6a4f] mb-3">Use of funds & traction</summary>
                <div className="flex flex-col gap-4 mt-3">
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Use of Proceeds</label>
                    <textarea rows={3} placeholder="e.g. 30% R&D, 40% commercialization, 30% team" value={fundingForm.raise_use_of_proceeds || ""}
                      onChange={e => setFundingForm(p => ({ ...p, raise_use_of_proceeds: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Revenue / ARR</label>
                    <input type="text" placeholder='e.g. "$50k MRR", "$1.2M ARR", or "Pre-revenue"' value={fundingForm.raise_revenue_status || ""}
                      onChange={e => setFundingForm(p => ({ ...p, raise_revenue_status: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                </div>
              </details>

              {/* SECTION 4 — MATERIALS & ACCESS (collapsible) */}
              <details className="border-t border-[#e2e6ed] pt-4">
                <summary className="text-xs font-mono uppercase tracking-wide text-[#4a5568] cursor-pointer hover:text-[#2d6a4f] mb-3">Materials & investor access</summary>
                <div className="flex flex-col gap-4 mt-3">
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Data Room URL</label>
                    <input type="url" placeholder="https://docsend.com/view/..." value={fundingForm.raise_data_room_url || ""}
                      onChange={e => setFundingForm(p => ({ ...p, raise_data_room_url: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Intro Call Booking Link</label>
                    <input type="url" placeholder="https://calendly.com/..." value={fundingForm.raise_intro_call_url || ""}
                      onChange={e => setFundingForm(p => ({ ...p, raise_intro_call_url: e.target.value }))}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                </div>
              </details>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={savingFunding} className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors">
                  {savingFunding ? "Saving..." : "Save funding details"}
                </button>
                {savedFunding && <span className="text-sm text-[#2d6a4f] font-medium">Saved</span>}
              </div>
            </form>

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

                {/* SECTION 1 — REQUIRED (always visible) */}
                <div className="text-xs font-mono uppercase tracking-wide text-[#2d6a4f] pb-1">Required info</div>
                <input required placeholder="Job title *" value={jobForm.title} onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                <input required placeholder="Location * (e.g., San Francisco, CA, or Remote)" value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                <input required type="email" placeholder="Contact email *" value={jobForm.contact_email} onChange={e => setJobForm(p => ({ ...p, contact_email: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />

                {/* SECTION 2 — JOB DETAILS */}
                <details className="border-t border-[#e2e6ed] pt-3">
                  <summary className="text-xs font-mono uppercase tracking-wide text-[#4a5568] cursor-pointer hover:text-[#2d6a4f]">Job details</summary>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <select value={jobForm.work_mode || ""} onChange={e => setJobForm(p => ({ ...p, work_mode: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                      <option value="">Work mode</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">Onsite</option>
                    </select>
                    <select value={jobForm.type || ""} onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                      <option value="">Employment type</option>
                      <option value="full_time">Full-time</option>
                      <option value="part_time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="internship">Internship</option>
                    </select>
                    <select value={jobForm.experience_level || ""} onChange={e => setJobForm(p => ({ ...p, experience_level: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                      <option value="">Experience level</option>
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="lead">Lead</option>
                      <option value="executive">Executive</option>
                    </select>
                  </div>
                </details>

                {/* SECTION 3 — COMPENSATION */}
                <details className="border-t border-[#e2e6ed] pt-3">
                  <summary className="text-xs font-mono uppercase tracking-wide text-[#4a5568] cursor-pointer hover:text-[#2d6a4f]">Compensation</summary>
                  <div className="flex flex-col gap-2 mt-3">
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" placeholder="Min salary" value={jobForm.salary_min || ""} onChange={e => setJobForm(p => ({ ...p, salary_min: e.target.value ? parseInt(e.target.value) : null }))}
                        className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                      <input type="number" placeholder="Max salary" value={jobForm.salary_max || ""} onChange={e => setJobForm(p => ({ ...p, salary_max: e.target.value ? parseInt(e.target.value) : null }))}
                        className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                      <select value={jobForm.salary_currency || "USD"} onChange={e => setJobForm(p => ({ ...p, salary_currency: e.target.value }))}
                        className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[#4a5568]">
                      <input type="checkbox" checked={jobForm.equity_offered || false} onChange={e => setJobForm(p => ({ ...p, equity_offered: e.target.checked }))}
                        className="w-4 h-4 accent-[#2d6a4f]" />
                      Equity offered
                    </label>
                  </div>
                </details>

                {/* SECTION 4 — ABOUT THE ROLE */}
                <details className="border-t border-[#e2e6ed] pt-3">
                  <summary className="text-xs font-mono uppercase tracking-wide text-[#4a5568] cursor-pointer hover:text-[#2d6a4f]">About the role</summary>
                  <div className="flex flex-col gap-2 mt-3">
                    <textarea placeholder="Role overview" rows={2} value={jobForm.role_overview || ""} onChange={e => setJobForm(p => ({ ...p, role_overview: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
                    <textarea placeholder="Responsibilities" rows={4} value={jobForm.responsibilities || ""} onChange={e => setJobForm(p => ({ ...p, responsibilities: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
                    <textarea placeholder="Requirements" rows={4} value={jobForm.requirements || ""} onChange={e => setJobForm(p => ({ ...p, requirements: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
                    <textarea placeholder="Nice-to-haves (optional)" rows={3} value={jobForm.nice_to_haves || ""} onChange={e => setJobForm(p => ({ ...p, nice_to_haves: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
                  </div>
                </details>

                {/* SECTION 5 — SECTOR & MISSION */}
                <details className="border-t border-[#e2e6ed] pt-3">
                  <summary className="text-xs font-mono uppercase tracking-wide text-[#4a5568] cursor-pointer hover:text-[#2d6a4f]">Sector & mission</summary>
                  <div className="flex flex-col gap-2 mt-3">
                    <input placeholder="Sector tags (comma-separated)" value={Array.isArray(jobForm.sector_tags) ? jobForm.sector_tags.join(", ") : (jobForm.sector_tags || "")}
                      onChange={e => setJobForm(p => ({ ...p, sector_tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    <textarea placeholder="Mission/impact statement" rows={2} value={jobForm.mission_statement || ""} onChange={e => setJobForm(p => ({ ...p, mission_statement: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
                  </div>
                </details>

                {/* SECTION 6 — HOW TO APPLY */}
                <details className="border-t border-[#e2e6ed] pt-3">
                  <summary className="text-xs font-mono uppercase tracking-wide text-[#4a5568] cursor-pointer hover:text-[#2d6a4f]">How to apply</summary>
                  <div className="flex flex-col gap-2 mt-3">
                    <input type="url" placeholder="Application URL (optional)" value={jobForm.apply_url || ""} onChange={e => setJobForm(p => ({ ...p, apply_url: e.target.value }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    <input type="date" value={jobForm.application_deadline || ""} onChange={e => setJobForm(p => ({ ...p, application_deadline: e.target.value || null }))}
                      className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                </details>

                <div className="flex gap-2 justify-end pt-2">
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
                    <button onClick={() => deleteUpdate(u.id)} className="text-xs text-red-500 hover:text-red-700 font-mono mt-2">Delete</button>
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
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Investor Discovery</div>
                <a href="/investors" target="_blank" className="text-xs text-[#2d6a4f] font-mono hover:underline">Browse all →</a>
              </div>
              <p className="text-xs text-[#718096] mb-5">Investors matched to your sector and stage. Update your profile tags to improve matches.</p>
              {matchedInvestors.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {matchedInvestors.map(inv => (
                    <div key={inv.id} className="border border-[#e2e6ed] rounded-xl p-4 flex items-start justify-between hover:border-[#2d6a4f] transition-colors group">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{inv.name}</div>
                        {inv.firm && <div className="text-xs text-[#718096] mt-0.5">{inv.firm}</div>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {inv.focus && <span className="text-xs px-2 py-0.5 rounded-full bg-[#eef1f6] border border-[#c8d8cc] text-[#2d6a4f]">{inv.focus}</span>}
                          {inv.stage && <span className="text-xs px-2 py-0.5 rounded-full bg-[#f2f4f8] border border-[#e2e6ed] text-[#718096]">{inv.stage}</span>}
                          {inv.check_size && <span className="text-xs px-2 py-0.5 rounded-full bg-[#f2f4f8] border border-[#e2e6ed] text-[#718096]">{inv.check_size}</span>}
                        </div>
                      </div>
                      {inv.show_contact && inv.primary_contact_email && (
                        <a href={`mailto:${inv.primary_contact_email}?subject=Introduction via EP Investing`}
                          className="text-xs bg-[#2d6a4f] text-white px-3 py-1.5 rounded-lg hover:bg-[#235a40] flex-shrink-0 ml-4 transition-colors">
                          Contact
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-[#e2e6ed] rounded-xl">
                  <p className="text-sm text-[#718096] mb-3">No matched investors yet.</p>
                  <p className="text-xs text-[#a0aec0] max-w-xs mx-auto">Fill in your industry tags and funding stage on your Profile tab to get matched with relevant investors.</p>
                  <button onClick={() => setActiveTab("profile")} className="mt-4 text-xs text-[#2d6a4f] font-semibold hover:underline">
                    Update your profile →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

{activeTab === "experts" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Available Experts</div>
                <a href="/experts" target="_blank" className="text-xs text-[#2d6a4f] font-mono hover:underline">Browse all →</a>
              </div>
              <p className="text-xs text-[#718096] mb-5">Climate and energy experts available for consulting, advisory, and fractional roles.</p>
              {matchedExperts.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {matchedExperts.map(exp => (
                    <div key={exp.id} className="border border-[#e2e6ed] rounded-xl p-4 flex items-start justify-between hover:border-[#2d6a4f] transition-colors group">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{exp.name}</div>
                        {exp.location && <div className="text-xs text-[#718096] mt-0.5">{exp.location}</div>}
                        {exp.expertise_areas?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exp.expertise_areas.slice(0, 3).map(a => (
                              <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-[#eef1f6] border border-[#c8d8cc] text-[#2d6a4f]">{a}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-3 mt-2">
                          {exp.hourly_rate && <span className="text-xs text-[#718096]">{exp.hourly_rate}</span>}
                          {exp.availability && <span className="text-xs text-[#2d6a4f] font-medium">{exp.availability}</span>}
                        </div>
                      </div>
                      {exp.email && (
                        <a href={`mailto:${exp.email}?subject=Expert inquiry via EP Investing`}
                          className="text-xs bg-[#2d6a4f] text-white px-3 py-1.5 rounded-lg hover:bg-[#235a40] flex-shrink-0 ml-4 transition-colors">
                          Contact
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-[#e2e6ed] rounded-xl">
                  <p className="text-sm text-[#718096] mb-2">No experts available yet.</p>
                  <p className="text-xs text-[#a0aec0] max-w-xs mx-auto">We're building our expert network. Check back soon or browse all experts.</p>
                  <a href="/experts" className="mt-4 inline-block text-xs text-[#2d6a4f] font-semibold hover:underline">
                    Browse experts →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}