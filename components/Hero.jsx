"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Import router
import { motion } from "framer-motion";
import { Search } from "lucide-react";

// ... tags array same as before
const tags = [
  "direct_air_capture",
  "emerald_hydrogen",
  "nuclear_technologies",
  "carbon_capture",
];


export default function Hero() {
  const [query, setQuery] = useState("");
  const useRouter_ = useRouter();

  const handleSearch = (e, overrideQuery) => {
    if (e) e.preventDefault();
    const searchTerm = overrideQuery || query;
    if (!searchTerm.trim()) return;

    // Navigate to the search page with the query param
    useRouter_.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white via-slate-50 to-white pt-32 pb-28">
      {/* ... Background Glow & Headline (Keep same design) ... */}

      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-200 h-[50%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] text-slate-900"
        >
          Climate investing intelligence —
          <span className="block bg-linear-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            built for action.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-8 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
        >
          Search companies, investors, and grants shaping the energy transition.
        </motion.p>
      
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        {/* Search Input */}
        <motion.div className="pt-12">
          <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-2xl shadow-lg p-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1 px-4">
                <Search size={18} className="text-slate-400 mr-3" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search direct air capture..."
                  className="w-full py-3 outline-none bg-transparent"
                />
              </div>
              <button type="submit" className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all">
                Search
              </button>
            </div>
          </form>
        </motion.div>

        {/* Tag Pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {tags.map((tag) => (
            <span
              key={tag}
              onClick={() => handleSearch(null, tag)}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition cursor-pointer"
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}