"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Zap, Users, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";

const PATHS = [
  {
    id: "investor",
    icon: TrendingUp,
    title: "I'm an Investor",
    desc: "Find deal flow matched to your thesis — climate companies by stage, technology, and traction.",
    color: "text-[#c8f560]",
    fields: [
      { name: "name", label: "Your name", placeholder: "Otto Gunderson", required: true },
      { name: "email", label: "Email", placeholder: "otto@fund.com", required: true, type: "email" },
      { name: "firm", label: "Fund / firm name", placeholder: "Breakthrough Energy Ventures", required: false },
      { name: "focus", label: "Investment focus areas", placeholder: "e.g. nuclear, green hydrogen, battery storage", required: true },
      { name: "stage", label: "Preferred stage", placeholder: "e.g. Seed, Series A, Growth", required: false },
      { name: "check_size", label: "Typical check size", placeholder: "e.g. $250k–$2M", required: false },
    ],
    textarea: { name: "notes", label: "Anything else we should know?", placeholder: "Geography focus, co-investment interest, timeline…" },
  },
  {
    id: "founder",
    icon: Zap,
    title: "I'm a Founder",
    desc: "Get matched to investors and grants aligned to your stage, technology, and capital needs.",
    color: "text-[#7dd3fc]",
    fields: [
      { name: "name", label: "Your name", placeholder: "Otto Gunderson", required: true },
      { name: "email", label: "Email", placeholder: "otto@company.com", required: true, type: "email" },
      { name: "company", label: "Company name", placeholder: "Verdagy", required: true },
      { name: "website", label: "Website", placeholder: "https://verdagy.com", required: false },
      { name: "technology", label: "Core technology / sector", placeholder: "e.g. green hydrogen electrolysis", required: true },
      { name: "stage", label: "Current stage", placeholder: "e.g. Pre-seed, Seed, Series A", required: true },
      { name: "raise", label: "Target raise amount", placeholder: "e.g. $2M", required: false },
    ],
    textarea: { name: "notes", label: "Tell us about your company", placeholder: "What problem are you solving? What traction do you have?" },
  },
  {
    id: "expert",
    icon: Users,
    title: "I'm an Expert",
    desc: "Join the EP Investing experts directory — get hired for consulting, advisory, and fractional roles.",
    color: "text-[#c4b5fd]",
    fields: [
      { name: "name", label: "Your name", placeholder: "Otto Gunderson", required: true },
      { name: "email", label: "Email", placeholder: "otto@consulting.com", required: true, type: "email" },
      { name: "linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/otto", required: false },
      { name: "specialties", label: "Areas of expertise", placeholder: "e.g. project finance, policy, technical due diligence", required: true },
      { name: "availability", label: "Availability", placeholder: "e.g. 10hrs/week, fractional, full-time advisory", required: false },
      { name: "rate", label: "Day rate range", placeholder: "e.g. $1,500–$3,000/day", required: false },
    ],
    textarea: { name: "bio", label: "Brief bio", placeholder: "Your background, past roles, key achievements in climate/energy…" },
  },
];

export default function GetMatchedPage() {
  const [selectedPath, setSelectedPath] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({});

  const path = PATHS.find(p => p.id === selectedPath);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/get-matched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, path: selectedPath }),
      });
      setDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(200,245,96,0.1)] border border-[#1e2e24] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#c8f560]" />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8] mb-3">Request received</h2>
        <p className="text-[#6b7a72] text-sm leading-relaxed mb-8">
          Thanks — we'll review your submission and follow up at {form.email} within 2–3 business days with your matched results.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#d4ff6b] transition-all">
          Back to home <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0d0f] text-[#e8ede8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-[#c8f560] text-xs font-mono tracking-widest uppercase border border-[#1e2e24] bg-[#151d18] rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8f560]" />
            Matching Service
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-5xl text-[#e8ede8] mb-4">
            Get matched
          </h1>
          <p className="text-[#6b7a72] text-base max-w-md mx-auto leading-relaxed font-light">
            Tell us who you are and what you're looking for — we'll match you manually from our curated database.
          </p>
        </div>

        {/* Step 1 — Path selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PATHS.map((p) => (
              <button key={p.id} onClick={() => { setSelectedPath(p.id); setStep(2); setForm({}); }}
                className="text-left bg-[#111518] border border-[#1e2428] rounded-2xl p-7 flex flex-col gap-4 hover:border-[#c8f560] hover:bg-[#171c20] transition-all group">
                <p.icon size={24} className={p.color} />
                <div>
                  <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#e8ede8] mb-2">{p.title}</h3>
                  <p className="text-sm text-[#6b7a72] leading-relaxed font-light">{p.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#c8f560] font-mono mt-auto pt-2 group-hover:gap-2 transition-all">
                  Get started <ArrowRight size={11} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Form */}
        {step === 2 && path && (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setStep(1)} className="text-sm text-[#6b7a72] hover:text-[#e8ede8] transition-colors mb-8 flex items-center gap-1">
              <ArrowLeft size={13} /> Back
            </button>

            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-7 pb-6 border-b border-[#1e2428]">
                <path.icon size={18} className={path.color} />
                <h2 className="font-semibold text-[#e8ede8]">{path.title}</h2>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {path.fields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">
                      {field.label} {field.required && <span className="text-[#c8f560]">*</span>}
                    </label>
                    <input
                      name={field.name}
                      type={field.type || "text"}
                      value={form[field.name] || ""}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors"
                    />
                  </div>
                ))}

                {path.textarea && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">
                      {path.textarea.label}
                    </label>
                    <textarea
                      name={path.textarea.name}
                      value={form[path.textarea.name] || ""}
                      onChange={handleChange}
                      placeholder={path.textarea.placeholder}
                      rows={4}
                      className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors resize-none"
                    />
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg py-3.5 hover:bg-[#d4ff6b] transition-all disabled:opacity-60 mt-2">
                  {loading ? "Submitting…" : "Submit match request"}
                  {!loading && <ArrowRight size={14} />}
                </button>
                <p className="text-xs text-[#4a5550] font-mono text-center">We review manually and respond within 2–3 business days</p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
