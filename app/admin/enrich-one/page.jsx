"use client";

import { useState } from "react";
import { Loader2, Search, Sparkles, Save } from "lucide-react";

const FIELD_LABELS = {
  description: "Description", core_technology: "Core Technology", target_market: "Target Market",
  key_customers: "Key Customers", business_model: "Business Model", tagline: "Tagline",
  short_description: "Short Description", bio: "Bio", partnership_description: "Partnership Description", staff_size: "Staff Size",
  investment_thesis: "Investment Thesis", climate_sectors: "Climate Sectors",
  geographies_focus: "Geographies Focus", investment_stages_text: "Investment Stages",
};
const CONF = { high: "bg-emerald-50 text-emerald-700 border-emerald-200", medium: "bg-amber-50 text-amber-700 border-amber-200", low: "bg-red-50 text-red-700 border-red-200" };
const TYPES = [
  { key: "company", label: "Company", hint: "id or slug (e.g. 1552 or natron-energy-1552)" },
  { key: "ngo", label: "NGO", hint: "slug (e.g. green-climate-fund)" },
  { key: "investor", label: "Investor", hint: "id (e.g. 312)" },
];

export default function EnrichOnePage() {
  const [entityType, setEntityType] = useState("company");
  const [idOrSlug, setIdOrSlug] = useState("");
  const [entity, setEntity] = useState(null);
  const [urlOverride, setUrlOverride] = useState("");
  const [drafts, setDrafts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [logo, setLogo] = useState(null); // { found, current, needsUpdate, keep }
  const [msg, setMsg] = useState("");
const [pastedText, setPastedText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const typeCfg = TYPES.find((t) => t.key === entityType);

  const post = async (payload) => {
    const res = await fetch("/api/admin/enrich-one", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType, ...payload }) });
    return res.json();
  };
  const load = async () => {
    if (!idOrSlug.trim()) return;
    setBusy(true); setMsg(""); setDrafts(null);
    const d = await post({ action: "load", idOrSlug: idOrSlug.trim() });
    setBusy(false);
    if (d.error) { setMsg(d.error); setEntity(null); return; }
    setEntity(d.entity);
    setUrlOverride(d.entity[d.urlCol] || "");
  };

  const scrape = async () => {
    setBusy(true); setMsg("");
    const key = entity.slug || entity.id;
    const d = await post({ action: "scrape", idOrSlug: key, urlOverride });
    setBusy(false);
    if (d.error) { setMsg(d.error); return; }
    if (d.warning) setMsg(d.warning);
    const prepared = {};
    for (const [f, info] of Object.entries(d.drafts || {})) prepared[f] = { ...info, value: info.drafted, keep: true };
    if (Object.keys(prepared).length === 0 && !d.warning) setMsg("No new fields could be extracted from the site.");
    setDrafts(prepared);
    if (d.logo && d.logo.found) setLogo({ ...d.logo, keep: d.logo.needsUpdate });
    else setLogo(null);
  };

  const extract = async () => {
    if (!entity) return;
    if (pastedText.trim().length < 100) { setMsg("Paste more text first (at least a paragraph)."); return; }
    setBusy(true); setMsg("");
    const key = entity.slug || entity.id;
    const d = await post({ action: "extract", idOrSlug: key, pastedText });
    setBusy(false);
    if (d.error) { setMsg(d.error); return; }
    const prepared = {};
    for (const [f, info] of Object.entries(d.drafts || {})) prepared[f] = { ...info, value: info.drafted, keep: true };
    if (Object.keys(prepared).length === 0) setMsg("No fields could be extracted from the pasted text.");
    setDrafts(prepared);
    setLogo(null);
  };

  const save = async () => {
    const fields = {};
    for (const [f, info] of Object.entries(drafts || {})) if (info.keep && info.value && info.value.trim()) fields[f] = info.value.trim();
    if (Object.keys(fields).length === 0 && !(logo && logo.keep && logo.found)) { setMsg("Nothing selected to save."); return; }
    setBusy(true); setMsg("");
    const payload = { action: "save", id: entity.id, fields };
    if (logo && logo.keep && logo.found) payload.logo_url = logo.found;
    const d = await post(payload);
    setBusy(false);
    if (d.error) { setMsg(d.error); return; }
    setMsg(`Saved ${d.saved.length} field(s) to ${entity.name}.`);
    setDrafts(null);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Enrich One</h1>
      <p className="text-sm text-gray-500 mb-5">Re-scrape a single profile's website, review, and save.</p>

      <div className="flex gap-1.5 mb-4">
        {TYPES.map((t) => (
          <button key={t.key} onClick={() => { setEntityType(t.key); reset(); setIdOrSlug(""); }}
            className={"text-sm font-semibold px-3 py-1.5 rounded-lg border " + (entityType === t.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input value={idOrSlug} onChange={(e) => setIdOrSlug(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder={typeCfg.hint}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
        <button onClick={load} disabled={busy}
          className="inline-flex items-center gap-1 bg-gray-900 text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Load
        </button>
      </div>

      {msg && <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-4">{msg}</div>}

      {entity && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base font-bold text-gray-900">{entity.name}</span>
            <span className="text-xs text-gray-400">#{entity.id}</span>
          </div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Website to scrape (editable)</label>
          <div className="flex gap-2">
            <input value={urlOverride} onChange={(e) => setUrlOverride(e.target.value)} placeholder="https://example.com"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-400" />
            <button onClick={scrape} disabled={busy || !urlOverride.trim()}
              className="inline-flex items-center gap-1 bg-emerald-600 text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Scrape & draft
            </button>
          </div>

          <div className="mt-3">
            <button onClick={() => setShowPaste(v => !v)}
              className="text-xs text-gray-500 hover:text-gray-800 underline">
              {showPaste ? "Hide paste option" : "Or paste text instead (for blocked / 403 sites) →"}
            </button>
            {showPaste && (
              <div className="mt-2">
                <p className="text-[11px] text-gray-400 mb-1">Open the site in your browser, copy the page text, and paste it here. The same AI extraction runs on your pasted text.</p>
                <textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)}
                  rows={6} placeholder="Paste the company's website text here..."
                  className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-emerald-400" />
                <button onClick={extract} disabled={busy}
                  className="mt-2 inline-flex items-center gap-1 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Extract from pasted text
                </button>
              </div>
            )}
          </div>
        </div>
      )}
{logo && logo.found && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" checked={logo.keep}
              onChange={(e) => setLogo((p) => ({ ...p, keep: e.target.checked }))} />
            <span className="text-sm font-semibold text-gray-800">Logo</span>
            {!logo.needsUpdate && <span className="text-[11px] text-gray-400">(current logo looks fine — off by default)</span>}
          </div>
          <div className="flex items-end gap-5">
            <div className="text-center">
              <div className="text-[10px] text-gray-400 mb-1">Found</div>
              <img src={logo.found} alt="found logo" className="h-12 w-12 object-contain border border-gray-100 rounded bg-white"
                onError={(e) => { e.target.style.opacity = 0.15; }} />
            </div>
            {logo.current && (
              <div className="text-center">
                <div className="text-[10px] text-gray-400 mb-1">Current</div>
                <img src={logo.current} alt="current logo" className="h-12 w-12 object-contain border border-gray-100 rounded bg-white" />
              </div>
            )}
          </div>
          {!(drafts && Object.keys(drafts).length > 0) && (
            <button onClick={save} disabled={busy}
              className="mt-4 inline-flex items-center gap-1 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save logo
            </button>
          )}
        </div>
      )}
      {drafts && Object.keys(drafts).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Drafts — review & edit</h2>
          {Object.entries(drafts).map(([f, info]) => (
            <div key={f} className="border-t border-gray-100 pt-3 mt-3 first:border-0 first:pt-0 first:mt-0">
              <div className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={info.keep}
                  onChange={(e) => setDrafts((p) => ({ ...p, [f]: { ...p[f], keep: e.target.checked } }))} />
                <span className="text-sm font-semibold text-gray-800">{FIELD_LABELS[f] || f}</span>
                {info.confidence && <span className={"text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border " + (CONF[info.confidence] || "")}>{info.confidence}</span>}
              </div>
              {info.current && <div className="text-xs text-gray-400 mb-1">Current: <span className="line-through">{info.current}</span></div>}
              <textarea value={info.value} disabled={!info.keep}
                onChange={(e) => setDrafts((p) => ({ ...p, [f]: { ...p[f], value: e.target.value } }))}
                rows={Math.min(5, Math.max(2, Math.ceil((info.value || "").length / 90)))}
                className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-emerald-400 disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
          ))}
          <button onClick={save} disabled={busy}
            className="mt-4 inline-flex items-center gap-1 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save selected to profile
          </button>
        </div>
      )}
    </div>
  );
}
