"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle, TrendingUp } from "lucide-react";

const SECTORS = ["green_hydrogen","nuclear_technologies","battery_storage","electric_aviation","solar","wind_energy","ev_charging","industrial_decarb","carbon_credits","direct_air_capture","saf_efuels","geothermal","clean_cooking","grid_storage"];
const STAGES = ["Pre-seed","Seed","Series A","Series B","Series C+","Growth"];
const CHECK_SIZES = ["<$100K","$100K–$500K","$500K–$1M","$1M–$5M","$5M–$20M","$20M+"];
const GEOS = ["United States","Europe","Latin America","Africa","Asia","Global"];

function ProgressBar({ step }) {
  const steps = ["Basics", "Focus", "Confirm"];
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

function MultiSelect({ options, selected, onChange, label }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map(o => (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
              selected.includes(o)
                ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"
            }`}>{o.replace(/_/g, " ")}</button>
        ))}
      </div>
    </div>
  );
}

export default function InvestorOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", firm: "", role: "",
    sectors: [], stages: [], check_sizes: [], geographies: [],
    thesis: "", how_heard: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/onboarding/investor", {
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
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">You're in</h2>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-2">
          Thanks {form.name} — we've received your investor profile{form.firm ? ` from ${form.firm}` : ""}.
        </p>
        <p className="text-[#718096] text-sm mb-8">
          Check your inbox at {form.email} for a confirmation. We'll match you to relevant deal flow shortly.
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
            <TrendingUp size={11} /> For Investors
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-1">Get matched to deal flow</h1>
          <p className="text-sm text-[#4a5568] font-light">Tell us your thesis and we'll surface the right companies.</p>
        </div>

        <ProgressBar step={step} />

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-[#0f1a14] mb-1">About you</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Your name <span className="text-[#2d6a4f]">*</span></label>
                  <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Otto Gunderson" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Your role</label>
                  <input value={form.role} onChange={e => set("role", e.target.value)} placeholder="Partner, Associate…" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email <span className="text-[#2d6a4f]">*</span></label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@fund.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Firm / Fund name</label>
                <input value={form.firm} onChange={e => set("firm", e.target.value)} placeholder="e.g. Breakthrough Energy Ventures" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>How did you hear about EP Investment?</label>
                <input value={form.how_heard} onChange={e => set("how_heard", e.target.value)} placeholder="LinkedIn, referral, Google…" className={inputClass} />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!form.name || !form.email}
                className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3.5 hover:bg-[#235a40] transition-all disabled:opacity-40 mt-2">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h2 className="font-semibold text-[#0f1a14] mb-1">Your investment focus</h2>

              <MultiSelect label="Climate sectors (select all that apply)" options={SECTORS} selected={form.sectors} onChange={v => set("sectors", v)} />
              <MultiSelect label="Investment stages" options={STAGES} selected={form.stages} onChange={v => set("stages", v)} />
              <MultiSelect label="Check size" options={CHECK_SIZES} selected={form.check_sizes} onChange={v => set("check_sizes", v)} />
              <MultiSelect label="Geographies" options={GEOS} selected={form.geographies} onChange={v => set("geographies", v)} />

              <div>
                <label className={labelClass}>Investment thesis (optional)</label>
                <textarea value={form.thesis} onChange={e => set("thesis", e.target.value)}
                  placeholder="Describe your thesis, what you look for in companies, and any specific focus areas…"
                  rows={3} className={`${inputClass} resize-none`} />
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 border border-[#d0d6e0] text-[#4a5568] text-sm font-medium rounded-lg px-5 py-3 hover:bg-[#f8f9fb] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => setStep(3)}
                  disabled={form.sectors.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-40">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-[#0f1a14] mb-1">Confirm your details</h2>

              <div className="bg-[#f8f9fb] rounded-xl border border-[#e2e6ed] p-5 flex flex-col gap-3">
                {[
                  { label: "Name", value: form.name },
                  { label: "Email", value: form.email },
                  { label: "Firm", value: form.firm },
                  { label: "Role", value: form.role },
                  { label: "Sectors", value: form.sectors.map(s => s.replace(/_/g, " ")).join(", ") },
                  { label: "Stages", value: form.stages.join(", ") },
                  { label: "Check size", value: form.check_sizes.join(", ") },
                  { label: "Geographies", value: form.geographies.join(", ") },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex gap-3 text-sm">
                    <span className="text-[#718096] font-mono text-xs w-24 flex-shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-[#0f1a14] text-xs">{row.value}</span>
                  </div>
                ))}
                {form.thesis && (
                  <div className="flex gap-3 text-sm pt-2 border-t border-[#e2e6ed]">
                    <span className="text-[#718096] font-mono text-xs w-24 flex-shrink-0 pt-0.5">Thesis</span>
                    <span className="text-[#4a5568] text-xs leading-relaxed line-clamp-3">{form.thesis}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-[#718096] leading-relaxed">
                By submitting you'll receive a confirmation at <strong>{form.email}</strong>. We'll start matching you to relevant deal flow right away.
              </p>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 border border-[#d0d6e0] text-[#4a5568] text-sm font-medium rounded-lg px-5 py-3 hover:bg-[#f8f9fb] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-60">
                  {loading ? "Submitting…" : "Submit"}
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
