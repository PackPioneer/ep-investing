"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Landmark,
  Target,
  ArrowRight,
} from "lucide-react";

export default function InvestorsPage() {
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

      {/* ================= WHY EP ================= */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto text-center">

          <h2 className="text-3xl md:text-4xl font-semibold">
            Why EP Investing
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-16">

            {/* Card 1 */}
            <FeatureCard
              icon={<Building2 size={28} />}
              title="Discover Companies"
              desc="Browse climate tech by sector, traction signals, and stage."
            />

            {/* Card 2 */}
            <FeatureCard
              icon={<Landmark size={28} />}
              title="Track Grants"
              desc="Monitor non-dilutive and blended finance opportunities."
            />

            {/* Card 3 */}
            <FeatureCard
              icon={<Target size={28} />}
              title="Get Smart Matches"
              desc="Receive recommendations aligned to thesis, stage, and geography."
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

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all"
    >
      <div className="text-emerald-600">{icon}</div>
      <h3 className="mt-6 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-slate-600 text-sm leading-relaxed">
        {desc}
      </p>
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
