"use client";

import Link from "next/link";
import { Check, ArrowRight, Briefcase, Building2, TrendingUp, Heart, Star, BookOpen } from "lucide-react";

const PAID_TIERS = [
  {
    id: "expert",
    name: "Expert",
    price: 49,
    afterLabel: "$49/mo after July 15",
    description: "For consultants and advisors who want visibility and inbound deal flow.",
    icon: Briefcase,
    highlighted: false,
    href: "/onboarding/expert",
    features: [
      "Everything in Researcher",
      "Personalized For You intelligence feed",
      "Expert directory listing",
      "Inbound enquiry notifications",
      "Verified expert badge",
      "Featured in sector searches",
    ],
  },
  {
    id: "ngo",
    name: "NGO",
    price: 19.99,
    afterLabel: "$19.99/mo after July 15",
    description: "For non-profits, NGOs, IGOs, and foundations working on the energy transition.",
    icon: Heart,
    highlighted: false,
    href: "/onboarding/ngo",
    features: [
      "Everything in Researcher",
      "Personalized For You intelligence feed",
      "Listed in NGO directory",
      "Publish grant programs & jobs",
      "International partnership signals",
      "Discover funded climate companies",
    ],
  },
  {
    id: "company",
    name: "Company",
    price: 99,
    afterLabel: "$99/mo after July 15",
    description: "For climate companies raising, hiring, or seeking strategic partners.",
    icon: Building2,
    highlighted: true,
    badge: "Most popular",
    href: "/onboarding/company",
    features: [
      "Everything in Researcher",
      "Personalized For You intelligence feed",
      "Verified company profile",
      "Raising / Hiring / Partnership signals",
      "Surfaced to relevant investors",
      "Priority placement in search",
      "Industry insights & reports",
    ],
  },
  {
    id: "investor",
    name: "Investor",
    price: 149,
    afterLabel: "$149/mo after July 15",
    description: "For VCs, family offices, and angels sourcing the next generation of climate deals.",
    icon: TrendingUp,
    highlighted: false,
    href: "/onboarding/investor",
    features: [
      "Everything in Researcher",
      "Personalized For You intelligence feed",
      "Filter companies raising by stage",
      "Direct contact with verified founders",
      "Weekly curated deal digest",
      "Industry insights & reports",
      "Investor profile & visibility",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" /> Now open
        </div>
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-5xl text-[#0f1a14] mb-4 leading-tight">
          The intelligence layer<br />for the energy transition
        </h1>
        <p className="text-[#4a5568] text-lg max-w-xl mx-auto leading-relaxed mb-8">
          Purpose-built for climate professionals.
        </p>
        <div className="inline-flex items-center bg-[#0f1a14] text-white px-8 py-4 rounded-2xl mb-3">
          <span style={{ fontFamily: "Georgia, serif" }} className="text-2xl md:text-3xl font-normal">
            Free until July 15, 2026
          </span>
        </div>
        <p className="text-xs font-mono text-[#718096]">All paid features unlocked · No credit card required · Researcher tier always free</p>
      </div>

      {/* Free Researcher banner */}
      <div className="max-w-6xl mx-auto px-6 mb-6">
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#eef1f6] flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} className="text-[#2d6a4f]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <span className="font-semibold text-[#0f1a14] text-base">Researcher</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#2d6a4f] border border-[#c8d8cc]">
                  Always free
                </span>
              </div>
              <p className="text-sm text-[#4a5568] leading-relaxed">
                For analysts, students, and anyone tracking the energy transition. Browse 1,300+ companies, save lists, get the weekly digest.
              </p>
            </div>
          </div>
          <Link href="/onboarding/researcher"
            className="bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-[#235a40] transition-colors flex items-center gap-2 flex-shrink-0">
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Pricing cards (4 paid tiers) */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PAID_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl p-6 transition-all ${
                tier.highlighted
                  ? "bg-[#0f1a14] text-white shadow-2xl scale-[1.02] border-2 border-[#2d6a4f]"
                  : "bg-white border border-[#e2e6ed]"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-[#2d6a4f] text-white text-[10px] font-semibold px-3 py-1 rounded-full">
                    <Star size={9} fill="white" /> {tier.badge}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className={`font-semibold text-sm ${tier.highlighted ? "text-white" : "text-[#0f1a14]"}`}>
                  {tier.name}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-bold tracking-tight ${tier.highlighted ? "text-white" : "text-[#0f1a14]"}`}>
                    Free
                  </span>
                  <span className={`text-sm pb-1.5 font-mono ${tier.highlighted ? "text-[#a0b8a8]" : "text-[#718096]"}`}>
                    until July 15
                  </span>
                </div>
                <p className={`text-[11px] font-mono mt-1 ${tier.highlighted ? "text-[#a0b8a8]" : "text-[#718096]"}`}>
                  {tier.afterLabel}
                </p>
                <p className={`text-xs leading-relaxed mt-3 ${tier.highlighted ? "text-[#a0b8a8]" : "text-[#718096]"}`}>
                  {tier.description}
                </p>
              </div>

              <div className={`h-px w-full mb-4 ${tier.highlighted ? "bg-[#1a2e22]" : "bg-[#f2f4f8]"}`} />

              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      tier.highlighted ? "bg-[#2d6a4f]" : "bg-[#eef1f6]"
                    }`}>
                      <Check size={9} className={tier.highlighted ? "text-white" : "text-[#2d6a4f]"} strokeWidth={3} />
                    </div>
                    <span className={`text-xs leading-relaxed ${tier.highlighted ? "text-[#d0e4d8]" : "text-[#4a5568]"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href={tier.href}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
                  tier.highlighted
                    ? "bg-[#4a9e7a] text-white hover:bg-[#3d8a69] border border-[#5db88a]"
                    : "bg-[#2d6a4f] text-white hover:bg-[#235a40]"
                }`}>
                Get started free <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#718096] font-mono">
            Free until July 15, 2026 · All plans billed monthly · Cancel anytime · No hidden fees
          </p>
          <p className="text-xs text-[#a0aec0] font-mono mt-2">
            Annual billing available at 20% discount when paid plans launch · <a href="mailto:otto@epinvesting.com" className="underline hover:text-[#2d6a4f]">contact us</a>
          </p>
        </div>
      </div>

      {/* Comparison footer */}
      <div className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-4">
          Why EP Investing?
        </h2>
        <p className="text-[#4a5568] leading-relaxed">
          Generalist platforms charge $99+/month for broad market data. EP Investing offers
          climate-specific intelligence — curated, enriched, and built for energy professionals — with
          a free tier that beats most paid alternatives.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-10">
          <div>
            <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">1,300+</div>
            <div className="text-xs font-mono text-[#718096] mt-1">Climate companies</div>
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">350+</div>
            <div className="text-xs font-mono text-[#718096] mt-1">Active investors</div>
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">185+</div>
            <div className="text-xs font-mono text-[#718096] mt-1">Grants tracked</div>
          </div>
        </div>
      </div>
    </div>
  );
}
