"use client";

import { motion } from "framer-motion";
import {
  Users,
  Lightbulb,
  UserCheck,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const items = [
  {
    title: "Investors",
    desc: "Discover climate-focused companies, co-investors, and funding signals — all in one intelligent platform.",
    btn: "Explore investor intelligence",
    icon: Users,
    link: "/investors"
  },
  {
    title: "Founders",
    desc: "Get matched with investors, grants, and experts aligned to your climate solution and stage.",
    btn: "Find capital & support",
    icon: Lightbulb,
    link: "/founders"
  },
  {
    title: "Experts",
    desc: "Showcase your expertise and connect with startups, investors, and institutions that need it.",
    btn: "Join the expert network",
    icon: UserCheck,
    link: "/"
  },
  {
    title: "Job Seekers",
    desc: "Find meaningful roles across climate tech, energy transition, and sustainability-driven organizations.",
    btn: "Browse climate jobs",
    icon: Briefcase,
    link: "/"
  },
];

export default function StartHere() {
  return (
    <section className="relative pb-28 bg-linear-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            Start here
          </h2>
          <p className="mt-4 text-slate-600 text-lg max-w-2xl mx-auto">
            Whether you deploy capital, build companies, provide expertise,
            or seek opportunity — EP Investing connects you to climate action.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ y: -6 }}
              className="group relative bg-white border border-slate-200/70 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-emerald-500 to-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 rounded-t-2xl" />

              {/* Icon */}
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-6 group-hover:scale-105 transition">
                <item.icon size={22} />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-slate-900">
                {item.title}
              </h3>

              {/* Description */}
              <p className="mt-4 text-slate-600 leading-relaxed text-sm">
                {item.desc}
              </p>

              {/* CTA */}
              <Link href={item.link} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-600 group-hover:gap-3 transition-all">
                {item.btn}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
