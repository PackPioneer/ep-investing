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
    if (!user) { router.push("/sign-in"); return; }
    fetch("/api/dashboard/company")
      .then(r => r.json())
      .then(data => {
        if (!data || data.error) { router.push("/"); return; }
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
        fetch("/api/dashboard/jobs")
          .then(r => r.json())
          .then(d => setJobs(Array.isArray(d.jobs) ? d.jobs : []));
        fetch("/api/companies/" + data.id + "/updates")
          .then(r => r.json())
          .then(u => setUpdates(Array.isArray(u) ? u : []));
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      industry_tags: form.industry_tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    await fetch("/api/dashboard/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function submitJob(e) {
    e.preventDefault();
    setSubmittingJob(true);
    const res = await fetch("/api/dashboard/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobForm),
    });
    if (res.ok) {
      const newJob = await res.json();
      setJobs(prev => [newJob, ...prev]);
      setJobForm({ title: "", location: "", type: "", contact_email: "", description: "" });
      setShowJobForm(false);
    }
    setSubmittingJob(false);
  }

  async function deleteJob(id) {
    await fetch("/api/dashboard/jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setJobs(prev => prev.filter(j => j.id !== id));
  }

  async function submitUpdate(e) {
    e.preventDefault();
    setSubmittingUpdate(true);
    const res = await fetch("/api/companies/" + company.id + "/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateForm),
    });
    if (res.ok) {
      const newUpdate = await res.json();
      setUpdates(prev => [newUpdate, ...prev]);
      setUpdateForm({ title: "", body: "", link: "", type: "milestone" });
      setShowUpdateForm(false);
    }
    setSubmittingUpdate(false);
  }
  async function saveFunding(e) {
    e.preventDefault();
    setSavingFunding(true);
    await fetch("/api/dashboard/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fundingForm),
    });
    setSavingFunding(false);
    setSavedFunding(true);
    setTimeout(() => setSavedFunding(false), 3000);
  }

  async function uploadDeck(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDeck(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/dashboard/pitch-deck", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const { url } = await res.json();
      setDeckUrl(url);
    }
    setUploadingDeck(false);
  }
  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-2">
          {company?.name} Dashboard
        </h1>
        <p className="text-sm text-[#4a5568] mb-8">Manage your company profile, jobs, and updates.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Profile Views</div>
            <div className="text-3xl font-bold text-[#0f1a14]">—</div>
          </div>
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Open Jobs</div>
            <div className="text-3xl font-bold text-[#0f1a14]">—</div>
          </div>
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Updates Posted</div>
            <div className="text-3xl font-bold text-[#0f1a14]">—</div>
          </div>
        </div>

        {form && (
          <form onSubmit={saveProfile} className="bg-white border border-[#e2e6ed] rounded-2xl p-7 mb-4">
            <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-6">Profile Settings</h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea rows={4} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none"
                  placeholder="Describe your company..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Funding Stage</label>
                  <select value={form.funding_stage}
                    onChange={e => setForm(p => ({ ...p, funding_stage: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    {STAGE_OPTIONS.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Business Model</label>
                  <select value={form.business_model}
                    onChange={e => setForm(p => ({ ...p, business_model: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="">Select...</option>
                    {MODEL_OPTIONS.map(m => <option key={m} value={m}>{MODEL_LABELS[m]}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Industry Tags (comma separated)</label>
                <input type="text" value={form.industry_tags}
                  onChange={e => setForm(p => ({ ...p, industry_tags: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]"
                  placeholder="solar, battery_storage, b2b..." />
              </div>
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3 block">Signals</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: "looking_to_raise", label: "💰 Looking to Raise" },
                    { key: "is_hiring", label: "🙋 Hiring" },
                    { key: "seeking_partnerships", label: "🤝 Seeking Partnerships" },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[key]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                        className="w-4 h-4 accent-[#2d6a4f]" />
                      <span className="text-sm text-[#0f1a14]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button type="submit" disabled={saving}
                className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save changes"}
              </button>
              {saved && <span className="text-sm text-[#2d6a4f] font-medium">✓ Saved</span>}
            </div>
          </form>
        )}

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 mb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Job Postings</h2>
            <button onClick={() => setShowJobForm(v => !v)}
              className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] transition-colors">
              + Add role
            </button>
          </div>
          {showJobForm && (
            <form onSubmit={submitJob} className="mb-6 flex flex-col gap-3 bg-[#f8f9fb] rounded-xl p-4 border border-[#e2e6ed]">
              <input required placeholder="Job title *" value={jobForm.title}
                onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))}
                className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Location" value={jobForm.location}
                  onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                <select value={jobForm.type}
                  onChange={e => setJobForm(p => ({ ...p, type: e.target.value }))}
                  className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                  <option value="">Type...</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <input placeholder="Contact email *" value={jobForm.contact_email}
                onChange={e => setJobForm(p => ({ ...p, contact_email: e.target.value }))}
                className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              <textarea placeholder="Job description" rows={3} value={jobForm.description}
                onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}
                className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowJobForm(false)}
                  className="text-xs text-[#718096] px-3 py-1.5 rounded-lg hover:bg-[#e2e6ed]">Cancel</button>
                <button type="submit" disabled={submittingJob}
                  className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-1.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50">
                  {submittingJob ? "Posting..." : "Post job"}
                </button>
              </div>
            </form>
          )}
          {jobs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between py-3 border-b border-[#e2e6ed] last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-[#0f1a14]">{job.title}</div>
                    <div className="text-xs text-[#718096] mt-0.5">{job.location} · {job.type?.replace("_", " ")}</div>
                  </div>
                  <button onClick={() => deleteJob(job.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-mono">Remove</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#718096]">No open roles yet.</p>
          )}
        </div>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Recent Updates</h2>
            <button onClick={() => setShowUpdateForm(v => !v)}
              className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] transition-colors">
              + Add update
            </button>
          </div>
          {showUpdateForm && (
            <form onSubmit={submitUpdate} className="mb-6 flex flex-col gap-3 bg-[#f8f9fb] rounded-xl p-4 border border-[#e2e6ed]">
              <input required placeholder="Title *" value={updateForm.title}
                onChange={e => setUpdateForm(p => ({ ...p, title: e.target.value }))}
                className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              <textarea placeholder="Details (optional)" rows={2} value={updateForm.body}
                onChange={e => setUpdateForm(p => ({ ...p, body: e.target.value }))}
                className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
              <input placeholder="Link (optional)" value={updateForm.link}
                onChange={e => setUpdateForm(p => ({ ...p, link: e.target.value }))}
                className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              <select value={updateForm.type}
                onChange={e => setUpdateForm(p => ({ ...p, type: e.target.value }))}
                className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                <option value="milestone">Milestone</option>
                <option value="hiring">Hiring</option>
                <option value="funding">Funding</option>
                <option value="product">Product</option>
                <option value="partnership">Partnership</option>
                <option value="other">Other</option>
              </select>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowUpdateForm(false)}
                  className="text-xs text-[#718096] px-3 py-1.5 rounded-lg hover:bg-[#e2e6ed]">Cancel</button>
                <button type="submit" disabled={submittingUpdate}
                  className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-1.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50">
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
 <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 mt-4">
          <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-6">Funding Round</h2>
          <p className="text-xs text-[#718096] mb-5">This information is only visible to verified investors.</p>
          
          <form onSubmit={saveFunding} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Target Raise</label>
                <input type="text" placeholder="e.g. $2M" value={fundingForm.raise_target}
                  onChange={e => setFundingForm(p => ({ ...p, raise_target: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Raised So Far</label>
                <input type="text" placeholder="e.g. $500K" value={fundingForm.raise_current}
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
                <input type="text" placeholder="e.g. $25K" value={fundingForm.min_check_size}
                  onChange={e => setFundingForm(p => ({ ...p, min_check_size: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingFunding}
                className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors">
                {savingFunding ? "Saving..." : "Save funding details"}
              </button>
              {savedFunding && <span className="text-sm text-[#2d6a4f] font-medium">✓ Saved</span>}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#e2e6ed]">
            <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3 block">Pitch Deck (PDF)</label>
            {deckUrl && (
              <div className="flex items-center gap-3 mb-3">
                <a href={deckUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-[#2d6a4f] hover:underline">View current pitch deck →</a>
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 border border-[#d0d6e0] text-sm text-[#4a5568] px-4 py-2.5 rounded-lg hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
              {uploadingDeck ? "Uploading..." : deckUrl ? "Replace pitch deck" : "Upload pitch deck"}
              <input type="file" accept=".pdf" onChange={uploadDeck} className="hidden" disabled={uploadingDeck} />
            </label>
            <p className="text-xs text-[#718096] mt-2">PDF only. Only visible to verified investors.</p>
          </div>
        </div>
      </div>
    </div>
  );
}