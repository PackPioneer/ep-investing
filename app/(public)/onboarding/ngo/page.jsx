"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Building2 } from "lucide-react";

const ORG_TYPES = [
  { value: "international_ngo", label: "International NGO", desc: "Conservation, advocacy, or service org operating across borders (e.g. WWF, EDF)" },
  { value: "igo", label: "Intergovernmental Organization", desc: "Multilateral body or international agency (e.g. UN, IRENA, World Bank)" },
  { value: "foundation", label: "Foundation", desc: "Grant-making philanthropy (e.g. Bezos Earth Fund, ClimateWorks)" },
  { value: "research_nonprofit", label: "Research Non-Profit", desc: "Think tank or research institute (e.g. RMI, WRI)" },
  { value: "implementation_nonprofit", label: "Implementation Non-Profit", desc: "Direct on-the-ground program delivery (e.g. Solar Sister)" },
  { value: "advocacy", label: "Advocacy / Movement", desc: "Public campaign, grassroots, or political action (e.g. 350.org)" },
  { value: "other", label: "Other", desc: "Doesn't fit above categories" },
];

const SECTORS = [
  "solar", "wind-energy", "battery-storage", "grid-storage", "green-hydrogen",
  "ev-charging", "electric-vehicles", "carbon-credits", "direct-air-capture",
  "saf-efuels", "nuclear-technologies", "geothermal-energy", "clean-cooking",
  "industrial-decarbonization", "buildings-efficiency", "transmission",
  "methane", "air-quality", "water", "waste", "permitting",
  "environmental-justice", "agriculture", "forestry",
];

const STAFF_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const BUDGET_RANGES = ["<1M", "1-10M", "10-100M", "100M+"];

const inputClass = "w-full bg-white border border-[#d0d6e0] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors";
const labelClass = "block text-xs font-mono text-[#4a5568] uppercase tracking-wider mb-1.5";

function ProgressBar({ step }) {
  const steps = ["Identity", "Mission", "Partnership"];
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
              i + 1 < step ? "bg-[#2d6a4f] border-[#2d6a4f] text-white" :
              i + 1 === step ? "bg-white border-[#2d6a4f] text-[#2d6a4f]" :
              "bg-white border-[#d0d6e0] text-[#a0aec0]"
            }`}>
              {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-[10px] font-mono ${i + 1 === step ? "text-[#2d6a4f]" : "text-[#a0aec0]"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-4 transition-all ${i + 1 < step ? "bg-[#2d6a4f]" : "bg-[#e2e6ed]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function NGOOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    name: "", org_type: "", website_url: "",
    headquarters_country: "", headquarters_city: "", founded_year: "",
    short_description: "", bio: "",
    sector_tags: [], geography_focus_input: "",
    staff_size: "", annual_grants_budget_usd_range: "",
    open_to_partnerships: false, partnership_description: "",
    contact_email: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]
  }));

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const geography_focus = form.geography_focus_input
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/onboarding/ngo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, geography_focus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const step1Valid = form.name && form.org_type && form.website_url && form.headquarters_country;
  const step2Valid = form.short_description && form.bio;
  const step3Valid = form.contact_email;

  if (done) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#2d6a4f]" />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">Profile under review</h2>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-8">
          Thanks for submitting <strong>{form.name}</strong>. We review every NGO profile and will follow up within a few business days. Once approved, you'll be able to log in, edit your profile, and post grants and jobs.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#2d6a4f] hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-4">
            <Building2 size={11} /> NGO Profile
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-2">List your organization</h1>
          <p className="text-sm text-[#4a5568] max-w-md mx-auto">
            Get discovered by climate companies, post grants and jobs, and connect with peer organizations.
          </p>
        </div>

        <ProgressBar step={step} />

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-semibold text-[#0f1a14]">Identity</h2>

              <div>
                <label className={labelClass}>Organization name *</label>
                <input className={inputClass} value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="e.g. World Resources Institute" />
              </div>

              <div>
                <label className={labelClass}>Organization type *</label>
                <div className="flex flex-col gap-2">
                  {ORG_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => set("org_type", t.value)}
                      className={`text-left px-4 py-3 rounded-lg border transition-all ${
                        form.org_type === t.value
                          ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.04)]"
                          : "border-[#e2e6ed] hover:border-[#2d6a4f]"
                      }`}>
                      <div className="text-sm font-semibold text-[#0f1a14]">{t.label}</div>
                      <div className="text-xs text-[#718096] mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Website URL *</label>
                <input className={inputClass} value={form.website_url} onChange={e => set("website_url", e.target.value)}
                  placeholder="https://www.yourorg.org" />
                <p className="text-[10px] text-[#a0aec0] mt-1">Your contact email's domain must match this for automatic verification.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>HQ Country *</label>
                  <input className={inputClass} value={form.headquarters_country} onChange={e => set("headquarters_country", e.target.value)}
                    placeholder="United States" />
                </div>
                <div>
                  <label className={labelClass}>HQ City</label>
                  <input className={inputClass} value={form.headquarters_city} onChange={e => set("headquarters_city", e.target.value)}
                    placeholder="Washington" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Founded year</label>
                <input className={inputClass} type="number" value={form.founded_year} onChange={e => set("founded_year", e.target.value)}
                  placeholder="1985" />
              </div>

              <button onClick={() => setStep(2)} disabled={!step1Valid}
                className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 w-fit ml-auto">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-semibold text-[#0f1a14]">Mission</h2>

              <div>
                <label className={labelClass}>One-line description *</label>
                <input className={inputClass} value={form.short_description} onChange={e => set("short_description", e.target.value.slice(0, 200))}
                  placeholder="What does your organization do?" maxLength={200} />
                <p className="text-[10px] text-[#a0aec0] mt-1">{form.short_description.length}/200</p>
              </div>

              <div>
                <label className={labelClass}>Mission statement *</label>
                <textarea rows={4} className={inputClass + " resize-none"} value={form.bio} onChange={e => set("bio", e.target.value.slice(0, 1500))}
                  placeholder="Describe your work, impact, and approach. 500-1500 characters." maxLength={1500} />
                <p className="text-[10px] text-[#a0aec0] mt-1">{form.bio.length}/1500</p>
              </div>

              <div>
                <label className={labelClass}>Sectors of focus</label>
                <div className="flex flex-wrap gap-1.5">
                  {SECTORS.map(s => (
                    <button type="button" key={s} onClick={() => toggleArr("sector_tags", s)}
                      className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                        form.sector_tags.includes(s)
                          ? "border-[#2d6a4f] bg-[#2d6a4f] text-white"
                          : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"
                      }`}>
                      {s.replace(/-/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Geographic focus</label>
                <input className={inputClass} value={form.geography_focus_input} onChange={e => set("geography_focus_input", e.target.value)}
                  placeholder="United States, India, Sub-Saharan Africa (comma-separated)" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Staff size</label>
                  <select className={inputClass} value={form.staff_size} onChange={e => set("staff_size", e.target.value)}>
                    <option value="">Select...</option>
                    {STAFF_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Annual grants budget</label>
                  <select className={inputClass} value={form.annual_grants_budget_usd_range} onChange={e => set("annual_grants_budget_usd_range", e.target.value)}>
                    <option value="">Select (optional)...</option>
                    {BUDGET_RANGES.map(b => <option key={b} value={b}>${b}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-[#4a5568] hover:text-[#0f1a14] px-3 py-2">
                  Back
                </button>
                <button onClick={() => setStep(3)} disabled={!step2Valid}
                  className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-base font-semibold text-[#0f1a14]">Partnership & Contact</h2>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={form.open_to_partnerships}
                    onChange={e => set("open_to_partnerships", e.target.checked)} />
                  <div>
                    <div className="text-sm font-semibold text-[#0f1a14]">Open to international partnerships</div>
                    <div className="text-xs text-[#718096] mt-0.5">
                      Get a partnership badge on your profile. Other orgs can reach out to collaborate.
                    </div>
                  </div>
                </label>
              </div>

              {form.open_to_partnerships && (
                <div>
                  <label className={labelClass}>What kind of partnerships?</label>
                  <textarea rows={3} className={inputClass + " resize-none"} value={form.partnership_description} onChange={e => set("partnership_description", e.target.value.slice(0, 500))}
                    placeholder="e.g. Implementation partners in West Africa for off-grid solar programs" maxLength={500} />
                </div>
              )}

              <div>
                <label className={labelClass}>Contact email *</label>
                <input className={inputClass} type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)}
                  placeholder="contact@yourorg.org" />
                <p className="text-[10px] text-[#a0aec0] mt-1">
                  For automatic verification, use an email address at your organization's domain (matches your website URL).
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-[#4a5568] hover:text-[#0f1a14] px-3 py-2">
                  Back
                </button>
                <button onClick={handleSubmit} disabled={!step3Valid || loading}
                  className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                  {loading ? "Submitting..." : "Submit profile"} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#718096] mt-6">
          Already listed? <Link href="/ngos/directory" className="text-[#2d6a4f] hover:underline">Browse the directory</Link> to claim your profile.
        </p>
      </div>
    </div>
  );
}
