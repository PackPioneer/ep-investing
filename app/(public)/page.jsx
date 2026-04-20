"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowRight, TrendingUp, Zap, Users, Briefcase } from "lucide-react";
import posthog from "posthog-js";

const quickTags = [
  { slug: "direct_air_capture", label: "Direct Air Capture" },
  { slug: "green_hydrogen", label: "Green Hydrogen" },
  { slug: "nuclear_technologies", label: "Nuclear Technologies" },
  { slug: "carbon_credits", label: "Carbon Credits" },
  { slug: "clean_cooking", label: "Clean Cooking" },
  { slug: "electric_aviation", label: "Electric Aviation" },
  { slug: "battery_storage", label: "Battery Storage" },
];

const categories = [
  { name: "Nuclear Technologies", count: 126, slug: "nuclear_technologies" },
  { name: "Electric Aviation", count: 74, slug: "electric_aviation" },
  { name: "Battery Storage", count: 69, slug: "battery_storage" },
  { name: "Green Hydrogen", count: 64, slug: "green_hydrogen" },
  { name: "Wind Energy", count: 60, slug: "wind_energy" },
  { name: "SAF / Efuels", count: 52, slug: "saf_efuels" },
  { name: "Geothermal", count: 39, slug: "geothermal" },
  { name: "Industrial Decarb", count: 37, slug: "industrial_decarb" },
  { name: "Solar", count: 37, slug: "solar" },
  { name: "EV Charging", count: 33, slug: "ev_charging" },
];

const roleTiles = [
  {
    icon: TrendingUp,
    title: "Investors",
    desc: "Source deals and track the energy transition across 14 sectors.",
    cta: "Get investor access",
    href: "/onboarding/investor",
  },
  {
    icon: Zap,
    title: "Founders",
    desc: "Get matched with investors and surface your company to the right people.",
    cta: "Claim your profile",
    href: "/onboarding/company",
  },
  {
    icon: Users,
    title: "Experts",
    desc: "Get hired for high-impact climate roles and attract inbound deal flow.",
    cta: "Join as an expert",
    href: "/experts",
  },
  {
    icon: Briefcase,
    title: "Researchers",
    desc: "Browse companies, open roles, and grants across the energy transition.",
    cta: "Get started free",
    href: "/onboarding/researcher",
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [recentInvestors, setRecentInvestors] = useState([]);
  const [recentGrants, setRecentGrants] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/companies?limit=5")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentCompanies(data.slice(0, 5)); })
      .catch(() => {});
    fetch("/api/investors")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentInvestors(data.slice(0, 5)); })
      .catch(() => {});
    fetch("/api/grants")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentGrants(data.slice(0, 5)); })
      .catch(() => {});
    fetch("/api/jobs?limit=5")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setRecentJobs(data.slice(0, 5)); })
      .catch(() => {});
  }, []);

  const handleSearch = (e, override) => {
    if (e) e.preventDefault();
    const term = override || query;
    if (!term.trim()) return;
    posthog.capture("search_performed", { query: term, source: "homepage" });
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleEmailSubmit = async () => {
    if (!email || !email.includes("@")) return;
    setEmailStatus("loading");
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      posthog.identify(email, { email });
      posthog.capture("newsletter_subscribed", { email, source: "homepage" });
      setEmailStatus("success");
      setEmail("");
    } catch {
      setEmailStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(45,106,79,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,79,0.4) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            Climate Finance Intelligence
          </div>

          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl md:text-7xl leading-[1.05] tracking-tight text-[#0f1a14] max-w-4xl mb-6">
            Capital discovery for{" "}
            <em className="text-[#2d6a4f] not-italic">the energy transition.</em>
          </h1>

          <p className="text-[#4a5568] text-lg max-w-xl leading-relaxed mb-10 font-light">
            Search companies, investors, grants, and jobs across climate and energy — curated, structured, and updated regularly.
          </p>

          <form onSubmit={handleSearch} className="flex max-w-2xl bg-[#ffffff] border border-[#d0d6e0] rounded-xl overflow-hidden mb-6 focus-within:border-[#2d6a4f] focus-within:shadow-[0_0_0_3px_rgba(45,106,79,0.12)] transition-all">
            <div className="flex items-center flex-1 px-4 gap-3">
              <Search size={16} className="text-[#718096] flex-shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search direct air capture, Breakthrough Energy, DOE grants…"
                className="w-full py-4 bg-transparent outline-none text-sm text-[#0f1a14] placeholder-[#718096]"
              />
            </div>
            <button type="submit" className="bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm px-6 hover:bg-[#235a40] transition-colors">
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 mb-12">
            <span className="text-[#718096] text-xs font-mono tracking-wider">Browse:</span>
            {quickTags.map(tag => (
              <button key={tag.slug} onClick={() => handleSearch(null, tag.slug)}
                className="text-xs font-mono px-3 py-1.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f] hover:bg-[rgba(45,106,79,0.06)] transition-all">
                {tag.label}
              </button>
            ))}
          </div>

          {/* ROLE CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleTiles.map(tile => (
              <Link key={tile.title} href={tile.href}
                className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2d6a4f] transition-all group">
                <div className="w-9 h-9 rounded-lg bg-[#eef1f6] flex items-center justify-center">
                  <tile.icon size={18} className="text-[#2d6a4f]" />
                </div>
                <div style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0f1a14]">{tile.title}</div>
                <div className="text-xs text-[#4a5568] leading-relaxed font-light flex-1">{tile.desc}</div>
                <div className="text-xs text-[#2d6a4f] font-mono flex items-center gap-1 group-hover:gap-2 transition-all mt-1">
                  {tile.cta} <ArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* STATS BAR */}
      <div className="border-y border-[#e2e6ed] bg-[#ffffff] overflow-x-auto">
        <div className="max-w-6xl mx-auto px-6 py-4 flex gap-0 justify-center">
          {[
            { num: "1,300+", label: "Companies", sub: "across 14 industries" },
            { num: "350", label: "Investors", sub: "VC, Angel & Philanthropy" },
            { num: "185+", label: "Grants", sub: "with tracked deadlines" },
            { num: "14", label: "Categories", sub: "energy transition coverage" },
            { num: "500+", label: "Jobs", sub: "across climate sectors" },
          ].map((stat, i) => (
            <div key={i} className={`flex items-center gap-4 pr-8 mr-8 flex-shrink-0 ${i < 4 ? "border-r border-[#e2e6ed]" : ""}`}>
              <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#2d6a4f]">{stat.num}</div>
              <div>
                <div className="text-sm font-medium text-[#0f1a14]">{stat.label}</div>
                <div className="text-xs text-[#4a5568]">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DIRECTORY BLOCKS */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14]">Explore EP Investing</h2>
          <Link href="/search" className="text-xs text-[#4a5568] font-mono tracking-wider hover:text-[#2d6a4f] transition-colors">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { num: "1,300+", title: "Companies", desc: "Browse climate companies by category, technology, and signals.", href: "/search" },
            { num: "350", title: "Investors", desc: "VC firms, angel syndicates, and philanthropic capital across the energy transition.", href: "/investors" },
            { num: "185+", title: "Grants", desc: "Track non-dilutive funding opportunities, sorted by upcoming deadlines.", href: "/grants" },
            { num: "500+", title: "Jobs", desc: "Roles across the energy transition — from deep tech to climate finance.", href: "/jobs" },
          ].map(card => (
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
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-8">Recently updated</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-[#e2e6ed] border border-[#e2e6ed] rounded-xl overflow-hidden">

          <div className="bg-[#ffffff] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2e6ed]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#4a5568]">New companies</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            </div>
            {recentCompanies.length > 0 ? recentCompanies.map(co => (
              <Link key={co.id} href={`/companies/${co.id}`}
                className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{co.name || co.url}</div>
                  {co.industry_tags?.[0] && <div className="text-xs font-mono text-[#718096] mt-1">{co.industry_tags[0].replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</div>}
                </div>
              </Link>
            )) : [1,2,3,4,5].map(i => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5" />
                <div className="h-4 bg-[#e2e6ed] rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="bg-[#ffffff] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2e6ed]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#4a5568]">Investors</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            </div>
            {recentInvestors.length > 0 ? recentInvestors.map(inv => (
              <Link key={inv.id} href="/investors"
                className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{inv.name}</div>
                  <div className="text-xs font-mono text-[#718096] mt-1">{inv.type?.replace(/_/g, " ") || "VC Firm"}</div>
                </div>
              </Link>
            )) : [1,2,3,4,5].map(i => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5" />
                <div className="h-4 bg-[#e2e6ed] rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="bg-[#ffffff] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2e6ed]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#4a5568]">Grants closing soon</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            </div>
            {recentGrants.length > 0 ? recentGrants.map(grant => (
              <Link key={grant.id} href="/grants"
                className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{(grant.title || "").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</div>
                  {grant.deadline_date && (
                    <div className="text-xs font-mono mt-1 px-2 py-0.5 rounded-full bg-[rgba(255,150,80,0.1)] text-[#ff9650] border border-[rgba(255,150,80,0.2)] inline-block">
                      {new Date(grant.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  )}
                </div>
              </Link>
            )) : [1,2,3,4,5].map(i => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5" />
                <div className="h-4 bg-[#e2e6ed] rounded w-32 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="bg-[#ffffff] p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#e2e6ed]">
              <span className="text-xs font-mono tracking-widest uppercase text-[#4a5568]">New jobs</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
            </div>
            {recentJobs.length > 0 ? recentJobs.map(job => (
              <Link key={job.id} href="/jobs"
                className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0 hover:opacity-80 transition-opacity group">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">{job.title}</div>
                  <div className="text-xs font-mono text-[#718096] mt-1">{job.company}</div>
                </div>
              </Link>
            )) : [1,2,3,4,5].map(i => (
              <div key={i} className="flex items-start gap-3 py-3 border-b border-[#e2e6ed] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d0d6e0] mt-1.5" />
                <div className="h-4 bg-[#e2e6ed] rounded w-32 animate-pulse" />
              </div>
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
          {categories.map(cat => (
            <button key={cat.name} onClick={() => handleSearch(null, cat.slug)}
              className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-5 flex flex-col gap-2 text-left hover:border-[#2d6a4f] hover:bg-[#f8f9fb] hover:-translate-y-0.5 transition-all">
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
              Get weekly <em className="text-[#2d6a4f] not-italic">EP Investing</em> updates
            </h2>
            <p className="text-[#4a5568] text-sm leading-relaxed font-light max-w-sm">
              New investors, grant deadlines, verified companies seeking capital — delivered every week.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {emailStatus === "success" ? (
              <div className="bg-[rgba(45,106,79,0.08)] border border-[#c8d8cc] rounded-lg px-4 py-3 text-sm text-[#2d6a4f] font-medium">
                ✓ You're subscribed — check your inbox.
              </div>
            ) : (
              <div className="flex bg-[#f2f4f8] border border-[#d0d6e0] rounded-lg overflow-hidden focus-within:border-[#2d6a4f] transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleEmailSubmit()}
                  placeholder="your@email.com"
                  className="flex-1 bg-transparent px-4 py-3 text-sm text-[#0f1a14] placeholder-[#718096] outline-none"
                />
                <button onClick={handleEmailSubmit} disabled={emailStatus === "loading"}
                  className="bg-[#2d6a4f] text-[#f2f4f8] text-sm font-semibold px-5 hover:bg-[#235a40] transition-colors disabled:opacity-60">
                  {emailStatus === "loading" ? "..." : "Subscribe"}
                </button>
              </div>
            )}
            <div className="flex gap-5 flex-wrap">
              {["Weekly digest", "Grant deadline alerts", "New investor additions"].map(f => (
                <span key={f} className="text-xs text-[#4a5568] font-mono flex items-center gap-1">
                  <span className="text-[#2d6a4f]">✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}