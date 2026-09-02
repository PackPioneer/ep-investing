"use client";

import { useState, useEffect, useMemo } from "react";
import { formatSector } from "@/lib/sectors";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import posthog from "posthog-js";

const quickTags = [
  { slug: "carbon_capture_storage", label: "Carbon Capture & Storage (CCS)" },
  { slug: "green_hydrogen", label: "Green Hydrogen" },
  { slug: "nuclear_technologies", label: "Nuclear Technologies" },
  { slug: "carbon_credits", label: "Carbon Credits" },
  { slug: "battery_storage", label: "Battery Storage" },
  { slug: "electric_aviation", label: "Electric Aviation" },
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
  { title: "Company", desc: "Get discovered, raise, hire, and announce.", cta: "Claim your profile", href: "/onboarding/company" },
  { title: "Investor", desc: "Track deals and follow the whole market.", cta: "Get investor access", href: "/onboarding/investor" },
  { title: "Expert", desc: "Get found for high-impact climate roles.", cta: "Join as an expert", href: "/experts" },
  { title: "NGO", desc: "Partner, convene, and list grants and jobs.", cta: "List your organization", href: "/ngos" },
  { title: "Individual", desc: "Follow your sectors, get a feed built for you.", cta: "Join free", href: "/onboarding/individual" },
];

const FEED_LABEL = { raise_close: "Raise", raise_open: "Raising", partnership: "Partnership", product: "Product", hire: "Hire", milestone: "Milestone", award: "Award", expansion: "Expansion", other: "Update" };
const FEED_STYLE = {
  Raise: ["#efe9fb", "#5b3fa8"], Raising: ["#efe9fb", "#5b3fa8"], Partnership: ["#e2eff0", "#0d6a72"],
  Product: ["#faece7", "#993c1d"], Hire: ["#e6f1fb", "#185fa5"], Milestone: ["#e2eff0", "#0d6a72"],
  Award: ["#e6f2ea", "#2d6a4f"], Expansion: ["#fbeaf0", "#993556"], Update: ["#f2f4f6", "#4a5568"],
  Insight: ["#e6f1fb", "#185fa5"], New: ["#e6f2ea", "#2d6a4f"],
};
const ago = (d) => {
  if (!d) return "";
  const h = (Date.now() - new Date(d).getTime()) / 3.6e6;
  if (h < 1) return "just now";
  if (h < 24) return `${Math.round(h)}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
};
const fmt = (n, fallback) => (typeof n === "number" ? n.toLocaleString() : fallback);

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState(null);
  const [email, setEmail] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats).catch(() => {});
    fetch("/api/companies?limit=6").then(r => r.json()).then(d => { if (Array.isArray(d)) setRecentCompanies(d.slice(0, 6)); }).catch(() => {});
    fetch("/api/announcements?limit=8").then(r => r.json()).then(d => { if (Array.isArray(d)) setAnnouncements(d); }).catch(() => {});
    fetch("/api/news?limit=8").then(r => r.json()).then(d => { const arr = Array.isArray(d) ? d : (d?.articles || []); setNews(arr); }).catch(() => {});
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
      await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      posthog.identify(email, { email });
      posthog.capture("newsletter_subscribed", { email, source: "homepage" });
      setEmailStatus("success");
      setEmail("");
    } catch { setEmailStatus("error"); }
  };

  const liveFeed = useMemo(() => {
    const items = [];
    for (const a of announcements) {
      items.push({ id: `a${a.id}`, kind: FEED_LABEL[a.category] || "Update", title: `${a.company?.name ? a.company.name + ": " : ""}${a.title}`, when: a.published_at, href: a.company?.id ? `/companies/${a.company.id}` : "/announcements" });
    }
    for (const n of (news || []).slice(0, 6)) {
      items.push({ id: `n${n.id}`, kind: "Insight", title: n.title, when: n.published_at, href: "/news" });
    }
    for (const co of recentCompanies.slice(0, 4)) {
      items.push({ id: `c${co.id}`, kind: "New", title: `${co.name || co.url} joined EP Network`, when: co.created_at, href: `/companies/${co.slug || co.id}` });
    }
    return items.filter(x => x.title).sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0)).slice(0, 8);
  }, [announcements, news, recentCompanies]);

  const statBar = [
    { num: fmt(stats?.companies, "1,300+"), label: "Companies", href: "/search" },
    { num: fmt(stats?.investors, "350+"), label: "Investors", href: "/investors" },
    { num: fmt(stats?.grants, "185+"), label: "Grants", href: "/grants" },
    { num: fmt(stats?.jobs, "500+"), label: "Jobs", href: "/jobs" },
    { num: fmt(stats?.ngos, "55+"), label: "NGOs", href: "/ngos" },
  ];

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 items-center">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#2d6a4f] mb-3">The energy transition network</div>
              <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-4xl md:text-[42px] font-bold leading-[1.08] tracking-tight mb-4">
                Where the energy transition connects.
              </h1>
              <p className="text-[#4a5852] text-base leading-relaxed mb-6">
                Build a profile, follow the companies and sectors you care about, and get a dashboard and feed built around you — updated daily.
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Link href="/get-started" style={{ fontFamily: "var(--font-display), sans-serif" }} className="bg-[#2d6a4f] text-white font-bold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
                  Join the network
                </Link>
                <button onClick={() => setShowDemo(true)} style={{ fontFamily: "var(--font-display), sans-serif" }} className="border border-[#dbdfe4] text-[#0f1a14] font-bold text-sm rounded-lg px-6 py-3 hover:border-[#2d6a4f] transition-all">
                  Watch demo
                </button>
              </div>
              <div className="text-xs text-[#8a958f] font-mono">Free to join · from the team behind The Energy Pioneer</div>
            </div>

            {/* Dashboard hero mockup */}
            <div className="bg-white rounded-xl border border-[#e8eaee] overflow-hidden grid grid-cols-[140px_1fr] min-h-[420px]">
              <div className="bg-[#0f1a14] p-3">
                <div className="mb-4 px-1.5">
                  <span style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-white text-sm font-bold">EP </span>
                  <span style={{ fontFamily: "var(--font-display), sans-serif", fontStyle: "italic" }} className="text-[#2d6a4f] text-sm font-bold">Network</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {[
                    { label: "Overview", active: false }, { label: "For You", active: true },
                    { label: "Edit profile", active: false }, { label: "Raise capital", active: false },
                    { label: "Post a job", active: false }, { label: "Share an update", active: false },
                    { label: "Find investors", active: false }, { label: "Hire experts", active: false },
                  ].map(item => (
                    <div key={item.label} className={`px-2 py-1.5 text-[11px] rounded ${item.active ? "bg-[rgba(45,106,79,0.4)] text-white font-medium" : "text-white/50"}`}>{item.label}</div>
                  ))}
                </div>
              </div>
              <div className="p-3.5 bg-[#fafbfc]">
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#718096] mb-2">Activity in your sector</div>
                {[
                  ["IPO", "#e1f5ee", "#0f6e56", "Climate Capital Weekly", "2h", "Battery storage firm surges 23% on first trading day"],
                  ["Funding", "#f2f4f6", "#2d6a4f", "Energy Intelligence", "8h", "Green hydrogen startup closes $80M Series B"],
                  ["Activity", "#faece7", "#993c1d", "Solar Futures", "1d", "Free market and storage reshape Brazilian solar sector"],
                ].map(([k, bg, fg, src, w, t]) => (
                  <div key={t} className="bg-white border border-[#e8eaee] rounded-md p-2.5 mb-1.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[8px] px-1.5 py-px rounded-full font-medium" style={{ background: bg, color: fg }}>{k}</span>
                      <span className="text-[8px] text-[#718096] font-mono">{src}</span>
                      <span className="text-[8px] text-[#718096] ml-auto">{w}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-[#0f1a14] leading-tight">{t}</div>
                  </div>
                ))}
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#718096] mb-2 mt-3">Policy &amp; deadlines</div>
                {[
                  ["Policy", "#e6f1fb", "#185fa5", "Nuclear Business", "May 3", "Virginia coal combustion residuals approval proposed"],
                  ["Grant", "#faeeda", "#854f0b", "DOE", "5 days left", "H2 Bridge Demonstration · $14M deadline approaching"],
                ].map(([k, bg, fg, src, w, t]) => (
                  <div key={t} className="bg-white border border-[#e8eaee] rounded-md p-2.5 mb-1.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[8px] px-1.5 py-px rounded-full font-medium" style={{ background: bg, color: fg }}>{k}</span>
                      <span className="text-[8px] text-[#718096] font-mono">{src}</span>
                      <span className="text-[8px] text-[#718096] ml-auto">{w}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-[#0f1a14] leading-tight">{t}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* STATS BAR */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <div className="bg-white border border-[#e8eaee] rounded-xl grid grid-cols-2 md:grid-cols-5 divide-x divide-[#e8eaee] overflow-hidden">
          {statBar.map(s => (
            <Link key={s.label} href={s.href} className="px-5 py-5 text-center hover:bg-[#fafbfc] transition-colors">
              <div style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl md:text-3xl font-bold text-[#2d6a4f]">{s.num}</div>
              <div className="text-xs text-[#4a5568] mt-1 font-mono uppercase tracking-wider">{s.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* SEARCH */}
      <section className="max-w-6xl mx-auto px-6 pb-4">
        <form onSubmit={handleSearch} className="flex max-w-2xl bg-white border border-[#dbdfe4] rounded-xl overflow-hidden mb-4 focus-within:border-[#2d6a4f] focus-within:shadow-[0_0_0_3px_rgba(45,106,79,0.12)] transition-all">
          <input name="q" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSearch(e); } }} placeholder="Search companies, investors, grants, sectors…"
            className="w-full py-3.5 px-4 bg-transparent outline-none text-sm text-[#0f1a14] placeholder-[#8a958f]" />
          <button type="submit" style={{ fontFamily: "var(--font-display), sans-serif" }} className="bg-[#2d6a4f] text-white font-bold text-sm px-6 hover:bg-[#235a40] transition-colors">Search</button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[#8a958f] text-xs font-mono">Browse:</span>
          {quickTags.map(tag => (
            <button key={tag.slug} onClick={() => handleSearch(null, tag.slug)}
              className="text-xs font-mono px-3 py-1.5 rounded-full border border-[#dbe2de] bg-[#f2f4f6] text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
              {tag.label}
            </button>
          ))}
        </div>
      </section>

      {/* JOIN AS */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl font-bold mb-6">Join as</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {roleTiles.map(tile => (
            <Link key={tile.title} href={tile.href} className="bg-white border border-[#e8eaee] rounded-xl p-5 flex flex-col gap-2 hover:border-[#2d6a4f] hover:bg-[#fafbfc] transition-all">
              <div style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-lg font-bold text-[#0f1a14]">{tile.title}</div>
              <div className="text-xs text-[#4a5568] leading-relaxed flex-1">{tile.desc}</div>
              <div className="text-xs text-[#2d6a4f] font-semibold mt-1">{tile.cta}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* LIVE ON THE NETWORK */}
      <section className="max-w-6xl mx-auto px-6 pb-4">
        <div className="flex items-end justify-between mb-5">
          <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl font-bold">Live on the network</h2>
          <Link href="/announcements" className="text-xs text-[#4a5568] font-mono hover:text-[#2d6a4f] transition-colors">See the newsroom</Link>
        </div>
        <div className="bg-white border border-[#e8eaee] rounded-xl overflow-hidden">
          {liveFeed.length > 0 ? liveFeed.map(item => {
            const [bg, fg] = FEED_STYLE[item.kind] || FEED_STYLE.Update;
            return (
              <Link key={item.id} href={item.href} className="flex items-start gap-3 px-5 py-3.5 border-b border-[#f2f4f6] last:border-0 hover:bg-[#fafbfc] transition-colors">
                <span className="text-[9px] font-mono uppercase tracking-wide px-2 py-1 rounded flex-shrink-0" style={{ background: bg, color: fg }}>{item.kind}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#0f1a14] leading-snug">{item.title}</div>
                </div>
                <span className="text-xs text-[#8a958f] whitespace-nowrap flex-shrink-0">{ago(item.when)}</span>
              </Link>
            );
          }) : [1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f2f4f6] last:border-0">
              <div className="h-5 w-14 bg-[#f2f4f6] rounded animate-pulse" />
              <div className="h-4 bg-[#f2f4f6] rounded w-64 animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* ENERGY PIONEER STRIP */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-[#0f1a14] rounded-xl px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-white text-lg font-bold">Independent journalism on the energy transition.</div>
            <div className="text-[#8a9a90] text-sm mt-0.5">EP Network is built by The Energy Pioneer — energy transition news and analysis, across the globe.</div>
          </div>
          <a href="https://www.theenergypioneer.com" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-display), sans-serif" }}
            className="flex-shrink-0 text-[#cdd6d1] text-sm font-bold border border-[#2f3d36] rounded-lg px-4 py-2.5 hover:bg-[#16241d] transition-colors">
            Read The Energy Pioneer
          </a>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl font-bold">Browse by sector</h2>
          <Link href="/search" className="text-xs text-[#4a5568] font-mono hover:text-[#2d6a4f] transition-colors">All sectors</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {categories.map(cat => (
            <button key={cat.name} onClick={() => handleSearch(null, cat.slug)}
              className="bg-white border border-[#e8eaee] rounded-xl p-4 flex flex-col gap-1.5 text-left hover:border-[#2d6a4f] hover:bg-[#fafbfc] transition-all">
              <div className="text-sm font-semibold text-[#0f1a14] leading-snug">{cat.name}</div>
              <div className="text-xs text-[#8a958f] font-mono">{cat.count} companies</div>
            </button>
          ))}
        </div>
      </section>

      {/* CREATE YOUR DASHBOARD */}
      <div className="bg-white border-y border-[#e8eaee]">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-3xl font-bold mb-3">Create your dashboard</h2>
          <p className="text-[#4a5568] text-sm leading-relaxed max-w-md mx-auto mb-7">Follow the companies, investors, and sectors you care about, and get a feed and dashboard built around you — free.</p>
          <Link href="/get-started" style={{ fontFamily: "var(--font-display), sans-serif" }}
            className="inline-block bg-[#2d6a4f] text-white font-bold text-sm rounded-lg px-7 py-3.5 hover:bg-[#235a40] transition-all">
            Create your dashboard
          </Link>
        </div>
      </div>

      {/* DEMO MODAL */}
      {showDemo && (
        <div onClick={() => setShowDemo(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div onClick={e => e.stopPropagation()} className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden border border-[#2d6a4f]">
            <button onClick={() => setShowDemo(false)} className="absolute top-2 right-3 z-10 text-white/80 hover:text-white text-xl leading-none">✕</button>
            <video src="https://vfcfdoaxlbkfqpfzhzvu.supabase.co/storage/v1/object/public/Demo%20Video/EP%20Investing%20Dashboard%20Overview.mp4" controls autoPlay preload="none" className="w-full h-auto block" />
          </div>
        </div>
      )}
    </div>
  );
}
