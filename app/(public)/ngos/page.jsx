"use client";
import Link from "next/link";
import { ArrowRight, CheckCircle, Building2 } from "lucide-react";

export default function NGOsLanding() {
  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-20">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" /> Now accepting NGO profiles
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-5xl text-[#0f1a14] mb-4 leading-tight">
            For NGOs, IGOs, and foundations
          </h1>
          <p className="text-[#4a5568] text-lg leading-relaxed max-w-xl mx-auto mb-8">
            List your organization, post grants and jobs, discover funded climate companies, and connect with peer organizations across the energy transition.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/onboarding/ngo"
              className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors">
              List your organization <ArrowRight size={14} />
            </Link>
            <Link href="/ngos/directory"
              className="inline-flex items-center gap-2 border border-[#d0d6e0] text-[#0f1a14] font-semibold text-sm rounded-lg px-6 py-3 hover:border-[#2d6a4f] transition-colors">
              Browse directory
            </Link>
          </div>
        </div>

        {/* Value props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              title: "Publish grants",
              desc: "List your grant programs in our climate-specific directory. Get applications from companies actively working in your sector.",
            },
            {
              title: "Post jobs",
              desc: "Hire from a pool of climate-focused candidates. Featured prominently in our job board.",
            },
            {
              title: "Find partners",
              desc: "Discover other organizations open to international partnerships in your geography or sector of focus.",
            },
            {
              title: "Discover companies",
              desc: "Browse 1,300+ climate companies as potential grantees, partners, or recipients of your programs.",
            },
            {
              title: "Get found",
              desc: "Verified profile in our directory. Companies, journalists, and researchers can find and contact you.",
            },
            {
              title: "Track grants",
              desc: "All grants you publish stay live in our directory until their deadlines. Free promotion to the right audience.",
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

        {/* Who it's for */}
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8 mb-16">
          <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-5">Who lists here</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "International NGOs", desc: "WWF, EDF, NRDC" },
              { label: "IGOs", desc: "UN, IRENA, World Bank" },
              { label: "Foundations", desc: "Bezos Earth Fund, ClimateWorks" },
              { label: "Research non-profits", desc: "RMI, WRI, ICCT" },
              { label: "Implementation NGOs", desc: "Solar Sister, ENGIE Energy Access" },
              { label: "Advocacy & movements", desc: "350.org, Sunrise" },
            ].map(item => (
              <div key={item.label} className="border border-[#e2e6ed] rounded-lg p-3">
                <div className="text-sm font-semibold text-[#0f1a14]">{item.label}</div>
                <div className="text-[11px] text-[#718096] mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing call-out */}
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8 mb-16 text-center">
          <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-2">Pricing</div>
          <div className="flex items-end justify-center gap-1 mb-2">
            <span style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#0f1a14]">Free</span>
            <span className="text-sm text-[#718096] pb-1.5 font-mono">until July 15, 2026</span>
          </div>
          <p className="text-sm text-[#4a5568]">
            Then $19.99/month. Cancel anytime. No credit card required to start.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-[#0f1a14] rounded-2xl p-10 text-center">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-white mb-3">Ready to list your organization?</h2>
          <p className="text-[#9ca8a0] text-sm mb-6 max-w-sm mx-auto">
            Submission takes under 5 minutes. We review every profile and approve verified organizations within a few business days.
          </p>
          <Link href="/onboarding/ngo"
            className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#3d8a69] transition-colors">
            Get started free <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}
