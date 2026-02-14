"use client"

import { motion } from "framer-motion"
import {
  Building2,
  Landmark,
  CheckCircle2,
  ArrowRight
} from "lucide-react"

export default function FoundersPage() {
  return (
    <div className="bg-[#F8FAFC] text-slate-900">

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b bg-linear-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-24">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
              For Founders
            </h1>

            <p className="mt-6 text-xl text-slate-600 leading-relaxed">
              Raise faster with structured investor discovery.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-sm">
                Get Matched
              </button>

              <button className="border border-slate-300 bg-white px-6 py-3 rounded-xl font-medium hover:bg-slate-100 transition">
                Browse Investors
              </button>

              <button className="border border-slate-300 bg-white px-6 py-3 rounded-xl font-medium hover:bg-slate-100 transition">
                Browse Grants
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= WHAT YOU GET ================= */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-center tracking-tight">
            What you get
          </h2>

          <div className="mt-16 grid md:grid-cols-3 gap-8">

            {/* Card 1 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <Building2 className="text-emerald-600" size={32} />
              <h3 className="mt-6 text-lg font-semibold">
                Investors aligned to your stage
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Get matched with investors focused on your sector, 
                traction, and fundraising round.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <Landmark className="text-emerald-600" size={32} />
              <h3 className="mt-6 text-lg font-semibold">
                Grants relevant to your work
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Curated grant opportunities matched to your focus area 
                with smart deadline tracking.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <CheckCircle2 className="text-emerald-600" size={32} />
              <h3 className="mt-6 text-lg font-semibold">
                Clear “why matched” insights
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Transparent reasoning behind each investor or grant 
                recommendation.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= MATCH SECTION ================= */}
      <section className="bg-white border-t py-24">
        <div className="max-w-4xl mx-auto px-6">

          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Get Matched with Investors & Grants
            </h2>
            <p className="mt-4 text-slate-600">
              Tell us about your company — receive personalized, 
              pre-vetted investors and grants.
            </p>
          </div>

          {/* Form Card */}
          <div className="mt-14 bg-white p-10 rounded-2xl border border-slate-200 shadow-sm">

            <div className="grid gap-6">

              <input
                placeholder="Full Name"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              />

              <div className="grid md:grid-cols-2 gap-6">
                <input
                  placeholder="Work Email"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  placeholder="Company URL"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <select className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option>Stage</option>
                <option>Pre-seed</option>
                <option>Seed</option>
                <option>Series A</option>
                <option>Growth</option>
              </select>

              <select className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option>Geography</option>
                <option>United States</option>
                <option>Europe</option>
                <option>Asia</option>
              </select>

              <button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2">
                Get Matched <ArrowRight size={18} />
              </button>

              <p className="text-sm text-slate-500 text-center mt-2">
                We’ll send relevant investors & grants shortly.
              </p>

            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
