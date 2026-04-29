"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { ArrowLeft, Globe, Handshake, ExternalLink, Mail, Lock, Briefcase, FileText } from "lucide-react";

const ORG_TYPE_LABELS = {
  international_ngo: "International NGO",
  igo: "Intergovernmental Organization",
  foundation: "Foundation",
  research_nonprofit: "Research Non-Profit",
  implementation_nonprofit: "Implementation Non-Profit",
  advocacy: "Advocacy / Movement",
  other: "Other",
};

function formatUSD(min, max, currency) {
  if (!min && !max) return null;
  const cur = currency || "USD";
  const fmt = (n) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };
  if (min && max && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max);
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NGOProfile() {
  const { slug } = useParams();
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/ngos/${slug}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading || !userLoaded) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data || data.error) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center text-[#4a5568]">
      Organization not found.
    </div>
  );

  const { ngo, grants, jobs } = data;

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">

        <Link href="/ngos/directory" className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f1a14] transition-colors mb-8">
          <ArrowLeft size={14} /> Back to directory
        </Link>

        {/* Hero */}
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f]">
              {ORG_TYPE_LABELS[ngo.org_type] ?? ngo.org_type}
            </span>
            {ngo.headquarters_country && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#e2e6ed] bg-white text-[#4a5568] flex items-center gap-1">
                <Globe size={9} /> {ngo.headquarters_city ? `${ngo.headquarters_city}, ` : ""}{ngo.headquarters_country}
              </span>
            )}
            {ngo.open_to_partnerships && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f] flex items-center gap-1">
                <Handshake size={9} /> Open to partnerships
              </span>
            )}
            {ngo.claimable && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#e2e6ed] bg-[#f8f9fb] text-[#718096]">
                Unclaimed
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#0f1a14] leading-tight mb-3">
            {ngo.name}
          </h1>

          {ngo.short_description && (
            <p className="text-[#4a5568] text-base font-light leading-relaxed mb-5">
              {ngo.short_description}
            </p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            {ngo.website_url && (
              <a href={ngo.website_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2d6a4f] hover:underline">
                Visit website <ExternalLink size={12} />
              </a>
            )}
            {ngo.contact_email && (
              isSignedIn ? (
                <a href={`mailto:${ngo.contact_email}`}
                  className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#235a40] transition-colors">
                  <Mail size={12} /> Contact
                </a>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl={`/ngos/${slug}`}>
                  <button className="inline-flex items-center gap-1.5 border border-[#d0d6e0] text-[#0f1a14] text-sm font-semibold rounded-lg px-4 py-2 hover:border-[#2d6a4f] transition-colors">
                    <Lock size={12} /> Sign in to contact
                  </button>
                </SignInButton>
              )
            )}
            {ngo.claimable && (
              <Link href={`/ngos/${slug}/claim`}
                className="text-sm text-[#4a5568] hover:text-[#2d6a4f] underline">
                Claim this profile
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {ngo.bio && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-4">About</h2>
                <p className="text-sm text-[#4a5568] leading-relaxed font-light whitespace-pre-line">{ngo.bio}</p>
              </div>
            )}

            {ngo.open_to_partnerships && ngo.partnership_description && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Handshake size={14} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Partnership opportunities</h2>
                </div>
                <p className="text-sm text-[#4a5568] leading-relaxed font-light">{ngo.partnership_description}</p>
              </div>
            )}

            {grants.length > 0 && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Active grant programs ({grants.length})</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {grants.map(g => (
                    <a key={g.id} href={g.application_url || "#"} target="_blank" rel="noopener noreferrer"
                      className="block border border-[#e2e6ed] rounded-lg p-4 hover:border-[#2d6a4f] transition-colors">
                      <div className="text-sm font-semibold text-[#0f1a14] mb-1">{g.title}</div>
                      <div className="flex items-center gap-3 text-[11px] text-[#718096] flex-wrap">
                        {formatUSD(g.amount_min_usd, g.amount_max_usd, g.currency) && (
                          <span className="font-mono font-semibold text-[#2d6a4f]">
                            {formatUSD(g.amount_min_usd, g.amount_max_usd, g.currency)}
                          </span>
                        )}
                        {g.deadline_date && (
                          <span>Deadline: {formatDate(g.deadline_date)}</span>
                        )}
                        {g.country && <span>{g.country}</span>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {jobs.length > 0 && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={14} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Open positions ({jobs.length})</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {jobs.map(j => (
                    <a key={j.id} href={j.apply_url || "#"} target="_blank" rel="noopener noreferrer"
                      className="block border border-[#e2e6ed] rounded-lg p-4 hover:border-[#2d6a4f] transition-colors">
                      <div className="text-sm font-semibold text-[#0f1a14] mb-1">{j.title}</div>
                      <div className="flex items-center gap-3 text-[11px] text-[#718096] flex-wrap">
                        {j.location && <span>{j.location}</span>}
                        {j.type && <span>{j.type}</span>}
                        {j.sector && <span className="capitalize">{j.sector.replace(/_/g, " ")}</span>}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-5">Org details</h3>
              <div className="flex flex-col gap-4 text-sm">
                {ngo.founded_year && (
                  <div>
                    <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-0.5">Founded</div>
                    <div className="text-[#0f1a14]">{ngo.founded_year}</div>
                  </div>
                )}
                {ngo.staff_size && (
                  <div>
                    <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-0.5">Staff</div>
                    <div className="text-[#0f1a14]">{ngo.staff_size}</div>
                  </div>
                )}
                {ngo.annual_grants_budget_usd_range && (
                  <div>
                    <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-0.5">Annual grants budget</div>
                    <div className="text-[#0f1a14]">${ngo.annual_grants_budget_usd_range}</div>
                  </div>
                )}
                {ngo.sector_tags && ngo.sector_tags.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-1.5">Sector focus</div>
                    <div className="flex flex-wrap gap-1">
                      {ngo.sector_tags.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#2d6a4f] capitalize">
                          {s.replace(/-/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {ngo.geography_focus && ngo.geography_focus.length > 0 && (
                  <div>
                    <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-1.5">Geography</div>
                    <div className="flex flex-wrap gap-1">
                      {ngo.geography_focus.map(g => (
                        <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#e2e6ed] text-[#4a5568]">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {ngo.claimable && (
              <div className="bg-[#0f1a14] border border-[#2d6a4f] rounded-2xl p-6">
                <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-white mb-2">Is this your organization?</h3>
                <p className="text-xs text-[#a0b8a8] leading-relaxed mb-4 font-light">
                  Claim this profile to edit details, post grant programs, and add job openings.
                </p>
                <Link href={`/ngos/${slug}/claim`}
                  className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
                  Claim profile
                </Link>
              </div>
            )}

            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-3">Browse</h3>
              <Link href="/ngos/directory" className="text-xs text-[#2d6a4f] font-mono hover:underline flex items-center gap-1">
                All organizations →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
