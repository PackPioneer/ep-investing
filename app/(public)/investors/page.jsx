"use client"

import axios from "axios";
import { motion } from "framer-motion";
import {
  Building2,
  Landmark,
  Target,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function InvestorsPage() {

  const [investors, setInvestors] = useState([]);
const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/investors");
      setInvestors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchInvestors();
}, []);
  
  return (
    <div className="bg-white text-slate-900">

      {/* ================= HERO ================= */}
      <section className="relative pt-28 pb-24 px-6">
        <div className="max-w-6xl mx-auto">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight"
          >
            For Investors
          </motion.h1>

          <p className="mt-6 text-lg text-slate-600 max-w-2xl">
            Deal flow for the energy transition — curated, searchable,
            and signal-driven.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition">
              Get Matched (2 minutes)
            </button>

            <button className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 transition">
              Browse Investors
            </button>

            <button className="px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 transition">
              Browse Companies
            </button>
          </div>
        </div>
      </section>



<section className="relative pb-24 px-4 sm:px-6">
  <div className="max-w-6xl mx-auto">

    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">

      {loading ? (
        // ================= SKELETON =================
        Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>

            <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>

            <div className="flex gap-2">
              <div className="h-5 w-12 bg-slate-200 rounded-full"></div>
              <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
              <div className="h-5 w-14 bg-slate-200 rounded-full"></div>
            </div>

            <div className="h-4 w-28 bg-slate-200 rounded mt-6"></div>
          </div>
        ))
      ) : investors.length === 0 ? (
        // ================= EMPTY STATE =================
        <div className="col-span-full text-center text-slate-500 py-10">
          No investors found.
        </div>
      ) : (
        // ================= ACTUAL DATA =================
        investors.map((i) => {
          return (
            <div
              key={i._id}
              className="group bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Top Section */}
              <div>

                {/* Logo + Name */}
                <div className="flex items-center gap-3 mb-3">
                  
                  {i.logo ? (
                    <img
                      src={i.logo}
                      alt={i.name}
                      className="w-10 h-10 object-contain rounded-md border border-slate-200 p-1 bg-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                      N/A
                    </div>
                  )}

                  <h3 className="font-semibold text-slate-800 leading-tight">
                    {i.name}
                  </h3>
                </div>

                {/* Type */}
                {i.type && (
                  <p className="mb-3 text-sm">
                    Type:{" "}
                    <span className="text-emerald-600 font-medium capitalize">
                      {i.type.replace("-", " ")}
                    </span>
                  </p>
                )}

                {/* Focus */}
                {i.focus && i.focus.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {i.focus.slice(0, 3).map((f, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

              </div>

              {/* CTA */}
              <Link
                href={i.website}
                className="flex items-center gap-1 mt-5 font-medium text-slate-700 hover:text-black underline" target="_blank"
              >
                Visit website <ArrowRight size={16} />
              </Link>
            </div>
          );
        })
      )}

    </div>

  </div>
</section>




<section className="py-24 px-4 sm:px-6 bg-linear-to-b from-slate-50 to-white">
  <div className="max-w-6xl mx-auto text-center">

    {/* Heading */}
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
      Why EP Investing
    </h2>

    <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
      A smarter way to discover, track, and invest in climate innovation.
    </p>

    {/* Cards */}
    <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 mt-14 sm:mt-16">

      <PremiumCard
        icon={<Building2 size={26} />}
        title="Discover Companies"
        desc="Explore curated climate tech startups by sector, traction, and stage."
      />

      <PremiumCard
        icon={<Landmark size={26} />}
        title="Track Grants"
        desc="Stay updated with non-dilutive funding, subsidies, and blended finance."
      />

      <PremiumCard
        icon={<Target size={26} />}
        title="Smart Matching"
        desc="Get AI-driven recommendations aligned with your thesis and geography."
      />

    </div>

  </div>
</section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-3xl md:text-4xl font-semibold">
            How Matching Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12 mt-16 text-left">

            <Step
              number="1"
              title="Tell us your focus"
              desc="Select sectors, stage, check size, and climate themes."
            />

            <Step
              number="2"
              title="We recommend opportunities"
              desc="Curated lists of startups and signals that match your criteria."
            />

            <Step
              number="3"
              title="Save, shortlist & request intros"
              desc="Build a shortlist and request introductions directly."
            />

          </div>
        </div>
      </section>

      {/* ================= FORM SECTION ================= */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold">
              Investing in Climate Tech?
            </h2>
            <p className="mt-4 text-slate-600">
              Tell us your focus areas and we’ll match you to relevant deals.
            </p>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200">

            <div className="grid md:grid-cols-2 gap-8">

              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500/30 outline-none"
                  placeholder="Full Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500/30 outline-none"
                  placeholder="you@fund.com"
                />
              </div>

            </div>

            <div className="mt-10">
              <button className="w-full md:w-auto px-8 py-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                Get Matched Today
                <ArrowRight size={18} />
              </button>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function PremiumCard({ icon, title, desc }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative group rounded-2xl p-px bg-linear-to-br from-emerald-400/40 via-transparent to-slate-200/40"
    >
      <div className="h-full w-full bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm group-hover:shadow-xl transition-all duration-300">

        {/* Icon */}
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
          {icon}
        </div>

        {/* Title */}
        <h3 className="mt-6 text-lg sm:text-xl font-semibold text-slate-800">
          {title}
        </h3>

        {/* Description */}
        <p className="mt-3 text-slate-600 text-sm leading-relaxed">
          {desc}
        </p>

        {/* Hover underline */}
        <div className="mt-6 w-10 h-0.5 bg-emerald-500 group-hover:w-16 transition-all duration-300"></div>

      </div>
    </motion.div>
  );
}

function Step({ number, title, desc }) {
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold">
          {number}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-4 text-slate-600 text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
