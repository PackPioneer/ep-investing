"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Landmark,
  FileText,
  ArrowUpRight,
} from "lucide-react";

const items = [
  {
    title: "Companies",
    desc: "Browse climate and energy transition companies by sector, maturity, traction signals, and capital raised.",
    btn: "Explore companies",
    icon: Building2,
  },
  {
    title: "Investors",
    desc: "Discover venture funds, angels, strategics, and institutional capital actively deploying in climate.",
    btn: "Browse investors",
    icon: Landmark,
  },
  {
    title: "Grants",
    desc: "Track global non-dilutive funding opportunities from governments, foundations, and institutions.",
    btn: "View active grants",
    icon: FileText,
  },
];

export default function ExploreSection() {
  return (
    <section className="relative bg-white overflow-hidden">
      
      {/* Subtle background depth */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-50/60 to-white pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">

        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
          <div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
              Explore EP Investing
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl text-lg">
              Structured intelligence across capital, companies, and
              non-dilutive funding — built for climate markets.
            </p>
          </div>
        </div>

        {/* Structured Grid */}
        <div className="grid lg:grid-cols-3 gap-10">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="group relative bg-white border border-slate-200/70 rounded-2xl p-10 shadow-sm hover:shadow-2xl transition-all duration-300"
            >
              {/* Hover Accent Glow */}
              <div className="absolute inset-0 rounded-2xl bg-green-500/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

              {/* Icon */}
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-green-50 text-green-600 mb-8 group-hover:scale-105 transition">
                <item.icon size={24} />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-semibold text-slate-900">
                {item.title}
              </h3>

              {/* Description */}
              <p className="mt-5 text-slate-600 leading-relaxed">
                {item.desc}
              </p>

              {/* CTA */}
              <div className="mt-8 inline-flex items-center gap-2 text-green-600 font-medium text-sm group-hover:gap-3 transition-all">
                {item.btn}
                <ArrowUpRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
