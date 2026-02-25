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
  Users,
  DollarSign,
  Calendar,
  Building,
  Target,
  TrendingUp,
  Factory
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
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Search
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              {/* Logo / Placeholder */}
              {company.logo_url ? (
                <div className="w-24 h-24 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-center overflow-hidden">
                  <img src={company.logo_url} alt={company.name} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-24 h-24 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-400 font-bold text-2xl">
                  {company.name?.charAt(0)}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{company.name}</h1>
                  {company.production_status && (
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border
                      ${company.production_status === 'commercial' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                      ${company.production_status === 'pilot' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                      ${company.production_status === 'research' ? 'bg-gray-50 text-gray-700 border-gray-100' : ''}
                      ${company.production_status === 'scaled' ? 'bg-purple-50 text-purple-700 border-purple-100' : ''}
                    `}>
                      {company.production_status}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm font-medium">
                  {(company.headquarters_location || company.location) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={16} className="text-slate-400" />
                      {company.headquarters_location || company.location}
                    </div>
                  )}
                  {company.url && (
                    <a href={company.url} target="_blank" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                      <Globe size={16} className="text-slate-400" />
                      {new URL(company.url).hostname}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={company.url}
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
            
            {/* About Section */}
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">About</h2>
              <p className="text-xl text-slate-600 leading-relaxed font-light">
                {company.description || "No description available for this company."}
              </p>
            </section>

            {/* Core Technology */}
            {company.core_technology && (
              <section className="bg-white border border-slate-200 rounded-2xl p-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Rocket size={14} />
                  Core Technology
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed">
                  {company.core_technology}
                </p>
              </section>
            )}

            {/* Key Customers */}
            {company.key_customers && (
              <section className="bg-white border border-slate-200 rounded-2xl p-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Users size={14} />
                  Key Customers
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed">
                  {company.key_customers}
                </p>
              </section>
            )}

            {/* Target Market */}
            {company.target_market && (
              <section className="bg-white border border-slate-200 rounded-2xl p-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Target size={14} />
                  Target Market
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed">
                  {company.target_market}
                </p>
              </section>
            )}

            {/* Recent Milestones */}
            {company.recent_milestones && (
              <section className="bg-white border border-slate-200 rounded-2xl p-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <TrendingUp size={14} />
                  Recent Milestones
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed">
                  {company.recent_milestones}
                </p>
              </section>
            )}

            {/* Manufacturing Capability */}
            {company.manufacturing_capability && (
              <section className="bg-white border border-slate-200 rounded-2xl p-8">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Factory size={14} />
                  Manufacturing Capability
                </h2>
                <p className="text-lg text-slate-700 leading-relaxed">
                  {company.manufacturing_capability}
                </p>
              </section>
            )}

            {/* Industry Tags */}
            {company.industry_tags?.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <TagIcon size={14} />
                  Industries
                </h2>
                <div className="flex flex-wrap gap-2">
                  {company.industry_tags.map((tag, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-sm font-semibold hover:bg-emerald-100 transition-all cursor-default"
                    >
                      {tag.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Company Details Card */}
          <aside className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 sticky top-8 shadow-sm space-y-8">
              <h3 className="text-lg font-bold text-slate-900">Company Intel</h3>
              
              {/* Production Status */}
              {company.production_status && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Rocket size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Production Status</p>
                    <p className="text-slate-900 font-semibold capitalize mt-0.5">{company.production_status}</p>
                  </div>
                </div>
              )}

              {/* Headquarters */}
              {(company.headquarters_location || company.location) && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headquarters</p>
                    <p className="text-slate-900 font-semibold mt-0.5">{company.headquarters_location || company.location}</p>
                  </div>
                </div>
              )}

              {/* Founded */}
              {company.founding_year && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Founded</p>
                    <p className="text-slate-900 font-semibold mt-0.5">{company.founding_year}</p>
                  </div>
                </div>
              )}

              {/* Funding Raised */}
              {company.total_funding_raised && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Funding Raised</p>
                    <p className="text-slate-900 font-semibold mt-0.5">{company.total_funding_raised}</p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-100">
                <div className="text-xs text-slate-400">
                  Last updated: {new Date(company.updated_at || company.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
