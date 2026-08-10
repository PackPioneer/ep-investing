"use client";

import { useEffect, useState } from "react";

const CAT_LABEL = { partnership: "Partnership", raise_open: "Raise — open", raise_close: "Raise — closed", product: "New product", award: "Award / grant", hire: "Key hire", milestone: "Milestone", expansion: "Expansion", other: "Other" };
const usd = (n) => (n == null || n === "" ? null : "$" + Number(n).toLocaleString());

function meta(a) {
  const m = a.meta || {};
  const bits = [];
  if (m.partner_name) bits.push(`Partner: ${m.partner_name}`);
  if (m.round_type) bits.push(m.round_type);
  if (m.amount_usd) bits.push(usd(m.amount_usd));
  if (m.amount_target_usd) bits.push(`target ${usd(m.amount_target_usd)}`);
  if (m.lead_investor) bits.push(`lead: ${m.lead_investor}`);
  if (m.close_date) bits.push(m.close_date);
  if (m.product_name) bits.push(m.product_name);
  if (m.award_name) bits.push(m.award_name);
  if (m.grantor) bits.push(`by ${m.grantor}`);
  return bits.join(" · ");
}

export default function AdminAnnouncements() {
  const [tab, setTab] = useState("published");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  // Post-an-update form (press releases / scraped company updates).
  const [showNew, setShowNew] = useState(false);
  const [cQuery, setCQuery] = useState("");
  const [cResults, setCResults] = useState([]);
  const [selectedCo, setSelectedCo] = useState(null);
  const [nCat, setNCat] = useState("product");
  const [nTitle, setNTitle] = useState("");
  const [nBody, setNBody] = useState("");
  const [nLink, setNLink] = useState("");
  const [nDate, setNDate] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [invAll, setInvAll] = useState([]);
  const [invQuery, setInvQuery] = useState("");
  const [selectedInv, setSelectedInv] = useState(null);

  const load = (status) => { setLoading(true); fetch(`/api/admin/announcements?status=${status}`).then((r) => r.json()).then((d) => { setRows(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(tab); }, [tab]);
  useEffect(() => { fetch("/api/investors").then((r) => r.json()).then((d) => setInvAll(Array.isArray(d) ? d : [])).catch(() => {}); }, []);

  const invResults = (invQuery.trim() && !(selectedInv && selectedInv.name === invQuery))
    ? invAll.filter((i) => (i.name || "").toLowerCase().includes(invQuery.toLowerCase())).slice(0, 8) : [];
  const isRaise = nCat === "raise_close" || nCat === "raise_open";

  useEffect(() => {
    if (!cQuery.trim() || (selectedCo && selectedCo.name === cQuery)) { setCResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/companies?q=${encodeURIComponent(cQuery)}&limit=8`).then((r) => r.json()).then((d) => setCResults(Array.isArray(d) ? d : [])).catch(() => setCResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [cQuery, selectedCo]);

  const postUpdate = async () => {
    if (!selectedCo || !nTitle.trim()) return;
    setPosting(true); setPostError("");
    try {
      const meta = selectedInv ? { investor_id: selectedInv.id, investor_name: selectedInv.name } : {};
      const res = await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: selectedCo.id, category: nCat, title: nTitle, body: nBody, link_url: nLink, meta, published_at: nDate || undefined }) });
      const data = await res.json().catch(() => ({}));
      setPosting(false);
      if (!res.ok) { setPostError(data.error || `Failed (${res.status})`); return; }
      setSelectedCo(null); setCQuery(""); setNTitle(""); setNBody(""); setNLink(""); setNDate(""); setNCat("product"); setSelectedInv(null); setInvQuery(""); setShowNew(false);
      setTab("published"); load("published");
    } catch (e) { setPosting(false); setPostError(e.message || "Network error"); }
  };

  const act = async (id, action, review_note) => {
    setBusy(id);
    await fetch("/api/admin/announcements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, review_note }) });
    setBusy(null);
    load(tab);
  };
  const takedown = (id) => { const note = prompt("Reason (shown to the company):"); if (note !== null) act(id, "takedown", note); };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Announcements — moderation</h1>
      <p className="text-sm text-slate-500 mb-4">Announcements from vetted companies publish instantly. Post updates yourself (press releases, company blog posts) below, or moderate what's live.</p>

      {!showNew ? (
        <button onClick={() => setShowNew(true)} className="mb-5 text-sm font-semibold bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700">Post an update</button>
      ) : (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Post a company update</span>
            <button onClick={() => setShowNew(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
          </div>
          <div className="relative">
            <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Company</label>
            {selectedCo ? (
              <div className="flex items-center gap-2 text-sm"><span className="font-medium text-slate-800">{selectedCo.name}</span><button onClick={() => { setSelectedCo(null); setCQuery(""); }} className="text-xs text-slate-400 hover:text-red-500">change</button></div>
            ) : (
              <>
                <input value={cQuery} onChange={(e) => setCQuery(e.target.value)} placeholder="Search company…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
                {cResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {cResults.map((c) => (
                      <button key={c.id} onClick={() => { setSelectedCo({ id: c.id, name: c.name }); setCResults([]); setCQuery(c.name); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{c.name}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Type</label>
              <select value={nCat} onChange={(e) => setNCat(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:border-emerald-400">
                {Object.entries(CAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Date</label>
              <input type="date" value={nDate} onChange={(e) => setNDate(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:border-emerald-400" />
            </div>
          </div>
          {isRaise && (
            <div className="relative">
              <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Investor (optional — tags their profile too)</label>
              {selectedInv ? (
                <div className="flex items-center gap-2 text-sm"><span className="font-medium text-slate-800">{selectedInv.name}</span><button onClick={() => { setSelectedInv(null); setInvQuery(""); }} className="text-xs text-slate-400 hover:text-red-500">change</button></div>
              ) : (
                <>
                  <input value={invQuery} onChange={(e) => setInvQuery(e.target.value)} placeholder="Search investors…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
                  {invResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {invResults.map((iv) => (
                        <button key={iv.id} onClick={() => { setSelectedInv({ id: iv.id, name: iv.name }); setInvQuery(iv.name); }} className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50">{iv.name}</button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Headline</label>
            <input value={nTitle} onChange={(e) => setNTitle(e.target.value)} placeholder="e.g. Acme partners with BigCo to deploy 50 MW" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Details (optional)</label>
            <textarea value={nBody} onChange={(e) => setNBody(e.target.value)} rows={2} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wide text-slate-400 block mb-1">Source link (press release / blog)</label>
            <input value={nLink} onChange={(e) => setNLink(e.target.value)} placeholder="https://…" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
          </div>
          {postError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{postError}</div>}
          <button onClick={postUpdate} disabled={posting || !selectedCo || !nTitle.trim()} className="text-sm font-semibold bg-emerald-600 text-white rounded-lg px-5 py-2 hover:bg-emerald-700 disabled:opacity-40">{posting ? "Posting…" : "Publish to newsroom"}</button>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {["published", "rejected", "all"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-xs px-3 py-1.5 rounded-full border ${tab === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}>{t}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
        : rows.length === 0 ? <p className="text-sm text-slate-400 py-8">Nothing here.</p>
        : (
          <div className="flex flex-col gap-3">
            {rows.map((a) => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">{CAT_LABEL[a.category] || a.category}</span>
                      <span className="text-sm font-semibold text-slate-900">{a.company?.name || "—"}</span>
                      {a.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Boosted</span>}
                    </div>
                    <div className="text-sm text-slate-800">{a.title}</div>
                    {meta(a) && <div className="text-xs text-slate-500 mt-0.5">{meta(a)}</div>}
                    {a.body && <div className="text-xs text-slate-500 mt-1">{a.body}</div>}
                    {a.link_url && <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-700 hover:underline mt-1 inline-block">{a.link_url}</a>}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {a.status === "published" && (
                      <>
                        <button disabled={busy === a.id} onClick={() => act(a.id, a.is_featured ? "unfeature" : "feature")} className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 border border-violet-200 text-violet-700 hover:bg-violet-50">{a.is_featured ? "Un-boost" : "Boost"}</button>
                        <button disabled={busy === a.id} onClick={() => takedown(a.id)} className="text-xs text-red-500 hover:text-red-600 px-3 py-1">Take down</button>
                      </>
                    )}
                    {a.status === "rejected" && (
                      <button disabled={busy === a.id} onClick={() => act(a.id, "restore")} className="text-xs text-emerald-600 hover:text-emerald-700 px-3 py-1">Restore</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
