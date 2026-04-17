"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function ExpertsPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" /> Now accepting applications
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-5xl text-[#0f1a14] mb-4 leading-tight">
            The climate expert network
          </h1>
          <p className="text-[#4a5568] text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Connect with vetted climate and energy specialists available for consulting, advisory, and fractional roles.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/onboarding/expert"
              className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors">
              Apply as an expert <ArrowRight size={14} />
            </Link>
            <Link href="/search"
              className="inline-flex items-center gap-2 border border-[#d0d6e0] text-[#0f1a14] font-semibold text-sm rounded-lg px-6 py-3 hover:border-[#2d6a4f] transition-colors">
              Browse directory
            </Link>
          </div>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              title: "Get discovered",
              desc: "Your profile is surfaced to climate companies actively looking for expertise in your area.",
            },
            {
              title: "Inbound enquiries",
              desc: "Companies and investors reach out directly via your profile — no cold outreach needed.",
            },
            {
              title: "Vetted network",
              desc: "Every expert is reviewed before being listed. Quality over quantity.",
            },
          ].map(item => (
            <div key={item.title} className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <div className="w-8 h-8 rounded-lg bg-[#eef1f6] flex items-center justify-center mb-4">
                <CheckCircle size={16} className="text-[#2d6a4f]" />
              </div>
              <div className="text-sm font-semibold text-[#0f1a14] mb-2">{item.title}</div>
              <p className="text-xs text-[#718096] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Expertise areas */}
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8 mb-16">
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-5">Areas of expertise</div>
          <div className="flex flex-wrap gap-2">
            {[
              "Solar & Wind", "Battery Storage", "Green Hydrogen", "Nuclear",
              "Carbon Markets", "Energy Efficiency", "EV & Mobility", "SAF / Efuels",
              "Climate Finance", "M&A / Due Diligence", "Project Finance",
              "Policy & Regulation", "ESG & Sustainability", "Project Development",
              "Engineering", "AI & Data Science", "Legal & Compliance", "Fundraising Advisory"
            ].map(area => (
              <span key={area} className="text-xs px-3 py-1.5 rounded-full bg-[#eef1f6] text-[#2d6a4f] border border-[#c8d8cc]">{area}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-[#0f1a14] rounded-2xl p-10 text-center">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-white mb-3">Ready to join?</h2>
          <p className="text-[#9ca8a0] text-sm mb-6 max-w-sm mx-auto">Applications take under 2 minutes. We review all submissions and reach out within 48 hours.</p>
          <Link href="/onboarding/expert"
            className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#3d8a69] transition-colors">
            Apply now <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}