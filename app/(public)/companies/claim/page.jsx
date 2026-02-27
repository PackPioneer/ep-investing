"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Building2, Briefcase, ArrowRight, Shield, Star, Zap } from "lucide-react";

const PLANS = [
  {
    id: "company_listing",
    name: "Company Listing",
    price: "$99",
    period: "/month",
    desc: "Get your company verified and discoverable by investors.",
    features: [
      "Verified badge on your profile",
      "Edit company description & logo",
      "Add funding rounds & milestones",
      "Appear in investor searches",
      "Tag-based category placement",
    ],
    cta: "Claim with Company Listing",
    accent: false,
  },
  {
    id: "company_hiring",
    name: "Company + Hiring",
    price: "$199",
    period: "/month",
    desc: "Everything in Company Listing, plus post jobs to the EP jobs board.",
    features: [
      "Everything in Company Listing",
      "Post unlimited job listings",
      "Featured placement in Jobs board",
      "Appear in Experts directory",
      "Priority in Get Matched results",
    ],
    cta: "Claim with Company + Hiring",
    accent: true,
  },
];

const TRUST = [
  { icon: Shield, label: "Verified badge on your profile" },
  { icon: Star, label: "Priority in investor discovery" },
  { icon: Zap, label: "Matched to relevant grants" },
];

export default function ClaimCompanyPage() {
  const [selectedPlan, setSelectedPlan] = useState("company_hiring");
  const [step, setStep] = useState(1); // 1 = plan, 2 = form, 3 = done
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    company_url: "",
    contact_name: "",
    contact_email: "",
    contact_role: "",
    description: "",
    plan: "company_hiring",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plan: selectedPlan }),
      });
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(200,245,96,0.1)] border border-[#1e2e24] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#c8f560]" />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8] mb-3">You're on the list</h2>
        <p className="text-[#6b7a72] text-sm leading-relaxed mb-8">
          We'll verify your company and reach out to {form.contact_email} within 1–2 business days to complete your listing.
        </p>
        <Link href="/search" className="inline-flex items-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#d4ff6b] transition-all">
          Browse companies <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0d0f] text-[#e8ede8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-[#c8f560] text-xs font-mono tracking-widest uppercase border border-[#1e2e24] bg-[#151d18] rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8f560]" />
            For Companies
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-5xl text-[#e8ede8] mb-4">
            Claim your company profile
          </h1>
          <p className="text-[#6b7a72] text-base max-w-lg mx-auto leading-relaxed font-light">
            Get verified, control your profile, and get discovered by investors and grant bodies actively deploying capital.
          </p>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap justify-center gap-6 mb-14">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-[#6b7a72]">
              <Icon size={14} className="text-[#c8f560]" />
              {label}
            </div>
          ))}
        </div>

        {step === 1 && (
          <>
            {/* Plan selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {PLANS.map((plan) => (
                <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                  className={`text-left rounded-2xl border p-8 transition-all ${
                    selectedPlan === plan.id
                      ? "border-[#c8f560] bg-[rgba(200,245,96,0.04)]"
                      : "border-[#1e2428] bg-[#111518] hover:border-[#252c32]"
                  }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#e8ede8] text-lg">{plan.name}</h3>
                        {plan.accent && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(200,245,96,0.1)] text-[#c8f560] border border-[#1e2e24]">Popular</span>
                        )}
                      </div>
                      <p className="text-sm text-[#6b7a72] font-light">{plan.desc}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <span style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#c8f560]">{plan.price}</span>
                      <span className="text-xs text-[#4a5550] font-mono">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2 mt-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[#6b7a72]">
                        <CheckCircle size={13} className="text-[#c8f560] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className={`mt-6 w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-all ${
                    selectedPlan === plan.id
                      ? "bg-[#c8f560] text-[#0a0d0f]"
                      : "bg-[#171c20] text-[#6b7a72] border border-[#252c32]"
                  }`}>
                    {selectedPlan === plan.id ? "✓ Selected" : "Select plan"}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg px-8 py-3.5 hover:bg-[#d4ff6b] transition-all">
                Continue with {PLANS.find(p => p.id === selectedPlan)?.name}
                <ArrowRight size={14} />
              </button>
              <p className="text-xs text-[#4a5550] font-mono mt-3">No payment required yet — we'll verify first</p>
            </div>
          </>
        )}

        {step === 2 && (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setStep(1)} className="text-sm text-[#6b7a72] hover:text-[#e8ede8] transition-colors mb-8 flex items-center gap-1">
              ← Back to plans
            </button>

            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-7 pb-6 border-b border-[#1e2428]">
                <Building2 size={18} className="text-[#c8f560]" />
                <h2 className="font-semibold text-[#e8ede8]">Company details</h2>
                <span className="ml-auto text-xs font-mono text-[#c8f560] px-2 py-0.5 rounded-full border border-[#1e2e24] bg-[#151d18]">
                  {PLANS.find(p => p.id === selectedPlan)?.name}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {[
                  { name: "company_name", label: "Company name", placeholder: "e.g. Verdagy", required: true },
                  { name: "company_url", label: "Company website", placeholder: "https://verdagy.com", required: true },
                  { name: "contact_name", label: "Your name", placeholder: "Otto Gunderson", required: true },
                  { name: "contact_email", label: "Your email", placeholder: "otto@company.com", required: true, type: "email" },
                  { name: "contact_role", label: "Your role", placeholder: "CEO, Founder, Marketing…", required: false },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">
                      {field.label} {field.required && <span className="text-[#c8f560]">*</span>}
                    </label>
                    <input
                      name={field.name}
                      type={field.type || "text"}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors"
                    />
                  </div>
                ))}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">
                    Brief description <span className="text-[#4a5550]">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="What does your company do? What's your core technology?"
                    rows={3}
                    className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors resize-none"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg py-3.5 hover:bg-[#d4ff6b] transition-all disabled:opacity-60 mt-2">
                  {loading ? "Submitting…" : "Submit claim request"}
                  {!loading && <ArrowRight size={14} />}
                </button>
                <p className="text-xs text-[#4a5550] font-mono text-center">We'll verify and reach out within 1–2 business days</p>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
