"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Search, Briefcase, Building2, TrendingUp, Star } from "lucide-react";

const TIERS = [
  {
    id: "researcher",
    name: "Researcher",
    price: 9,
    description: "For analysts, students, and curious minds tracking the energy transition.",
    icon: Search,
    highlighted: false,
    href: "/onboarding/researcher",
    features: [
      "Browse 1,300+ climate companies",
      "View open job listings",
      "Search & filter by sector",
      "Company profiles & descriptions",
      "Access to industry reports",
    ],
  },
  {
    id: "expert",
    name: "Expert",
    price: 49,
    description: "For consultants and advisors who want visibility and inbound deal flow.",
    icon: Briefcase,
    highlighted: false,
    href: "/onboarding/researcher",
    features: [
      "Everything in Researcher",
      "Expert directory listing",
      "Inbound enquiry notifications",
      "Verified expert badge",
      "Featured in sector searches",
    ],
  },
  {
    id: "company",
    name: "Company",
    price: 99,
    description: "For climate companies raising, hiring, or seeking strategic partners.",
    icon: Building2,
    highlighted: true,
    badge: "Most popular",
    href: "/onboarding/company",
    features: [
      "Everything in Researcher",
      "Verified company profile",
      "Raising / Hiring / Partnership signals",
      "Surfaced to relevant investors",
      "Priority placement in search",
      "Admin dashboard access",
    ],
  },
  {
    id: "investor",
    name: "Investor",
    price: 149,
    description: "For VCs, family offices, and angels sourcing the next generation of climate deals.",
    icon: TrendingUp,
    highlighted: false,
    href: "/onboarding/investor",
    features: [
      "Everything in Researcher",
      "Full company signal feed",
      "Filter companies raising by stage",
      "Direct contact with verified founders",
      "Weekly curated deal digest",
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
          <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" /> Now live
        </div>
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-5xl text-[#0f1a14] mb-4 leading-tight">
          The intelligence layer<br />for the energy transition
        </h1>
        <p className="text-[#4a5568] text-lg max-w-xl mx-auto leading-relaxed mb-8">
          Purpose-built for the green transition.
        </p>
        <div className="inline-flex items-center bg-[#0f1a14] text-white px-8 py-4 rounded-2xl mb-3">
          <span style={{ fontFamily: "Georgia, serif" }} className="text-2xl md:text-3xl font-normal">
            Free until July 15, 2025
          </span>
        </div>
        <p className="text-xs font-mono text-[#718096]">No credit card required to start · Cancel anytime before July 15th</p>
      </div>

      {/* Pricing cards */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            return (
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
                      ${tier.price}
                    </span>
                    <span className={`text-sm pb-1.5 font-mono ${tier.highlighted ? "text-[#a0b8a8]" : "text-[#718096]"}`}>
                      /month after July 15
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed mt-2 ${tier.highlighted ? "text-[#a0b8a8]" : "text-[#718096]"}`}>
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
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[#718096] font-mono">
            Free until July 15, 2025 · All plans billed monthly · Cancel anytime · No hidden fees
          </p>
        </div>
      </div>
    </div>
  );
}