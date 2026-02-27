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
    <div className="min-h-screen bg-[#0a0d0f] text-[#e8ede8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-[#1e2428] bg-[#0a0d0f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c8f560] animate-pulse" />
            <span style={{ fontFamily: "Georgia, serif" }} className="text-base font-normal text-[#e8ede8]">EP Investment</span>
          </Link>
          <div className="hidden md:flex items-center gap-7 text-sm text-[#6b7a72]">
            {["Companies", "Investors", "Grants", "Categories", "Jobs", "Experts"].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="hover:text-[#e8ede8] transition-colors">
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/get-matched" className="text-sm text-[#6b7a72] border border-[#252c32] rounded-md px-3 py-1.5 hover:text-[#e8ede8] hover:border-[#4a5550] transition-all">
              Get matched
            </Link>
            <Link href="/get-matched" className="text-sm bg-[#c8f560] text-[#0a0d0f] font-semibold rounded-md px-4 py-1.5 hover:bg-[#d4ff6b] transition-all">
              Claim your company
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(200,245,96,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(200,245,96,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 text-[#c8f560] text-xs font-mono tracking-widest uppercase border border-[#1e2e24] bg-[#151d18] rounded-full px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8f560]" />
            Climate Finance Intelligence
          </div>

          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl md:text-7xl leading-[1.05] tracking-tight text-[#e8ede8] max-w-4xl mb-6">
            Capital discovery for{" "}
            <em className="text-[#c8f560] not-italic">the energy transition.</em>
          </h1>

          <p className="text-[#6b7a72] text-lg max-w-xl leading-relaxed mb-10 font-light">
            Search companies, investors, grants, and jobs across climate and energy — curated, structured, and updated regularly.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex max-w-2xl bg-[#111518] border border-[#252c32] rounded-xl overflow-hidden mb-8 focus-within:border-[#c8f560] focus-within:shadow-[0_0_0_3px_rgba(200,245,96,0.07)] transition-all">
            <div className="flex items-center flex-1 px-4 gap-3">
              <Search size={16} className="text-[#4a5550] flex-shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search direct air capture, Breakthrough Energy, DOE grants…"
                className="w-full py-4 bg-transparent outline-none text-sm text-[#e8ede8] placeholder-[#4a5550]"
              />
            </div>
            <button type="submit" className="bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm px-6 hover:bg-[#d4ff6b] transition-colors">
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
                className="flex items-center gap-2 px-4 py-2 text-sm border border-[#252c32] bg-[#111518] rounded-lg text-[#e8ede8] hover:border-[#c8f560] hover:text-[#c8f560] hover:bg-[#171c20] transition-all">
                {btn.label}
              </Link>
            ))}
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#4a5550] text-xs font-mono tracking-wider">Browse:</span>
            {quickTags.map((tag) => (
              <button key={tag} onClick={() => handleSearch(null, tag)}
                className="text-xs font-mono px-3 py-1.5 rounded-full border border-[#1e2e24] bg-[#151d18] text-[#6b7a72] hover:border-[#c8f560] hover:text-[#c8f560] hover:bg-[rgba(200,245,96,0.06)] transition-all">
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* STATS BAR */}
      <div className="border-y border-[#1e2428] bg-[#111518] overflow-x-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-0">
          {[
            { num: "654", label: "Companies", sub: "across 14 industries" },
            { num: "135", label: "Investors", sub: "VC, Angel & Philanthropy" },
            { num: "47", label: "Grants", sub: "with tracked deadlines" },
            { num: "14", label: "Categories", sub: "energy transition coverage" },
          ].map((stat, i) => (
            <div key={i} className={`flex items-center gap-4 pr-8 mr-8 flex-shrink-0 ${i < 3 ? "border-r border-[#1e2428]" : ""}`}>
              <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#c8f560]">{stat.num}</div>
              <div>
                <div className="text-sm font-medium text-[#e8ede8]">{stat.label}</div>
                <div className="text-xs text-[#6b7a72]">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROLE TILES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8]">Start here</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1e2428] border border-[#1e2428] rounded-xl overflow-hidden">
          {roleTiles.map((tile) => (
            <Link key={tile.title} href={tile.href}
              className="bg-[#111518] p-7 flex flex-col gap-3 hover:bg-[#171c20] transition-colors group">
              <tile.icon size={22} className="text-[#c8f560]" />
              <div style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#e8ede8]">{tile.title}</div>
              <div className="text-sm text-[#6b7a72] leading-relaxed font-light">{tile.desc}</div>
              <div className="text-xs text-[#c8f560] font-mono mt-auto pt-3 group-hover:gap-2 flex items-center gap-1 transition-all">
                {tile.cta} <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="border-t border-[#1e2428]" />

      {/* DIRECTORY BLOCKS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8]">Explore EP Investment</h2>
          <Link href="/search" className="text-xs text-[#6b7a72] font-mono tracking-wider hover:text-[#c8f560] transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { num: "654", title: "Companies", desc: "Browse climate companies by category, technology, and signals.", href: "/search" },
            { num: "135", title: "Investors", desc: "VC firms, angel syndicates, and philanthropic capital across the energy transition.", href: "/investors" },
            { num: "47", title: "Grants", desc: "Track non-dilutive funding opportunities, sorted by upcoming deadlines.", href: "/grants" },
          ].map((card) => (
            <Link key={card.title} href={card.href}
              className="relative bg-[#111518] border border-[#1e2428] rounded-xl p-7 flex flex-col gap-3 hover:border-[#c8f560] hover:bg-[#171c20] transition-all group">
              <div style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#c8f560]">{card.num}</div>
              <div className="text-base font-semibold text-[#e8ede8]">{card.title}</div>
              <div className="text-sm text-[#6b7a72] leading-relaxed font-light">{card.desc}</div>
              <span className="absolute right-6 top-7 text-[#4a5550] group-hover:text-[#c8f560] group-hover:translate-x-1 transition-all text-lg">→</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="border-t border-[#1e2428]" />

      {/* LIVE FEEDS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8]">Recently updated</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1e2428] border border-[#1e2428] rounded-xl overflow-hidden">
          {/* New Companies */}
          <div className="bg-[#111518] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1e2428]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#6b7a72]">New companies</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#c8f560] animate-pulse" />
            </div>
            {recentCompanies.length > 0 ? recentCompanies.map((co) => (
              <Link key={co.id} href={`/companies/${co.id}`}
                className="flex items-start gap-3 py-3 border-b border-[#1e2428] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#252c32] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#e8ede8] group-hover:text-[#c8f560] transition-colors">{co.name || co.url}</div>
                  {co.industry_tags?.[0] && (
                    <div className="text-xs font-mono text-[#4a5550] mt-1">{co.industry_tags[0]}</div>
                  )}
                </div>
              </Link>
            )) : [1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#1e2428] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#252c32] mt-1.5" />
                <div className="h-4 bg-[#1e2428] rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Investors */}
          <div className="bg-[#111518] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1e2428]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#6b7a72]">New investors</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#c8f560] animate-pulse" />
            </div>
            {["Breakthrough Energy Ventures", "Prelude Ventures", "Spring Lane Capital", "Azolla Ventures", "Clean Energy Ventures"].map((name) => (
              <Link key={name} href="/investors"
                className="flex items-start gap-3 py-3 border-b border-[#1e2428] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#252c32] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#e8ede8] group-hover:text-[#c8f560] transition-colors">{name}</div>
                  <div className="text-xs font-mono text-[#4a5550] mt-1">VC Firm</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Grants */}
          <div className="bg-[#111518] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#1e2428]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#6b7a72]">Grants closing soon</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#c8f560] animate-pulse" />
            </div>
            {[
              { name: "DOE Advanced Nuclear R&D", date: "Mar 12, 2026" },
              { name: "ARPA-E OPEN 2025", date: "Mar 28, 2026" },
              { name: "DOE Hydrogen Shot", date: "Apr 5, 2026" },
              { name: "NREL Clean Energy Fund", date: "Apr 18, 2026" },
              { name: "EU Horizon Climate", date: "May 2, 2026" },
            ].map((grant) => (
              <Link key={grant.name} href="/grants"
                className="flex items-start gap-3 py-3 border-b border-[#1e2428] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#252c32] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#e8ede8] group-hover:text-[#c8f560] transition-colors">{grant.name}</div>
                  <div className="text-xs font-mono mt-1 px-2 py-0.5 rounded-full bg-[rgba(255,150,80,0.1)] text-[#ff9650] border border-[rgba(255,150,80,0.2)] inline-block">{grant.date}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-[#1e2428]" />

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8]">Browse by category</h2>
          <Link href="/search" className="text-xs text-[#6b7a72] font-mono tracking-wider hover:text-[#c8f560] transition-colors">All categories →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => handleSearch(null, cat.slug.replace(/-/g, "_"))}
              className="bg-[#111518] border border-[#1e2428] rounded-xl p-5 flex flex-col gap-2 text-left hover:border-[#c8f560] hover:bg-[#171c20] hover:-translate-y-0.5 transition-all group">
              <div className="text-2xl">{cat.icon}</div>
              <div className="text-sm font-medium text-[#e8ede8] leading-snug">{cat.name}</div>
              <div className="text-xs text-[#4a5550] font-mono">{cat.count} companies</div>
            </button>
          ))}
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <div className="bg-[#111518] border-y border-[#1e2428]">
        <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8] mb-3">
              Get weekly <em className="text-[#c8f560] not-italic">EP Investment</em> updates
            </h2>
            <p className="text-[#6b7a72] text-sm leading-relaxed font-light max-w-sm">
              New investors, grant deadlines, verified companies seeking capital — delivered every week.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex bg-[#0a0d0f] border border-[#252c32] rounded-lg overflow-hidden focus-within:border-[#c8f560] transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent px-4 py-3 text-sm text-[#e8ede8] placeholder-[#4a5550] outline-none"
              />
              <button className="bg-[#c8f560] text-[#0a0d0f] text-sm font-semibold px-5 hover:bg-[#d4ff6b] transition-colors">
                Subscribe
              </button>
            </div>
            <div className="flex gap-5 flex-wrap">
              {["Weekly digest", "Grant deadline alerts", "New investor additions"].map((f) => (
                <span key={f} className="text-xs text-[#6b7a72] font-mono flex items-center gap-1">
                  <span className="text-[#c8f560]">✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[#1e2428] max-w-full px-8 py-8 flex items-center justify-between">
        <span style={{ fontFamily: "Georgia, serif" }} className="text-[#6b7a72] text-sm">EP Investment</span>
        <div className="flex gap-6">
          {["Companies", "Investors", "Grants", "Pricing", "About"].map((item) => (
            <Link key={item} href={`/${item.toLowerCase()}`} className="text-xs text-[#4a5550] hover:text-[#6b7a72] transition-colors">
              {item}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
