"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  ExternalLink, 
  MapPin, 
  Rocket, 
  Tag as TagIcon, 
  Globe, 
  Calendar 
} from "lucide-react";
import Link from "next/link";

export default function SingleCompanyPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`/api/companies/${id}`);
        setCompany(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium font-sans">Loading company data...</p>
      </div>
    );
  }

  if (!company) return <div className="p-20 text-center text-slate-500">Company not found.</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-20 font-sans">
      {/* ================= HERO SECTION ================= */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-10">
          <Link
            href="/companies"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Companies
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              {/* Logo / Placeholder */}
              {company.logo ? (
                <div className="w-24 h-24 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src={company.logo} alt={company.name} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-2xl">
                  {company.name?.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{company.name}</h1>
                  {company.stage && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                      {company.stage.replace("-", " ")}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm font-medium">
                  {company.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-slate-400" />
                      {company.location}
                    </div>
                  )}
                  {company.website && (
                    <a href={company.website} target="_blank" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                      <Globe size={16} className="text-slate-400" />
                      {new URL(company.website).hostname}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-[0.98]"
              >
                Visit Site
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN: Overview */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">About</h2>
              <p className="text-xl text-slate-600 leading-relaxed font-light">
                {company.description || "No description available for this company."}
              </p>
            </section>

            {company.tags?.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <TagIcon size={14} />
                  Categories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag, i) => (
                    <div
                      key={i}
                      className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:border-emerald-200 hover:text-emerald-600 transition-all cursor-default"
                    >
                      #{tag}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Company Details Card */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sticky top-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-8">Company Details</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Rocket size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maturity Stage</p>
                    <p className="text-slate-900 font-semibold capitalize mt-0.5">{company.stage || "Not Specified"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headquarters</p>
                    <p className="text-slate-900 font-semibold mt-0.5">{company.location || "Remote / Global"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listing Date</p>
                    <p className="text-slate-900 font-semibold mt-0.5">
                      {new Date(company.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100">
                <button className="w-full py-3 text-sm font-bold text-slate-400 hover:text-emerald-600 border border-dashed border-slate-200 rounded-xl transition-colors">
                  Suggest an Edit
                </button>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}