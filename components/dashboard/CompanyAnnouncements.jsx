"use client";

import { useEffect, useState } from "react";
import { CTA, CTA_OPTIONS } from "@/lib/announcements/categories";

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
const when = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
const usd = (n) => (n == null || n === "" ? null : "$" + Number(n).toLocaleString());
// One-line summary of an announcement's structured fields (amount, partner, etc.).
function metaLine(a) {
  const m = a.meta || {};
  const bits = [];
  if (m.partners?.length) bits.push("with " + m.partners.map((p) => p.name).join(", "));
  else if (m.partner_name) bits.push("with " + m.partner_name);
  if (m.round_type) bits.push(m.round_type);
  if (m.amount_usd) bits.push(usd(m.amount_usd));
  if (m.amount_target_usd) bits.push("target " + usd(m.amount_target_usd));
  if (m.lead_investor) bits.push("led by " + m.lead_investor);
  if (m.product_name) bits.push(m.product_name);
  if (m.person_name) bits.push(m.person_name + (m.role ? ", " + m.role : ""));
  if (m.award_name) bits.push(m.award_name);
  if (m.grantor) bits.push("from " + m.grantor);
  if (m.location) bits.push(m.location);
  return bits.join(" · ");
}
const inputClass = "w-full text-sm px-3 py-2 rounded-lg border border-[#dbdfe4] bg-white focus:outline-none focus:border-[#2d6a4f]";
const labelClass = "text-xs font-mono text-[#718096] uppercase tracking-wide mb-1 block";

export default function CompanyAnnouncements() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [boardAccess, setBoardAccess] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("partnership");
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [link, setLink] = useState("");
  const [ctaLabel, setCtaLabel] = useState(CTA.partnership.label);
  const [meta, setMeta] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = () => fetch("/api/dashboard/company/announcements")
    .then((r) => r.json()).then((d) => { setList(d.announcements || []); setBoardAccess(!!d.board_access); setLoading(false); }).catch(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const upgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/subscribe-company", { method: "POST" });
      const d = await res.json();
      if (d.url) window.location.href = d.url;
      else { setUpgrading(false); alert(d.error || "Could not start checkout."); }
    } catch { setUpgrading(false); alert("Could not start checkout."); }
  };

  const publishToBoard = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/dashboard/company/announcements", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "publish_to_board" }),
      });
      if (res.ok) load();
      else { const d = await res.json().catch(() => ({})); alert(d.error || "Could not publish to the board."); }
    } finally { setBusyId(null); }
  };

  const reset = () => { setTitle(""); setBodyText(""); setLink(""); setMeta({}); setCat("partnership"); setCtaLabel(CTA.partnership.label); setOpen(false); };
  const activeFields = CATEGORIES.find((c) => c.id === cat)?.fields || [];

  const submit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await fetch("/api/dashboard/company/announcements", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat, title, body: bodyText, link_url: link, meta: { ...meta, cta_label: ctaLabel } }),
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
      <div className="bg-white border border-[#e8eaee] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-semibold text-[#0f1a14]">Announcements</div>
              {boardAccess && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Growth</span>}
            </div>
            <p className="text-xs text-[#718096] max-w-lg">
              {boardAccess
                ? "Post partnerships, raises, hires, milestones, and more. Your updates publish to the public EP newsroom board and feed the investor market tracker."
                : "Post partnerships, raises, hires, milestones, and more. Updates go live on your company profile right away. Publishing to the public EP newsroom board — and feeding the investor market tracker — is a Growth feature."}
            </p>
          </div>
          {!open && (
            <button onClick={() => setOpen(true)} className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] flex-shrink-0">
              New announcement
            </button>
          )}
        </div>

        {!loading && !boardAccess && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
            <div className="text-xs text-[#0f1a14]">
              <span className="font-semibold">Reach the whole network.</span> Upgrade to Growth to publish updates to the public EP newsroom board, feed the investor market tracker, and re-post your existing updates to the board.
            </div>
            <button onClick={upgrade} disabled={upgrading} className="text-xs font-semibold bg-[#2d6a4f] text-white px-4 py-2 rounded-lg hover:bg-[#235a40] disabled:opacity-50 flex-shrink-0">
              {upgrading ? "Starting…" : "Upgrade to Growth"}
            </button>
          </div>
        )}

        {open && (
          <div className="mt-5 pt-5 border-t border-[#e8eaee] flex flex-col gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select value={cat} onChange={(e) => { const id = e.target.value; setCat(id); setMeta({}); setCtaLabel(CTA[id]?.label || "Learn more"); }} className={inputClass}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
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
              <label className={labelClass}>Call-to-action button</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-[#a0aec0] mb-1">Button says</div>
                  <select value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputClass}>
                    {CTA_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-[#a0aec0] mb-1">Button links to</div>
                  <input value={link} onChange={(e) => setLink(e.target.value)} placeholder={CTA[cat]?.ph || "https://…"} className={inputClass} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-[#a0aec0]">Preview:</span>
                <span className="inline-block text-xs font-semibold bg-[#2d6a4f] text-white px-3 py-1.5 rounded-lg">{ctaLabel || "Learn more"} →</span>
              </div>
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

      <div className="bg-white border border-[#e8eaee] rounded-2xl p-6">
        <div className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-4">Your announcements</div>
        {loading ? (
          <p className="text-sm text-[#718096]">Loading…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-[#718096]">No announcements yet. Post your first one above.</p>
        ) : (
          <div className="flex flex-col divide-y divide-[#f6f7f9]">
            {list.map((a) => {
              const st = STATUS[a.status] || STATUS.pending;
              return (
                <div key={a.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2f4f6] text-[#4a5568] border border-[#dbdfe4]">{catLabel(a.category)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                      {a.status === "published" && (
                        a.newsroom
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">On public board</span>
                          : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f2f4f6] text-[#718096] border border-[#dbdfe4]">Profile only</span>
                      )}
                      {a.is_featured && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">Boosted</span>}
                    </div>
                    <div className="text-sm text-[#0f1a14] font-medium">{a.title}</div>
                    {metaLine(a) && <div className="text-xs text-[#4a5568] mt-0.5">{metaLine(a)}</div>}
                    {a.body && <div className="text-xs text-[#718096] mt-0.5 leading-relaxed line-clamp-2">{a.body}</div>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#a0aec0]">{when(a.published_at || a.created_at)}</span>
                      {a.link_url && <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#2d6a4f] hover:underline">View link →</a>}
                    </div>
                    {a.status === "rejected" && a.review_note && <div className="text-xs text-red-500 mt-0.5">Reviewer: {a.review_note}</div>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {boardAccess && a.status === "published" && !a.newsroom && (
                      <button onClick={() => publishToBoard(a.id)} disabled={busyId === a.id}
                        className="text-xs font-semibold text-[#2d6a4f] hover:text-[#235a40] disabled:opacity-50">
                        {busyId === a.id ? "Publishing…" : "Publish to board"}
                      </button>
                    )}
                    <button onClick={() => remove(a.id)} className="text-xs text-[#a0aec0] hover:text-red-500">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
