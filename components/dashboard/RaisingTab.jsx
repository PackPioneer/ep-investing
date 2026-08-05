"use client";

import { useEffect, useState } from "react";
import { Loader2, Zap, Clock, CheckCircle } from "lucide-react";

function usd(n) {
  if (n == null) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(0) + "M";
  return "$" + n;
}
const label = (s) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const monthsAgo = (d) => d ? Math.round((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24 * 30.4)) : null;
const daysAgo = (d) => d ? Math.round((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)) : null;

const BADGE = {
  self: "bg-emerald-50 text-emerald-700 border-emerald-200",
  press: "bg-sky-50 text-sky-700 border-sky-200",
  due: "bg-amber-50 text-amber-700 border-amber-200",
  hiring: "bg-violet-50 text-violet-700 border-violet-200",
};
function Badge({ kind, children }) {
  return <span className={`text-[9px] font-medium uppercase tracking-wide border px-1.5 py-0.5 rounded ${BADGE[kind]}`}>{children}</span>;
}

function Panel({ icon: Icon, color, title, sub, count, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Icon size={15} style={{ color }} />
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <span className="text-xs font-mono text-slate-400">{count}</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Row({ name, tag, right, sub, badge, href, external, saveId, isSaved, onToggleSave }) {
  const inner = (
    <div className="px-4 py-2.5 hover:bg-slate-50 flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {saveId != null && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave?.(saveId); }}
              className={`text-sm leading-none ${isSaved?.(saveId) ? "text-emerald-600" : "text-slate-300 hover:text-emerald-500"}`}
              title={isSaved?.(saveId) ? "Saved to pipeline" : "Save to pipeline"}>
              {isSaved?.(saveId) ? "★" : "☆"}
            </button>
          )}
          <span className="text-sm text-slate-800 font-medium truncate">{name}</span>
          {badge}
        </div>
        <div className="text-xs text-slate-400">{tag}{sub ? ` · ${sub}` : ""}</div>
      </div>
      <div className="text-xs font-mono text-slate-600 whitespace-nowrap text-right">{right}</div>
    </div>
  );
  if (href) return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block">{inner}</a>;
  return inner;
}

export default function RaisingTab({ isSaved, onToggleSave }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/dashboard/dealflow").then((r) => r.json()).then((x) => { setD(x); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (!d || d.error) return <div className="p-6 text-sm text-red-600">Error: {d?.error || "no data"}</div>;

  const c = d.counts;
  const currentTotal = c.currentlyRaising + c.pressRaising;
  const likelyTotal = c.likelyRaising + c.hiringSignal;

  return (
    <div>
      <p className="text-sm text-slate-500 mb-3">Forward-looking view: who's raising now (self-reported or spotted in the press), who's statistically due or hiring like they're about to, and who just closed. Star a company to add it to your pipeline.</p>

      <details className="mb-5 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-600 select-none">How these signals are derived</summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p><span className="font-medium text-slate-700">Currently raising.</span> <span className="text-emerald-700">Verified</span> = the company self-reported on EP. <span className="text-sky-700">Press</span> = we detected news language that the company is actively seeking capital (round open, not yet closed).</p>
          <p><span className="font-medium text-slate-700">Likely raising soon.</span> <span className="text-amber-700">Due</span> = the last equity round closed 12–18 months ago — the typical window before a follow-on raise. <span className="text-violet-700">Hiring</span> = a recent burst of open roles (especially senior finance/BD), which tends to precede expansion and a new raise.</p>
          <p><span className="font-medium text-slate-700">Recently raised.</span> Rounds that closed in the last ~4 months.</p>
          <p className="text-slate-400 border-t border-slate-100 pt-2"><span className="font-medium">Disclaimer:</span> Verified and Recently raised are factual. Due, Hiring, and Press are <em>inferred</em> signals, not confirmations — a company shown here may not be raising, and absence here doesn't mean it isn't.</p>
        </div>
      </details>

      <div className="grid md:grid-cols-3 gap-3">
        <Panel icon={CheckCircle} color="#2d6a4f" title="Currently raising" sub="Self-reported on EP + detected in the press" count={currentTotal}>
          {currentTotal === 0 && <p className="px-4 py-4 text-xs text-slate-400">None yet. Fills from self-reports and from news of companies in-market.</p>}
          {d.currentlyRaising.map((co) => (
            <Row key={`s${co.id}`} name={co.name} tag={label((co.industry_tags || [])[0]) || "—"}
              sub={co.raise_round_type ? label(co.raise_round_type) : null}
              right={co.raise_target ? usd(co.raise_target) : "raising"}
              badge={<Badge kind="self">verified</Badge>}
              href={`/companies/${co.id}`} saveId={co.id} isSaved={isSaved} onToggleSave={onToggleSave} />
          ))}
          {(d.pressRaising || []).map((r, i) => (
            <Row key={`p${i}`} name={r.name} tag={label((r.industry_tags || [])[0]) || (r.matched ? "—" : "not in directory")}
              sub={`${daysAgo(r.published_at)}d ago`}
              right="in market"
              badge={<Badge kind="press">press</Badge>}
              href={r.matched ? `/companies/${r.company_id}` : r.article_url}
              external={!r.matched}
              saveId={r.matched ? r.company_id : null} isSaved={isSaved} onToggleSave={onToggleSave} />
          ))}
        </Panel>

        <Panel icon={Clock} color="#d97706" title="Likely raising soon" sub="Statistically due, or hiring like they're about to" count={likelyTotal}>
          {likelyTotal === 0 && <p className="px-4 py-4 text-xs text-slate-400">Fills as companies get linked to funding history or post hiring bursts.</p>}
          {(d.hiringSignal || []).map((co) => (
            <Row key={`h${co.id}`} name={co.name} tag={label((co.industry_tags || [])[0]) || "—"}
              sub={`${co.postings} new roles${co.senior ? `, ${co.senior} senior/finance` : ""}`}
              right={`${daysAgo(co.latest)}d ago`}
              badge={<Badge kind="hiring">hiring</Badge>}
              href={`/companies/${co.id}`} saveId={co.id} isSaved={isSaved} onToggleSave={onToggleSave} />
          ))}
          {d.likelyRaising.map((co) => (
            <Row key={`d${co.id}`} name={co.name} tag={label((co.industry_tags || [])[0]) || label(co.last_round?.sector) || "—"}
              sub={`last: ${label(co.last_round?.stage) || co.last_round?.type} ${usd(co.last_round?.amount_usd)}`}
              right={`${monthsAgo(co.last_round?.announced_date)}mo ago`}
              badge={<Badge kind="due">due</Badge>}
              href={`/companies/${co.id}`} saveId={co.id} isSaved={isSaved} onToggleSave={onToggleSave} />
          ))}
        </Panel>

        <Panel icon={Zap} color="#7c3aed" title="Recently raised" sub="Closed in the last ~4 months — momentum" count={c.recentlyRaised}>
          {d.recentlyRaised.map((e, i) => (
            <Row key={i} name={e.company_name} tag={label(e.sector) || label(e.type)}
              sub={label(e.stage)} right={`${usd(e.amount_usd)} · ${monthsAgo(e.announced_date)}mo`}
              href={e.company_id ? `/companies/${e.company_id}` : undefined}
              saveId={e.company_id ?? null} isSaved={isSaved} onToggleSave={onToggleSave} />
          ))}
        </Panel>
      </div>
    </div>
  );
}
