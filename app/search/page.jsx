"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Building2, 
  Wallet, 
  GraduationCap, 
  Loader2, 
  ArrowLeft, 
  ExternalLink, 
  MapPin, 
  Search 
} from "lucide-react";
import Link from "next/link";

/**
 * ResultSection Component
 * Renders a column for either Companies, Investors, or Grants
 */
function ResultSection({ title, icon, items, type }) {
  return (
    <div className="flex flex-col space-y-4">
      {/* Column Header */}
      <div className="flex items-center gap-3 px-2">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
          {icon}
        </div>
        <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
        <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">
          {items?.length || 0}
        </span>
      </div>

      {/* List of Cards */}
      <div className="space-y-3">
        {items?.length > 0 ? (
          items.map((item) => (
            <Link 
              key={item._id} 
              href={`/${type}/${item._id}`}
              className="block bg-white border border-slate-200 p-5 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {item.name || item.title}
                </h3>
                <ExternalLink size={14} className="text-slate-300 group-hover:text-emerald-400" />
              </div>

              {/* Model-Specific Metadata */}
              <div className="text-xs space-y-2">
                {type === "companies" && (
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                      {item.stage || "Not Specified"}
                    </span>
                    {item.location && (
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin size={12}/> {item.location}
                      </span>
                    )}
                  </div>
                )}

                {type === "investors" && (
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium capitalize">
                      {item.type || "VC"}
                    </span>
                    <p className="text-slate-500 italic line-clamp-1">
                      {item.focus?.join(" • ")}
                    </p>
                  </div>
                )}

                {type === "founders" && (
                  <div className="flex flex-col gap-1">
                    <p className="text-emerald-600 font-bold">
                      {item.amountMax 
                        ? `Up to $${item.amountMax.toLocaleString()}` 
                        : "Grant funding"}
                    </p>
                    <p className="text-slate-400">Funder: {item.funder}</p>
                  </div>
                )}

                <p className="text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                  {item.description || (item.tags && item.tags.join(", "))}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-slate-100/50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
            <p className="text-sm text-slate-400">No {title.toLowerCase()} found</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SearchResults Component
 * Handles the data fetching logic using URL parameters
 */
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [results, setResults] = useState({ companies: [], investors: [], grants: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Page Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link 
            href="/" 
            className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Search
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            Results for <span className="text-emerald-600 italic">"{query || ""}"</span>
          </h1>
        </div>
        
        <div className="text-sm text-slate-400">
          Showing top matches across climate tech
        </div>
      </div>

      {/* Main Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
          <p className="text-slate-500 font-medium animate-pulse">Scanning the ecosystem...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          <ResultSection 
            title="Companies" 
            icon={<Building2 size={20} />} 
            type="companies" 
            items={results.companies} 
          />
          <ResultSection 
            title="Investors" 
            icon={<Wallet size={20} />} 
            type="investors" 
            items={results.investors} 
          />
          <ResultSection 
            title="Founders" 
            icon={<GraduationCap size={20} />} 
            type="founders" 
            items={results.grants} 
          />
        </div>
      )}
    </div>
  );
}

/**
 * Main Page Export
 * Wrapped in Suspense to prevent Next.js build errors
 */
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <Suspense 
        fallback={
          <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  );
}