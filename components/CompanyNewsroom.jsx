"use client";

import { useEffect, useState } from "react";
import { ctaLabelFor } from "@/lib/announcements/categories";

const CAT_LABEL = { partnership: "Partnership", raise_open: "Raises", raise_close: "Raises", product: "Product", award: "Award", hire: "Key hire", milestone: "Milestone", expansion: "Expansion", other: "News" };
const CAT_COLOR = { raise_close: "#7c3aed", raise_open: "#2d6a4f", partnership: "#0ea5e9", product: "#d97706", award: "#059669", hire: "#4f46e5", milestone: "#0d9488", expansion: "#db2777", other: "#64748b" };
const when = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

// Published announcements for a company, shown on its public profile. Renders
// nothing if the company hasn't announced anything.
export default function CompanyNewsroom({ companyId }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/announcements?company_id=${companyId}&limit=8`)
      .then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {});
  }, [companyId]);

  if (!rows.length) return null;

  return (
    <div className="bg-white border border-[#e8eaee] rounded-2xl p-6">
      <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-4">Announcements</h3>
      <div className="flex flex-col">
        {rows.map((a) => (
          <div key={a.id} className="py-2.5 border-b border-[#e8eaee] last:border-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: (CAT_COLOR[a.category] || "#64748b") + "1a", color: CAT_COLOR[a.category] || "#64748b" }}>{CAT_LABEL[a.category] || a.category}</span>
              <span className="text-[10px] text-[#a0aec0] ml-auto">{when(a.published_at)}</span>
            </div>
            <div className="text-xs text-[#0f1a14] font-medium leading-snug">{a.title}</div>
            {a.body && <div className="text-[11px] text-[#718096] mt-0.5 leading-snug line-clamp-2">{a.body}</div>}
            {a.link_url && (
              <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-1.5 text-[11px] font-semibold bg-[#2d6a4f] text-white px-2.5 py-1 rounded-md hover:bg-[#235a40]">
                {ctaLabelFor(a.category, a.meta)} →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
