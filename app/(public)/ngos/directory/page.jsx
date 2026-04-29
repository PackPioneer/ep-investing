"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Globe, Building2, Handshake, ArrowRight } from "lucide-react";

const ORG_TYPE_LABELS = {
  international_ngo: "International NGO",
  igo: "IGO",
  foundation: "Foundation",
  research_nonprofit: "Research",
  implementation_nonprofit: "Implementation",
  advocacy: "Advocacy",
  other: "Other",
};

const ORG_TYPES = [
  { value: "all", label: "All types" },
  { value: "international_ngo", label: "International NGOs" },
  { value: "igo", label: "IGOs" },
  { value: "foundation", label: "Foundations" },
  { value: "research_nonprofit", label: "Research" },
  { value: "implementation_nonprofit", label: "Implementation" },
  { value: "advocacy", label: "Advocacy" },
];

function NGOCard({ ngo }) {
  return (
    <Link href={`/ngos/${ngo.slug}`}
      className="bg-white border border-[#e2e6ed] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2d6a4f] transition-all group">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f]">
          {ORG_TYPE_LABELS[ngo.org_type] ?? ngo.org_type}
        </span>
        {ngo.open_to_partnerships && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-white text-[#2d6a4f] flex items-center gap-1">
            <Handshake size={9} /> Open to partnerships
          </span>
        )}
        {ngo.claimable && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#e2e6ed] bg-[#f8f9fb] text-[#718096]">
            Unclaimed
          </span>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors leading-snug">
          {ngo.name}
        </h3>
        {ngo.short_description && (
          <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-2 mt-1 font-light">
            {ngo.short_description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-[#718096] mt-auto pt-2">
        {ngo.headquarters_country && (
          <span className="flex items-center gap-1">
            <Globe size={10} /> {ngo.headquarters_country}
          </span>
        )}
        {ngo.staff_size && (
          <span>{ngo.staff_size} staff</span>
        )}
      </div>
    </Link>
  );
}

export default function NGOsDirectory() {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgType, setOrgType] = useState("all");
  const [partnership, setPartnership] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (orgType !== "all") params.set("org_type", orgType);
    if (partnership) params.set("partnership", "true");

    fetch(`/api/ngos?${params}`)
      .then(r => r.json())
      .then(data => { setNgos(data.ngos ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [orgType, partnership]);

  const filtered = ngos.filter(n =>
    !search || n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.short_description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-16">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-6">
            <Building2 size={11} /> NGO Directory
          </div>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#0f1a14] mb-3">
                NGOs, IGOs & Foundations
              </h1>
              <p className="text-[#4a5568] text-base max-w-xl leading-relaxed font-light">
                Climate-focused organizations: research institutes, foundations, intergovernmental bodies, and implementation non-profits.
              </p>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#2d6a4f]">{ngos.length}</div>
              <div className="text-xs font-mono text-[#718096]">organizations</div>
            </div>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 bg-white border border-[#d0d6e0] rounded-xl px-4 py-3 mb-4 focus-within:border-[#2d6a4f] transition-all max-w-xl">
          <Search size={14} className="text-[#718096]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search organizations…"
            className="flex-1 bg-transparent text-sm text-[#0f1a14] placeholder-[#718096] outline-none" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {ORG_TYPES.map(t => (
            <button key={t.value} onClick={() => setOrgType(t.value)}
              className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
                orgType === t.value
                  ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                  : "border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <button onClick={() => setPartnership(!partnership)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
              partnership
                ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                : "border-[#e2e6ed] bg-white text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
            }`}>
            <Handshake size={11} /> Open to partnerships
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white border border-[#e2e6ed] rounded-xl p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ngo => <NGOCard key={ngo.id} ngo={ngo} />)}
          </div>
        ) : (
          <div className="text-center py-24 border border-dashed border-[#e2e6ed] rounded-2xl">
            <Building2 size={32} className="text-[#d0d6e0] mx-auto mb-4" />
            <p className="text-[#718096] font-mono text-sm">No organizations found</p>
            <p className="text-[#718096] text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}

        <div className="mt-16 bg-white border border-[#e2e6ed] rounded-2xl p-7 text-center">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-2">Don't see your organization?</h2>
          <p className="text-sm text-[#4a5568] mb-5 max-w-md mx-auto">
            Add your NGO, IGO, or foundation to the directory. Free until July 15, 2026.
          </p>
          <Link href="/onboarding/ngo"
            className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors">
            List your organization <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </div>
  );
}
