"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function SingleInvestorPage() {
  const { id } = useParams();
  const [investor, setInvestor] = useState(null);

  useEffect(() => {
    const fetchInvestor = async () => {
      try {
        const res = await axios.get(`/api/investors/${id}`);
        setInvestor(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (id) fetchInvestor();
  }, [id]);

  if (!investor) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="max-w-5xl mx-auto px-6 pt-24">

        <Link
          href="/investors"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-black mb-6"
        >
          <ArrowLeft size={16} />
          Back to Investors
        </Link>

        <div className="flex items-center gap-4">

          {/* Logo */}
          {investor.logo ? (
            <img
              src={investor.logo}
              alt={investor.name}
              className="w-14 h-14 object-contain border rounded-md p-2"
            />
          ) : (
            <div className="w-14 h-14 bg-slate-200 rounded-md flex items-center justify-center text-xs">
              N/A
            </div>
          )}

          {/* Name + Type */}
          <div>
            <h1 className="text-3xl font-semibold">{investor.name}</h1>
            {investor.type && (
              <p className="text-emerald-600 capitalize">
                {investor.type.replace("-", " ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-5xl mx-auto px-6 py-16">

        {/* Description */}
        {investor.description && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-slate-600 leading-relaxed">
              {investor.description}
            </p>
          </motion.div>
        )}

        {/* Focus Areas */}
        {investor.focus?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Focus Areas</h2>

            <div className="flex flex-wrap gap-3">
              {investor.focus.map((f, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Check Size */}
        {investor.checkSize && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-2">Check Size</h2>
            <p className="text-slate-600">{investor.checkSize}</p>
          </div>
        )}

        {/* Geography */}
        {investor.geography?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Geography</h2>

            <div className="flex flex-wrap gap-3">
              {investor.geography.map((g, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Website */}
        {investor.website && (
          <div>
            <a
              href={investor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
            >
              Visit Website
              <ExternalLink size={16} />
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
