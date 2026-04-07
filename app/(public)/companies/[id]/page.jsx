"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { ArrowLeft, Globe, MapPin, Calendar, Cpu, Users, TrendingUp, Target, Star, Factory, ChevronRight, Lock, Briefcase, BarChart2, Handshake, Plus, Rss } from "lucide-react";
const STAGE_COLORS = {
  pre_seed: "bg-slate-100 text-slate-600",
  seed: "bg-blue-100 text-blue-700",
  series_a: "bg-violet-100 text-violet-700",
  series_b: "bg-purple-100 text-purple-700",
  series_c: "bg-fuchsia-100 text-fuchsia-700",
  growth: "bg-emerald-100 text-emerald-700",
  public: "bg-amber-100 text-amber-700",
  unknown: "bg-slate-100 text-slate-500",
};

const STAGE_LABELS = {
  pre_seed: "Pre-Seed", seed: "Seed", series_a: "Series A",
  series_b: "Series B", series_c: "Series C", growth: "Growth",
  public: "Public", unknown: "Unknown",
};

const MODEL_LABELS = {
  b2b: "B2B", b2c: "B2C", b2g: "B2G", hardware: "Hardware",
  software: "Software", project_developer: "Project Dev",
  marketplace: "Marketplace", mixed: "Mixed",
};

const GEO_LABELS = {
  us: "US", europe: "Europe", asia: "Asia",
  africa: "Africa", latam: "LatAm", mena: "MENA",
  global: "Global", oceania: "Oceania",
};

export default function CompanyProfilePage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({ title: "", body: "", link: "", type: "milestone" });
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/companies/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCompany(data);
        setLoading(false);
        posthog.capture("company_viewed", { company_id: id, company_name: data.name });
        // Fetch relevant grants based on industry tags
        fetch(`/api/companies/${id}/updates`)
          .then(r => r.json())
          .then(u => setUpdates(Array.isArray(u) ? u : []))
          .catch(() => {});
        if (data?.industry_tags?.length > 0) {
        fetch(`/api/grants?tags=${data.industry_tags[0]}&limit=3`)
            .then(r => r.json())
            .then(g => setGrants(Array.isArray(g) ? g : []))
            .catch(() => {});
        }
      })
      .catch(() => setLoading(false));
      fetch("/api/auth/investor-check")
  .then(r => r.json())
  .then(d => setIsInvestor(d.isInvestor))
  .catch(() => {});
  }, [id]);
async function postUpdate(e) {
    e.preventDefault();
    if (!updateForm.title.trim()) return;
    setPostingUpdate(true);
    try {
      const res = await fetch(`/api/companies/${id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateForm),
      });
      if (res.ok) {
        const newUpdate = await res.json();
        setUpdates(prev => [newUpdate, ...prev]);
        setUpdateForm({ title: "", body: "", link: "", type: "milestone" });
        setShowUpdateForm(false);
      }
    } finally {
      setPostingUpdate(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!company) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center text-[#4a5568]">
      Company not found.
    </div>
  );

  const tags = company.industry_tags || (company.sector ? [company.sector] : []);
  const hasSignals = company.looking_to_raise || company.is_hiring || company.seeking_partnerships;

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">

        <Link href="/search" className="inline-flex items-center gap-2 text-sm text-[#4a5568] hover:text-[#0f1a14] transition-colors mb-8">
          <ArrowLeft size={14} /> Back to search
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* HERO CARD */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-5">
                  {company.logo_url ? (
                    <>
                      <img src={company.logo_url} alt={company.name}
                        className="w-16 h-16 rounded-xl object-contain bg-white p-2 border border-[#e2e6ed]"
                        onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                      <div style={{display:"none"}} className="w-16 h-16 rounded-xl bg-[#e2e6ed] items-center justify-center text-2xl font-bold text-[#2d6a4f]">
                        {(company.name||"?")[0].toUpperCase()}
                      </div>
                    </>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#e2e6ed] flex items-center justify-center text-2xl font-bold text-[#2d6a4f]">
                      {(company.name || company.url || "?")[0].toUpperCase()}
                      {company.show_contact && company.primary_contact_email && (
                   <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] border border-[#c8d8cc] text-[#2d6a4f]">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f] animate-pulse" />
                    Open to contact
                    </span>
                   )}
                    </div>
                  )}
                  <div>
                    <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] leading-tight">
                      {company.name || company.url}
                    </h1>
                    {company.url && (
                      <a href={company.url.startsWith("http") ? company.url : `https://${company.url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-[#4a5568] hover:text-[#2d6a4f] transition-colors mt-1">
                        <Globe size={12} /> {company.url.replace(/https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                </div>
                {company.production_status && (
                  <div className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-mono border border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f]">
                    {company.production_status}
                  </div>
                )}
              </div>

              {/* Tags + stage + model */}
              <div className="flex flex-wrap gap-2 mb-4">
                {company.funding_stage && company.funding_stage !== 'unknown' && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STAGE_COLORS[company.funding_stage] || STAGE_COLORS.unknown}`}>
                    {STAGE_LABELS[company.funding_stage] || company.funding_stage}
                  </span>
                )}
                {company.business_model && (
                  <span className="px-3 py-1 rounded-full text-xs font-mono border border-[#c8d8cc] bg-white text-[#2d6a4f]">
                    {MODEL_LABELS[company.business_model] || company.business_model}
                  </span>
                )}
                {tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full text-xs font-mono border border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568]">
                    {tag.replace(/_/g, " ")}
                  </span>
                ))}
              </div>

              {/* Signal badges */}
              {hasSignals && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {company.looking_to_raise && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Raising
                    </span>
                  )}
                  {company.is_hiring && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      Hiring
                    </span>
                  )}
                  {company.seeking_partnerships && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Partnerships
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {company.description && (
                <p className="text-[#4a5568] leading-relaxed text-sm font-light">
                  {company.description}
                </p>
              )}
            </div>

            {/* CORE TECHNOLOGY */}
            {company.core_technology && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Core Technology</h2>
                </div>
                <p className="text-sm text-[#4a5568] leading-relaxed">{company.core_technology}</p>
              </div>
            )}

            {/* KEY CUSTOMERS */}
            {company.key_customers && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Key Customers</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.key_customers.split(",").map((c) => (
                    <span key={c} className="px-3 py-1.5 rounded-lg text-sm bg-[#f8f9fb] border border-[#d0d6e0] text-[#4a5568]">
                      {c.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* RECENT MILESTONES */}
            {company.recent_milestones && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Recent Milestones</h2>
                </div>
                <p className="text-sm text-[#4a5568] leading-relaxed">{company.recent_milestones}</p>
              </div>
            )}

            {/* MANUFACTURING */}
            {company.manufacturing_capability && (
              <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-4">
                  <Factory size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Manufacturing Capability</h2>
                </div>
                <p className="text-sm text-[#4a5568] leading-relaxed">{company.manufacturing_capability}</p>
              </div>
            )}

            {/* RECENT UPDATES */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Rss size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Recent Updates</h2>
                </div>
                <button onClick={() => setShowUpdateForm(v => !v)}
                  className="inline-flex items-center gap-1 text-xs text-[#2d6a4f] font-mono hover:underline">
                  <Plus size={12} /> Add update
                </button>
              </div>

              {showUpdateForm && (
                <form onSubmit={postUpdate} className="mb-5 flex flex-col gap-3 bg-[#f8f9fb] rounded-xl p-4 border border-[#e2e6ed]">
                  <input
                    required
                    placeholder="Title *"
                    value={updateForm.title}
                    onChange={e => setUpdateForm(p => ({ ...p, title: e.target.value }))}
                    className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]"
                  />
                  <textarea
                    placeholder="Details (optional)"
                    rows={2}
                    value={updateForm.body}
                    onChange={e => setUpdateForm(p => ({ ...p, body: e.target.value }))}
                    className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f] resize-none"
                  />
                  <input
                    placeholder="Link (optional)"
                    value={updateForm.link}
                    onChange={e => setUpdateForm(p => ({ ...p, link: e.target.value }))}
                    className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]"
                  />
                  <select
                    value={updateForm.type}
                    onChange={e => setUpdateForm(p => ({ ...p, type: e.target.value }))}
                    className="text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]">
                    <option value="milestone">Milestone</option>
                    <option value="hiring">Hiring</option>
                    <option value="funding">Funding</option>
                    <option value="product">Product</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowUpdateForm(false)}
                      className="text-xs text-[#718096] px-3 py-1.5 rounded-lg hover:bg-[#e2e6ed]">Cancel</button>
                    <button type="submit" disabled={postingUpdate}
                      className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-1.5 rounded-lg hover:bg-[#235a40] disabled:opacity-50">
                      {postingUpdate ? "Posting..." : "Post update"}
                    </button>
                  </div>
                </form>
              )}

              {updates.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {updates.map(u => (
                    <div key={u.id} className="border-b border-[#e2e6ed] last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0] capitalize">{u.type}</span>
                        <span className="text-xs text-[#718096]">{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#0f1a14]">{u.title}</p>
                      {u.body && <p className="text-xs text-[#4a5568] mt-1 leading-relaxed">{u.body}</p>}
                      {u.link && (
                        <a href={u.link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-[#2d6a4f] hover:underline mt-1 inline-block">
                          Read more →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#718096]">No updates yet.</p>
              )}
            </div>

            {/* LOCKED INTELLIGENCE */}
            {isInvestor ? (
  <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
    <div className="flex items-center gap-2 mb-5">
      <Lock size={16} className="text-[#2d6a4f]" />
      <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Investor Intelligence</h2>
    </div>
    <div className="flex flex-col gap-4">
      {company.raise_target && (
        <div>
          <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Target Raise</div>
          <div className="text-sm font-semibold text-[#0f1a14]">${Number(company.raise_target).toLocaleString()}</div>
        </div>
      )}
      {company.raise_current && (
        <div>
          <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Raised So Far</div>
          <div className="text-sm font-semibold text-[#0f1a14]">${Number(company.raise_current).toLocaleString()}</div>
          {company.raise_target && (
            <div className="mt-2 h-1.5 w-full bg-[#d1fae5] rounded-full">
              <div className="h-1.5 bg-[#2d6a4f] rounded-full"
                style={{ width: `${Math.min(100, Math.round((company.raise_current / company.raise_target) * 100))}%` }} />
            </div>
          )}
        </div>
      )}
      {company.raise_close_date && (
        <div>
          <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Round Close Date</div>
          <div className="text-sm font-semibold text-[#0f1a14]">
            {new Date(company.raise_close_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
      )}
      {company.min_check_size && (
        <div>
          <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Min Check Size</div>
          <div className="text-sm font-semibold text-[#0f1a14]">${Number(company.min_check_size).toLocaleString()}</div>
        </div>
      )}
      {company.pitch_deck_url && (
        <div className="pt-2 border-t border-[#e2e6ed]">
          <a href={company.pitch_deck_url} target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
            View Pitch Deck
          </a>
        </div>
      )}
      {!company.raise_target && !company.pitch_deck_url && (
        <p className="text-sm text-[#718096]">This company hasn't added funding details yet.</p>
      )}
    </div>
  </div>
) : (
  <div className="bg-white border border-[#d0d6e0] rounded-2xl p-7 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white pointer-events-none" />
    <div className="flex items-center gap-2 mb-5">
      <Lock size={16} className="text-[#718096]" />
      <h2 className="text-xs font-mono font-semibold text-[#718096] tracking-wide uppercase">Investor Intelligence</h2>
    </div>
    <div className="flex flex-col gap-3">
      {["Target raise amount", "Raised so far", "Round close date", "Min check size", "Pitch deck"].map((field) => (
        <div key={field} className="flex items-center justify-between py-2 border-b border-[#e2e6ed] last:border-0">
          <span className="text-sm text-[#718096]">{field}</span>
          <div className="h-4 w-24 bg-[#e2e6ed] rounded-sm" />
        </div>
      ))}
    </div>
    <Link href="/pricing"
      className="mt-6 w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-colors">
      Unlock Investor Access
    </Link>
  </div>
)}
          </div> 
          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">

            {/* QUICK FACTS */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-5">Quick Facts</h3>
              <div className="flex flex-col gap-4">
                {company.founding_year && (
                  <div className="flex items-start gap-3">
                    <Calendar size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Founded</div>
                      <div className="text-sm text-[#0f1a14]">{company.founding_year}</div>
                    </div>
                  </div>
                )}
                {(company.location || company.headquarters_location) && (
                  <div className="flex items-start gap-3">
                    <MapPin size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Location</div>
                      <div className="text-sm text-[#0f1a14]">{company.location || company.headquarters_location}</div>
                    </div>
                  </div>
                )}
                {company.total_funding_raised && (
                  <div className="flex items-start gap-3">
                    <TrendingUp size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Total Funding</div>
                      <div className="text-sm text-[#0f1a14]">{company.total_funding_raised}</div>
                    </div>
                  </div>
                )}
                {company.business_model && (
                  <div className="flex items-start gap-3">
                    <Briefcase size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Business Model</div>
                      <div className="text-sm text-[#0f1a14]">{MODEL_LABELS[company.business_model] || company.business_model}</div>
                    </div>
                  </div>
                )}
                {company.target_market && (
                  <div className="flex items-start gap-3">
                    <Target size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Target Market</div>
                      <div className="text-sm text-[#0f1a14]">{company.target_market}</div>
                    </div>
                  </div>
                )}
                {company.production_status && (
                  <div className="flex items-start gap-3">
                    <Factory size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Status</div>
                      <div className="text-sm text-[#0f1a14] capitalize">{company.production_status}</div>
                    </div>
                  </div>
                )}
                {/* Target geographies */}
                {company.target_geographies?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Globe size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Geographies</div>
                      <div className="flex flex-wrap gap-1">
                        {company.target_geographies.map(g => (
                          <span key={g} className="text-xs text-[#0f1a14]">{GEO_LABELS[g] || g}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Customer segments */}
                {company.customer_segment?.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-[#718096] font-mono mb-1">Customers</div>
                      <div className="text-sm text-[#0f1a14] capitalize">{company.customer_segment.join(", ")}</div>
                    </div>
                  </div>
                )}
              </div>

              {company.url && (
                <a href={company.url.startsWith("http") ? company.url : `https://${company.url}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-6 w-full flex items-center justify-center gap-2 border border-[#d0d6e0] text-[#0f1a14] text-sm rounded-lg py-2.5 hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                  <Globe size={14} /> Visit website
                </a>
              )}
            </div>

            {/* RELEVANT GRANTS */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-4">Relevant Grants</h3>
              {grants.length > 0 ? (
                grants.map((grant) => (
                  <div key={grant.id} className="flex items-start justify-between py-2.5 border-b border-[#e2e6ed] last:border-0">
                    <span className="text-xs text-[#4a5568] leading-snug pr-2">{grant.title}</span>
                    {grant.deadline && (
                      <span className="text-xs font-mono text-[#ff9650] flex-shrink-0">
                        {new Date(grant.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#718096]">Browse our grants database for funding opportunities.</p>
              )}
              <Link href="/grants" className="mt-4 text-xs text-[#2d6a4f] font-mono hover:underline flex items-center gap-1">
                Browse all grants →
              </Link>
            </div>

{/* POINT OF CONTACT */}
{company.show_contact && company.primary_contact_email && (
  <div className="bg-white border border-[#2d6a4f]/20 rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-pulse" />
      <h3 className="text-xs font-mono font-semibold text-[#2d6a4f] tracking-widest uppercase">Open to contact</h3>
    </div>
    <p className="text-xs text-[#718096] leading-relaxed mb-4">
      This company is open to investment inquiries, partnerships, and introductions.
    </p>
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#eef1f6] flex items-center justify-center text-xs font-semibold text-[#2d6a4f]">
          {company.primary_contact_name?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <div className="text-sm font-medium text-[#0f1a14]">{company.primary_contact_name}</div>
          <div className="text-xs text-[#718096]">Primary contact</div>
        </div>
      </div>
      {company.secondary_contact_name && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#eef1f6] flex items-center justify-center text-xs font-semibold text-[#2d6a4f]">
            {company.secondary_contact_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="text-sm font-medium text-[#0f1a14]">{company.secondary_contact_name}</div>
            <div className="text-xs text-[#718096]">Secondary contact</div>
          </div>
        </div>
      )}
    </div>
    <a href={`mailto:${company.primary_contact_email}?subject=Inquiry via EP Investing — ${company.name}`}
      className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
      Get in touch
    </a>
  </div>
)}
            {/* CLAIM CTA */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0f1a14] mb-2">Is this your company?</h3>
              <p className="text-xs text-[#4a5568] leading-relaxed mb-4">Claim your profile to add your logo, edit your description, and appear in investor discovery.</p>
              <Link href="/onboarding/company"
                className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
                Claim this company
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
