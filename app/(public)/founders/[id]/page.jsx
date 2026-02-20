"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  ExternalLink, 
  Building2, 
  Clock, 
  Tag as TagIcon,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function SingleGrantPage() {
  const { id } = useParams();
  const [grant, setGrant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrant = async () => {
      try {
        const res = await axios.get(`/api/grants/${id}`);
        setGrant(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchGrant();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Fetching grant details...</p>
      </div>
    );
  }

  if (!grant) return <div className="p-20 text-center text-slate-500">Grant not found.</div>;

  const isExpired = grant.deadline && new Date(grant.deadline) < new Date();

  return (
    <div className="bg-[#FDFCFB] min-h-screen py-20 font-sans">
      {/* ================= HEADER ================= */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 pt-12 pb-10">
          <Link
            href="/founders"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-amber-600 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to All Founders
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-widest rounded-md">
                  Grant Opportunity
                </span>
                {isExpired && (
                  <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest rounded-md flex items-center gap-1">
                    <AlertCircle size={12} /> Closed
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">
                {grant.title}
              </h1>
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <Building2 size={20} className="text-amber-500" />
                <span>Issued by: <span className="text-slate-900">{grant.funder || "Not Specified"}</span></span>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl text-white min-w-70 shadow-xl shadow-slate-200">
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Funding Amount</p>
               <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-bold">
                   {grant.amountMin ? `$${grant.amountMin.toLocaleString()}` : "Variable"}
                 </span>
                 {grant.amountMax && (
                   <span className="text-xl text-slate-400 font-medium">
                     — ${grant.amountMax.toLocaleString()}
                   </span>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-12">
            <section>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Eligible Categories</h2>
              <div className="flex flex-wrap gap-3">
                {grant.tags?.map((tag, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm">
                    <TagIcon size={14} className="text-amber-500" />
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            <section className="bg-amber-50/50 rounded-2xl p-8 border border-amber-100/50">
               <h2 className="text-lg font-bold text-slate-900 mb-4">Application Guidance</h2>
               <p className="text-slate-600 leading-relaxed italic">
                 Founders are encouraged to review the official documentation provided by {grant.funder || 'the funder'} before submitting. Ensure all eligibility criteria in the {grant.tags?.join(", ")} categories are met.
               </p>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-900 font-bold mb-6">
                <Clock className="text-amber-500" size={20} />
                Important Dates
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submission Deadline</p>
                  <p className={`text-lg font-bold ${isExpired ? 'text-red-500' : 'text-slate-900'}`}>
                    {grant.deadline ? new Date(grant.deadline).toLocaleDateString('en-US', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    }) : "Rolling Basis"}
                  </p>
                </div>
              </div>

              <a
                href={grant.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${
                  isExpired 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-100'
                }`}
              >
                {isExpired ? 'Application Closed' : 'Apply for Grant'}
                <ExternalLink size={18} />
              </a>
            </div>

            <p className="text-center text-xs text-slate-400 px-4">
              Found a mistake? <button className="underline hover:text-amber-600">Report outdated information</button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}