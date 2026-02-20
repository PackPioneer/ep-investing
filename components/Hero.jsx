"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const tags = [
  "direct_air_capture",
  "emerald_hydrogen",
  "nuclear_technologies",
  "carbon_capture",
];

export default function Hero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  // 🔍 Handle Search
  const handleSearch = (searchQuery) => {
    const value = searchQuery || query;

    if (!value.trim()) return;

    // Redirect to search page with query
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  // ⌨️ Enter key support
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white via-slate-50 to-white pt-32 pb-28">
      
      {/* Background Glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-150 h-75 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        
        {/* Heading */}
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
          className="mt-8 text-lg md:text-xl text-slate-600 leading-relaxed"
        >
          Search companies, investors, grants, and jobs shaping the energy
          transition.
        </motion.p>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="pt-12"
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-2">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">

              {/* Input */}
              <div className="flex items-center flex-1 px-4">
                <Search size={18} className="text-slate-400 mr-3" />

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search direct air capture, Breakthrough Energy..."
                  className="w-full py-3 text-sm md:text-base outline-none bg-transparent placeholder:text-slate-400"
                />
              </div>

              {/* Button */}
              <button
                onClick={() => handleSearch()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
              >
                Search
              </button>

            </div>
          </div>
        </motion.div>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {tags.map((tag) => (
            <span
              key={tag}
              onClick={() => handleSearch(tag)}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </motion.div>

      </div>
    </section>
  );
}