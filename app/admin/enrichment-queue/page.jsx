"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2, ExternalLink, AlertTriangle, EyeOff } from "lucide-react";

const CONF_COLORS = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-700 border-red-200",
};

const FIELD_LABELS = {
  description: "Description",
  core_technology: "Core Technology",
  target_market: "Target Market",
  key_customers: "Key Customers",
  business_model: "Business Model",
};

function DraftRow({ draft, onDone }) {
  const [value, setValue] = useState(draft.drafted_value || "");
  const [busy, setBusy] = useState(false);

  const act = async (action) => {
    setBusy(true);
    const res = await fetch("/api/admin/enrichment-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "approve" ? { action, id: draft.id, value } : { action, id: draft.id }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) { alert(data.error); return; }
    onDone(draft.id);
  };

  return (
    <div className="border-t border-gray-100 pt-3 mt-3 first:border-0 first:pt-0 first:mt-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-800">{FIELD_LABELS[draft.field_name] || draft.field_name}</span>
        <span className={"text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border " + (CONF_COLORS[draft.confidence] || "bg-gray-50 text-gray-600 border-gray-200")}>
          {draft.confidence || "—"}
        </span>
      </div>
      {draft.current_value && (
        <div className="text-xs text-gray-400 mb-1">
          Current: <span className="line-through">{draft.current_value}</span>
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={Math.min(6, Math.max(2, Math.ceil(value.length / 90)))}
        className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-emerald-400"
      />
      <div className="flex gap-2 mt-2">
        <button onClick={() => act("approve")} disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />} Approve
        </button>
        <button onClick={() => act("reject")} disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-semibold bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 disabled:opacity-50">
          <XCircle size={13} /> Reject
        </button>
      </div>
    </div>
  );
}

function DuplicateCard({ flag, onDone }) {
  const [busy, setBusy] = useState(false);
  const sparserId = flag.sparser_id;

  const hide = async (hideId) => {
    if (!confirm(`Hide this company from the site (soft delete)? It stays in the database but won't show publicly.`)) return;
    setBusy(true);
    const res = await fetch("/api/admin/enrichment-queue", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hide_dup", flag_id: flag.id, hide_company_id: hideId }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) { alert(data.error); return; }
    onDone(flag.id);
  };
  const dismiss = async () => {
    setBusy(true);
    await fetch("/api/admin/enrichment-queue", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "dismiss_dup", flag_id: flag.id }),
    });
    setBusy(false);
    onDone(flag.id);
  };

  const Side = ({ c, id, claimed }) => (
    <div className={"flex-1 border rounded-lg p-3 " + (id === sparserId ? "border-amber-300 bg-amber-50" : "border-gray-200")}>
      <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
        {c?.name || `#${id}`} {claimed && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1 rounded">claimed</span>}
      </div>
      <div className="text-xs text-gray-400 truncate">{c?.url}</div>
      <div className="text-xs text-gray-500 mt-1">{c?.fullness ?? "?"} / 5 fields filled{id === sparserId ? " · sparser" : ""}</div>
      <button onClick={() => hide(id)} disabled={busy || claimed}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 border border-red-200 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-40">
        <EyeOff size={11} /> Hide this one
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
      <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 mb-2">
        <AlertTriangle size={13} /> Possible duplicate · {flag.reason}
      </div>
      <div className="flex gap-3">
        <Side c={flag.a} id={flag.company_id_a} claimed={flag.a_is_claimed} />
        <Side c={flag.b} id={flag.company_id_b} claimed={flag.b_is_claimed} />
      </div>
      <button onClick={dismiss} disabled={busy} className="mt-2 text-[11px] text-gray-400 hover:text-gray-600">
        Not a duplicate — dismiss
      </button>
    </div>
  );
}

export default function EnrichmentQueuePage() {
  const [drafts, setDrafts] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highOnly, setHighOnly] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/enrichment-queue")
      .then((r) => r.json())
      .then((d) => {
        setDrafts(Array.isArray(d.drafts) ? d.drafts : []);
        setDuplicates(Array.isArray(d.duplicates) ? d.duplicates : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  useEffect(load, []);

  const removeDraft = (id) => setDrafts((p) => p.filter((d) => d.id !== id));
  const removeDup = (id) => setDuplicates((p) => p.filter((d) => d.id !== id));

  // Group drafts by company.
  const visible = highOnly ? drafts.filter((d) => d.confidence === "high") : drafts;
  const byCompany = {};
  for (const d of visible) (byCompany[d.company_id] ??= { name: d.company_name, url: d.company_url, rows: [] }).rows.push(d);

  if (loading) return <div className="p-8 text-gray-400"><Loader2 className="animate-spin" /> Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Profile Enrichment Queue</h1>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={highOnly} onChange={(e) => setHighOnly(e.target.checked)} />
          High-confidence only
        </label>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {drafts.length} pending field drafts · {duplicates.length} duplicate flags. Approve writes to the live profile.
      </p>

      {duplicates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Duplicates</h2>
          <div className="flex flex-col gap-3">
            {duplicates.map((f) => <DuplicateCard key={f.id} flag={f} onDone={removeDup} />)}
          </div>
        </div>
      )}

      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Field Drafts</h2>
      <div className="flex flex-col gap-4">
        {Object.entries(byCompany).map(([cid, grp]) => (
          <div key={cid} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <a href={`/companies/${cid}`} target="_blank" rel="noopener noreferrer"
                className="text-base font-bold text-gray-900 hover:text-emerald-600 inline-flex items-center gap-1">
                {grp.name} <ExternalLink size={13} />
              </a>
            </div>
            {grp.rows.map((d) => <DraftRow key={d.id} draft={d} onDone={removeDraft} />)}
          </div>
        ))}
        {visible.length === 0 && <div className="text-sm text-gray-400">Nothing to review.</div>}
      </div>
    </div>
  );
}
