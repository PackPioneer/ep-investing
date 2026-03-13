"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle, Building2, TrendingUp, Users, Handshake } from "lucide-react";

const SECTORS = ["green_hydrogen","nuclear_technologies","battery_storage","electric_aviation","solar","wind_energy","ev_charging","industrial_decarb","carbon_credits","direct_air_capture","saf_efuels","geothermal","clean_cooking","grid_storage"];
const STAGES = ["Pre-revenue","Pilot","Early revenue","Growth","Profitable"];
const FUNDING_ROUNDS = ["Pre-seed","Seed","Series A","Series B","Series C+","Grant-funded","Bootstrapped"];

const SIGNALS = [
  {
    key: "looking_to_raise",
    icon: TrendingUp,
    label: "Looking to raise investment",
    sublabel: "Surface your company to investors on the platform",
    color: { ring: "ring-blue-500", bg: "bg-blue-50", icon: "text-blue-600", check: "bg-blue-600", border: "border-blue-200" },
  },
  {
    key: "is_hiring",
    icon: Users,
    label: "Currently hiring",
    sublabel: "Show a hiring badge on your company profile",
    color: { ring: "ring-violet-500", bg: "bg-violet-50", icon: "text-violet-600", check: "bg-violet-600", border: "border-violet-200" },
  },
  {
    key: "seeking_partnerships",
    icon: Handshake,
    label: "Open to partnerships & expansion",
    sublabel: "Signal interest in new markets, channels, or strategic partners",
    color: { ring: "ring-amber-500", bg: "bg-amber-50", icon: "text-amber-600", check: "bg-amber-600", border: "border-amber-200" },
  },
];

function ProgressBar({ step }) {
  const steps = ["Basics", "Details", "Confirm"];
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

const inputClass = "w-full bg-white border border-[#d0d6e0] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors";
const labelClass = "block text-xs font-mono text-[#4a5568] uppercase tracking-wider mb-1.5";

export default function CompanyOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    company_name: "", website: "", contact_name: "", contact_email: "", contact_role: "",
    sector: "", stage: "", funding_round: "", location: "", description: "", funding_raised: "",
    looking_to_raise: false, is_hiring: false, seeking_partnerships: false, other_signal: "", other_sector: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k) => setForm(f => ({ ...f, [k]: !f[k] }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/onboarding/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setDone(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#2d6a4f]" />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">You're on the list</h2>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-2">
          Thanks {form.contact_name} — we've received your submission for <strong>{form.company_name}</strong>.
        </p>
        <p className="text-[#718096] text-sm mb-8">
          Check your inbox at {form.contact_email} for a confirmation. We'll be in touch within 1–2 business days.
        </p>
        <Link href="/search" className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
          Browse companies <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-xl mx-auto px-6 py-16">

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-4">
            <Building2 size={11} /> For Companies
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-1">Claim your profile</h1>
          <p className="text-sm text-[#4a5568] font-light">Get verified and discoverable by investors in 3 minutes.</p>
        </div>

        <ProgressBar step={step} />

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-[#0f1a14] mb-1">About you</h2>
              <div>
                <label className={labelClass}>Company name <span className="text-[#2d6a4f]">*</span></label>
                <input value={form.company_name} onChange={e => set("company_name", e.target.value)} placeholder="e.g. Verdagy" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Company website <span className="text-[#2d6a4f]">*</span></label>
                <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://verdagy.com" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Your name <span className="text-[#2d6a4f]">*</span></label>
                  <input value={form.contact_name} onChange={e => set("contact_name", e.target.value)} placeholder="Otto Gunderson" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Your role</label>
                  <input value={form.contact_role} onChange={e => set("contact_role", e.target.value)} placeholder="CEO, Founder…" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email <span className="text-[#2d6a4f]">*</span></label>
                <input type="email" value={form.contact_email} onChange={e => set("contact_email", e.target.value)} placeholder="otto@company.com" className={inputClass} />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.company_name || !form.website || !form.contact_name || !form.contact_email}
                className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3.5 hover:bg-[#235a40] transition-all disabled:opacity-40 mt-2">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-[#0f1a14] mb-1">About your company</h2>

              <div>
                <label className={labelClass}>Sector <span className="text-[#2d6a4f]">*</span></label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SECTORS.map(s => (
                    <button key={s} type="button" onClick={() => set("sector", s)}
                      className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
                        form.sector === s
                          ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                          : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"
                      }`}>{s.replace(/_/g, " ")}</button>
                  ))}
                  <button key="other" type="button" onClick={() => set("sector", "other")}
                    className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
                      form.sector === "other"
                        ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                        : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"
                    }`}>other</button>
                </div>
                {form.sector === "other" && (
                  <div className="mt-2">
                    <input
                      value={form.other_sector}
                      onChange={e => set("other_sector", e.target.value)}
                      placeholder="Please specify your sector…"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Stage</label>
                  <select value={form.stage} onChange={e => set("stage", e.target.value)} className={inputClass}>
                    <option value="">Select…</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Funding round</label>
                  <select value={form.funding_round} onChange={e => set("funding_round", e.target.value)} className={inputClass}>
                    <option value="">Select…</option>
                    {FUNDING_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Location</label>
                  <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. San Jose, CA" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Total funding raised</label>
                  <input value={form.funding_raised} onChange={e => set("funding_raised", e.target.value)} placeholder="e.g. $4.2M" className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Company description <span className="text-[#2d6a4f]">*</span></label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Describe your technology, what problem you solve, and your current traction…"
                  rows={4} className={`${inputClass} resize-none`} />
              </div>

              {/* Signal toggles */}
              <div>
                <label className={labelClass}>Company signals <span className="text-[#718096] normal-case font-normal tracking-normal">— select all that apply</span></label>
                <div className="flex flex-col gap-2.5 mt-1">
                  {SIGNALS.map(({ key, icon: Icon, label, sublabel, color: c }) => (
                    <button key={key} type="button" onClick={() => toggle(key)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        form[key] ? `${c.bg} ${c.border} ring-1 ${c.ring}` : "bg-slate-50 border-[#e2e6ed] hover:border-[#c8d8cc]"
                      }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${form[key] ? c.bg : "bg-white border border-[#e2e6ed]"}`}>
                        <Icon size={16} className={form[key] ? c.icon : "text-[#a0aec0]"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${form[key] ? "text-[#0f1a14]" : "text-[#4a5568]"}`}>{label}</p>
                        <p className="text-xs text-[#a0aec0] mt-0.5">{sublabel}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        form[key] ? `${c.check} border-transparent` : "border-[#d0d6e0]"
                      }`}>
                        {form[key] && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 border border-[#d0d6e0] text-[#4a5568] text-sm font-medium rounded-lg px-5 py-3 hover:bg-[#f8f9fb] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => setStep(3)}
                  disabled={!form.sector || !form.description}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-40">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — CONFIRM */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-[#0f1a14] mb-1">Confirm your details</h2>

              <div className="bg-[#f8f9fb] rounded-xl border border-[#e2e6ed] p-5 flex flex-col gap-3">
                {[
                  { label: "Company", value: form.company_name },
                  { label: "Website", value: form.website },
                  { label: "Contact", value: `${form.contact_name}${form.contact_role ? ` · ${form.contact_role}` : ""}` },
                  { label: "Email", value: form.contact_email },
                  { label: "Sector", value: form.sector?.replace(/_/g, " ") },
                  { label: "Stage", value: form.stage },
                  { label: "Round", value: form.funding_round },
                  { label: "Location", value: form.location },
                  { label: "Raised", value: form.funding_raised },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex gap-3 text-sm">
                    <span className="text-[#718096] font-mono text-xs w-20 flex-shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-[#0f1a14]">{row.value}</span>
                  </div>
                ))}
                {form.description && (
                  <div className="flex gap-3 text-sm pt-2 border-t border-[#e2e6ed]">
                    <span className="text-[#718096] font-mono text-xs w-20 flex-shrink-0 pt-0.5">About</span>
                    <span className="text-[#4a5568] line-clamp-3 text-xs leading-relaxed">{form.description}</span>
                  </div>
                )}
                {(form.looking_to_raise || form.is_hiring || form.seeking_partnerships) && (
                  <div className="flex gap-3 text-sm pt-2 border-t border-[#e2e6ed]">
                    <span className="text-[#718096] font-mono text-xs w-20 flex-shrink-0 pt-0.5">Signals</span>
                    <div className="flex flex-wrap gap-1.5">
                      {form.looking_to_raise && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">💰 Raising</span>}
                      {form.is_hiring && <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">🙋 Hiring</span>}
                      {form.seeking_partnerships && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">🤝 Partnerships</span>}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#718096] leading-relaxed">
                By submitting you'll receive a confirmation at <strong>{form.contact_email}</strong>. We'll verify your company and be in touch within 1–2 business days.
              </p>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 border border-[#d0d6e0] text-[#4a5568] text-sm font-medium rounded-lg px-5 py-3 hover:bg-[#f8f9fb] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-60">
                  {loading ? "Submitting…" : "Submit claim"}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
