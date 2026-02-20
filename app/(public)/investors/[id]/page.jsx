"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, MapPin, Target, Wallet, Globe } from "lucide-react";
import Link from "next/link";

export default function SingleInvestorPage() {
  const { id } = useParams();
  const [investor, setInvestor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestor = async () => {
      try {
        const res = await axios.get(`/api/investors/${id}`);
        setInvestor(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvestor();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!investor) return <div className="p-20 text-center">Investor not found.</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-20">
      {/* ================= HERO SECTION ================= */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10">
          <Link
            href="/investors"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Directory
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Logo with shadow */}
              {investor.logo ? (
                <div className="w-24 h-24 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-center">
                  <img src={investor.logo} alt={investor.name} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl">
                  {investor.name?.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{investor.name}</h1>
                   {investor.type && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                      {investor.type.replace("-", " ")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                   {investor.website && (
                     <a href={investor.website} target="_blank" className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                       <Globe size={16} />
                       <span className="text-sm font-medium">{new URL(investor.website).hostname}</span>
                     </a>
                   )}
                </div>
              </div>
            </div>

            <a
              href={investor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 hover:shadow-emerald-100"
            >
              Visit Website
              <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN: Main Info */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Investment Thesis</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg text-slate-600 leading-relaxed italic">
                  "{investor.description || "No description provided."}"
                </p>
              </div>
            </section>

            {investor.focus?.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target size={18} className="text-slate-400" />
                  Primary Sectors
                </h2>
                <div className="flex flex-wrap gap-2">
                  {investor.focus.map((f, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium shadow-sm hover:border-emerald-300 transition-colors"
                    >
                      {f}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Sidebar Stats */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sticky top-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Facts</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shrink-0">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Typical Check Size</p>
                    <p className="text-slate-900 font-semibold">{investor.checkSize || "Undisclosed"}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Geographies</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                       {investor.geography?.map((g, i) => (
                         <span key={i} className="text-slate-900 font-semibold text-sm">
                           {g}{i !== investor.geography.length - 1 ? "," : ""}
                         </span>
                       ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="text-xs text-slate-400 leading-tight">
                  Information is updated based on public filings and community contributions.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}