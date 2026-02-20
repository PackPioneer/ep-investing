"use client"

import axios from "axios";
import { motion } from "framer-motion";
import {
  Building2,
  Rocket,
  Search,
  ArrowRight,
  MapPin,
  Layers,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/companies");
        setCompanies(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="bg-white text-slate-900 font-sans">

      {/* ================= HERO ================= */}
      <section className="relative pt-28 pb-24 px-6 bg-linear-to-b from-emerald-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-6 inline-block">
              Portfolio Directory
            </span>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900">
              Climate Tech <span className="text-emerald-600">Innovators</span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl leading-relaxed">
              Discover the next generation of companies solving the planet's 
              most pressing environmental challenges.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href={'/founders'} className="px-8 py-4 rounded-xl bg-slate-900 text-white font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 text-center">
                View Founders
              </Link>
              <Link href={'/investors'} className="px-8 py-4 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-50 transition text-center">
                View Investors
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================= DATA GRID ================= */}
      <section className="relative pb-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              // Skeleton UI
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-75 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
              ))
            ) : companies.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Rocket className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-900">No companies found</h3>
                <p className="text-slate-500">Check back later or submit a new startup.</p>
              </div>
            ) : (
              companies.map((company) => (
                <div
                  key={company._id}
                  className="group bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-14 h-14 object-contain rounded-xl border border-slate-100 p-2 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-400 font-bold text-xl">
                        {company.name?.charAt(0)}
                      </div>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                      {company.stage || 'Stealth'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    {company.name}
                  </h3>
                  
                  <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                    {company.description || "Building the future of sustainable infrastructure and climate resilience."}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-8 mt-auto">
                    {company.tags?.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[11px] font-medium px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                      <MapPin size={14} />
                      {company.location || 'Remote'}
                    </div>
                    <Link
                      href={`/companies/${company._id}`}
                      className="text-sm font-bold text-slate-900 flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Profile <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ================= VALUE PROPS ================= */}
      <section className="py-24 px-4 sm:px-6 bg-slate-950 text-white overflow-hidden relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ecosystem Resources</h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">Everything you need to scale your climate tech solution.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard 
              icon={<Zap size={24} />} 
              title="Talent Pool" 
              desc="Access a database of engineers and operators specifically looking for mission-driven work."
            />
            <FeatureCard 
              icon={<Layers size={24} />} 
              title="Resource Library" 
              desc="Standardized legal docs, pitch decks, and commercialization playbooks for founders."
            />
            <FeatureCard 
              icon={<Search size={24} />} 
              title="Visibility" 
              desc="Get featured in our monthly investor newsletter sent to 500+ climate-focused VCs."
            />
          </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-from)_0%,transparent_70%)] from-emerald-500/10 to-transparent pointer-events-none" />
      </section>

      {/* ================= CTA ================= */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto p-12 rounded-[2.5rem] bg-emerald-600 text-white shadow-2xl shadow-emerald-200">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to join the directory?</h2>
          <p className="text-emerald-100 mb-10 text-lg">Help us accelerate the energy transition by making your startup discoverable.</p>
          <Link href={'/get-matched'} className="px-10 py-4 bg-white text-emerald-600 font-bold rounded-2xl hover:bg-emerald-50 transition-all scale-100 hover:scale-105 active:scale-95">
            Get Matched
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}