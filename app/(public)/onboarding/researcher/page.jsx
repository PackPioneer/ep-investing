"use client";
"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle, Briefcase } from "lucide-react";
import posthog from "posthog-js";

const SECTORS = ["solar","wind_energy","battery_storage","green_hydrogen","nuclear_technologies","ev_charging","carbon_markets","direct_air_capture","saf_efuels","electric_aviation","geothermal","industrial_decarbonization","energy_efficiency","climate_tech"];
const JOB_TYPES = ["Engineering", "Finance & Investment", "Policy & Regulation", "Operations", "Sales & BD", "Product & Design", "Marketing", "Legal", "Research & Science", "Other"];
const EXPERIENCE = ["Student / Recent grad", "1–3 years", "3–7 years", "7–15 years", "15+ years"];

function ProgressBar({ step }) {
  const steps = ["Basics", "Interests", "Done"];
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

export default function JobSeekerOnboarding() {
  const [userType, setUserType] = useState("researcher");
const [step, setStep] = useState(1);
if (!userType) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">What brings you to EP Investing?</h1>
          <p className="text-[#4a5568] text-sm">We'll get you set up in the right place.</p>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { type: "company", label: "I'm a founder or operator", sub: "Raise, hire, and get matched with investors", href: "/onboarding/company" },
            { type: "investor", label: "I'm an investor", sub: "Source deals and track the energy transition", href: "/onboarding/investor" },
            { type: "researcher", label: "I'm a researcher or job seeker", sub: "Browse companies, jobs, and grants", href: null },
          ].map(({ type, label, sub, href }) => (
            <button key={type}
              onClick={() => href ? window.location.href = href : setUserType("researcher")}
              className="w-full text-left bg-white border border-[#e2e6ed] rounded-xl p-5 hover:border-[#2d6a4f] transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#0f1a14] text-sm group-hover:text-[#2d6a4f] transition-colors">{label}</p>
                  <p className="text-xs text-[#718096] mt-0.5">{sub}</p>
                </div>
                <ArrowRight size={16} className="text-[#c8d8cc] group-hover:text-[#2d6a4f] transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", location: "", experience: "",
    job_types: [], sectors: [], open_to_remote: false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]
  }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/onboarding/researcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      posthog.identify(form.email, { email: form.email, name: form.name });
      posthog.capture("researcher_onboarding_submitted", {});
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
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">You're all set</h2>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-8">
          Welcome to EP Investing. Browse 500+ climate and energy jobs, explore companies, and discover grants.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/jobs" className="inline-flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
            Browse jobs <ArrowRight size={14} />
          </Link>
          <Link href="/search" className="inline-flex items-center justify-center gap-2 border border-[#2d6a4f] text-[#2d6a4f] font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#eef1f6] transition-all">
            Explore companies
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-xl mx-auto px-6 py-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-4">
            <Briefcase size={11} /> For Researchers
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-1">Explore the energy transition</h1>
          <p className="text-sm text-[#4a5568] font-light">Browse 500+ climate and energy jobs across 14 sectors.</p>
        </div>

        <ProgressBar step={step} />

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="font-semibold text-[#0f1a14] mb-1">About you</h2>
              <div>
                <label className={labelClass}>Your name</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Alex Johnson" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email <span className="text-[#2d6a4f]">*</span></label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="San Francisco, CA" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Years of experience</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EXPERIENCE.map(e => (
                    <button key={e} type="button" onClick={() => set("experience", e)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.experience === e ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]" : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!form.email}
                className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3.5 hover:bg-[#235a40] transition-all disabled:opacity-40 mt-2">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <h2 className="font-semibold text-[#0f1a14] mb-1">What are you looking for?</h2>

              <div>
                <label className={labelClass}>Job function (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {JOB_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => toggleArr("job_types", t)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.job_types.includes(t) ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]" : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Sectors of interest (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SECTORS.map(s => (
                    <button key={s} type="button" onClick={() => toggleArr("sectors", s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${form.sectors.includes(s) ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]" : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"}`}>
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#f8f9fb] border border-[#e2e6ed] rounded-xl p-4">
                <div>
                  <div className="text-sm font-medium text-[#0f1a14]">Open to remote roles</div>
                </div>
                <button type="button" onClick={() => set("open_to_remote", !form.open_to_remote)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.open_to_remote ? "bg-[#2d6a4f]" : "bg-[#d0d6e0]"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.open_to_remote ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 border border-[#d0d6e0] text-[#4a5568] text-sm font-medium rounded-lg px-5 py-3 hover:bg-[#f8f9fb] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-60">
                  {loading ? "Saving..." : "Browse jobs"}
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