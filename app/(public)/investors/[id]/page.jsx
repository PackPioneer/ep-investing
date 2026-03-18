"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Globe, MapPin, TrendingUp, Users, DollarSign,
  Target, Briefcase, ChevronRight, Mail, Building2, Zap, CheckCircle
} from "lucide-react";

const GEO_LABELS = {
  us: "🇺🇸 US", europe: "🇪🇺 Europe", asia: "🌏 Asia",
  africa: "🌍 Africa", latam: "🌎 LatAm", mena: "🌍 MENA",
  global: "🌐 Global", oceania: "🌏 Oceania",
};

const STAGE_COLORS = {
  "pre-seed": "bg-slate-100 text-slate-600",
  "seed": "bg-blue-100 text-blue-700",
  "series a": "bg-violet-100 text-violet-700",
  "series b": "bg-purple-100 text-purple-700",
  "series c": "bg-fuchsia-100 text-fuchsia-700",
  "growth": "bg-emerald-100 text-emerald-700",
  "late stage": "bg-amber-100 text-amber-700",
};

function IntroForm({ investor }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await fetch("/api/intro-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_id: investor.id,
          investor_name: investor.name,
          email,
          message,
        }),
      });
      setStatus("done");
    } catch {
      setStatus("done");
    }
  };

  if (status === "done") return (
    <div className="flex items-center gap-2 text-sm text-[#2d6a4f] font-medium py-2">
      <CheckCircle size={15} /> Request sent — we'll be in touch shortly.
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email" value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Your email" required
        className="w-full px-3 py-2.5 rounded-lg border border-[#d0d6e0] text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors"
      />
      <textarea
        value={message} onChange={e => setMessage(e.target.value)}
        placeholder="Brief intro — company name, stage, what you're raising…"
        rows={3}
        className="w-full px-3 py-2.5 rounded-lg border border-[#d0d6e0] text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors resize-none"
      />
      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-colors disabled:opacity-50"
      >
        <Mail size={13} /> Request introduction
      </button>
    </form>
  );
}

export default function InvestorProfilePage() {
  const { id } = useParams();
  const [investor, setInvestor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/investors/${id}`)
      .then(r => r.json())
      .then(data => { setInvestor(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!investor) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center text-[#4a5568]">
      Investor not found.
    </div>
  );

  const website = investor.url || investor.website;
  const focusAreas = investor.climate_focus_areas || [];
  const stages = investor.investment_stages || [];
  const geographies = investor.geographies || [];
  const decisionMakers = investor.decision_makers || [];

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">

        <Link href="/investors" className="inline-flex items-center gap-2 text-sm text-[#4a5568] hover:text-[#0f1a14] transition-colors mb-8">
          <ArrowLeft size={14} /> Back to investors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* HERO CARD */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
              <div className="flex items-start gap-5 mb-6">
                {investor.logo_url ? (
                  <>
                    <img src={investor.logo_url} alt={investor.name}
                      className="w-16 h-16 rounded-xl object-contain bg-white p-2 border border-[#e2e6ed] flex-shrink-0"
                      onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                    <div style={{ display: "none" }} className="w-16 h-16 rounded-xl bg-[#eef1f6] items-center justify-center text-2xl font-bold text-[#2d6a4f] flex-shrink-0">
                      {(investor.name || "?")[0].toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#eef1f6] flex items-center justify-center text-2xl font-bold text-[#2d6a4f] flex-shrink-0">
                    {(investor.name || "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] leading-tight mb-1">
                    {investor.name}
                  </h1>
                  {investor.type && (
                    <span className="text-xs font-mono text-[#718096] capitalize">
                      {investor.type.replace(/_/g, " ")}
                    </span>
                  )}
                  {website && (
                    <a href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#4a5568] hover:text-[#2d6a4f] transition-colors mt-1 ml-3">
                      <Globe size={12} /> {website.replace(/https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Focus area tags */}
              {focusAreas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {focusAreas.map((area, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-mono border border-[#c8d8cc] bg-[rgba(45,106,79,0.06)] text-[#2d6a4f]">
                      {area}
                    </span>
                  ))}
                </div>
              )}

              {investor.description && (
                <p className="text-[#4a5568] leading-relaxed text-sm font-light">
                  {investor.description}
                </p>
              )}
            </div>

            {/* INVESTMENT THESIS */}
            {investor.thesis && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Investment Thesis</h2>
                </div>
                <p className="text-sm text-[#4a5568] leading-relaxed">{investor.thesis}</p>
              </div>
            )}

            {/* INVESTMENT STAGES */}
            {stages.length > 0 && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Investment Stages</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stages.map((stage, i) => (
                    <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                      STAGE_COLORS[stage.toLowerCase()] || "bg-slate-100 text-slate-600"
                    }`}>
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DECISION MAKERS */}
            {decisionMakers.length > 0 && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Key People</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {decisionMakers.map((person, i) => (
                    <span key={i} className="px-3 py-2 rounded-lg text-sm bg-[#f8f9fb] border border-[#d0d6e0] text-[#4a5568]">
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PORTFOLIO — placeholder for future enrichment */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={16} className="text-[#2d6a4f]" />
                <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Portfolio Companies</h2>
              </div>
              <p className="text-sm text-[#718096]">
                Portfolio data coming soon.{" "}
                <Link href="/search" className="text-[#2d6a4f] hover:underline">
                  Browse all climate companies →
                </Link>
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">

            {/* QUICK FACTS */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-5">Quick Facts</h3>
              <div className="flex flex-col gap-4">
                {investor.fund_size && (
                  <div className="flex items-start gap-3">
                    <DollarSign size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Fund Size</div>
                      <div className="text-sm text-[#0f1a14]">{investor.fund_size}</div>
                    </div>
                  </div>
                )}
                {investor.total_aum && (
                  <div className="flex items-start gap-3">
                    <TrendingUp size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Total AUM</div>
                      <div className="text-sm text-[#0f1a14]">{investor.total_aum}</div>
                    </div>
                  </div>
                )}
                {geographies.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Globe size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Geographies</div>
                      <div className="flex flex-wrap gap-1">
                        {geographies.map((g, i) => (
                          <span key={i} className="text-xs text-[#0f1a14]">
                            {GEO_LABELS[g?.toLowerCase()] || g}{i < geographies.length - 1 ? "," : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {investor.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">HQ</div>
                      <div className="text-sm text-[#0f1a14]">{investor.location}</div>
                    </div>
                  </div>
                )}
              </div>

              {website && (
                <a href={website.startsWith("http") ? website : `https://${website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-6 w-full flex items-center justify-center gap-2 border border-[#d0d6e0] text-[#0f1a14] text-sm rounded-lg py-2.5 hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                  <Globe size={14} /> Visit website
                </a>
              )}
            </div>

            {/* REQUEST INTRO */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0f1a14] mb-1">
                Request an introduction
              </h3>
              <p className="text-xs text-[#718096] leading-relaxed mb-4">
                Tell us about your company and we'll facilitate an introduction to {investor.name}.
              </p>
              <IntroForm investor={investor} />
            </div>

            {/* ONBOARDING CTA */}
            <div className="bg-[#0f1a14] border border-[#2d6a4f] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-[#2d6a4f]" />
                <span className="text-xs font-mono text-[#a0b8a8] uppercase tracking-widest">Are you an investor?</span>
              </div>
              <p className="text-sm text-[#d0e4d8] leading-relaxed mb-4">
                Join EP Investing to access deal flow, company signals, and curated climate opportunities.
              </p>
              <Link href="/onboarding/investor"
                className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
                Join as investor <ChevronRight size={13} />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
