"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Loader2, Compass, BadgeCheck, Rss, ArrowRight, Building2, Newspaper, Check } from "lucide-react";
import { INDUSTRY_LABELS } from "@/lib/industries";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const h = Math.floor((Date.now() - d.getTime()) / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

export default function IndividualDashboard() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("feed");
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  // expert listing state
  const [listing, setListing] = useState(null);
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [savingListing, setSavingListing] = useState(false);
  const [listingSaved, setListingSaved] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch("/api/dashboard/individual/feed").then((r) => r.json()).catch(() => ({})),
      fetch("/api/news/for-you?limit=8").then((r) => r.json()).catch(() => ({})),
      fetch("/api/dashboard/individual/expert").then((r) => r.json()).catch(() => ({})),
    ]).then(([feed, newsRes, listingRes]) => {
      setData(feed);
      setNews(Array.isArray(newsRes.articles) ? newsRes.articles : []);
      const l = listingRes.listing;
      setListing(l);
      if (l) {
        setBio(l.bio || "");
        setExpertise((l.expertise_areas || []).join(", "));
        setLinkedin(l.linkedin_url || "");
        setWebsite(l.website_url || "");
      }
      setLoading(false);
    });
  }, [isLoaded, user]);

  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    try { if (typeof window !== "undefined" && window.posthog) window.posthog.capture("individual_feedback", { text: feedback.trim() }); } catch (e) {}
    setFeedbackSent(true);
  };

  const saveListing = async (listNow) => {
    setSavingListing(true); setListingSaved(false);
    try {
      const res = await fetch("/api/dashboard/individual/expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          expertise_areas: expertise.split(",").map((s) => s.trim()).filter(Boolean),
          linkedin_url: linkedin,
          website_url: website,
          list: listNow,
        }),
      });
      if (res.ok) {
        setListingSaved(true);
        setListing((p) => ({ ...(p || {}), is_listed: listNow ? true : (p?.is_listed || false), status: listNow ? "pending" : p?.status }));
      }
    } catch (e) {}
    setSavingListing(false);
  };

  if (!isLoaded || loading) {
    return <div className="min-h-[70vh] bg-[#f2f4f8] flex items-center justify-center"><Loader2 className="animate-spin text-[#2d6a4f]" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[#f2f4f8] flex items-center justify-center px-6" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        <div className="text-center">
          <p className="text-[#4a5568] mb-4">Please sign in to view your dashboard.</p>
          <a href="/sign-in" className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3">Sign in</a>
        </div>
      </div>
    );
  }

  const member = data?.member;
  const companies = data?.companies || [];
  const industries = member?.industries || [];
  const firstName = member?.name?.split(" ")[0] || user?.firstName || "there";
  const isListed = listing?.is_listed;
  const listingStatus = listing?.status;

  return (
    <div className="min-h-screen bg-[#f2f4f8] px-6 py-10" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-3xl text-[#0f1a14] mb-2">Welcome back, {firstName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#4a5568]">Following:</span>
            {industries.length > 0 ? industries.map((slug) => (
              <span key={slug} className="text-xs bg-white border border-[#e2e6ed] rounded-full px-3 py-1 text-[#0f1a14]">{INDUSTRY_LABELS[slug] || slug}</span>
            )) : (
              <Link href="/onboarding/individual" className="text-xs text-[#2d6a4f] underline">Set up your industries</Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#e2e6ed] mb-8">
          {[
            { id: "feed", label: "Your Feed" },
            { id: "expert", label: "Expert" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.id ? "border-[#2d6a4f] text-[#0f1a14]" : "border-transparent text-[#a0aec0] hover:text-[#4a5568]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ---- YOUR FEED ---- */}
        {tab === "feed" && (
          <div>
            {/* quick actions */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              <Link href="/search" className="flex items-center gap-3 bg-white border border-[#e2e6ed] rounded-xl p-4 hover:border-[#2d6a4f] transition-all">
                <Compass size={20} className="text-[#2d6a4f]" />
                <div><div className="text-sm font-semibold text-[#0f1a14]">Explore the network</div><div className="text-xs text-[#4a5568]">Browse all companies, investors & NGOs</div></div>
              </Link>
              <button onClick={() => setTab("expert")} className="text-left flex items-center gap-3 bg-white border border-[#e2e6ed] rounded-xl p-4 hover:border-[#2d6a4f] transition-all">
                <BadgeCheck size={20} className="text-[#2d6a4f]" />
                <div><div className="text-sm font-semibold text-[#0f1a14]">List yourself as an expert</div><div className="text-xs text-[#4a5568]">Get discovered by companies & investors</div></div>
              </button>
            </div>

            {/* News */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Newspaper size={18} className="text-[#2d6a4f]" />
                <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl text-[#0f1a14]">Latest in the energy transition</h2>
              </div>
              {news.length === 0 ? (
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-6 text-center text-sm text-[#4a5568]">No news yet — check back soon.</div>
              ) : (
                <div className="bg-white border border-[#e2e6ed] rounded-xl divide-y divide-[#f0f2f6]">
                  {news.map((a) => (
                    <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-4 hover:bg-[#f7f9fc] transition-colors">
                      {a.image_url && <img src={a.image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" onError={(e) => { e.target.style.display = "none"; }} />}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#0f1a14] leading-snug">{a.title}</div>
                        {(a.excerpt || a.summary_factual) && <div className="text-xs text-[#4a5568] mt-1 line-clamp-2">{a.excerpt || a.summary_factual}</div>}
                        <div className="flex items-center gap-2 mt-1.5">
                          {a.classification && <span className="text-[10px] uppercase tracking-wide text-[#2d6a4f] bg-[#eef4f0] rounded px-1.5 py-0.5">{a.classification}</span>}
                          <span className="text-[11px] text-[#a0aec0]">{timeAgo(a.published_at)}</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Companies */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Rss size={18} className="text-[#2d6a4f]" />
                <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl text-[#0f1a14]">Companies in your industries</h2>
              </div>
              {companies.length === 0 ? (
                <div className="bg-white border border-[#e2e6ed] rounded-xl p-8 text-center">
                  <Building2 size={24} className="text-[#a0aec0] mx-auto mb-2" />
                  <p className="text-sm text-[#4a5568]">No companies yet. <Link href="/onboarding/individual" className="text-[#2d6a4f] underline">Adjust your industries</Link>.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {companies.map((c) => (
                    <Link key={c.id} href={`/companies/${c.slug || c.id}`} className="flex items-start gap-3 bg-white border border-[#e2e6ed] rounded-xl p-4 hover:border-[#2d6a4f] transition-all">
                      <div className="w-10 h-10 rounded-lg bg-[#f2f4f8] border border-[#e2e6ed] flex items-center justify-center overflow-hidden shrink-0">
                        {c.logo_url ? <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain" onError={(e) => { e.target.style.display = "none"; }} /> : <Building2 size={16} className="text-[#a0aec0]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#0f1a14] truncate">{c.name}</div>
                        {c.description && <div className="text-xs text-[#4a5568] line-clamp-2 mt-0.5">{c.description}</div>}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(c.industry_tags || []).filter((t) => industries.includes(t)).slice(0, 2).map((t) => (
                            <span key={t} className="text-[10px] bg-[#eef4f0] text-[#2d6a4f] rounded-full px-2 py-0.5">{INDUSTRY_LABELS[t] || t}</span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback */}
            <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-[#0f1a14] mb-1">What would make this more useful?</h3>
              <p className="text-xs text-[#4a5568] mb-3">We're building this for you — tell us what you'd want to see.</p>
              {feedbackSent ? <p className="text-sm text-[#2d6a4f]">Thanks — we hear you.</p> : (
                <div className="flex gap-2">
                  <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="More news? Specific companies? A different view?" className="flex-1 text-sm border border-[#d0d6e0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
                  <button onClick={sendFeedback} className="inline-flex items-center gap-1 bg-[#2d6a4f] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#235a40]">Send <ArrowRight size={14} /></button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- EXPERT ---- */}
        {tab === "expert" && (
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck size={20} className="text-[#2d6a4f]" />
              <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl text-[#0f1a14]">List yourself as an expert</h2>
            </div>
            <p className="text-sm text-[#4a5568] mb-6">
              Get discovered by companies, investors, and journalists across the energy transition. Add your details below and request to be listed in the expert directory. It's free right now.
            </p>

            {isListed && (
              <div className="bg-[#eef4f0] border border-[#c9e0d3] rounded-xl p-4 mb-6 flex items-center gap-2">
                <Check size={16} className="text-[#2d6a4f]" />
                <span className="text-sm text-[#2d6a4f] font-medium">
                  {listingStatus === "approved" ? "You're listed in the expert directory." : "Your listing is pending review."}
                </span>
              </div>
            )}

            <div className="bg-white border border-[#e2e6ed] rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4a5568] uppercase tracking-wide mb-1">Short bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="What you do and your expertise..." className="w-full text-sm border border-[#d0d6e0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4a5568] uppercase tracking-wide mb-1">Areas of expertise (comma-separated)</label>
                <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="e.g. carbon markets, project finance, policy" className="w-full text-sm border border-[#d0d6e0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4a5568] uppercase tracking-wide mb-1">LinkedIn</label>
                  <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full text-sm border border-[#d0d6e0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4a5568] uppercase tracking-wide mb-1">Website</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." className="w-full text-sm border border-[#d0d6e0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {!isListed ? (
                  <button onClick={() => saveListing(true)} disabled={savingListing || !bio.trim()}
                    className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#235a40] disabled:opacity-40">
                    {savingListing ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />} Request to be listed
                  </button>
                ) : (
                  <>
                    <button onClick={() => saveListing(true)} disabled={savingListing}
                      className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#235a40] disabled:opacity-40">
                      {savingListing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save changes
                    </button>
                    <button onClick={() => saveListing(false)} disabled={savingListing}
                      className="text-sm text-[#a0aec0] hover:text-[#4a5568]">Remove listing</button>
                  </>
                )}
                {listingSaved && <span className="text-xs text-[#2d6a4f]">Saved</span>}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}