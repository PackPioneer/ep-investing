"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, Search, Star, Briefcase, MapPin } from "lucide-react";

const SAMPLE_EXPERTS = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Project Finance & Structured Debt",
    specialties: ["project finance", "tax equity", "debt structuring"],
    availability: "Fractional, 15hrs/week",
    location: "San Francisco, CA",
    rate: "$2,500/day",
    bio: "10 years structuring clean energy project finance deals at Goldman and First Solar. Led $2B+ in transactions across solar, wind, and storage.",
  },
  {
    id: 2,
    name: "Dr. Marcus Webb",
    role: "Technical Due Diligence — Hydrogen",
    specialties: ["green hydrogen", "electrolysis", "technical DD"],
    availability: "Project-based",
    location: "Remote",
    rate: "$3,000/day",
    bio: "Former Head of R&D at Nel Hydrogen. PhD in electrochemical engineering. Advises VCs and corporates on hydrogen investment decisions.",
  },
  {
    id: 3,
    name: "Priya Nair",
    role: "Climate Policy & Regulatory Strategy",
    specialties: ["policy", "regulatory", "IRA", "permitting"],
    availability: "Advisory, 10hrs/month",
    location: "Washington, DC",
    rate: "$2,000/day",
    bio: "Former DOE policy director. Expert in IRA incentives, federal permitting reform, and clean energy regulatory strategy.",
  },
  {
    id: 4,
    name: "James Okafor",
    role: "Climate VC — Deal Flow & Sourcing",
    specialties: ["venture capital", "deal sourcing", "due diligence"],
    availability: "Fractional, 20hrs/week",
    location: "New York, NY",
    rate: "$2,200/day",
    bio: "Previously Principal at Breakthrough Energy Ventures. Sourced and evaluated 200+ climate deals across hardware and software.",
  },
  {
    id: 5,
    name: "Elena Voss",
    role: "Nuclear Commercialization Strategy",
    specialties: ["nuclear", "SMR", "commercialization", "regulatory"],
    availability: "Project-based",
    location: "Remote",
    rate: "$2,800/day",
    bio: "Spent 12 years at TerraPower and NuScale on commercialization strategy, investor relations, and NRC licensing.",
  },
  {
    id: 6,
    name: "Tom Ridley",
    role: "Carbon Markets & MRV",
    specialties: ["carbon credits", "MRV", "Verra", "Gold Standard"],
    availability: "Fractional, 10hrs/week",
    location: "London, UK",
    rate: "$1,800/day",
    bio: "Built carbon MRV systems for three of the top 10 carbon project developers globally. Expert in Verra VCS and Gold Standard.",
  },
];

const SPECIALTIES = ["All", "project finance", "hydrogen", "policy", "venture capital", "nuclear", "carbon credits"];

function ExpertCard({ expert, onHire }) {
  return (
    <div className="bg-[#111518] border border-[#1e2428] rounded-xl p-6 flex flex-col gap-4 hover:border-[#c8f560] transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#1e2428] flex items-center justify-center text-base font-bold text-[#c8f560] flex-shrink-0">
          {expert.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#e8ede8] text-sm group-hover:text-[#c8f560] transition-colors">{expert.name}</h3>
          <p className="text-xs text-[#6b7a72] mt-0.5">{expert.role}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-mono text-[#c8f560]">{expert.rate}</div>
          <div className="text-[10px] text-[#4a5550] font-mono mt-0.5">{expert.availability}</div>
        </div>
      </div>

      <p className="text-xs text-[#6b7a72] leading-relaxed line-clamp-2 font-light">{expert.bio}</p>

      <div className="flex flex-wrap gap-1.5">
        {expert.specialties.map(s => (
          <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#1e2e24] bg-[#151d18] text-[#6b7a72]">{s}</span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1e2428]">
        <span className="flex items-center gap-1 text-[10px] text-[#4a5550] font-mono">
          <MapPin size={9} /> {expert.location}
        </span>
        <button onClick={() => onHire(expert)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#0a0d0f] bg-[#c8f560] px-3 py-1.5 rounded-lg hover:bg-[#d4ff6b] transition-all">
          Hire <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}

function HireForm({ expert, onDone, onBack }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", scope: "", timeline: "", budget: "" });
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expert_id: expert.id, expert_name: expert.name }),
      });
      onDone();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={onBack} className="text-sm text-[#6b7a72] hover:text-[#e8ede8] transition-colors mb-8 flex items-center gap-1">
        ← Back to experts
      </button>

      <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-7 pb-6 border-b border-[#1e2428]">
          <div className="w-11 h-11 rounded-xl bg-[#1e2428] flex items-center justify-center text-base font-bold text-[#c8f560]">
            {expert.name[0]}
          </div>
          <div>
            <h2 className="font-semibold text-[#e8ede8] text-sm">{expert.name}</h2>
            <p className="text-xs text-[#6b7a72]">{expert.role}</p>
          </div>
          <span className="ml-auto text-xs font-mono text-[#c8f560]">{expert.rate}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {[
            { name: "name", label: "Your name", placeholder: "Otto Gunderson", required: true },
            { name: "email", label: "Your email", placeholder: "otto@fund.com", required: true, type: "email" },
            { name: "company", label: "Company / fund", placeholder: "e.g. Breakthrough Energy", required: false },
          ].map(field => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">
                {field.label} {field.required && <span className="text-[#c8f560]">*</span>}
              </label>
              <input name={field.name} type={field.type || "text"} value={form[field.name]}
                onChange={handleChange} placeholder={field.placeholder} required={field.required}
                className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors" />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">Timeline</label>
              <input name="timeline" value={form.timeline} onChange={handleChange} placeholder="e.g. ASAP, Q2 2026"
                className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">Budget</label>
              <input name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. $10k project"
                className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">Project scope <span className="text-[#c8f560]">*</span></label>
            <textarea name="scope" value={form.scope} onChange={handleChange} required rows={4}
              placeholder={`What do you need ${expert.name.split(" ")[0]} to help with? What's the deliverable?`}
              className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg py-3.5 hover:bg-[#d4ff6b] transition-all disabled:opacity-60 mt-2">
            {loading ? "Sending…" : `Request intro to ${expert.name.split(" ")[0]}`}
            {!loading && <ArrowRight size={14} />}
          </button>
          <p className="text-xs text-[#4a5550] font-mono text-center">We'll connect you within 1 business day</p>
        </form>
      </div>
    </div>
  );
}

export default function ExpertsPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [done, setDone] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: "", email: "", specialties: "", bio: "", rate: "", availability: "" });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyDone, setApplyDone] = useState(false);

  const filtered = SAMPLE_EXPERTS.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty = specialty === "All" || e.specialties.includes(specialty);
    return matchSearch && matchSpecialty;
  });

  const handleApplyChange = e => setApplyForm({ ...applyForm, [e.target.name]: e.target.value });
  const handleApplySubmit = async e => {
    e.preventDefault();
    setApplyLoading(true);
    try {
      await fetch("/api/experts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applyForm),
      });
      setApplyDone(true);
    } catch (err) { console.error(err); }
    finally { setApplyLoading(false); }
  };

  if (done) return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(200,245,96,0.1)] border border-[#1e2e24] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#c8f560]" />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8] mb-3">Request sent</h2>
        <p className="text-[#6b7a72] text-sm leading-relaxed mb-8">We'll introduce you to {selectedExpert?.name} within 1 business day.</p>
        <button onClick={() => { setDone(false); setSelectedExpert(null); }}
          className="inline-flex items-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#d4ff6b] transition-all">
          Browse more experts <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0d0f] text-[#e8ede8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-16">

        {selectedExpert ? (
          <HireForm expert={selectedExpert} onDone={() => setDone(true)} onBack={() => setSelectedExpert(null)} />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 text-[#c8f560] text-xs font-mono tracking-widest uppercase border border-[#1e2e24] bg-[#151d18] rounded-full px-3 py-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8f560]" />
                  Experts for Hire
                </div>
                <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#e8ede8]">Hire a specialist</h1>
                <p className="text-[#6b7a72] text-sm mt-2 font-light max-w-lg">Vetted climate and energy experts available for consulting, advisory, and fractional roles.</p>
              </div>
              <button onClick={() => setShowApplyForm(!showApplyForm)}
                className="flex-shrink-0 flex items-center gap-2 border border-[#252c32] text-[#e8ede8] text-sm rounded-lg px-5 py-2.5 hover:border-[#c8f560] hover:text-[#c8f560] transition-all">
                {showApplyForm ? "← Browse experts" : <>Join as expert <ArrowRight size={13} /></>}
              </button>
            </div>

            {showApplyForm ? (
              applyDone ? (
                <div className="max-w-md mx-auto text-center py-20">
                  <CheckCircle size={40} className="text-[#c8f560] mx-auto mb-4" />
                  <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#e8ede8] mb-3">Application received</h2>
                  <p className="text-[#6b7a72] text-sm mb-6">We review expert applications weekly and will be in touch.</p>
                  <button onClick={() => { setShowApplyForm(false); setApplyDone(false); }}
                    className="inline-flex items-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#d4ff6b] transition-all">
                    Back to directory
                  </button>
                </div>
              ) : (
                <div className="max-w-xl mx-auto">
                  <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-7 pb-6 border-b border-[#1e2428]">
                      <Briefcase size={18} className="text-[#c8f560]" />
                      <h2 className="font-semibold text-[#e8ede8]">Apply to join as an expert</h2>
                    </div>
                    <form onSubmit={handleApplySubmit} className="flex flex-col gap-5">
                      {[
                        { name: "name", label: "Your name", placeholder: "Otto Gunderson", required: true },
                        { name: "email", label: "Email", placeholder: "otto@consulting.com", required: true, type: "email" },
                        { name: "specialties", label: "Areas of expertise", placeholder: "e.g. project finance, nuclear, carbon markets", required: true },
                        { name: "rate", label: "Day rate", placeholder: "e.g. $2,000–$3,000/day", required: false },
                        { name: "availability", label: "Availability", placeholder: "e.g. 10hrs/week, project-based", required: false },
                      ].map(field => (
                        <div key={field.name} className="flex flex-col gap-1.5">
                          <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">
                            {field.label} {field.required && <span className="text-[#c8f560]">*</span>}
                          </label>
                          <input name={field.name} type={field.type || "text"} value={applyForm[field.name]}
                            onChange={handleApplyChange} placeholder={field.placeholder} required={field.required}
                            className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors" />
                        </div>
                      ))}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-[#6b7a72] tracking-wider uppercase">Bio <span className="text-[#c8f560]">*</span></label>
                        <textarea name="bio" value={applyForm.bio} onChange={handleApplyChange} required rows={4}
                          placeholder="Your background, past roles, key achievements…"
                          className="bg-[#0a0d0f] border border-[#252c32] rounded-lg px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none focus:border-[#c8f560] transition-colors resize-none" />
                      </div>
                      <button type="submit" disabled={applyLoading}
                        className="w-full flex items-center justify-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg py-3.5 hover:bg-[#d4ff6b] transition-all disabled:opacity-60">
                        {applyLoading ? "Submitting…" : "Submit application"}
                        {!applyLoading && <ArrowRight size={14} />}
                      </button>
                    </form>
                  </div>
                </div>
              )
            ) : (
              <>
                {/* Search + filter */}
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <div className="flex items-center gap-3 flex-1 bg-[#111518] border border-[#252c32] rounded-xl px-4 py-3 focus-within:border-[#c8f560] transition-all">
                    <Search size={14} className="text-[#4a5550]" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search by name, role, or specialty…"
                      className="flex-1 bg-transparent text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {SPECIALTIES.map(s => (
                      <button key={s} onClick={() => setSpecialty(s)}
                        className={`text-xs font-mono px-3 py-2 rounded-lg border transition-all ${
                          specialty === s
                            ? "border-[#c8f560] bg-[rgba(200,245,96,0.1)] text-[#c8f560]"
                            : "border-[#1e2428] bg-[#111518] text-[#6b7a72] hover:border-[#c8f560] hover:text-[#c8f560]"
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map(expert => <ExpertCard key={expert.id} expert={expert} onHire={setSelectedExpert} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
