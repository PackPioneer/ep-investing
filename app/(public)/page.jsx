"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowRight, TrendingUp, Zap, Users, Briefcase } from "lucide-react";

const quickTags = [
  "direct_air_capture", "green_hydrogen", "nuclear_technologies",
  "carbon_credits", "clean_cooking", "electric_aviation", "battery_storage"
];

const categories = [
  { icon: "⚛️", name: "Nuclear Technologies", count: 126, slug: "nuclear-technologies" },
  { icon: "✈️", name: "Electric Aviation", count: 74, slug: "electric-aviation" },
  { icon: "🔋", name: "Battery Storage", count: 69, slug: "battery-storage" },
  { icon: "💧", name: "Green Hydrogen", count: 64, slug: "green-hydrogen" },
  { icon: "💨", name: "Wind Energy", count: 60, slug: "wind-energy" },
  { icon: "⛽", name: "SAF / Efuels", count: 52, slug: "saf-efuels" },
  { icon: "🌋", name: "Geothermal", count: 39, slug: "geothermal" },
  { icon: "🏭", name: "Industrial Decarb", count: 37, slug: "industrial-decarb" },
  { icon: "☀️", name: "Solar", count: 37, slug: "solar" },
  { icon: "🔌", name: "EV Charging", count: 33, slug: "ev-charging" },
];

const roleTiles = [
  {
    icon: TrendingUp,
    title: "Investors",
    desc: "Find deal flow across climate categories — from seed to growth — with thesis-matched companies and grants.",
    cta: "Explore investors",
    href: "/investors",
    color: "from-emerald-500/10 to-emerald-600/5",
  },
  {
    icon: Zap,
    title: "Founders",
    desc: "Raise faster with structured investor discovery. Find aligned VCs, angels, and non-dilutive grants.",
    cta: "Claim your company",
    href: "/get-matched",
    color: "from-blue-500/10 to-blue-600/5",
  },
  {
    icon: Users,
    title: "Experts",
    desc: "Get hired for high-impact climate work — consulting, fractional roles, and advisory.",
    cta: "Create a profile",
    href: "/get-matched",
    color: "from-violet-500/10 to-violet-600/5",
  },
  {
    icon: Briefcase,
    title: "Job Seekers",
    desc: "Browse roles from cleantech companies — engineering, finance, policy, and operations.",
    cta: "Browse jobs",
    href: "/get-matched",
    color: "from-amber-500/10 to-amber-600/5",
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [email, setEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/companies?limit=5")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentCompanies(data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e, override) => {
    if (e) e.preventDefault();
    const term = override || query;
    if (!term.trim()) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(200,245,96,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,245,96,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
            Climate Finance Intelligence
          </div>

          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl md:text-7xl leading-[1.05] tracking-tight text-[#0f1a14] max-w-4xl mb-6">
            Capital discovery for{" "}
            <em className="text-[#2d6a4f] not-italic">the energy transition.</em>
          </h1>

          <p className="text-[#4a5568] text-lg max-w-xl leading-relaxed mb-10 font-light">
            Search companies, investors, grants, and jobs across climate and energy — curated, structured, and updated regularly.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex max-w-2xl bg-[#ffffff] border border-[#d0d6e0] rounded-xl overflow-hidden mb-8 focus-within:border-[#2d6a4f] focus-within:shadow-[0_0_0_3px_rgba(45,106,79,0.12)] transition-all">
            <div className="flex items-center flex-1 px-4 gap-3">
              <Search size={16} className="text-[#718096] flex-shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search direct air capture, Breakthrough Energy, DOE grants…"
                className="w-full py-4 bg-transparent outline-none text-sm text-[#0f1a14] placeholder-[#718096]"
              />
            </div>
            <button type="submit" className="bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm px-6 hover:bg-[#235a40] transition-colors">
              Search
            </button>
          </form>

          {/* Role CTAs */}
          <div className="flex flex-wrap gap-3 mb-8">
            {[
              { label: "📈 I'm an Investor", href: "/investors" },
              { label: "🚀 I'm a Founder", href: "/get-matched" },
              { label: "🗂 Browse Directory", href: "/search" },
            ].map((btn) => (
              <Link key={btn.label} href={btn.href}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-[#d0d6e0] bg-[#ffffff] rounded-lg text-[#0f1a14] hover:border-[#2d6a4f] hover:text-[#2d6a4f] hover:bg-[#f8f9fb] transition-all">
                {btn.label}
              </Link>
            ))}
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#718096] text-xs font-mono tracking-wider">Browse:</span>
            {quickTags.map((tag) => (
              <button key={tag} onClick={() => handleSearch(null, tag)}
                className="text-xs font-mono px-3 py-1.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f] hover:bg-[rgba(45,106,79,0.06)] transition-all">
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* STATS BAR */}
      <div className="border-y border-[#e2e6ed] bg-[#ffffff] overflow-x-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-0">
          {[
            { num: "654", label: "Companies", sub: "across 14 industries" },
            { num: "135", label: "Investors", sub: "VC, Angel & Philanthropy" },
            { num: "47", label: "Grants", sub: "with tracked deadlines" },
            { num: "14", label: "Categories", sub: "energy transition coverage" },
          ].map((stat, i) => (
            <div key={i} className={`flex items-center gap-4 pr-8 mr-8 flex-shrink-0 ${i < 3 ? "border-r border-[#e2e6ed]" : ""}`}>
              <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#2d6a4f]">{stat.num}</div>
              <div>
                <div className="text-sm font-medium text-[#0f1a14]">{stat.label}</div>
                <div className="text-xs text-[#4a5568]">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROLE TILES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">Start here</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#e2e6ed] border border-[#e2e6ed] rounded-xl overflow-hidden">
          {roleTiles.map((tile) => (
            <Link key={tile.title} href={tile.href}
              className="bg-[#ffffff] p-7 flex flex-col gap-3 hover:bg-[#f8f9fb] transition-colors group">
              <tile.icon size={22} className="text-[#2d6a4f]" />
              <div style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14]">{tile.title}</div>
              <div className="text-sm text-[#4a5568] leading-relaxed font-light">{tile.desc}</div>
              <div className="text-xs text-[#2d6a4f] font-mono mt-auto pt-3 group-hover:gap-2 flex items-center gap-1 transition-all">
                {tile.cta} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="border-t border-[#e2e6ed]" />

      {/* DIRECTORY BLOCKS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">Explore EP Investment</h2>
          <Link href="/search" className="text-xs text-[#4a5568] font-mono tracking-wider hover:text-[#2d6a4f] transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { num: "654", title: "Companies", desc: "Browse climate companies by category, technology, and signals.", href: "/search" },
            { num: "135", title: "Investors", desc: "VC firms, angel syndicates, and philanthropic capital across the energy transition.", href: "/investors" },
            { num: "47", title: "Grants", desc: "Track non-dilutive funding opportunities, sorted by upcoming deadlines.", href: "/grants" },
          ].map((card) => (
            <Link key={card.title} href={card.href}
              className="relative bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-7 flex flex-col gap-3 hover:border-[#2d6a4f] hover:bg-[#f8f9fb] transition-all group">
              <div style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#2d6a4f]">{card.num}</div>
              <div className="text-base font-semibold text-[#0f1a14]">{card.title}</div>
              <div className="text-sm text-[#4a5568] leading-relaxed font-light">{card.desc}</div>
              <span className="absolute right-6 top-7 text-[#718096] group-hover:text-[#2d6a4f] group-hover:translate-x-1 transition-all text-lg">→</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="border-t border-[#e2e6ed]" />

      {/* LIVE FEEDS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">Recently updated</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#e2e6ed] border border-[#e2e6ed] rounded-xl overflow-hidden">
          {/* New Companies */}
          <div className="bg-[#ffffff] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2e6ed]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#4a5568]">New companies</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            </div>
            {recentCompanies.length > 0 ? recentCompanies.map((co) => (
              <Link key={co.id} href={`/companies/${co.id}`}
                className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{co.name || co.url}</div>
                  {co.industry_tags?.[0] && (
                    <div className="text-xs font-mono text-[#718096] mt-1">{co.industry_tags[0]}</div>
                  )}
                </div>
              </Link>
            )) : [1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5" />
                <div className="h-4 bg-[#e2e6ed] rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Investors */}
          <div className="bg-[#ffffff] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2e6ed]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#4a5568]">New investors</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            </div>
            {["Breakthrough Energy Ventures", "Prelude Ventures", "Spring Lane Capital", "Azolla Ventures", "Clean Energy Ventures"].map((name) => (
              <Link key={name} href="/investors"
                className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{name}</div>
                  <div className="text-xs font-mono text-[#718096] mt-1">VC Firm</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Grants */}
          <div className="bg-[#ffffff] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2e6ed]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#4a5568]">Grants closing soon</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            </div>
            {[
              { name: "DOE Advanced Nuclear R&D", date: "Mar 12, 2026" },
              { name: "ARPA-E OPEN 2025", date: "Mar 28, 2026" },
              { name: "DOE Hydrogen Shot", date: "Apr 5, 2026" },
              { name: "NREL Clean Energy Fund", date: "Apr 18, 2026" },
              { name: "EU Horizon Climate", date: "May 2, 2026" },
            ].map((grant) => (
              <Link key={grant.name} href="/grants"
                className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{grant.name}</div>
                  <div className="text-xs font-mono mt-1 px-2 py-0.5 rounded-full bg-[rgba(255,150,80,0.1)] text-[#ff9650] border border-[rgba(255,150,80,0.2)] inline-block">{grant.date}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-[#e2e6ed]" />

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">Browse by category</h2>
          <Link href="/search" className="text-xs text-[#4a5568] font-mono tracking-wider hover:text-[#2d6a4f] transition-colors">All categories →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => handleSearch(null, cat.slug.replace(/-/g, "_"))}
              className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-5 flex flex-col gap-2 text-left hover:border-[#2d6a4f] hover:bg-[#f8f9fb] hover:-translate-y-0.5 transition-all group">
              <div className="text-2xl">{cat.icon}</div>
              <div className="text-sm font-medium text-[#0f1a14] leading-snug">{cat.name}</div>
              <div className="text-xs text-[#718096] font-mono">{cat.count} companies</div>
            </button>
          ))}
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <div className="bg-[#ffffff] border-y border-[#e2e6ed]">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">
              Get weekly <em className="text-[#2d6a4f] not-italic">EP Investment</em> updates
            </h2>
            <p className="text-[#4a5568] text-sm leading-relaxed font-light max-w-sm">
              New investors, grant deadlines, verified companies seeking capital — delivered every week.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex bg-[#f2f4f8] border border-[#d0d6e0] rounded-lg overflow-hidden focus-within:border-[#2d6a4f] transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent px-4 py-3 text-sm text-[#0f1a14] placeholder-[#718096] outline-none"
              />
              <button className="bg-[#2d6a4f] text-[#f2f4f8] text-sm font-semibold px-5 hover:bg-[#235a40] transition-colors">
                Subscribe
              </button>
            </div>
            <div className="flex gap-5 flex-wrap">
              {["Weekly digest", "Grant deadline alerts", "New investor additions"].map((f) => (
                <span key={f} className="text-xs text-[#4a5568] font-mono flex items-center gap-1">
                  <span className="text-[#2d6a4f]">✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#e2e6ed] max-w-full px-8 py-8 flex items-center justify-between">
        <span style={{ fontFamily: "Georgia, serif" }} className="text-[#4a5568] text-sm">EP Investment</span>
        <div className="flex gap-6">
          {["Companies", "Investors", "Grants", "Pricing", "About"].map((item) => (
            <Link key={item} href={`/${item.toLowerCase()}`} className="text-xs text-[#718096] hover:text-[#4a5568] transition-colors">
              {item}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
