"use client";

import { motion } from "framer-motion";
import { Building2, Landmark, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const items = [
  {
    title: "Companies",
    desc: "Browse climate and energy transition companies by sector, maturity, traction signals, and capital raised.",
    btn: "Explore companies",
    icon: Building2,
    link: "/companies"
  },
  {
    title: "Investors",
    desc: "Discover venture funds, angels, strategics, and institutional capital actively deploying in climate.",
    btn: "Browse investors",
    icon: Landmark,
    link: "/investors"
  },
  {
    title: "Grants",
    desc: "Track global non-dilutive funding opportunities from governments, foundations, and institutions.",
    btn: "View active grants",
    icon: FileText,
    link: "/founders"
  },
];

export default function StartHere() {
  return (
    <section className="relative pb-16 md:pb-28 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Start here
          </h2>
          <p className="mt-3 text-slate-600 text-base md:text-lg max-w-2xl mx-auto px-2">
            Whether you deploy capital, build companies, provide expertise,
            or seek opportunity — EP Investment connects you to climate action.
          </p>
        </motion.div>

        {/* Grid — single col on mobile, 3 col on large */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ y: -8 }}
              className="group relative bg-white border border-slate-200/70 rounded-2xl p-6 md:p-10 shadow-sm hover:shadow-2xl transition-all duration-300"
            >
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

              <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-6 md:mb-8 group-hover:scale-105 transition">
                <item.icon size={22} />
              </div>

              <h3 className="text-xl md:text-2xl font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-3 md:mt-5 text-slate-600 leading-relaxed text-sm md:text-base">
                {item.desc}
              </p>

              <Link href={item.link} className="mt-6 md:mt-8 inline-flex items-center gap-2 text-emerald-600 font-medium text-sm group-hover:gap-3 transition-all">
                {item.btn}
                <ArrowUpRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
