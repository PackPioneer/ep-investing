"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";

const EXPERTISE_OPTIONS = [
  // Technical / Engineering
  "Solar & Wind", "Battery Storage", "Green Hydrogen", "Nuclear",
  "Carbon Markets", "Energy Efficiency", "EV & Mobility", "SAF / Efuels",
  "Electric Aviation", "Project Development", "Engineering",
  // Finance & Strategy
  "Climate Finance", "M&A / Due Diligence", "Project Finance",
  "Policy & Regulation", "ESG & Sustainability", "Operations",
  // Business & Growth
  "Marketing & Communications", "Brand & Design", "Web Development",
  "AI & Data Science", "Product Management", "Sales & BD",
  // Advisory
  "Executive Coaching", "Fundraising Advisory", "Legal & Compliance", "Other"
];

const AVAILABILITY_OPTIONS = [
  "Available now", "Available in 1 month", "Limited availability", "Advisory only"
];

export default function ExpertOnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", bio: "", expertise_areas: [],
    hourly_rate: "", availability: "", linkedin_url: "", website_url: "", location: ""
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleExpertise = (area) => {
    setForm(p => ({
      ...p,
      expertise_areas: p.expertise_areas.includes(area)
        ? p.expertise_areas.filter(a => a !== area)
        : [...p.expertise_areas, area]
    }));
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/experts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full text-sm px-4 py-3 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] transition-colors";
  const labelClass = "text-xs font-mono text-[#4a5568] tracking-wider uppercase mb-1.5 block";

  if (done) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.08)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#2d6a4f]" />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">Application received</h2>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-8">
          Thanks for applying to the EP Investing expert network. We'll review your application and reach out before our April 15 launch.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" /> Expert Network
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#0f1a14] mb-3">Join as an expert</h1>
          <p className="text-[#4a5568] text-sm leading-relaxed">
            Get hired for consulting, advisory, and fractional roles across the energy transition.
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${step >= s ? "bg-[#2d6a4f]" : "bg-[#e2e6ed]"}`} />
          ))}
        </div>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold text-[#0f1a14] mb-2">Basic information</h2>
              <div>
                <label className={labelClass}>Full name *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@example.com" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="San Francisco, CA" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Bio</label>
                <textarea rows={4} value={form.bio} onChange={e => set("bio", e.target.value)}
                  placeholder="Tell us about your background and experience in climate / energy..."
                  className={inputClass + " resize-none"} />
              </div>
              <button onClick={() => { if (form.name && form.email) setStep(2); }}
                disabled={!form.name || !form.email}
                className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors flex items-center gap-2 w-fit">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold text-[#0f1a14] mb-2">Expertise & availability</h2>
              <div>
                <label className={labelClass}>Areas of expertise (select all that apply)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {EXPERTISE_OPTIONS.map(area => (
                    <button key={area} onClick={() => toggleExpertise(area)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.expertise_areas.includes(area) ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Availability</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <button key={opt} onClick={() => set("availability", opt)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.availability === opt ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Hourly rate (USD)</label>
                <input value={form.hourly_rate} onChange={e => set("hourly_rate", e.target.value)}
                  placeholder="e.g. $200–$350/hr" className={inputClass} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="text-sm text-[#718096] px-4 py-2 rounded-lg hover:bg-[#e2e6ed] transition-colors">Back</button>
                <button onClick={() => setStep(3)}
                  className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40] transition-colors flex items-center gap-2">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h2 className="text-lg font-semibold text-[#0f1a14] mb-2">Online presence</h2>
              <div>
                <label className={labelClass}>LinkedIn URL</label>
                <input value={form.linkedin_url} onChange={e => set("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/yourname" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Website or portfolio</label>
                <input value={form.website_url} onChange={e => set("website_url", e.target.value)}
                  placeholder="https://yoursite.com" className={inputClass} />
              </div>

              {/* Summary */}
              <div className="bg-[#f8f9fb] rounded-xl p-5 border border-[#e2e6ed]">
                <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-3">Your application</div>
                <div className="flex flex-col gap-2 text-sm text-[#0f1a14]">
                  <div><span className="text-[#718096]">Name:</span> {form.name}</div>
                  <div><span className="text-[#718096]">Email:</span> {form.email}</div>
                  {form.location && <div><span className="text-[#718096]">Location:</span> {form.location}</div>}
                  {form.expertise_areas.length > 0 && <div><span className="text-[#718096]">Expertise:</span> {form.expertise_areas.join(", ")}</div>}
                  {form.availability && <div><span className="text-[#718096]">Availability:</span> {form.availability}</div>}
                  {form.hourly_rate && <div><span className="text-[#718096]">Rate:</span> {form.hourly_rate}</div>}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="text-sm text-[#718096] px-4 py-2 rounded-lg hover:bg-[#e2e6ed] transition-colors">Back</button>
                <button onClick={submit} disabled={loading}
                  className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40] disabled:opacity-50 transition-colors flex items-center gap-2">
                  {loading ? "Submitting..." : "Submit application"} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}