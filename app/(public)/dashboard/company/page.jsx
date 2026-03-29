cat > "app/(public)/dashboard/company/page.jsx" << 'EOF'
"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const STAGE_OPTIONS = ["pre_seed","seed","series_a","series_b","series_c","growth","public","unknown"];
const STAGE_LABELS = { pre_seed:"Pre-Seed", seed:"Seed", series_a:"Series A", series_b:"Series B", series_c:"Series C", growth:"Growth", public:"Public", unknown:"Unknown" };
const MODEL_OPTIONS = ["b2b","b2c","b2g","hardware","software","project_developer","marketplace","mixed"];
const MODEL_LABELS = { b2b:"B2B", b2c:"B2C", b2g:"B2G", hardware:"Hardware", software:"Software", project_developer:"Project Dev", marketplace:"Marketplace", mixed:"Mixed" };

export default function CompanyDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
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
        });
        setFundingForm({
          raise_target: data.raise_target || "",
          raise_current: data.raise_current || "",
          raise_close_date: data.raise_close_date || "",
          min_check_size: data.min_check_size || "",
        });
        setDeckUrl(data.pitch_deck_url || null);
        setLoading(false);
        fetch("/api/dashboard/jobs").then(r => r.json()).then(d => setJobs(Array.isArray(d.jobs) ? d.jobs : []));
        fetch(`/api/companies/${data.id}/updates`).then(r => r.json()).then(u => setUpdates(Array.isArray(u) ? u : []));
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, industry_tags: form.industry_tags.split(",").map(t => t.trim()).filter(Boolean) };
    await fetch("/api/dashboard/company", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  async function submitJob(e) {
    e.preventDefault();
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
    const res = await fetch(`/api/companies/${company.id}/updates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updateForm) });
    if (res.ok) { const u = await res.json(); setUpdates(prev => [u, ...prev]); setUpdateForm({ title: "", body: "", link: "", type: "milestone" }); setShowUpdateForm(false); }
    setSubmittingUpdate(false);
  }

  async function saveFunding(e) {
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

  const raisePercent = fundingForm.raise_target && fundingForm.raise_current
    ? Math.min(100, Math.round((parseFloat(fundingForm.raise_current) / parseFloat(fundingForm.raise_target)) * 100))
    : 0;

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

  const navItems = [
    { id: "overview", label: "Overview", icon: "⊞" },
    { id: "profile", label: "Profile", icon: "◯" },
    { id: "funding", label: "Funding Round", icon: "💰" },
    { id: "jobs", label: "Jobs", icon: "💼" },
    { id: "updates", label: "Updates", icon: "📄" },
  ];

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {/* Sidebar */}
      <div className="w-56 bg-[#0f1a14] flex flex-col gap-1 px-3 py-6 flex-shrink-0">
        <div style={{ fontFamily: "Georgia, serif" }} className="text-white text-base mb-6 px-2">
          EP <span className="text-[#2d6a4f]">Investing</span>
        </div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors ${activeTab === item.id ? "bg-[#1a2e20] text-white" : "text-[#9ca8a0] hover:text-white"}`}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 bg-[#f2f4f8] p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
            {company?.name || "Company Dashboard"}
          </h1>
          {company?.id && (
            <a href={`/companies/${company.id}`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold border border-[#2d6a4f] text-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#eef1f6] transition-colors">
              Preview public profile →
            </a>
          )}
        </div>

        {/* OVERVIEW */}
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
                <div className="text-2xl font-semibold text-[#0f1a14]">—</div>
              </div>
            </div>

            {/* Profile completeness */}
            <div className="bg-white border border-[#e2e6ed] rounded-xl p-6">
              <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-4">Profile completeness</div>
              <div className="flex flex-col gap-3">
                {profileChecks.map(({ label, done }) => (
                  <div key={label} className={`flex items-center gap-2.5 text-sm ${done ? "text-[#2d6a4f]" : "text-[#718096]"}`}>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${done ? "bg-[#2d6a4f] border-[#2d6a4f] text-white" : "border-[#d0d6e0]"}`}>
                      {done ? "✓" : ""}
                    </div>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Funding banner */}
            {fundingForm.raise_target && (
              <div className="bg-[#eef7f2] border border-[#a8d5be] rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-[#2d6a4f] uppercase tracking-wide mb-1">Active raise</div>
                  <div className="text-lg font-semibold text-[#0f1a14]">
                    {fundingForm.raise_current ? `$${fundingForm.raise_current} raised of $${fundingForm.raise_target} target` : `$${fundingForm.raise_target} target`}
                  </div>
                  {raisePercent > 0 && (
                    <div className="mt-2 h-1.5 w-48 bg-[#d1fae5] rounded-full">
                      <div className="h-1.5 bg-[#2d6a4f] rounded-full" style={{ width: `${raisePercent}%` }} />
                    </div>
                  )}
                </div>
                <button onClick={() => setActiveTab("funding")} className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40]">
                  Edit round →
                </button>
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && form && (
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
                  {[{ key: "looking_to_raise", label: "💰 Looking to Raise" }, { key: "is_hiring", label: "🙋 Hiring" }, { key: "seeking_partnerships", label: "🤝 Seeking Partnerships" }].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))} className="w-4 h-4 accent-[#2d6a4f]" />
                      <span className="text-sm text-[#0f1a14]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button type="submit" disabled={saving} className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save changes"}
              </button>
              {saved && <span className="text-sm text-[#2d6a4f] font-medium">✓ Saved</span>}
            </div>
          </form>
        )}

        {/* FUNDING */}
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
                {savedFunding && <span className="text-sm text-[#2d6a4f] font-medium">✓ Saved</span>}
              </div>
            </form>
            <div className="mt-6 pt-6 border-t border-[#e2e6ed]">
              <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3 block">Pitch Deck (PDF)</label>
              {deckUrl && (
                <a href={deckUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#2d6a4f] hover:underline block mb-3">
                  View current pitch deck →
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

        {/* JOBS */}
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

        {/* UPDATES */}
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
      </div>
    </div>
  );
}
EOF