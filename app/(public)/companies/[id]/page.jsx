"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Globe, MapPin, Calendar, Cpu, Users, TrendingUp, Target, Star, Factory, ChevronRight, Lock } from "lucide-react";

export default function CompanyProfilePage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/companies/${id}`)
      .then((r) => r.json())
      .then((data) => { setCompany(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d0f] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c8f560] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!company) return (
    <div className="min-h-screen bg-[#0a0d0f] flex items-center justify-center text-[#6b7a72]">
      Company not found.
    </div>
  );

  const tags = company.industry_tags || (company.sector ? [company.sector] : []);

  return (
    <div className="min-h-screen bg-[#0a0d0f] text-[#e8ede8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Back */}
        <Link href="/search" className="inline-flex items-center gap-2 text-sm text-[#6b7a72] hover:text-[#e8ede8] transition-colors mb-8">
          <ArrowLeft size={14} /> Back to search
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* HERO CARD */}
            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-5">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-xl object-contain bg-white p-2" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#1e2428] flex items-center justify-center text-2xl font-bold text-[#c8f560]">
                      {(company.name || company.url || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#e8ede8] leading-tight">
                      {company.name || company.url}
                    </h1>
                    {company.url && (
                      <a href={company.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#6b7a72] hover:text-[#c8f560] transition-colors mt-1">
                        <Globe size={12} /> {company.url.replace(/https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
                {company.production_status && (
                  <div className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-mono border border-[#1e2e24] bg-[#151d18] text-[#c8f560]">
                    {company.production_status}
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs font-mono border border-[#1e2e24] bg-[#151d18] text-[#6b7a72]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {company.description && (
                <p className="text-[#6b7a72] leading-relaxed text-sm font-light">
                  {company.description}
                </p>
              )}
            </div>

            {/* CORE TECHNOLOGY */}
            {company.core_technology && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={16} className="text-[#c8f560]" />
                  <h2 className="text-sm font-semibold text-[#e8ede8] tracking-wide uppercase text-xs font-mono">Core Technology</h2>
                </div>
                <p className="text-sm text-[#6b7a72] leading-relaxed">{company.core_technology}</p>
              </div>
            )}

            {/* KEY CUSTOMERS */}
            {company.key_customers && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-[#c8f560]" />
                  <h2 className="text-xs font-mono font-semibold text-[#e8ede8] tracking-wide uppercase">Key Customers</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.key_customers.split(",").map((c) => (
                    <span key={c} className="px-3 py-1.5 rounded-lg text-sm bg-[#171c20] border border-[#252c32] text-[#6b7a72]">
                      {c.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* RECENT MILESTONES */}
            {company.recent_milestones && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={16} className="text-[#c8f560]" />
                  <h2 className="text-xs font-mono font-semibold text-[#e8ede8] tracking-wide uppercase">Recent Milestones</h2>
                </div>
                <p className="text-sm text-[#6b7a72] leading-relaxed">{company.recent_milestones}</p>
              </div>
            )}

            {/* MANUFACTURING */}
            {company.manufacturing_capability && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Factory size={16} className="text-[#c8f560]" />
                  <h2 className="text-xs font-mono font-semibold text-[#e8ede8] tracking-wide uppercase">Manufacturing Capability</h2>
                </div>
                <p className="text-sm text-[#6b7a72] leading-relaxed">{company.manufacturing_capability}</p>
              </div>
            )}

            {/* INVESTOR PRO LOCKED */}
            <div className="bg-[#111518] border border-[#252c32] rounded-2xl p-7 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#111518] pointer-events-none" />
              <div className="flex items-center gap-2 mb-5">
                <Lock size={16} className="text-[#4a5550]" />
                <h2 className="text-xs font-mono font-semibold text-[#4a5550] tracking-wide uppercase">Restricted Company Intelligence</h2>
              </div>
              <div className="flex flex-col gap-3">
                {["Raise round / stage", "Estimated revenue range", "Employee count signals", "Lead investors"].map((field) => (
                  <div key={field} className="flex items-center justify-between py-2 border-b border-[#1e2428] last:border-0">
                    <span className="text-sm text-[#4a5550]">{field}</span>
                    <div className="h-4 w-24 bg-[#1e2428] rounded-sm" />
                  </div>
                ))}
              </div>
              <Link href="/get-matched"
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg py-3 hover:bg-[#d4ff6b] transition-colors">
                Upgrade to Investor Pro ($129/mo) <ChevronRight size={14} />
              </Link>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">

            {/* QUICK FACTS */}
            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#6b7a72] tracking-widest uppercase mb-5">Quick Facts</h3>
              <div className="flex flex-col gap-4">
                {company.founding_year && (
                  <div className="flex items-start gap-3">
                    <Calendar size={14} className="text-[#c8f560] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#4a5550] font-mono mb-1">Founded</div>
                      <div className="text-sm text-[#e8ede8]">{company.founding_year}</div>
                    </div>
                  </div>
                )}
                {(company.location || company.headquarters_location) && (
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="text-[#c8f560] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#4a5550] font-mono mb-1">Location</div>
                      <div className="text-sm text-[#e8ede8]">{company.location || company.headquarters_location}</div>
                    </div>
                  </div>
                )}
                {company.total_funding_raised && (
                  <div className="flex items-start gap-3">
                    <TrendingUp size={14} className="text-[#c8f560] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#4a5550] font-mono mb-1">Total Funding</div>
                      <div className="text-sm text-[#e8ede8]">{company.total_funding_raised}</div>
                    </div>
                  </div>
                )}
                {company.target_market && (
                  <div className="flex items-start gap-3">
                    <Target size={14} className="text-[#c8f560] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#4a5550] font-mono mb-1">Target Market</div>
                      <div className="text-sm text-[#e8ede8]">{company.target_market}</div>
                    </div>
                  </div>
                )}
                {company.production_status && (
                  <div className="flex items-start gap-3">
                    <Factory size={14} className="text-[#c8f560] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#4a5550] font-mono mb-1">Status</div>
                      <div className="text-sm text-[#e8ede8] capitalize">{company.production_status}</div>
                    </div>
                  </div>
                )}
              </div>

              {company.url && (
                <a href={company.url} target="_blank" rel="noopener noreferrer"
                  className="mt-6 w-full flex items-center justify-center gap-2 border border-[#252c32] text-[#e8ede8] text-sm rounded-lg py-2.5 hover:border-[#c8f560] hover:text-[#c8f560] transition-all">
                  <Globe size={14} /> Visit website
                </a>
              )}
            </div>

            {/* RELEVANT GRANTS */}
            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#6b7a72] tracking-widest uppercase mb-4">Relevant Grants</h3>
              {[
                { name: "DOE Advanced R&D Program", date: "Mar 12" },
                { name: "ARPA-E OPEN 2025", date: "Mar 28" },
                { name: "Clean Energy Initiative", date: "Apr 5" },
              ].map((grant) => (
                <div key={grant.name} className="flex items-start justify-between py-2.5 border-b border-[#1e2428] last:border-0">
                  <span className="text-xs text-[#6b7a72]">{grant.name}</span>
                  <span className="text-xs font-mono text-[#ff9650] ml-2 flex-shrink-0">{grant.date}</span>
                </div>
              ))}
              <Link href="/grants" className="mt-4 text-xs text-[#c8f560] font-mono hover:underline flex items-center gap-1">
                Browse all grants →
              </Link>
            </div>

            {/* CTA */}
            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-6">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#e8ede8] mb-2">Is this your company?</h3>
              <p className="text-xs text-[#6b7a72] leading-relaxed mb-4">Claim your profile to add your logo, edit your description, and appear in investor discovery.</p>
              <Link href="/get-matched"
                className="w-full flex items-center justify-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg py-2.5 hover:bg-[#d4ff6b] transition-colors">
                Claim this company
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
