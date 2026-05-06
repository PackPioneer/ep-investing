"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle, Mail } from "lucide-react";
import posthog from "posthog-js";

const INVESTOR_TYPES = [
  { value: "venture_capital", label: "Venture Capital", description: "Institutional fund, GPs deploying LP capital" },
  { value: "angel", label: "Angel Investor", description: "Individual, early-stage" },
  { value: "family_office", label: "Family Office", description: "Single or multi-family" },
  { value: "foundation", label: "Philanthropic / Foundation", description: "Mission-aligned patient capital" },
  { value: "corporate_venture", label: "Corporate Venture (CVC)", description: "Strategic + financial" },
  { value: "debt_finance", label: "Debt / Project Finance", description: "Infrastructure, green bonds" },
  { value: "government", label: "Government / Sovereign", description: "DOE, EU, non-dilutive" },
  { value: "individual", label: "Individual / Retail", description: "Sophisticated individual" },
  { value: "hedge_fund", label: "Hedge Fund / Public Equity", description: "Later-stage / public" },
  { value: "accelerator", label: "Accelerator / Incubator", description: "Program + small check" },
  { value: "other", label: "Other", description: "Doesn't fit the above" },
];

const SECTOR_CATEGORIES = [
  {
    id: "energy_generation",
    label: "Energy Generation",
    sectors: ["Solar", "Wind Energy", "Nuclear Technologies", "Geothermal", "Hydropower", "Bioenergy"],
  },
  {
    id: "storage_grid",
    label: "Storage & Grid",
    sectors: ["Battery Storage", "Long-Duration Storage", "Grid Software", "Smart Grid Infrastructure", "Energy Management"],
  },
  {
    id: "transportation",
    label: "Transportation",
    sectors: ["EV Charging", "Electric Aviation", "SAF / E-Fuels", "Maritime Decarbonization", "Heavy-Duty Electrification"],
  },
  {
    id: "carbon_climate",
    label: "Carbon & Climate Solutions",
    sectors: ["Direct Air Capture", "Carbon Capture (Point Source)", "Carbon Credits", "Carbon Markets", "Nature-Based Solutions"],
  },
  {
    id: "industry_materials",
    label: "Industry & Materials",
    sectors: ["Green Hydrogen", "Industrial Decarbonization", "Sustainable Materials", "Circular Economy", "Cement & Steel", "Mining & Critical Minerals"],
  },
  {
    id: "agri_built",
    label: "Agriculture & Built Environment",
    sectors: ["AgTech / Sustainable Agriculture", "Alternative Proteins", "Building Efficiency", "Climate Adaptation & Resilience", "Clean Cooking", "Water Tech"],
  },
];

const STAGES = ["Pre-seed", "Seed", "Series A", "Series B+"];
const INSTRUMENTS = ["Equity", "SAFE / Note", "Debt", "Grants", "Convertible"];
const CHECK_SIZES = ["$0–10K", "$10K–50K", "$50K–100K", "$100K–500K", "$500K–1M", "$1M–5M", "$5M+"];

export default function InvestorOnboardingPage() {
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", firm: "",
    investor_type: "", investor_type_other: "",
    sectors: [], sub_sectors: [],
    stages: [],
    investment_instruments: [],
    check_sizes: [],
    geographies: [],
    accredited_investor: "",
    thesis: "",
    show_contact: true,
    primary_contact_name: "", primary_contact_email: "",
    secondary_contact_name: "", secondary_contact_email: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggle = (k, value) => {
    setForm(f => ({
      ...f,
      [k]: f[k].includes(value) ? f[k].filter(v => v !== value) : [...f[k], value],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/onboarding/investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, terms_agreed_at: new Date().toISOString() }),
      });
      posthog.identify(form.email, { email: form.email, name: form.name, firm: form.firm });
      posthog.capture("investor_onboarding_submitted", {
        email: form.email, firm: form.firm, investor_type: form.investor_type,
        sectors: form.sectors, stages: form.stages,
      });
      setDone(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#2d6a4f]" />
        </div>
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">You're in</h1>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-6">
          Thanks for joining as an investor. We'll review your profile and start matching you to relevant deal flow within 1–2 business days.
        </p>
        <p className="text-xs text-[#718096]">
          Confirmation sent to <strong>{form.email}</strong>.
        </p>
      </div>
    </div>
  );

  // Sub-sectors visible based on chosen categories
  const visibleSubSectors = SECTOR_CATEGORIES
    .filter(c => form.sectors.includes(c.id))
    .flatMap(c => c.sectors.map(s => ({ category: c.label, sector: s })));

  return (
    <div className="min-h-screen bg-[#f2f4f8] py-12 px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-xl mx-auto">

        <div className="mb-6 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-[#2d6a4f] mb-2">Step {step} of 4</div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
            {step === 1 && "Tell us about you"}
            {step === 2 && "Your investment focus"}
            {step === 3 && "Geography & verification"}
            {step === 4 && "Review & submit"}
          </h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#e2e6ed] rounded-2xl p-7">

          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Your name *</label>
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Email *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              </div>

              <div className="pt-3 border-t border-[#e2e6ed]">
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2.5 block">What kind of investor are you? *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INVESTOR_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => set("investor_type", t.value)}
                      className={`text-left rounded-lg p-3 border transition-all ${
                        form.investor_type === t.value
                          ? "bg-[#eef1f6] border-[#2d6a4f]"
                          : "bg-white border-[#d0d6e0] hover:border-[#2d6a4f]"
                      }`}>
                      <div className="text-sm font-medium text-[#0f1a14]">{t.label}</div>
                      <div className="text-[11px] text-[#718096] leading-tight mt-0.5">{t.description}</div>
                    </button>
                  ))}
                </div>
                {form.investor_type === "other" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="e.g. impact fund, syndicate"
                      value={form.investor_type_other}
                      onChange={e => set("investor_type_other", e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Firm name (optional for individuals)</label>
                <input value={form.firm} onChange={e => set("firm", e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              </div>

              <button onClick={() => setStep(2)} disabled={!form.name || !form.email || !form.investor_type || (form.investor_type === "other" && !form.investor_type_other)}
                className="bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                Continue <ArrowRight size={14} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">

              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2.5 block">Climate sector categories * (pick all that apply)</label>
                <div className="grid grid-cols-1 gap-2">
                  {SECTOR_CATEGORIES.map(cat => (
                    <button key={cat.id} type="button" onClick={() => toggle("sectors", cat.id)}
                      className={`text-left rounded-lg p-3 border transition-all ${
                        form.sectors.includes(cat.id)
                          ? "bg-[#eef1f6] border-[#2d6a4f]"
                          : "bg-white border-[#d0d6e0] hover:border-[#2d6a4f]"
                      }`}>
                      <div className="text-sm font-medium text-[#0f1a14]">{cat.label}</div>
                      <div className="text-[11px] text-[#718096] mt-0.5">{cat.sectors.slice(0, 3).join(" · ")}{cat.sectors.length > 3 ? " · ..." : ""}</div>
                    </button>
                  ))}
                </div>
              </div>

              {visibleSubSectors.length > 0 && (
                <div className="pt-3 border-t border-[#e2e6ed]">
                  <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2.5 block">Specific sub-sectors (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {visibleSubSectors.map(({ sector }) => (
                      <button key={sector} type="button" onClick={() => toggle("sub_sectors", sector)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          form.sub_sectors.includes(sector)
                            ? "bg-[#eef1f6] border-[#2d6a4f] text-[#2d6a4f] font-medium"
                            : "bg-white border-[#d0d6e0] text-[#4a5568] hover:border-[#2d6a4f]"
                        }`}>
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#e2e6ed]">
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2.5 block">Investment stages</label>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(s => (
                    <button key={s} type="button" onClick={() => toggle("stages", s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        form.stages.includes(s)
                          ? "bg-[#eef1f6] border-[#2d6a4f] text-[#2d6a4f] font-medium"
                          : "bg-white border-[#d0d6e0] text-[#4a5568] hover:border-[#2d6a4f]"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e2e6ed]">
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2.5 block">Investment instruments</label>
                <div className="flex flex-wrap gap-2">
                  {INSTRUMENTS.map(i => (
                    <button key={i} type="button" onClick={() => toggle("investment_instruments", i)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        form.investment_instruments.includes(i)
                          ? "bg-[#eef1f6] border-[#2d6a4f] text-[#2d6a4f] font-medium"
                          : "bg-white border-[#d0d6e0] text-[#4a5568] hover:border-[#2d6a4f]"
                      }`}>
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#e2e6ed]">
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2.5 block">Check size range</label>
                <div className="flex flex-wrap gap-2">
                  {CHECK_SIZES.map(c => (
                    <button key={c} type="button" onClick={() => toggle("check_sizes", c)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        form.check_sizes.includes(c)
                          ? "bg-[#eef1f6] border-[#2d6a4f] text-[#2d6a4f] font-medium"
                          : "bg-white border-[#d0d6e0] text-[#4a5568] hover:border-[#2d6a4f]"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 border border-[#d0d6e0] text-[#4a5568] text-sm font-medium rounded-lg px-5 py-3 hover:bg-[#f8f9fb] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => setStep(3)} disabled={form.sectors.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Geographic focus (optional)</label>
                <input placeholder="e.g. North America, Europe, global" value={form.geographies.join(", ")}
                  onChange={e => set("geographies", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              </div>

              <div className="pt-3 border-t border-[#e2e6ed]">
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2.5 block">Are you an accredited investor?</label>
                <div className="flex gap-2">
                  {[{ v: "yes", l: "Yes" }, { v: "no", l: "No" }, { v: "prefer_not_to_say", l: "Prefer not to say" }].map(opt => (
                    <button key={opt.v} type="button" onClick={() => set("accredited_investor", opt.v)}
                      className={`text-sm px-4 py-2 rounded-lg border transition-all ${
                        form.accredited_investor === opt.v
                          ? "bg-[#eef1f6] border-[#2d6a4f] text-[#2d6a4f] font-medium"
                          : "bg-white border-[#d0d6e0] text-[#4a5568] hover:border-[#2d6a4f]"
                      }`}>
                      {opt.l}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#718096] mt-2 leading-relaxed">Affects what investment opportunities you can see (e.g., Reg D offerings).</p>
              </div>

              <div className="pt-3 border-t border-[#e2e6ed]">
                <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Investment thesis (optional)</label>
                <textarea rows={3} placeholder="What's your investment thesis or focus?" value={form.thesis}
                  onChange={e => set("thesis", e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none" />
              </div>

              <div className="pt-3 border-t border-[#e2e6ed]">
                <label className="flex items-center gap-2 text-sm text-[#0f1a14] mb-3 cursor-pointer">
                  <input type="checkbox" checked={form.show_contact}
                    onChange={e => set("show_contact", e.target.checked)}
                    className="w-4 h-4 accent-[#2d6a4f]" />
                  Let companies contact me directly
                </label>
                {form.show_contact && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <input placeholder="Primary contact name" value={form.primary_contact_name}
                      onChange={e => set("primary_contact_name", e.target.value)}
                      className="text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    <input type="email" placeholder="Primary contact email" value={form.primary_contact_email}
                      onChange={e => set("primary_contact_email", e.target.value)}
                      className="text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    <input placeholder="Secondary contact name (optional)" value={form.secondary_contact_name}
                      onChange={e => set("secondary_contact_name", e.target.value)}
                      className="text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                    <input type="email" placeholder="Secondary contact email (optional)" value={form.secondary_contact_email}
                      onChange={e => set("secondary_contact_email", e.target.value)}
                      className="text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 border border-[#d0d6e0] text-[#4a5568] text-sm font-medium rounded-lg px-5 py-3 hover:bg-[#f8f9fb] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={() => setStep(4)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div className="bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg p-4">
                <div className="text-xs font-mono uppercase tracking-wide text-[#718096] mb-2">Your profile</div>
                <div className="text-sm font-semibold text-[#0f1a14] mb-1">{form.name}</div>
                <div className="text-xs text-[#4a5568] mb-2">{form.email} · {form.firm || "Individual"}</div>
                <div className="text-xs text-[#4a5568] mb-2">
                  <span className="font-medium">Type:</span> {INVESTOR_TYPES.find(t => t.value === form.investor_type)?.label || "—"}
                </div>
                {form.sectors.length > 0 && (
                  <div className="text-xs text-[#4a5568] mb-2">
                    <span className="font-medium">Sectors:</span> {form.sectors.map(s => SECTOR_CATEGORIES.find(c => c.id === s)?.label).join(", ")}
                  </div>
                )}
                {form.stages.length > 0 && (
                  <div className="text-xs text-[#4a5568] mb-2">
                    <span className="font-medium">Stages:</span> {form.stages.join(", ")}
                  </div>
                )}
                {form.check_sizes.length > 0 && (
                  <div className="text-xs text-[#4a5568]">
                    <span className="font-medium">Check size:</span> {form.check_sizes.join(", ")}
                  </div>
                )}
              </div>

              <p className="text-xs text-[#718096] leading-relaxed">
                By submitting you'll receive a confirmation at <strong>{form.email}</strong>. We'll start matching you to relevant deal flow right away.
              </p>

              <label className="flex items-start gap-2.5 mt-2 mb-2 text-xs text-[#4a5568] leading-relaxed">
                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#2d6a4f] flex-shrink-0" />
                <span>I agree to the <a href="/terms-and-conditions" target="_blank" className="text-[#2d6a4f] underline">Terms of Service</a> and <a href="/privacy-policy" target="_blank" className="text-[#2d6a4f] underline">Privacy Policy</a>.</span>
              </label>

              <div className="flex gap-3 mt-2">
                <button onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 border border-[#d0d6e0] text-[#4a5568] text-sm font-medium rounded-lg px-5 py-3 hover:bg-[#f8f9fb] transition-all">
                  <ArrowLeft size={13} /> Back
                </button>
                <button onClick={handleSubmit} disabled={loading || !agreedToTerms}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-60">
                  {loading ? "Submitting…" : "Submit"}
                  {!loading && <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          )}

        </motion.div>

      </div>
    </div>
  );
}
