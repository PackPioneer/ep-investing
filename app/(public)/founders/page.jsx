"use client"

import axios from "axios";
import { motion } from "framer-motion"
import { Building2, Landmark, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react";

export default function FoundersPage() {


const [founders, setFounders] = useState([]);
const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchFounders = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/grants");
      setFounders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchFounders();
}, []);

  return (
    <div className="bg-[#F5F7FA] text-slate-900">

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-white">
        {/* Subtle background layer */}
        {/* <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-white to-slate-100 opacity-70" /> */}

        <div className="relative max-w-6xl mx-auto px-6 md:px-0 pt-28 pb-20 lg:py-32">
          <div className="max-w-3xl">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-slate-900">
                For Founders
              </h1>

              <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed">
                Structured investor and grant discovery for serious climate founders.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href={'/get-matched'} className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3.5 rounded-xl font-medium transition shadow-md hover:shadow-lg text-center">
                  Get Matched
                </Link>

                <Link href={'/investors'} className="border border-slate-300 bg-white px-7 py-3.5 rounded-xl font-medium hover:bg-slate-100 transition text-center">
                  Browse Investors
                </Link>

                <Link href={'/grants'} className="border border-slate-300 bg-white px-7 py-3.5 rounded-xl font-medium hover:bg-slate-100 transition text-center">
                  Browse Grants
                </Link>
              </div>
            </motion.div>

          </div>
        </div>
      </section>


<section className="relative bg-white pb-24 px-4 sm:px-6">
  <div className="max-w-6xl mx-auto">

    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">

      {loading ? (
        // ================= SKELETON =================
        Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm animate-pulse"
          >
            <div className="h-5 w-40 bg-slate-200 rounded mb-3"></div>
            <div className="h-4 w-28 bg-slate-200 rounded mb-3"></div>

            <div className="flex gap-2 mb-4">
              <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
              <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
            </div>

            <div className="h-4 w-32 bg-slate-200 rounded"></div>
          </div>
        ))
      ) : founders.length === 0 ? (
        // ================= EMPTY =================
        <div className="col-span-full text-center text-slate-500 py-10">
          No founders available.
        </div>
      ) : (
        // ================= DATA =================
        founders.map((g) => {
          return (
            <div
              key={g._id}
              className="group bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              {/* TOP */}
              <div>

                {/* Title */}
                <h3 className="font-semibold text-slate-800 text-lg leading-tight">
                  {g.title}
                </h3>

                {/* Funder */}
                {g.funder && (
                  <p className="mt-2 text-sm text-slate-600">
                    Funded by{" "}
                    <span className="text-emerald-600 font-medium">
                      {g.funder}
                    </span>
                  </p>
                )}

                {/* Deadline */}
                {g.deadline && (
                  <p className="mt-2 text-sm text-red-500">
                    Deadline:{" "}
                    {new Date(g.deadline).toLocaleDateString()}
                  </p>
                )}

                {/* Amount */}
                {(g.amountMin || g.amountMax) && (
                  <p className="mt-2 text-sm text-slate-700 font-medium">
                    Funding:{" "}
                    {g.amountMin && `₹${g.amountMin.toLocaleString()}`}
                    {g.amountMin && g.amountMax && " - "}
                    {g.amountMax && `₹${g.amountMax.toLocaleString()}`}
                  </p>
                )}

                {/* Tags */}
                {g.tags && g.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {g.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

              </div>

              {/* CTA */}
              {g.link && (
                <a
                  href={g.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 mt-5 font-medium text-emerald-600 hover:text-emerald-700 underline"
                >
                  Apply Now
                  <ArrowRight size={16} />
                </a>
              )}
            </div>
          );
        })
      )}

    </div>

  </div>
</section>



      {/* ================= WHAT YOU GET ================= */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">
              What you get
            </h2>
            <p className="mt-4 text-slate-600">
              Precision matching designed for high-quality capital alignment.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">

            {/* Card */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Building2 className="text-emerald-600" size={24} />
              </div>
              <h3 className="mt-6 text-lg font-semibold">
                Stage-Aligned Investors
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Investors filtered by sector, traction, and round — not generic lists.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Landmark className="text-emerald-600" size={24} />
              </div>
              <h3 className="mt-6 text-lg font-semibold">
                Curated Grants
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Deadline-aware grants relevant to your technology and geography.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={24} />
              </div>
              <h3 className="mt-6 text-lg font-semibold">
                Transparent Match Logic
              </h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">
                Clear explanations on why each investor or grant fits your company.
              </p>
            </div>

          </div>
        </div>
      </section>


      {/* ================= APPLICATION SECTION ================= */}
      <section className=" text-slate-900 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">

          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">
              Get Matched with Investors & Grants
            </h2>
            <p className="mt-4 text-slate-400">
              Submit your company details. We curate, filter, and send qualified capital opportunities.
            </p>
          </div>

          <div className="mt-14 bg-white text-slate-900 rounded-3xl p-8 lg:p-10 shadow-2xl">

            <div className="grid gap-6">

              <input
                placeholder="Full Name"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              />

              <div className="grid sm:grid-cols-2 gap-6">
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

              <button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-medium transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                Get Matched <ArrowRight size={18} />
              </button>

              <p className="text-sm text-slate-500 text-center">
                We respond within 48 hours.
              </p>

            </div>

          </div>
        </div>
      </section>

    </div>
  )
}
