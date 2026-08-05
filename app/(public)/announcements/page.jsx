"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { ctaLabelFor } from "@/lib/announcements/categories";

const CATS = [
  { id: "", label: "All" },
  { id: "raise_close", label: "Raises" },
  { id: "raise_open", label: "Now raising" },
  { id: "partnership", label: "Partnerships" },
  { id: "product", label: "Products" },
  { id: "milestone", label: "Milestones" },
  { id: "hire", label: "Hires" },
  { id: "award", label: "Awards" },
  { id: "expansion", label: "Expansion" },
  { id: "other", label: "Other" },
];
const CAT_LABEL = { partnership: "Partnership", raise_open: "Now raising", raise_close: "Raise", product: "Product", award: "Award", hire: "Key hire", milestone: "Milestone", expansion: "Expansion", other: "News" };
const CAT_COLOR = { raise_close: "#7c3aed", raise_open: "#2d6a4f", partnership: "#0ea5e9", product: "#d97706", award: "#059669", hire: "#4f46e5", milestone: "#0d9488", expansion: "#db2777", other: "#64748b" };
const usd = (n) => (n == null || n === "" ? null : "$" + Number(n).toLocaleString());

function metaLine(a) {
  const m = a.meta || {};
  const bits = [];
  if (m.partner_name) bits.push(m.partner_name);
  if (m.round_type) bits.push(m.round_type);
  if (m.amount_usd) bits.push(usd(m.amount_usd));
  if (m.amount_target_usd) bits.push(`target ${usd(m.amount_target_usd)}`);
  if (m.lead_investor) bits.push(`led by ${m.lead_investor}`);
  if (m.product_name) bits.push(m.product_name);
  if (m.person_name) bits.push(`${m.person_name}${m.role ? `, ${m.role}` : ""}`);
  if (m.award_name) bits.push(m.award_name);
  if (m.grantor) bits.push(`from ${m.grantor}`);
  if (m.location) bits.push(m.location);
  return bits.join(" · ");
}
const when = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

export default function NewsroomPage() {
  const [cat, setCat] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/announcements?limit=200${cat ? `&category=${cat}` : ""}`)
      .then((r) => r.json()).then((d) => { setRows(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cat]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-1">Newsroom</h1>
      <p className="text-sm text-slate-500 mb-6">Announcements from climate & energy companies on EP Network — raises, partnerships, launches, and more, firsthand.</p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${cat === c.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" /></div>
        : rows.length === 0 ? <p className="text-sm text-slate-400 py-10">No announcements yet.</p>
        : (
          <div className="flex flex-col gap-3">
            {rows.map((a) => {
              const co = a.company;
              return (
                <div key={a.id} className={`bg-white border rounded-xl p-4 ${a.is_featured ? "border-violet-200 ring-1 ring-violet-100" : "border-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: (CAT_COLOR[a.category] || "#64748b") + "1a", color: CAT_COLOR[a.category] || "#64748b" }}>{CAT_LABEL[a.category] || a.category}</span>
                    {a.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">Featured</span>}
                    <span className="text-[11px] text-slate-400 ml-auto">{when(a.published_at)}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    {co && (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-emerald-700 flex-shrink-0 overflow-hidden">
                        {co.logo_url ? <img src={co.logo_url} alt="" className="w-full h-full object-contain p-0.5" /> : (co.name?.[0] || "?")}
                      </div>
                    )}
                    <div className="min-w-0">
                      {co && <Link href={`/companies/${co.id}`} className="text-xs font-semibold text-slate-500 hover:text-emerald-700">{co.name}</Link>}
                      <div className="text-sm font-semibold text-slate-900 leading-snug">{a.title}</div>
                      {metaLine(a) && <div className="text-xs text-slate-500 mt-0.5">{metaLine(a)}</div>}
                      {a.body && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{a.body}</p>}
                      {a.link_url && (
                        <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2.5 text-xs font-semibold bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-emerald-700">
                          {ctaLabelFor(a.category, a.meta)} →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
