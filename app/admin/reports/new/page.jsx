"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function NewReportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    slug: "",
    sector: "",
    geography: "",
    summary: "",
    pdf_url: "",
    market_value: "",
    expected_growth: "",
    linked_company_tags: "",
    published: false,
  });
  const [findings, setFindings] = useState([{ heading: "", body: "" }]);
  const [chartData, setChartData] = useState([{ label: "", value: "" }]);

  const handleChange = e => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    // Auto-generate slug from title
    if (e.target.name === "title") {
      setForm(prev => ({
        ...prev,
        title: e.target.value,
        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      }));
    }
  };

  const handleFinding = (i, field, val) => {
    const updated = [...findings];
    updated[i][field] = val;
    setFindings(updated);
  };

  const handleChart = (i, field, val) => {
    const updated = [...chartData];
    updated[i][field] = val;
    setChartData(updated);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        linked_company_tags: form.linked_company_tags ? form.linked_company_tags.split(",").map(t => t.trim()) : [],
        key_findings: findings.filter(f => f.heading && f.body),
        chart_data: chartData.filter(d => d.label && d.value).map(d => ({ ...d, value: parseFloat(d.value) })),
      };
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) setDone(true);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <CheckCircle size={40} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-slate-900 mb-3">Report published!</h2>
        <div className="flex gap-3 justify-center mt-6">
          <Link href={`/insights/${form.slug}`} className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-all">
            View report
          </Link>
          <button onClick={() => { setDone(false); setForm({ title:"",subtitle:"",slug:"",sector:"",geography:"",summary:"",pdf_url:"",market_value:"",expected_growth:"",linked_company_tags:"",published:false }); setFindings([{heading:"",body:""}]); setChartData([{label:"",value:""}]); }}
            className="border border-slate-200 text-slate-600 text-sm px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-all">
            Add another
          </button>
        </div>
      </div>
    </div>
  );

  const inputClass = "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors placeholder-slate-400";
  const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft size={14} /> Admin
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-700 font-medium">New Report</span>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 mb-8">Publish new report</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* Basic info */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider pb-3 border-b border-slate-100">Basic Info</h2>

            <div>
              <label className={labelClass}>Report Title *</label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Green Hydrogen in the USA" required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Subtitle</label>
              <input name="subtitle" value={form.subtitle} onChange={handleChange} placeholder="Capital flows, key players, and the road to cost parity" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Slug (auto-generated) *</label>
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="green-hydrogen-usa-2025" required className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Sector *</label>
                <select name="sector" value={form.sector} onChange={handleChange} required className={inputClass}>
                  <option value="">Select sector…</option>
                  {["green_hydrogen","nuclear_technologies","battery_storage","electric_aviation","solar","carbon_credits","industrial_decarb","ev_charging","geothermal","wind_energy","direct_air_capture","saf_efuels"].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Geography *</label>
                <select name="geography" value={form.geography} onChange={handleChange} required className={inputClass}>
                  <option value="">Select geography…</option>
                  {["United States","Europe","Global","Asia Pacific","Middle East","Africa","Latin America"].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Executive Summary *</label>
              <textarea name="summary" value={form.summary} onChange={handleChange} rows={5} required
                placeholder="2–3 paragraph overview of the sector, key dynamics, and what investors need to know…"
                className={`${inputClass} resize-none`} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Market Value</label>
                <input name="market_value" value={form.market_value} onChange={handleChange} placeholder="e.g. $8.2B" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Expected Growth</label>
                <input name="expected_growth" value={form.expected_growth} onChange={handleChange} placeholder="e.g. 34% CAGR through 2030" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>PDF URL</label>
              <input name="pdf_url" value={form.pdf_url} onChange={handleChange} placeholder="https://… (S3, Google Drive, etc.)" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Linked Company Tags (comma-separated)</label>
              <input name="linked_company_tags" value={form.linked_company_tags} onChange={handleChange}
                placeholder="e.g. green_hydrogen, electrolyzer" className={inputClass} />
              <p className="text-xs text-slate-400 mt-1">Companies with these industry_tags will appear in the report.</p>
            </div>
          </div>

          {/* Key findings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Key Findings</h2>
              <button type="button" onClick={() => setFindings([...findings, { heading: "", body: "" }])}
                className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium">
                <Plus size={12} /> Add finding
              </button>
            </div>
            {findings.map((f, i) => (
              <div key={i} className="flex flex-col gap-3 pb-4 border-b border-slate-100 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">Finding {i + 1}</span>
                  {findings.length > 1 && (
                    <button type="button" onClick={() => setFindings(findings.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <input value={f.heading} onChange={e => handleFinding(i, "heading", e.target.value)}
                  placeholder="Finding headline" className={inputClass} />
                <textarea value={f.body} onChange={e => handleFinding(i, "body", e.target.value)}
                  placeholder="2–3 sentences explaining this finding…" rows={3}
                  className={`${inputClass} resize-none`} />
              </div>
            ))}
          </div>

          {/* Chart data */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Funding Chart Data</h2>
              <button type="button" onClick={() => setChartData([...chartData, { label: "", value: "" }])}
                className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium">
                <Plus size={12} /> Add data point
              </button>
            </div>
            <p className="text-xs text-slate-400">Enter annual investment totals in $B (e.g. 8.2 for $8.2B)</p>
            <div className="flex flex-col gap-3">
              {chartData.map((d, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input value={d.label} onChange={e => handleChart(i, "label", e.target.value)}
                    placeholder="Year (e.g. 2024)" className={`${inputClass} flex-1`} />
                  <input value={d.value} onChange={e => handleChart(i, "value", e.target.value)}
                    placeholder="$B value (e.g. 8.2)" type="number" step="0.1" className={`${inputClass} flex-1`} />
                  {chartData.length > 1 && (
                    <button type="button" onClick={() => setChartData(chartData.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Publish */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" name="published" id="published" checked={form.published} onChange={handleChange}
                className="w-4 h-4 accent-emerald-600" />
              <label htmlFor="published" className="text-sm font-medium text-slate-700">
                Publish immediately
              </label>
              <span className="text-xs text-slate-400">(unchecked = save as draft)</span>
            </div>
            <button type="submit" disabled={loading}
              className="bg-emerald-600 text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-60">
              {loading ? "Saving…" : form.published ? "Publish report" : "Save draft"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
