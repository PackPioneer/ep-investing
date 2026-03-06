"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const tags = [
  "climate ventures",
  "hydrogen",
  "grant",
  "climate finance",
  "google"
];

export default function Hero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e, overrideQuery) => {
    if (e) e.preventDefault();
    const searchTerm = overrideQuery || query;
    if (!searchTerm.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white pt-20 pb-20 md:pt-32 md:pb-28">

      {/* Background glow — fixed: was w-200 (invalid), now w-full */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[50%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight leading-[1.1] text-slate-900"
        >
          Climate investing intelligence —
          <span className="block bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            built for action.
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed px-2"
        >
          Search companies, investors, and grants shaping the energy transition.
        </motion.p>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="mt-10 max-w-2xl mx-auto"
        >
          <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-2xl shadow-lg p-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1 px-3 min-w-0">
                <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search direct air capture..."
                  className="w-full py-3 outline-none bg-transparent text-sm sm:text-base min-w-0"
                />
              </div>
              <button
                type="submit"
                className="flex-shrink-0 px-4 sm:px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all text-sm sm:text-base"
              >
                Search
              </button>
            </div>
          </form>
        </motion.div>

        {/* Tag Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {tags.map((tag) => (
            <span
              key={tag}
              onClick={() => handleSearch(null, tag)}
              className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs sm:text-sm hover:bg-slate-200 transition cursor-pointer"
            >
              {tag.replace(/_/g, ' ')}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
