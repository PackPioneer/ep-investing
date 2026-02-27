"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Building2, Wallet, FileText, Loader2, ArrowLeft, Globe, MapPin, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

const INDUSTRY_FILTERS = [
  "nuclear_technologies", "electric_aviation", "battery_storage",
  "green_hydrogen", "wind_energy", "solar", "geothermal",
  "industrial_decarb", "ev_charging", "carbon_credits",
  "clean_cooking", "direct_air_capture", "saf_efuels", "grid_storage"
];

function CompanyCard({ company }) {
  const tags = company.industry_tags || (company.sector ? [company.sector] : []);
  return (
    <Link href={`/companies/${company.id}`}
      className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2d6a4f] hover:bg-[#f8f9fb] transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="w-9 h-9 rounded-lg object-contain bg-white p-1 flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#e2e6ed] flex items-center justify-center text-sm font-bold text-[#2d6a4f] flex-shrink-0">
              {(company.name || company.url || "?")[0].toUpperCase()}
            </div>
          )}
          <h3 className="font-semibold text-[#0f1a14] text-sm group-hover:text-[#2d6a4f] transition-colors leading-snug">
            {company.name || company.url}
          </h3>
        </div>
        <ChevronRight size={14} className="text-[#718096] group-hover:text-[#2d6a4f] flex-shrink-0 mt-0.5 transition-colors" />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568]">
              {tag.replace(/_/g, " ")}
            </span>
          ))}
          {company.production_status && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f]">
              {company.production_status}
            </span>
          )}
        </div>
      )}

      {(company.description || company.core_technology) && (
        <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-2 font-light">
          {company.description || company.core_technology}
        </p>
      )}

      <div className="flex items-center gap-3 mt-auto">
        {(company.location || company.headquarters_location) && (
          <span className="text-[10px] text-[#718096] flex items-center gap-1 font-mono">
            <MapPin size={10} /> {company.location || company.headquarters_location}
          </span>
        )}
        {company.founding_year && (
          <span className="text-[10px] text-[#718096] flex items-center gap-1 font-mono">
            <Calendar size={10} /> {company.founding_year}
          </span>
        )}
      </div>
    </Link>
  );
}

function InvestorCard({ investor }) {
  return (
    <Link href={`/investors/${investor.id}`}
      className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2d6a4f] hover:bg-[#f8f9fb] transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {investor.logo_url ? (
            <img src={investor.logo_url} alt={investor.name} className="w-9 h-9 rounded-lg object-contain bg-white p-1 flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#e2e6ed] flex items-center justify-center text-sm font-bold text-[#2d6a4f] flex-shrink-0">
              {(investor.name || "?")[0].toUpperCase()}
            </div>
          )}
          <h3 className="font-semibold text-[#0f1a14] text-sm group-hover:text-[#2d6a4f] transition-colors">
            {investor.name}
          </h3>
        </div>
        <ChevronRight size={14} className="text-[#718096] group-hover:text-[#2d6a4f] flex-shrink-0 mt-0.5 transition-colors" />
      </div>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568] self-start">
        VC Firm
      </span>
      {investor.description && (
        <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-2 font-light">{investor.description}</p>
      )}
    </Link>
  );
}

function GrantCard({ grant }) {
  return (
    <Link href={`/grants/${grant.id}`}
      className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-5 flex flex-col gap-3 hover:border-[#2d6a4f] hover:bg-[#f8f9fb] transition-all group">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-[#0f1a14] text-sm group-hover:text-[#2d6a4f] transition-colors leading-snug">
          {grant.title || grant.name}
        </h3>
        <ChevronRight size={14} className="text-[#718096] group-hover:text-[#2d6a4f] flex-shrink-0 mt-0.5 transition-colors" />
      </div>
      {grant.funder_name && (
        <span className="text-xs text-[#4a5568] font-mono">Funder: {grant.funder_name}</span>
      )}
      {grant.deadline_date && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[rgba(255,150,80,0.1)] text-[#ff9650] border border-[rgba(255,150,80,0.2)] self-start">
          Deadline: {new Date(grant.deadline_date).toLocaleDateString()}
        </span>
      )}
      {grant.description && (
        <p className="text-xs text-[#4a5568] leading-relaxed line-clamp-2 font-light">{grant.description}</p>
      )}
    </Link>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState({ companies: [], investors: [], grants: [] });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [activeTab, setActiveTab] = useState("companies");

  useEffect(() => {
    setInputValue(query);
    setLoading(true);
    const url = query ? `/api/search?q=${encodeURIComponent(query)}` : "/api/search?q=";
    fetch(url)
      .then(r => r.json())
      .then(data => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) router.push(`/search?q=${encodeURIComponent(inputValue)}`);
  };

  const handleFilter = (tag) => {
    const next = activeFilter === tag ? null : tag;
    setActiveFilter(next);
    router.push(`/search?q=${encodeURIComponent(next || "")}`);
  };

  const companies = results.companies || [];
  const investors = results.investors || [];
  const grants = results.grants || [];

  const tabs = [
    { id: "companies", label: "Companies", count: companies.length, icon: Building2 },
    { id: "investors", label: "Investors", count: investors.length, icon: Wallet },
    { id: "grants", label: "Grants", count: grants.length, icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Back + Search bar */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f1a14] transition-colors mb-6">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <form onSubmit={handleSearch} className="flex max-w-2xl bg-[#ffffff] border border-[#d0d6e0] rounded-xl overflow-hidden focus-within:border-[#2d6a4f] focus-within:shadow-[0_0_0_3px_rgba(45,106,79,0.12)] transition-all mb-5">
          <div className="flex items-center flex-1 px-4 gap-3">
            <Search size={15} className="text-[#718096] flex-shrink-0" />
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search companies, investors, grants…"
              className="w-full py-3.5 bg-transparent outline-none text-sm text-[#0f1a14] placeholder-[#718096]"
            />
          </div>
          <button type="submit" className="bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm px-5 hover:bg-[#235a40] transition-colors">
            Search
          </button>
        </form>

        {/* Industry filter chips */}
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_FILTERS.map(tag => (
            <button key={tag} onClick={() => handleFilter(tag)}
              className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${
                activeFilter === tag
                  ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                  : "border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
              }`}>
              {tag.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
          {query ? <>Results for <em className="text-[#2d6a4f]">"{query}"</em></> : "Browse all"}
        </h1>
        <span className="text-sm text-[#4a5568] font-mono">{companies.length + investors.length + grants.length} results</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[#2d6a4f] text-[#f2f4f8]"
                : "text-[#4a5568] hover:text-[#0f1a14]"
            }`}>
            <tab.icon size={14} />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
              activeTab === tab.id ? "bg-[#f2f4f8]/20 text-[#f2f4f8]" : "bg-[#e2e6ed] text-[#718096]"
            }`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="animate-spin text-[#2d6a4f]" size={32} />
          <p className="text-[#4a5568] text-sm font-mono">Scanning the ecosystem…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === "companies" && (
            companies.length > 0
              ? companies.map(c => <CompanyCard key={c.id} company={c} />)
              : <div className="col-span-3 text-center py-20 text-[#718096] font-mono text-sm">No companies found</div>
          )}
          {activeTab === "investors" && (
            investors.length > 0
              ? investors.map(i => <InvestorCard key={i.id} investor={i} />)
              : <div className="col-span-3 text-center py-20 text-[#718096] font-mono text-sm">No investors found</div>
          )}
          {activeTab === "grants" && (
            grants.length > 0
              ? grants.map(g => <GrantCard key={g.id} grant={g} />)
              : <div className="col-span-3 text-center py-20 text-[#718096] font-mono text-sm">No grants found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>

      <Suspense fallback={
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin text-[#2d6a4f]" size={32} />
        </div>
      }>
        <SearchResults />
      </Suspense>
    </div>
  );
}
