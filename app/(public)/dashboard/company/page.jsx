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
        setLoading(false);
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

        {/* PROFILE SETTINGS */}
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
          <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-4">Job Postings</h2>
          <p className="text-sm text-[#718096]">Manage your open roles.</p>
        </div>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
          <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-4">Recent Updates</h2>
          <p className="text-sm text-[#718096]">Post updates about your company.</p>
        </div>
      </div>
    </div>
  );
}