"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatSector } from "@/lib/sectors";
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
const CAT_LABEL = { partnership: "Partnership", raise_open: "Raises", raise_close: "Raises", product: "Product", award: "Award", hire: "Key hire", milestone: "Milestone", expansion: "Expansion", other: "News" };
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
  const [sec, setSec] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/announcements?limit=250${cat ? `&category=${cat}` : ""}`)
      .then((r) => r.json()).then((d) => { setRows(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cat]);

  const sectorOpts = useMemo(() => [...new Set(rows.flatMap((r) => r.company?.industry_tags || []))].filter(Boolean).sort(), [rows]);
  const shown = sec ? rows.filter((r) => (r.company?.industry_tags || []).includes(sec)) : rows;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-3xl font-bold text-slate-900 mb-1">Newsroom</h1>
      <p className="text-sm text-slate-500 mb-6">Raises, partnerships, launches, and hires from climate &amp; energy companies across the EP Network.</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATS.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${cat === c.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-6">
        <select value={sec} onChange={(e) => setSec(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:border-emerald-400">
          <option value="">All sectors</option>
          {sectorOpts.map((s) => <option key={s} value={s}>{formatSector(s)}</option>)}
        </select>
        <span className="text-xs text-slate-400">{shown.length} update{shown.length === 1 ? "" : "s"}</span>
      </div>

      {loading ? <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
        : shown.length === 0 ? <p className="text-sm text-slate-400 py-10">No updates here yet.</p>
        : (
          <div className="flex flex-col gap-3">
            {shown.map((a) => {
              const co = a.company;
              return (
                <div key={a.id} className={`bg-white border rounded-xl p-4 ${a.is_featured ? "border-violet-200 ring-1 ring-violet-100" : "border-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: (CAT_COLOR[a.category] || "#64748b") + "1a", color: CAT_COLOR[a.category] || "#64748b" }}>{CAT_LABEL[a.category] || a.category}</span>
                    {a.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">Featured</span>}
                    <Link href={`/announcements/${a.id}`} className="text-[11px] text-slate-400 hover:text-slate-600 ml-auto">{when(a.published_at)}</Link>
                  </div>
                  <div className="flex items-start gap-3">
                    {co && (
                      <Link href={`/companies/${co.id}`} className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-emerald-700 flex-shrink-0 overflow-hidden">
                        {co.logo_url ? <img src={co.logo_url} alt="" className="w-full h-full object-contain p-0.5" /> : (co.name?.[0] || "?")}
                      </Link>
                    )}
                    <div className="min-w-0 flex-1">
                      {co && <Link href={`/companies/${co.id}`} className="text-xs font-semibold text-slate-500 hover:text-emerald-700">{co.name}</Link>}
                      <Link href={`/announcements/${a.id}`} className="block text-sm font-semibold text-slate-900 leading-snug hover:text-emerald-700">{a.title}</Link>
                      {metaLine(a) && <div className="text-xs text-slate-500 mt-0.5">{metaLine(a)}</div>}
                      {a.meta?.investor_id && (
                        <div className="text-xs text-slate-500 mt-0.5">Backed by <Link href={`/investors/${a.meta.investor_id}`} className="text-emerald-700 hover:underline font-medium">{a.meta.investor_name}</Link></div>
                      )}
                      {a.body && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{a.body}</p>}
                      <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                        {a.is_curated ? (
                          <>
                            {a.link_url && <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-emerald-700">Read release →</a>}
                            {co && <Link href={`/companies/${co.id}`} className="text-xs font-semibold text-emerald-700 hover:underline">View on EP →</Link>}
                          </>
                        ) : (
                          <>
                            {a.link_url && <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-semibold bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-emerald-700">{ctaLabelFor(a.category, a.meta)} →</a>}
                            {co && <Link href={`/companies/${co.id}`} className="text-xs font-semibold text-emerald-700 hover:underline">View on EP →</Link>}
                          </>
                        )}
                      </div>
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
