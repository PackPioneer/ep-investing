"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, Search, Briefcase, Building2, TrendingUp, Zap, Star, Bell, CheckCircle } from "lucide-react";

const LAUNCH_DATE = "April 15, 2025";

const TIERS = [
  {
    id: "researcher",
    name: "Researcher",
    price: 9,
    description: "For analysts, students, and curious minds tracking the energy transition.",
    icon: Search,
    accent: "#64748b",
    highlighted: false,
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
    accent: "#7c3aed",
    highlighted: false,
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
    accent: "#2d6a4f",
    highlighted: true,
    badge: "Most popular",
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
    accent: "#b45309",
    highlighted: false,
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

function WaitlistForm({ tier }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), plan: tier }),
      });
      setStatus("done");
    } catch {
      setStatus("done"); // still show success
    }
  };

  if (status === "done") return (
    <div className="flex items-center gap-2 justify-center py-3 text-sm text-[#2d6a4f] font-medium">
      <CheckCircle size={15} /> We'll remind you on April 15th
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full px-3 py-2.5 rounded-lg border border-[#d0d6e0] text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors bg-white"
      />
      <button
        type="submit"
        disabled={status === "loading" || !email.trim()}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all bg-[#2d6a4f] text-white hover:bg-[#235a40] disabled:opacity-50"
      >
        <Bell size={13} /> Notify me April 15th
      </button>
    </form>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-white rounded-full px-3 py-1.5 mb-6">
          <Zap size={11} /> Launching April 15th
        </div>
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-5xl text-[#0f1a14] mb-4 leading-tight">
          The intelligence layer<br />for the energy transition
        </h1>
        <p className="text-[#4a5568] text-lg max-w-xl mx-auto leading-relaxed mb-4">
          Purpose-built for climate professionals. Plans open on April 15th — enter your email below and we'll remind you the moment signups go live.
        </p>
        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-mono px-4 py-2 rounded-full">
          🔒 Subscriptions open April 15, 2025
        </div>
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
                    ? "bg-[#0f1a14] text-white shadow-2xl scale-[1.02] border border-[#2d6a4f]"
                    : "bg-white border border-[#e2e6ed] hover:border-[#c8d8cc] hover:shadow-md"
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
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    tier.highlighted ? "bg-[#2d6a4f]" : "bg-[#f2f4f8]"
                  }`}>
                    <Icon size={16} style={{ color: tier.highlighted ? "white" : tier.accent }} />
                  </div>
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
                      /month
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

                {/* Waitlist form instead of CTA button */}
                <WaitlistForm tier={tier.id} />
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[#718096] font-mono">
            All plans billed monthly · Cancel anytime · No hidden fees
          </p>
          <p className="text-xs text-[#a0aec0] mt-2">
            Annual billing available at 20% discount —{" "}
            <Link href="/contact" className="text-[#2d6a4f] hover:underline">contact us</Link>
          </p>
        </div>

        {/* Comparison callout */}
        <div className="mt-16 bg-white border border-[#e2e6ed] rounded-2xl p-8 max-w-3xl mx-auto text-center">
          <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-2">
            Why EP Investing?
          </h3>
          <p className="text-sm text-[#4a5568] mb-8 leading-relaxed max-w-xl mx-auto">
            Crunchbase charges $99/month for broad market data. We offer climate-specific intelligence — curated, enriched, and built for energy professionals — starting at $9.
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Climate companies", value: "1,300+" },
              { label: "Active investors", value: "350+" },
              { label: "Grants tracked", value: "59+" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-[#2d6a4f] mb-1">{value}</div>
                <div className="text-xs text-[#718096] font-mono">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
