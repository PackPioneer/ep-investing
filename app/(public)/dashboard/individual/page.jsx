"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INDUSTRIES, INDUSTRY_LABELS } from "@/lib/industries";
import { usePaywall } from "@/components/PaywallModal";
import MarketsTab from "@/components/dashboard/MarketsTab";
import RaisingTab from "@/components/dashboard/RaisingTab";

// Pro features are open during the free period; flip to false to hard-gate.
const FREE_PREVIEW = true;
function ProGate({ hasPayment, children }) {
  if (hasPayment || FREE_PREVIEW) return children;
  return (
    <div className="bg-white border border-[#e8eaee] rounded-2xl p-8 text-center max-w-lg mx-auto">
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#2d6a4f] mb-2">EP Network Pro</div>
      <h3 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl font-bold text-[#0f1a14] mb-2">Unlock the intelligence layer</h3>
      <p className="text-sm text-[#4a5568] mb-5 max-w-sm mx-auto">Go Pro for the market tracker, live deal flow, and research reports across the energy transition.</p>
      <a href="/pricing" className="inline-block bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40]">See Pro plans</a>
    </div>
  );
}

const GEO_OPTIONS = ["us", "europe", "asia", "africa", "latam", "mena", "global"];
const GEO_LABELS = { us: "US", europe: "Europe", asia: "Asia", africa: "Africa", latam: "LatAm", mena: "MENA", global: "Global" };

const NEWS_COLORS = {
  product: "bg-emerald-50 text-emerald-700", policy: "bg-blue-50 text-blue-700",
  market: "bg-amber-50 text-amber-700", regulatory: "bg-violet-50 text-violet-700",
  partnership: "bg-teal-50 text-teal-700", funding: "bg-fuchsia-50 text-fuchsia-700",
  m_and_a: "bg-indigo-50 text-indigo-700", other: "bg-slate-100 text-slate-600",
};
const NEWS_LABELS = { product: "Product", policy: "Policy", market: "Market", regulatory: "Regulatory", partnership: "Partnership", funding: "Funding", m_and_a: "M&A", other: "Other" };
const ANN_LABEL = { raise_close: "Raise", raise_open: "Raising", partnership: "Partnership", product: "Product", hire: "Hire", milestone: "Milestone", award: "Award", expansion: "Expansion", other: "Update" };

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}
const Spinner = () => <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />;

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`text-xs rounded-full px-3 py-1.5 border transition-all ${active ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#0f1a14] border-[#dbdfe4] hover:border-[#2d6a4f]"}`}>
      {label}
    </button>
  );
}

export default function IndividualDashboard() {
  const { user, isLoaded } = useUser();
  const { hasPayment } = usePaywall();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [news, setNews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("feed");

  // follows
  const [followIds, setFollowIds] = useState(new Set());
  const [followedCompanies, setFollowedCompanies] = useState([]);

  // expert listing
  const [listing, setListing] = useState(null);
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [savingListing, setSavingListing] = useState(false);
  const [listingSaved, setListingSaved] = useState(false);

  // research filters
  const [industryFilter, setIndustryFilter] = useState("");
  const [geoFilter, setGeoFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");

  // feedback (relocated out of the tab bar)
  const [showFeedback, setShowFeedback] = useState(false);
  const [reqCategory, setReqCategory] = useState("company");
  const [reqDetails, setReqDetails] = useState("");
  const [reqSending, setReqSending] = useState(false);
  const [reqSent, setReqSent] = useState(false);

  const loadFollows = () => fetch("/api/dashboard/individual/follows").then((r) => r.json()).then((d) => {
    setFollowIds(new Set(d.ids || []));
    setFollowedCompanies(d.companies || []);
  }).catch(() => {});

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch("/api/dashboard/individual/feed").then((r) => r.json()).catch(() => ({})),
      fetch("/api/news/for-you?limit=8").then((r) => r.json()).catch(() => ({})),
      fetch("/api/dashboard/individual/expert").then((r) => r.json()).catch(() => ({})),
      fetch("/api/announcements?limit=50").then((r) => r.json()).catch(() => []),
    ]).then(([feed, newsRes, listingRes, annRes]) => {
      if (!feed || !feed.member) { router.replace("/onboarding/individual"); return; }
      setData(feed);
      setNews(Array.isArray(newsRes.articles) ? newsRes.articles : []);
      setAnnouncements(Array.isArray(annRes) ? annRes : []);
      const l = listingRes.listing;
      setListing(l);
      if (l) { setBio(l.bio || ""); setExpertise((l.expertise_areas || []).join(", ")); setLinkedin(l.linkedin_url || ""); setWebsite(l.website_url || ""); }
      setLoading(false);
    });
    loadFollows();
    fetch("/api/reports").then((r) => r.json()).then((d) => setReports(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isLoaded, user]);

  const toggleFollow = async (id) => {
    const has = followIds.has(id);
    setFollowIds((prev) => { const n = new Set(prev); has ? n.delete(id) : n.add(id); return n; });
    try {
      if (has) await fetch(`/api/dashboard/individual/follows?company_id=${id}`, { method: "DELETE" });
      else await fetch("/api/dashboard/individual/follows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: id }) });
    } catch (e) {}
    loadFollows();
  };

  const saveListing = async (listNow) => {
    setSavingListing(true); setListingSaved(false);
    try {
      const res = await fetch("/api/dashboard/individual/expert", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, expertise_areas: expertise.split(",").map((s) => s.trim()).filter(Boolean), linkedin_url: linkedin, website_url: website, list: listNow }),
      });
      if (res.ok) { setListingSaved(true); setListing((p) => ({ ...(p || {}), is_listed: listNow ? true : (p?.is_listed || false), status: listNow ? "pending" : p?.status })); }
    } catch (e) {}
    setSavingListing(false);
  };

  const sendRequest = async () => {
    if (!reqDetails.trim()) return;
    setReqSending(true);
    try {
      const res = await fetch("/api/dashboard/individual/requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: reqCategory, details: reqDetails, email: user?.primaryEmailAddress?.emailAddress }),
      });
      if (res.ok) { setReqSent(true); setReqDetails(""); }
    } catch (e) {}
    setReqSending(false);
  };

  if (!isLoaded || loading) {
    return <div className="min-h-[70vh] bg-[#f6f7f9] flex items-center justify-center"><Spinner /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[#f6f7f9] flex items-center justify-center px-6" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        <div className="text-center">
          <p className="text-[#4a5568] mb-4">Please sign in to view your dashboard.</p>
          <a href="/sign-in" className="inline-block bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3">Sign in</a>
        </div>
      </div>
    );
  }

  const member = data?.member;
  const allCompanies = data?.companies || [];
  const industries = member?.industries || [];
  const firstName = member?.name?.split(" ")[0] || user?.firstName || "there";
  const isListed = listing?.is_listed;
  const listingStatus = listing?.status;

  const followedUpdates = announcements.filter((a) => a.company && followIds.has(a.company.id)).slice(0, 8);

  const researchCompanies = (() => {
    let list = [...allCompanies];
    if (searchQuery.trim()) { const q = searchQuery.trim().toLowerCase(); list = list.filter((c) => (c.name || "").toLowerCase().includes(q)); }
    if (industryFilter) list = list.filter((c) => (c.industry_tags || []).includes(industryFilter));
    if (geoFilter) list = list.filter((c) => {
      const loc = ((c.headquarters_country || c.location || "") + "").toLowerCase();
      const map = { us: ["united states", "usa", "u.s", "us"], europe: ["europe", "uk", "germany", "france", "spain", "netherlands", "sweden", "norway", "denmark", "italy"], asia: ["china", "japan", "india", "singapore", "korea"], africa: ["africa", "kenya", "nigeria", "south africa"], latam: ["brazil", "mexico", "chile", "argentina"], mena: ["saudi", "uae", "emirates", "israel", "egypt"], global: [] };
      return (map[geoFilter] || []).some((n) => loc.includes(n));
    });
    if (sortBy === "name") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return list;
  })();

  const TABS = [
    { id: "feed", label: "Your feed" },
    { id: "following", label: `Following${followIds.size ? ` · ${followIds.size}` : ""}` },
    { id: "research", label: "Discover" },
    { id: "markets", label: "Markets", pro: true },
    { id: "raising", label: "Deal flow", pro: true },
    { id: "reports", label: "Reports", pro: true },
    { id: "expert", label: "Expert" },
  ];

  const FollowBtn = ({ id }) => {
    const has = followIds.has(id);
    return (
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFollow(id); }}
        className={`text-xs font-semibold rounded-lg px-3 py-1.5 border transition-all flex-shrink-0 ${has ? "bg-[#eef4f0] text-[#2d6a4f] border-[#c9e0d3]" : "bg-white text-[#0f1a14] border-[#dbdfe4] hover:border-[#2d6a4f]"}`}>
        {has ? "Following" : "Follow"}
      </button>
    );
  };
  const Logo = ({ c }) => (
    <div className="w-10 h-10 rounded-lg bg-[#f6f7f9] border border-[#e8eaee] flex items-center justify-center overflow-hidden shrink-0 text-sm font-semibold text-[#2d6a4f]">
      {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = "none"; }} /> : (c.name?.[0] || "?")}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f9] px-6 py-10" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

        {/* LEFT SIDEBAR */}
        <aside className="md:w-56 flex-shrink-0 md:sticky md:top-6 md:self-start">
          <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl font-bold text-[#0f1a14] mb-1">Welcome back, {firstName}</h1>
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <span className="text-[11px] text-[#4a5568]">Following:</span>
            {industries.length > 0 ? industries.map((slug) => (
              <span key={slug} className="text-[11px] bg-white border border-[#e8eaee] rounded-full px-2.5 py-0.5 text-[#0f1a14]">{INDUSTRY_LABELS[slug] || slug}</span>
            )) : <Link href="/onboarding/individual" className="text-[11px] text-[#2d6a4f] underline">Set up your industries</Link>}
          </div>

          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible border-b md:border-b-0 border-[#e8eaee] pb-2 md:pb-0">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center justify-between gap-2 text-left text-sm font-medium rounded-lg px-3 py-2 whitespace-nowrap transition-colors ${tab === t.id ? "bg-[#eef4f0] text-[#0f1a14]" : "text-[#4a5568] hover:bg-white hover:text-[#0f1a14]"}`}>
                <span>{t.label}</span>
                {t.pro && <span className="text-[9px] font-mono uppercase tracking-wide bg-[#eef4f0] text-[#2d6a4f] rounded px-1 py-0.5">Pro</span>}
              </button>
            ))}
          </nav>

          <button onClick={() => { setShowFeedback(true); setReqSent(false); }} className="hidden md:block text-xs text-[#8a958f] hover:text-[#2d6a4f] mt-6">Send feedback</button>
        </aside>

        {/* RIGHT CONTENT */}
        <div className="flex-1 min-w-0">

        {/* YOUR FEED */}
        {tab === "feed" && (
          <div>
            {followedUpdates.length > 0 && (
              <div className="mb-10">
                <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl font-bold text-[#0f1a14] mb-4">From companies you follow</h2>
                <div className="bg-white border border-[#e8eaee] rounded-xl divide-y divide-[#f0f2f6]">
                  {followedUpdates.map((a) => (
                    <Link key={a.id} href={a.company?.id ? `/companies/${a.company.id}` : "/announcements"} className="flex items-start gap-3 p-4 hover:bg-[#fafbfc] transition-colors">
                      <span className="text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 bg-[#eef4f0] text-[#2d6a4f] flex-shrink-0 mt-0.5">{ANN_LABEL[a.category] || "Update"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#0f1a14] leading-snug">{a.company?.name ? `${a.company.name}: ` : ""}{a.title}</div>
                        <div className="text-[11px] text-[#a0aec0] mt-1">{timeAgo(a.published_at)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {followIds.size === 0 && (
              <div className="bg-white border border-dashed border-[#c9e0d3] rounded-xl p-5 mb-10 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-[#0f1a14] mb-0.5">Follow companies to build your feed</div>
                  <div className="text-xs text-[#4a5568]">Follow the companies you care about and their raises, launches, and hires show up here.</div>
                </div>
                <button onClick={() => setTab("research")} className="text-xs font-semibold bg-[#2d6a4f] text-white rounded-lg px-4 py-2 hover:bg-[#235a40] flex-shrink-0">Discover companies</button>
              </div>
            )}

            <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl font-bold text-[#0f1a14] mb-4">Latest in the energy transition</h2>
            {news.length === 0 ? (
              <div className="bg-white border border-[#e8eaee] rounded-xl p-6 text-center text-sm text-[#4a5568]">No news yet — check back soon.</div>
            ) : (
              <div className="bg-white border border-[#e8eaee] rounded-xl divide-y divide-[#f0f2f6]">
                {news.map((a) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-4 hover:bg-[#fafbfc] transition-colors">
                    {a.image_url && <img src={a.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" onError={(e) => { e.target.style.display = "none"; }} />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#0f1a14] leading-snug">{a.title}</div>
                      {(a.excerpt || a.summary_factual) && <div className="text-xs text-[#4a5568] mt-1 line-clamp-2">{a.excerpt || a.summary_factual}</div>}
                      <div className="flex items-center gap-2 mt-1.5">
                        {a.classification && <span className={"text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 " + (NEWS_COLORS[a.classification] || "bg-slate-100 text-slate-600")}>{NEWS_LABELS[a.classification] || a.classification}</span>}
                        <span className="text-[11px] text-[#a0aec0]">{timeAgo(a.published_at)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FOLLOWING */}
        {tab === "following" && (
          <div>
            {followedCompanies.length === 0 ? (
              <div className="bg-white border border-[#e8eaee] rounded-xl p-8 text-center">
                <p className="text-sm text-[#4a5568] mb-3">You're not following any companies yet.</p>
                <button onClick={() => setTab("research")} className="text-xs font-semibold bg-[#2d6a4f] text-white rounded-lg px-4 py-2 hover:bg-[#235a40]">Discover companies</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {followedCompanies.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 bg-white border border-[#e8eaee] rounded-xl p-4">
                    <Logo c={c} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/companies/${c.slug || c.id}`} className="text-sm font-semibold text-[#0f1a14] hover:text-[#2d6a4f] truncate block">{c.name}</Link>
                      {c.description && <div className="text-xs text-[#4a5568] line-clamp-2 mt-0.5">{c.description}</div>}
                    </div>
                    <FollowBtn id={c.id} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DISCOVER */}
        {tab === "research" && (
          <div>
            <div className="bg-white border border-[#e8eaee] rounded-xl p-4 mb-6">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search companies by name…"
                className="w-full text-sm border border-[#dbdfe4] rounded-lg px-3 py-2 mb-3 focus:outline-none focus:border-[#2d6a4f]" />
              <div className="flex flex-wrap items-center gap-2">
                <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="text-xs border border-[#dbdfe4] rounded-lg px-2 py-2 focus:outline-none focus:border-[#2d6a4f]">
                  <option value="">All industries</option>
                  {INDUSTRIES.map((ind) => <option key={ind.slug} value={ind.slug}>{ind.label}</option>)}
                </select>
                <select value={geoFilter} onChange={(e) => setGeoFilter(e.target.value)} className="text-xs border border-[#dbdfe4] rounded-lg px-2 py-2 focus:outline-none focus:border-[#2d6a4f]">
                  <option value="">All geographies</option>
                  {GEO_OPTIONS.map((g) => <option key={g} value={g}>{GEO_LABELS[g]}</option>)}
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-xs border border-[#dbdfe4] rounded-lg px-2 py-2 focus:outline-none focus:border-[#2d6a4f]">
                  <option value="name">Name (A–Z)</option>
                  <option value="default">Default</option>
                </select>
                <span className="text-xs text-[#a0aec0] ml-auto">{researchCompanies.length} companies</span>
              </div>
            </div>

            {researchCompanies.length === 0 ? (
              <div className="bg-white border border-[#e8eaee] rounded-xl p-8 text-center text-sm text-[#4a5568]">No companies match these filters. Try clearing them.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {researchCompanies.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 bg-white border border-[#e8eaee] rounded-xl p-4 hover:border-[#2d6a4f] transition-all">
                    <Logo c={c} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/companies/${c.slug || c.id}`} className="text-sm font-semibold text-[#0f1a14] hover:text-[#2d6a4f] truncate block">{c.name}</Link>
                      {c.description && <div className="text-xs text-[#4a5568] line-clamp-2 mt-0.5">{c.description}</div>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(c.industry_tags || []).filter((t) => INDUSTRY_LABELS[t]).slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] bg-[#eef4f0] text-[#2d6a4f] rounded-full px-2 py-0.5">{INDUSTRY_LABELS[t] || t}</span>
                        ))}
                      </div>
                    </div>
                    <FollowBtn id={c.id} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MARKETS (Pro) */}
        {tab === "markets" && <ProGate hasPayment={hasPayment}><MarketsTab isSaved={(id) => followIds.has(id)} onToggleSave={toggleFollow} /></ProGate>}

        {/* DEAL FLOW (Pro) */}
        {tab === "raising" && <ProGate hasPayment={hasPayment}><RaisingTab isSaved={(id) => followIds.has(id)} onToggleSave={toggleFollow} /></ProGate>}

        {/* REPORTS (Pro) */}
        {tab === "reports" && (
          <ProGate hasPayment={hasPayment}>
            <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl font-bold text-[#0f1a14] mb-4">Research reports</h2>
            {reports.length === 0 ? (
              <div className="bg-white border border-[#e8eaee] rounded-2xl p-8 text-center text-sm text-[#4a5568]">No reports yet — check back soon.</div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {reports.map((rp) => (
                  <Link key={rp.id} href={`/insights/${rp.slug}`} className="bg-white border border-[#e8eaee] rounded-xl p-5 hover:border-[#2d6a4f] transition-all">
                    <div className="text-sm font-semibold text-[#0f1a14] mb-1 leading-snug">{rp.title}</div>
                    {rp.subtitle && <div className="text-xs text-[#4a5568] line-clamp-2">{rp.subtitle}</div>}
                    {rp.sector && <div className="text-[10px] font-mono text-[#2d6a4f] mt-2 uppercase tracking-wide">{rp.sector.replace(/_/g, " ")}</div>}
                  </Link>
                ))}
              </div>
            )}
          </ProGate>
        )}

        {/* EXPERT */}
        {tab === "expert" && (
          <div className="max-w-2xl">
            <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl font-bold text-[#0f1a14] mb-2">List yourself as an expert</h2>
            <p className="text-sm text-[#4a5568] mb-6">Get discovered by companies, investors, and journalists across the energy transition. It's free right now.</p>

            {isListed && (
              <div className="bg-[#eef4f0] border border-[#c9e0d3] rounded-xl p-4 mb-6">
                <span className="text-sm text-[#2d6a4f] font-medium">{listingStatus === "approved" ? "You're listed in the expert directory." : "Your listing is pending review."}</span>
              </div>
            )}

            <div className="bg-white border border-[#e8eaee] rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4a5568] uppercase tracking-wide mb-1">Short bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="What you do and your expertise…" className="w-full text-sm border border-[#dbdfe4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4a5568] uppercase tracking-wide mb-1">Areas of expertise (comma-separated)</label>
                <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="e.g. carbon markets, project finance, policy" className="w-full text-sm border border-[#dbdfe4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4a5568] uppercase tracking-wide mb-1">LinkedIn</label>
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" className="w-full text-sm border border-[#dbdfe4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a5568] uppercase tracking-wide mb-1">Website</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="w-full text-sm border border-[#dbdfe4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                {!isListed ? (
                  <button onClick={() => saveListing(true)} disabled={savingListing || !bio.trim()} className="bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#235a40] disabled:opacity-40">
                    {savingListing ? "Saving…" : "Request to be listed"}
                  </button>
                ) : (
                  <>
                    <button onClick={() => saveListing(true)} disabled={savingListing} className="bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#235a40] disabled:opacity-40">{savingListing ? "Saving…" : "Save changes"}</button>
                    <button onClick={() => saveListing(false)} disabled={savingListing} className="text-sm text-[#a0aec0] hover:text-[#4a5568]">Remove listing</button>
                  </>
                )}
                {listingSaved && <span className="text-xs text-[#2d6a4f]">Saved</span>}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* FEEDBACK MODAL */}
      {showFeedback && (
        <div onClick={() => setShowFeedback(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-white rounded-2xl border border-[#e8eaee] p-6">
            <div className="flex items-start justify-between mb-1">
              <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl font-bold text-[#0f1a14]">Send feedback</h2>
              <button onClick={() => setShowFeedback(false)} className="text-[#a0aec0] hover:text-[#4a5568] text-lg leading-none">✕</button>
            </div>
            <p className="text-sm text-[#4a5568] mb-5">Suggest a company we should add, request a feature, or share a thought.</p>
            {reqSent ? (
              <div className="bg-[#eef4f0] border border-[#c9e0d3] rounded-xl p-4">
                <span className="text-sm text-[#2d6a4f] font-medium">Thanks — we've got it.</span>
                <button onClick={() => setReqSent(false)} className="text-xs text-[#2d6a4f] underline ml-2">Send another</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {[{ id: "company", label: "Suggest a company" }, { id: "feature", label: "Request a feature" }, { id: "feedback", label: "General feedback" }].map((c) => (
                    <Chip key={c.id} label={c.label} active={reqCategory === c.id} onClick={() => setReqCategory(c.id)} />
                  ))}
                </div>
                <textarea value={reqDetails} onChange={(e) => setReqDetails(e.target.value)} rows={4}
                  placeholder={reqCategory === "company" ? "Which company should we add? Include a website if you have it." : reqCategory === "feature" ? "What feature would make this more useful?" : "What's on your mind?"}
                  className="w-full text-sm border border-[#dbdfe4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
                <button onClick={sendRequest} disabled={reqSending || !reqDetails.trim()} className="bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#235a40] disabled:opacity-40">
                  {reqSending ? "Sending…" : "Send"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
