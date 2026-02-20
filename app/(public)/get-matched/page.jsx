"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Lightbulb,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function GetMatchedPage() {
  return (
    <div className="bg-white text-slate-900">

      {/* ================= HERO ================= */}
      <section className="relative pt-28 pb-24 px-6 bg-linear-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto text-center">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-semibold tracking-tight"
          >
            Get Matched
          </motion.h1>

          <p className="mt-6 text-lg text-slate-600">
            Choose your path:
          </p>

          {/* Path Cards */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">

            <PathCard
              icon={<Briefcase size={36} />}
              title="I'm an Investor"
              desc="Discover deal flow matched to your investment focus."
              button="Find Startups to Fund"
              link="/investors"
            />

            <PathCard
              icon={<Lightbulb size={36} />}
              title="I'm a Founder"
              desc="Connect with funders and grants aligned to your stage."
              button="Find Investors & Grants"
              link="/founders"
            />

          </div>
        </div>
      </section>

      {/* ================= LIST PREVIEW ================= */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">

          {/* Investors Column */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Investors</h3>
              <ChevronDown size={18} className="text-slate-500" />
            </div>

            <div className="space-y-6">
              <InvestorItem
                name="Summit Climate Ventures"
                tags={["energy storage", "hydrogen", "smart grid"]}
              />
              <InvestorItem
                name="TerraNova Capital"
                tags={["DAC", "carbon monitoring"]}
              />
              <InvestorItem
                name="Blue Horizon Philanthropy"
                tags={["green hydrogen", "climate solutions"]}
              />
            </div>

            <button className="mt-8 w-full py-3 rounded-lg border border-slate-300 hover:bg-slate-50 transition">
              View Profile
            </button>
          </div>

          {/* Grants Column */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Relevant Grants</h3>
              <ChevronDown size={18} className="text-slate-500" />
            </div>

            <div className="space-y-6">

              <GrantItem
                title="DOE Direct Air Capture"
                deadline="Apr 18, 2024"
                amount="$2–4M"
                tag="direct_air_capture"
              />

              <GrantItem
                title="Climate Solutions Catalyst Grant"
                deadline="May 10, 2024"
                amount="$1M"
                tag="carbon_credits"
              />

            </div>

            <button className="mt-8 w-full py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">
              View Grant
            </button>
          </div>

        </div>
      </section>

      {/* ================= FOOT NOTE ================= */}
      <section className="py-16 px-6 text-center bg-white">
        <p className="max-w-3xl mx-auto text-slate-600">
          EP Investing is part of The Energy Pioneer ecosystem — connecting
          capital, talent, and intelligence to accelerate the energy transition.
        </p>
      </section>

    </div>
  );
}

/* ================= COMPONENTS ================= */

function PathCard({ icon, title, desc, button, link }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-lg p-10 text-center hover:shadow-xl transition-all"
    >
      <div className="text-emerald-600 flex justify-center">{icon}</div>
      <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
      <p className="mt-4 text-slate-600">{desc}</p>

      <Link href={link} className="mt-8 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition flex items-center justify-center gap-2 mx-auto">
        {button}
        <ArrowRight size={18} />
      </Link>
    </motion.div>
  );
}

function InvestorItem({ name, tags }) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <h4 className="font-medium">{name}</h4>
      <div className="flex flex-wrap gap-2 mt-3">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function GrantItem({ title, deadline, amount, tag }) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-slate-600 mt-2">
        Deadline: {deadline} · {amount}
      </p>
      <span className="inline-block mt-3 text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-600">
        {tag}
      </span>
    </div>
  );
}
