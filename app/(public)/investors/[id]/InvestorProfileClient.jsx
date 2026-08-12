"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const GEO_LABELS = {
  us: "US", usa: "US", europe: "Europe", eu: "Europe", asia: "Asia",
  africa: "Africa", latam: "LatAm", mena: "MENA",
  global: "Global", oceania: "Oceania", uk: "UK", canada: "Canada",
};

function geoLabel(g) {
  if (!g) return g;
  return GEO_LABELS[String(g).toLowerCase()] || g;
}

function SectionLabel({ children, count }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">{children}</h2>
      {count != null && (
        <span className="text-[10px] font-mono text-[#a0aec0]">{count}</span>
      )}
    </div>
  );
}

// Member-gated: only a signed-in user with a registered company can request to
// connect. The request surfaces to the investor (if they've claimed their firm).
function ConnectBox({ investor }) {
  const { user, isLoaded } = useUser();
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | no_company

  const submit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/investor-connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investor_id: investor.id, note }),
      });
      if (res.status === 403) { setStatus("no_company"); return; }
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch { setStatus("done"); }
  };

  if (!isLoaded) return <div className="h-9" />;

  if (!user) return (
    <div>
      <p className="text-xs text-[#718096] leading-relaxed mb-3">Sign in with your company to request a connection.</p>
      <Link href="/sign-in" className="w-full block text-center bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-colors">Sign in</Link>
    </div>
  );

  if (status === "no_company") return (
    <div>
      <p className="text-xs text-[#718096] leading-relaxed mb-3">You'll need a company registered on EP Network to connect with investors.</p>
      <Link href="/onboarding/company" className="w-full block text-center bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-colors">Register your company</Link>
    </div>
  );

  if (status === "done") return (
    <div className="text-sm text-[#2d6a4f] font-medium py-2">Request sent — {investor.name} can see your company in their inbound requests.</div>
  );

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <textarea
        value={note} onChange={e => setNote(e.target.value)}
        placeholder="Optional note — what you're building, stage, what you're raising…"
        rows={3}
        className="w-full px-3 py-2.5 rounded-lg border border-[#dbdfe4] text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors resize-none"
      />
      <button type="submit" disabled={status === "loading"}
        className="w-full bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-colors disabled:opacity-50">
        {status === "loading" ? "Sending…" : "Request to connect"}
      </button>
    </form>
  );
}

function Fact({ label, value }) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div>
      <div className="text-[11px] text-[#718096] font-mono uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm text-[#0f1a14]">{value}</div>
    </div>
  );
}

export default function InvestorProfilePage() {
  const { id } = useParams();
  const [investor, setInvestor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/investors/${id}`)
      .then(r => r.json())
      .then(data => { setInvestor(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`/api/investors/${id}/portfolio`)
      .then(r => r.json())
      .then(data => setPortfolio(Array.isArray(data?.companies) ? data.companies : []))
      .catch(() => {});
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!investor || investor.message) return (
    <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center text-[#4a5568]">
      Investor not found.
    </div>
  );

  const website = investor.url || investor.website;
  const websiteHref = website ? (website.startsWith("http") ? website : `https://${website}`) : null;
  // Clean tag arrays render as chips; enriched free-text renders as prose (one
  // home each, no chip-splitting of sentences).
  const focusAreas = investor.climate_focus_areas?.length ? investor.climate_focus_areas : [];
  const focusText = !focusAreas.length ? (investor.climate_sectors || null) : null;
  const stageTags = investor.investment_stages?.length ? investor.investment_stages : [];
  const stageText = !stageTags.length ? (investor.investment_stages_text || null) : null;
  const geoTags = investor.geographies?.length ? investor.geographies : [];
  const geoText = !geoTags.length ? (investor.geographies_focus || null) : null;
  const thesis = investor.thesis || investor.investment_thesis;
  const decisionMakers = investor.decision_makers || [];
  const linkedin = investor.linkedin_url || investor.linkedin;
  const twitter = investor.twitter_url || investor.twitter;

  // Headline metrics for the hero strip — only render the ones we actually have.
  const heroMetrics = [
    investor.fund_size && { label: "Fund size", value: investor.fund_size },
    investor.sweet_spot_check_size && { label: "Check size", value: investor.sweet_spot_check_size },
    investor.total_aum && { label: "Total AUM", value: investor.total_aum },
    investor.location && { label: "HQ", value: investor.location },
    (investor.founded_year || investor.founded) && { label: "Founded", value: investor.founded_year || investor.founded },
  ].filter(Boolean).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">

        <Link href="/investors" className="inline-flex items-center gap-1 text-sm text-[#4a5568] hover:text-[#0f1a14] transition-colors mb-8">
          ← Back to investors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* HERO CARD */}
            <div className="bg-white border border-[#e8eaee] rounded-2xl p-8">
              <div className="flex items-start gap-5">
                {investor.logo_url ? (
                  <>
                    <img src={investor.logo_url} alt={investor.name}
                      className="w-16 h-16 rounded-xl object-contain bg-white p-2 border border-[#e8eaee] flex-shrink-0"
                      onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                    <div style={{ display: "none" }} className="w-16 h-16 rounded-xl bg-[#f2f4f6] items-center justify-center text-2xl font-bold text-[#2d6a4f] flex-shrink-0">
                      {(investor.name || "?")[0].toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#f2f4f6] flex items-center justify-center text-2xl font-bold text-[#2d6a4f] flex-shrink-0">
                    {(investor.name || "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-3xl text-[#0f1a14] leading-tight mb-1.5">
                    {investor.name}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {investor.type && (
                      <span className="text-xs font-mono text-[#718096] capitalize">
                        {investor.type.replace(/_/g, " ")}
                      </span>
                    )}
                    {investor.location && (
                      <span className="text-xs font-mono text-[#a0aec0]">· {investor.location}</span>
                    )}
                    {website && (
                      <a href={websiteHref} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-mono text-[#2d6a4f] hover:underline">
                        · {website.replace(/https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Focus areas — chips from tags, prose from enriched text */}
              {focusAreas.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-5">
                  {focusAreas.map((area, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-mono border border-[#c8d8cc] bg-[rgba(45,106,79,0.06)] text-[#2d6a4f]">
                      {area}
                    </span>
                  ))}
                </div>
              ) : focusText ? (
                <p className="text-sm text-[#4a5568] leading-relaxed mt-5"><span className="text-[11px] font-mono uppercase tracking-wide text-[#718096] mr-2">Focus</span>{focusText}</p>
              ) : null}

              {investor.description && (
                <p className="text-[#4a5568] leading-relaxed text-sm font-light mt-5">
                  {investor.description}
                </p>
              )}

              {/* Headline metrics strip */}
              {heroMetrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#e8eaee]">
                  {heroMetrics.map((m, i) => (
                    <div key={i}>
                      <div className="text-[11px] text-[#718096] font-mono uppercase tracking-wide mb-1">{m.label}</div>
                      <div className="text-sm font-semibold text-[#0f1a14]">{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* INVESTMENT THESIS */}
            {thesis && (
              <div className="bg-white border border-[#e8eaee] rounded-2xl p-7">
                <SectionLabel>Investment Thesis</SectionLabel>
                <p className="text-sm text-[#4a5568] leading-relaxed">{thesis}</p>
              </div>
            )}

            {/* INVESTMENT STAGES — chips for tags, prose for enriched text */}
            {(stageTags.length > 0 || stageText) && (
              <div className="bg-white border border-[#e8eaee] rounded-2xl p-7">
                <SectionLabel>Investment Stages</SectionLabel>
                {stageTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {stageTags.map((stage, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium capitalize bg-[#f2f4f6] border border-[#e8eaee] text-[#4a5568]">
                        {stage}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#4a5568] leading-relaxed">{stageText}</p>
                )}
              </div>
            )}

            {/* KEY PEOPLE */}
            {decisionMakers.length > 0 && (
              <div className="bg-white border border-[#e8eaee] rounded-2xl p-7">
                <SectionLabel count={decisionMakers.length}>Key People</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {decisionMakers.map((person, i) => (
                    <span key={i} className="px-3 py-2 rounded-lg text-sm bg-[#fafbfc] border border-[#dbdfe4] text-[#4a5568]">
                      {person}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* PORTFOLIO */}
            <div className="bg-white border border-[#e8eaee] rounded-2xl p-7">
              <SectionLabel count={portfolio.length > 0 ? portfolio.length : null}>Portfolio Companies</SectionLabel>
              {portfolio.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {portfolio.map((c) => (
                    <Link key={c.id} href={`/companies/${c.slug || c.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e8eaee] hover:border-[#2d6a4f] hover:bg-[#fafbfc] transition-all group">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name}
                          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                          className="w-8 h-8 rounded-md object-contain bg-white border border-[#e8eaee] p-1 flex-shrink-0" />
                      ) : null}
                      <div className={`w-8 h-8 rounded-md bg-[#f2f4f6] items-center justify-center text-xs font-bold text-[#2d6a4f] flex-shrink-0 ${c.logo_url ? "hidden" : "flex"}`}>
                        {(c.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors truncate">{c.name}</div>
                        {c.industry_tags?.length > 0 && (
                          <div className="text-[10px] font-mono text-[#a0aec0] truncate">{c.industry_tags.slice(0, 2).join(", ")}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#718096]">
                  Portfolio data is still being compiled.{" "}
                  <Link href="/search" className="text-[#2d6a4f] hover:underline">
                    Browse all climate companies →
                  </Link>
                </p>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">

            {/* QUICK FACTS */}
            <div className="bg-white border border-[#e8eaee] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-5">Quick Facts</h3>
              <div className="flex flex-col gap-4">
                <Fact label="Type" value={investor.type ? investor.type.replace(/_/g, " ") : null} />
                <Fact label="Fund Size" value={investor.fund_size} />
                <Fact label="Total AUM" value={investor.total_aum} />
                <Fact label="Check Size" value={investor.sweet_spot_check_size} />
                <Fact label="Geographies" value={geoTags.length > 0 ? geoTags.map(geoLabel).join(", ") : geoText} />
                <Fact label="HQ" value={investor.location} />
                <Fact label="Founded" value={investor.founded_year || investor.founded} />
                <Fact label="Portfolio" value={portfolio.length > 0 ? `${portfolio.length} companies tracked` : null} />
              </div>

              {(website || linkedin || twitter) && (
                <div className="flex flex-col gap-2 mt-6">
                  {website && (
                    <a href={websiteHref} target="_blank" rel="noopener noreferrer"
                      className="w-full text-center border border-[#dbdfe4] text-[#0f1a14] text-sm rounded-lg py-2.5 hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                      Visit website →
                    </a>
                  )}
                  <div className="flex gap-2">
                    {linkedin && (
                      <a href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center border border-[#dbdfe4] text-[#4a5568] text-xs font-mono rounded-lg py-2 hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                        LinkedIn
                      </a>
                    )}
                    {twitter && (
                      <a href={twitter.startsWith("http") ? twitter : `https://${twitter}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 text-center border border-[#dbdfe4] text-[#4a5568] text-xs font-mono rounded-lg py-2 hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                        Twitter / X
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* REQUEST INTRO */}
            <div className="bg-white border border-[#e8eaee] rounded-2xl p-6">
              <h3 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-lg text-[#0f1a14] mb-1">
                Request to connect
              </h3>
              <p className="text-xs text-[#718096] leading-relaxed mb-4">
                Put your company in front of {investor.name} as inbound interest.
              </p>
              <ConnectBox investor={investor} />
            </div>

            {/* CLAIM / ONBOARDING CTA */}
            {!investor.claimed_by_clerk_user_id ? (
              <div className="bg-[#0f1a14] border border-[#2d6a4f] rounded-2xl p-6">
                <span className="text-xs font-mono text-[#a0b8a8] uppercase tracking-widest">Is this your firm?</span>
                <p className="text-sm text-[#d0e4d8] leading-relaxed mt-3 mb-4">
                  Claim this profile to manage it, update your details, and connect directly with founders.
                </p>
                <Link href={`/claim/investor/${investor.id}`}
                  className="w-full block text-center bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
                  Claim this profile →
                </Link>
              </div>
            ) : (
              <div className="bg-[#0f1a14] border border-[#2d6a4f] rounded-2xl p-6">
                <span className="text-xs font-mono text-[#a0b8a8] uppercase tracking-widest">Are you an investor?</span>
                <p className="text-sm text-[#d0e4d8] leading-relaxed mt-3 mb-4">
                  Join EP Network to access deal flow, company signals, and curated climate opportunities.
                </p>
                <Link href="/onboarding/investor"
                  className="w-full block text-center bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
                  Join as investor →
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
