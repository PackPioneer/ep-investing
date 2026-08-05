"use client";

import { useEffect, useState } from "react";

const CATEGORIES = [
  { id: "partnership", label: "Partnership", hint: "Announce a partnership, JV, offtake, or commercial deal.",
    fields: [{ k: "partner_name", label: "Partner name" }] },
  { id: "raise_open", label: "Raise — now open", hint: "Tell investors you're actively raising. Flips you into the tracker's \"Currently raising.\"",
    fields: [{ k: "round_type", label: "Round (e.g. Series A)" }, { k: "amount_target_usd", label: "Target amount (USD)", type: "number" }, { k: "lead_investor", label: "Lead investor (optional)" }] },
  { id: "raise_close", label: "Raise — closed", hint: "Announce a closed round. Becomes a verified deal in the market tracker.",
    fields: [{ k: "round_type", label: "Round" }, { k: "amount_usd", label: "Amount raised (USD)", type: "number" }, { k: "lead_investor", label: "Lead investor" }, { k: "close_date", label: "Close date", type: "date" }] },
  { id: "product", label: "New product", hint: "Launch or major product milestone.",
    fields: [{ k: "product_name", label: "Product name" }] },
  { id: "award", label: "Award / grant", hint: "A prize, grant, or recognition.",
    fields: [{ k: "award_name", label: "Award name" }, { k: "grantor", label: "Awarded by" }, { k: "amount_usd", label: "Amount (USD, optional)", type: "number" }] },
  { id: "hire", label: "Key hire", hint: "A new executive, senior leader, or board appointment.",
    fields: [{ k: "person_name", label: "Name" }, { k: "role", label: "Role" }] },
  { id: "milestone", label: "Milestone", hint: "A commercial or technical proof point — deployment, first revenue, a major contract.",
    fields: [] },
  { id: "expansion", label: "Expansion", hint: "A new market, geography, facility, or plant.",
    fields: [{ k: "location", label: "Market / location" }] },
  { id: "other", label: "Other", hint: "Anything else worth announcing.",
    fields: [] },
];

const STATUS = {
  pending: { label: "In review", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  published: { label: "Published", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Needs changes", cls: "bg-red-50 text-red-600 border-red-200" },
};
const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;
const inputClass = "w-full text-sm px-3 py-2 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]";
const labelClass = "text-xs font-mono text-[#718096] uppercase tracking-wide mb-1 block";

export default function CompanyAnnouncements() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("partnership");
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [link, setLink] = useState("");
  const [meta, setMeta] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = () => fetch("/api/dashboard/company/announcements")
    .then((r) => r.json()).then((d) => { setList(d.announcements || []); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const reset = () => { setTitle(""); setBodyText(""); setLink(""); setMeta({}); setCat("partnership"); setOpen(false); };
  const activeFields = CATEGORIES.find((c) => c.id === cat)?.fields || [];

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await fetch("/api/dashboard/company/announcements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat, title, body: bodyText, link_url: link, meta }),
    });
    setSubmitting(false);
    reset();
    load();
  };

  const remove = async (id) => {
    await fetch(`/api/dashboard/company/announcements?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[#0f1a14] mb-1">Announcements</div>
            <p className="text-xs text-[#718096] max-w-lg">Post partnerships, raises, hires, milestones, and more. Each goes live on your profile and in the EP newsroom right away. Raise announcements feed the investor market tracker.</p>
          </div>
          {!open && (
            <button onClick={() => setOpen(true)} className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] flex-shrink-0">
              New announcement
            </button>
          )}
        </div>

        {open && (
          <div className="mt-5 pt-5 border-t border-[#e2e6ed] flex flex-col gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => { setCat(c.id); setMeta({}); }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${cat === c.id ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#a0aec0] mt-1.5">{CATEGORIES.find((c) => c.id === cat)?.hint}</p>
            </div>

            <div>
              <label className={labelClass}>Headline</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Acme partners with BigCo to deploy 50 MW" className={inputClass} />
            </div>

            {activeFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeFields.map((f) => (
                  <div key={f.k}>
                    <label className={labelClass}>{f.label}</label>
                    <input type={f.type || "text"} value={meta[f.k] || ""} onChange={(e) => setMeta((m) => ({ ...m, [f.k]: e.target.value }))} className={inputClass} />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className={labelClass}>Details (optional)</label>
              <textarea rows={3} value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="A sentence or two of context." className={inputClass + " resize-none"} />
            </div>
            <div>
              <label className={labelClass}>Link (optional)</label>
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…  (press release, product page)" className={inputClass} />
            </div>

            <div className="flex items-center gap-3">
              <button onClick={submit} disabled={submitting || !title.trim()} className="bg-[#2d6a4f] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#235a40] disabled:opacity-50">
                {submitting ? "Publishing…" : "Publish"}
              </button>
              <button onClick={reset} className="text-sm text-[#718096] hover:text-[#0f1a14]">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
        <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-4">Your announcements</div>
        {loading ? (
          <p className="text-sm text-[#718096]">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-[#718096]">No announcements yet. Post your first one above.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[#f2f4f8]">
            {list.map((a) => {
              const st = STATUS[a.status] || STATUS.pending;
              return (
                <div key={a.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#eef1f6] text-[#4a5568] border border-[#d0d6e0]">{catLabel(a.category)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      {a.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Boosted</span>}
                    </div>
                    <div className="text-sm text-[#0f1a14] font-medium truncate">{a.title}</div>
                    {a.status === "rejected" && a.review_note && <div className="text-xs text-red-500 mt-0.5">Reviewer: {a.review_note}</div>}
                  </div>
                  <button onClick={() => remove(a.id)} className="text-xs text-[#a0aec0] hover:text-red-500 flex-shrink-0">Remove</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
