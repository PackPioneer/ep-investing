"use client";

import { useEffect, useState } from "react";

function usd(n) {
  if (n == null) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
}
const label = (s) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const monthsAgo = (d) => (d ? Math.round((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30.4)) : null);
const daysAgo = (d) => (d ? Math.round((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)) : null);
const ago = (d) => { const days = daysAgo(d); if (days == null) return ""; if (days < 1) return "today"; if (days < 30) return `${days}d ago`; const m = Math.round(days / 30.4); return `${m}mo ago`; };

const DOT = { self: "#2d6a4f", press: "#0ea5e9", due: "#d97706", hiring: "#7c3aed", raised: "#7c3aed" };
function Tag({ kind, children }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: DOT[kind] || "#94a3b8" }} />
      {children}
    </span>
  );
}

function Row({ name, meta, right, rightSub, kind, kindLabel, href, external, saveId, isSaved, onToggleSave }) {
  const inner = (
    <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-2 min-w-0">
        {saveId != null && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave?.(saveId); }}
            className={`text-base leading-none mt-0.5 ${isSaved?.(saveId) ? "text-emerald-600" : "text-slate-300 hover:text-emerald-500"}`}
            title={isSaved?.(saveId) ? "Saved to pipeline" : "Save to pipeline"}>
            {isSaved?.(saveId) ? "★" : "☆"}
          </button>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900 truncate">{name}</span>
            {kindLabel && <Tag kind={kind}>{kindLabel}</Tag>}
          </div>
          {meta && <div className="text-xs text-slate-500 mt-0.5 truncate">{meta}</div>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">{right}</div>
        {rightSub && <div className="text-[11px] text-slate-400 whitespace-nowrap">{rightSub}</div>}
      </div>
    </div>
  );
  if (href) return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block">{inner}</a>;
  return inner;
}

function Section({ accent, title, subtitle, count, rows, defaultShow = 6, collapsible = false, startOpen = true }) {
  const [open, setOpen] = useState(startOpen);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? rows : rows.slice(0, defaultShow);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => collapsible && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 ${collapsible ? "cursor-pointer hover:bg-slate-50" : "cursor-default"}`}>
        <div className="flex items-center gap-2.5 text-left">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: accent }} />
          <div>
            <div className="text-sm font-bold text-slate-900">{title} <span className="text-slate-400 font-mono font-normal">{count}</span></div>
            <div className="text-xs text-slate-400">{subtitle}</div>
          </div>
        </div>
        {collapsible && <span className="text-slate-400 text-sm">{open ? "▾" : "▸"}</span>}
      </button>
      {open && (
        <>
          {rows.length === 0 ? (
            <p className="px-5 pb-4 text-xs text-slate-400">Nothing here right now.</p>
          ) : (
            <div className="divide-y divide-slate-100 border-t border-slate-100">{visible}</div>
          )}
          {rows.length > defaultShow && (
            <button onClick={() => setShowAll((v) => !v)} className="w-full text-center text-xs font-semibold text-emerald-700 hover:bg-slate-50 py-2.5 border-t border-slate-100">
              {showAll ? "Show less" : `Show ${rows.length - defaultShow} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function RaisingTab({ isSaved, onToggleSave }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/dashboard/dealflow").then((r) => r.json()).then((x) => { setD(x); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!d || d.error) return <div className="p-6 text-sm text-red-600">Error: {d?.error || "no data"}</div>;

  const c = d.counts || {};

  // --- RAISING NOW (factual/fresh): verified self-reports + press, newest first ---
  const nowRows = [
    ...(d.currentlyRaising || []).map((co) => ({
      key: `s${co.id}`, sortDate: co.updated_at || co.created_at || Date.now(),
      el: (
        <Row key={`s${co.id}`} name={co.name}
          meta={[label((co.industry_tags || [])[0]), co.raise_round_type ? label(co.raise_round_type) : null].filter(Boolean).join(" · ")}
          right={co.raise_target ? usd(co.raise_target) : "Raising"} rightSub="verified"
          kind="self" kindLabel="Verified"
          href={`/companies/${co.id}`} saveId={co.id} isSaved={isSaved} onToggleSave={onToggleSave} />
      ),
    })),
    ...(d.pressRaising || []).map((r, i) => ({
      key: `p${i}`, sortDate: r.published_at || 0,
      el: (
        <Row key={`p${i}`} name={r.name}
          meta={[label((r.industry_tags || [])[0]) || (r.matched ? null : "not in directory")].filter(Boolean).join(" · ") || "In market"}
          right="In market" rightSub={ago(r.published_at)}
          kind="press" kindLabel="Press"
          href={r.matched ? `/companies/${r.company_id}` : r.article_url} external={!r.matched}
          saveId={r.matched ? r.company_id : null} isSaved={isSaved} onToggleSave={onToggleSave} />
      ),
    })),
  ].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate)).map((x) => x.el);

  // --- RECENTLY RAISED (factual): closed recently, newest first ---
  const recentRows = [...(d.recentlyRaised || [])]
    .sort((a, b) => new Date(b.announced_date || 0) - new Date(a.announced_date || 0))
    .map((e, i) => (
      <Row key={`r${i}`} name={e.company_name}
        meta={[label(e.sector) || label(e.type), label(e.stage)].filter(Boolean).join(" · ")}
        right={usd(e.amount_usd)} rightSub={ago(e.announced_date)}
        kind="raised"
        href={e.company_id ? `/companies/${e.company_id}` : undefined}
        saveId={e.company_id ?? null} isSaved={isSaved} onToggleSave={onToggleSave} />
    ));

  // --- LIKELY SOON (inferred): hiring bursts + statistically due ---
  const likelyRows = [
    ...(d.hiringSignal || []).map((co) => (
      <Row key={`h${co.id}`} name={co.name}
        meta={[label((co.industry_tags || [])[0]), `${co.postings} new roles${co.senior ? `, ${co.senior} senior` : ""}`].filter(Boolean).join(" · ")}
        right="Hiring" rightSub={ago(co.latest)} kind="hiring" kindLabel="Hiring"
        href={`/companies/${co.id}`} saveId={co.id} isSaved={isSaved} onToggleSave={onToggleSave} />
    )),
    ...(d.likelyRaising || []).map((co) => (
      <Row key={`d${co.id}`} name={co.name}
        meta={`Last: ${label(co.last_round?.stage) || co.last_round?.type} ${usd(co.last_round?.amount_usd)}`}
        right="Likely due" rightSub={`${monthsAgo(co.last_round?.announced_date)}mo since`} kind="due" kindLabel="Due"
        href={`/companies/${co.id}`} saveId={co.id} isSaved={isSaved} onToggleSave={onToggleSave} />
    )),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: nowRows.length, l: "Raising now", c: "#2d6a4f" },
          { n: recentRows.length, l: "Recently raised", c: "#7c3aed" },
          { n: likelyRows.length, l: "Likely soon", c: "#d97706" },
        ].map((s) => (
          <div key={s.l} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div className="text-2xl font-bold text-slate-900">{s.n}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.c }} />{s.l}
            </div>
          </div>
        ))}
      </div>

      <Section accent="#2d6a4f" title="Raising now" subtitle="Self-reported on EP + spotted in the press · newest first" count={nowRows.length} rows={nowRows} />
      <Section accent="#7c3aed" title="Recently raised" subtitle="Closed in the last ~4 months" count={recentRows.length} rows={recentRows} />
      <Section accent="#d97706" title="Likely raising soon" subtitle="Inferred signals — hiring bursts & rounds statistically due (not confirmations)" count={likelyRows.length} rows={likelyRows} collapsible startOpen={false} />

      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-700 select-none">How these signals are derived</summary>
        <div className="mt-2 space-y-1.5 leading-relaxed bg-white border border-slate-200 rounded-xl p-4">
          <p><span className="font-medium text-slate-700">Raising now.</span> Verified = the company self-reported on EP. Press = news language shows an open round.</p>
          <p><span className="font-medium text-slate-700">Recently raised.</span> Factual closes from the last ~4 months.</p>
          <p><span className="font-medium text-slate-700">Likely soon.</span> Due = last equity round closed 12–18 months ago. Hiring = a recent burst of senior roles. These are <em>inferred</em>, not confirmations.</p>
          <p className="text-slate-400 border-t border-slate-100 pt-1.5">Updated daily from EP's news and funding pipeline.</p>
        </div>
      </details>
    </div>
  );
}
