import Link from "next/link";
import { TrendingUp, Zap, Users, Heart, Briefcase, ArrowRight } from "lucide-react";

const ROLE_CARDS = {
  capital: [
    {
      icon: TrendingUp,
      title: "Investor",
      cta: "Get investor access",
      href: "/onboarding/investor",
      bullets: [
        "Source deals across 14 climate sectors",
        "Filter by stage, sector, geography, check size",
        "Track and connect with companies actively raising",
        "See market signals and recent IPOs",
      ],
    },
    {
      icon: Zap,
      title: "Founder",
      cta: "Claim your profile",
      href: "/onboarding/company",
      bullets: [
        "Raise capital — get found by relevant investors",
        "Hire — post jobs to climate-focused candidates",
        "Connect — find experts and partners",
        "Track sector news, grants, and policy changes",
      ],
    },
  ],
  network: [
    {
      icon: Users,
      title: "Expert",
      cta: "Join the network",
      href: "/onboarding/expert",
      bullets: [
        "Get hired for high-impact climate roles",
        "Build inbound deal flow from companies",
        "Get found by hiring managers and journalists",
        "Track market activity in your specialty",
      ],
    },
    {
      icon: Heart,
      title: "NGO or foundation",
      cta: "List your organization",
      href: "/onboarding/ngo",
      bullets: [
        "List grant opportunities to climate companies",
        "Post jobs and find partners",
        "Discover funded companies aligned with your mission",
        "Showcase your programs and impact",
      ],
    },
  ],
};

const RESEARCHER = {
  icon: Briefcase,
  title: "Researcher",
  cta: "Get started free",
  href: "/onboarding/researcher",
  bullets: [
    "Browse 1,300+ climate companies free",
    "Track 350 investors and their portfolios",
    "Search by sector, technology, geography",
    "No commitment, no payment",
  ],
};

function RoleCard({ role }) {
  const Icon = role.icon;
  return (
    <Link
      href={role.href}
      className="bg-white border border-[#e2e6ed] rounded-xl p-6 flex flex-col hover:border-[#2d6a4f] transition-all group"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-[#eef1f6] flex items-center justify-center flex-shrink-0">
          <Icon size={16} className="text-[#2d6a4f]" />
        </div>
        <div style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0f1a14]">
          {role.title}
        </div>
      </div>
      <div className="text-sm text-[#4a5568] leading-relaxed mb-4 flex-1">
        {role.bullets.map((b, i) => (
          <div key={i} className="mb-1">— {b}</div>
        ))}
      </div>
      <div className="text-xs text-[#2d6a4f] font-mono pt-3 border-t border-[#e2e6ed] flex items-center gap-1 group-hover:gap-2 transition-all">
        {role.cta} <ArrowRight size={11} />
      </div>
    </Link>
  );
}

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            Free until July 15, 2026
          </div>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl md:text-5xl text-[#0f1a14] mb-3 leading-[1.05]">
            Get started
          </h1>
          <p className="text-[#4a5568] text-base max-w-md mx-auto leading-relaxed font-light">
            Pick the path that fits. We'll set up your profile and tailor what you see.
          </p>
        </div>

        {/* Capital section */}
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#718096] mb-3">
          Capital
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {ROLE_CARDS.capital.map(role => <RoleCard key={role.title} role={role} />)}
        </div>

        {/* Network section */}
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#718096] mb-3">
          Network
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {ROLE_CARDS.network.map(role => <RoleCard key={role.title} role={role} />)}
        </div>

        {/* Just exploring */}
        <div className="text-[10px] font-mono uppercase tracking-widest text-[#718096] mb-3">
          Just exploring
        </div>
        <Link
          href={RESEARCHER.href}
          className="bg-white border border-[#e2e6ed] rounded-xl p-6 flex items-start gap-4 hover:border-[#2d6a4f] transition-all group mb-8"
        >
          <div className="w-9 h-9 rounded-lg bg-[#eef1f6] flex items-center justify-center flex-shrink-0">
            <RESEARCHER.icon size={16} className="text-[#2d6a4f]" />
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0f1a14] mb-2">
              {RESEARCHER.title}
            </div>
            <div className="text-sm text-[#4a5568] leading-relaxed">
              {RESEARCHER.bullets.map((b, i) => (
                <div key={i} className="mb-1">— {b}</div>
              ))}
            </div>
          </div>
          <div className="text-xs text-[#2d6a4f] font-mono flex items-center gap-1 group-hover:gap-2 transition-all flex-shrink-0 self-end">
            {RESEARCHER.cta} <ArrowRight size={11} />
          </div>
        </Link>

        {/* Sign in fallback */}
        <div className="text-center text-sm text-[#718096]">
          Already have an account?{" "}
          <a href="https://accounts.epinvesting.com/sign-in" className="text-[#2d6a4f] hover:underline">
            Sign in
          </a>
        </div>

      </div>
    </div>
  );
}
