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
      <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Row({ name, tag, right, sub }) {
  return (
    <div className="px-4 py-2.5 hover:bg-slate-50 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm text-slate-800 font-medium truncate">{name}</div>
        <div className="text-xs text-slate-400">{tag}{sub ? ` · ${sub}` : ""}</div>
      </div>
      <div className="text-xs font-mono text-slate-600 whitespace-nowrap text-right">{right}</div>
    </div>
  );
}

export default function DealflowPage() {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/admin/dealflow").then((r) => r.json()).then((x) => { setD(x); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (!d || d.error) return <div className="p-6 text-sm text-red-600">Error: {d?.error || "no data"}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-1">
        <Zap size={18} className="text-emerald-600" />
        <h1 className="text-2xl font-bold text-slate-900">Deal flow — who's raising</h1>
        <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">admin preview</span>
      </div>
      <p className="text-sm text-slate-500 mb-5">Forward-looking view: companies raising now, statistically due, or with fresh momentum. This is the part investors pay for.</p>

      <div className="grid md:grid-cols-3 gap-3">
        <Panel icon={CheckCircle} color="#2d6a4f" title="Currently raising" sub="Self-reported on EP — verified" count={d.counts.currentlyRaising}>
          {d.currentlyRaising.length === 0 && <p className="px-4 py-4 text-xs text-slate-400">None yet. Fills as claimed companies mark themselves open to raise.</p>}
          {d.currentlyRaising.map((c) => (
            <Row key={c.id} name={c.name} tag={label((c.industry_tags || [])[0]) || "—"} sub={c.raise_round_type ? label(c.raise_round_type) : null} right={c.raise_target ? usd(c.raise_target) : "raising"} />
          ))}
        </Panel>

        <Panel icon={Clock} color="#d97706" title="Likely raising soon" sub="Last round 18-33 months ago — statistically due" count={d.counts.likelyRaising}>
          {d.likelyRaising.length === 0 && <p className="px-4 py-4 text-xs text-slate-400">Fills as more companies get linked to their funding history.</p>}
          {d.likelyRaising.map((c) => (
            <Row key={c.id} name={c.name} tag={label((c.industry_tags || [])[0]) || label(c.last_round?.sector) || "—"}
              sub={`last: ${label(c.last_round?.stage) || c.last_round?.type} ${usd(c.last_round?.amount_usd)}`}
              right={`${monthsAgo(c.last_round?.announced_date)}mo ago`} />
          ))}
        </Panel>

        <Panel icon={Zap} color="#7c3aed" title="Recently raised" sub="Closed in the last ~4 months — momentum" count={d.counts.recentlyRaised}>
          {d.recentlyRaised.map((e, i) => (
            <Row key={i} name={e.company_name} tag={label(e.sector) || label(e.type)}
              sub={label(e.stage)} right={`${usd(e.amount_usd)} · ${monthsAgo(e.announced_date)}mo`} />
          ))}
        </Panel>
      </div>
    </div>
  );
}
