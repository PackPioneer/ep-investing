"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

const tags = [
  "direct_air_capture",
  "emerald_hydrogen",
  "nuclear_technologies",
  "carbon_capture",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-white via-slate-50 to-white pt-32 pb-28">
      
      {/* Subtle Background Glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-200 h-[50%] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        
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
          className="mt-8 text-lg md:text-xl text-slate-600 leading-relaxed"
        >
          Search companies, investors, grants, and jobs shaping the energy
          transition. From early-stage climate tech to institutional capital —
          find what moves your work forward.
        </motion.p>

        {/* Premium Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="pt-12"
        >
          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/30">
            
            <div className="pl-5 text-slate-400">
              <Search size={20} />
            </div>

            <input
              placeholder="Search direct air capture, Breakthrough Energy..."
              className="flex-1 py-4 px-4 text-sm md:text-base outline-none bg-transparent"
            />

            <button className="-ml-10 m-2 px-6 py-3 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:bg-emerald-700 transition-all duration-300">
              Search
            </button>
          </div>
        </motion.div>

        {/* Tag Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {tags.map((tag, i) => (
            <motion.span
              key={tag}
              whileHover={{ y: -3 }}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition cursor-pointer"
            >
              {tag}
            </motion.span>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
