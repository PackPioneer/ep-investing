"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ExternalLink, Sparkles, Loader2 } from "lucide-react";

const CATEGORY_COLORS = {
  capital: "bg-emerald-50 text-emerald-700 border-emerald-200",
  grant: "bg-violet-50 text-violet-700 border-violet-200",
  policy: "bg-blue-50 text-blue-700 border-blue-200",
  industry: "bg-amber-50 text-amber-700 border-amber-200",
};

const CATEGORIES = ["capital", "grant", "policy", "industry"];

function isoToLocalInput(iso) {
  // Convert an ISO string to the value format a datetime-local input expects.
  const d = iso ? new Date(iso) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CandidateCard({ cand, onDone }) {
  const [category, setCategory] = useState(cand.category || "industry");
  const [importance, setImportance] = useState(cand.importance || 2);
  const [title, setTitle] = useState(cand.title || "");
  const [body, setBody] = useState(cand.body || "");
  const [publishedAt, setPublishedAt] = useState(isoToLocalInput(null)); // default: now
  const [busy, setBusy] = useState(false);

  const act = async (action) => {
    setBusy(true);
    const payload = { action, id: cand.id };
    if (action === "approve") {
      payload.edits = { category, importance, title, body, published_at: new Date(publishedAt).toISOString() };
    }
    const res = await fetch("/api/admin/feed-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (data.error) { alert(data.error); return; }
    onDone(cand.id);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={"text-xs font-semibold px-2 py-1 rounded-md border " + (CATEGORY_COLORS[category] || "bg-gray-50 text-gray-700 border-gray-200")}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="flex items-center gap-1 ml-1">
          <span className="text-xs text-gray-400">importance</span>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => setImportance(n)}
              className={"w-7 h-7 rounded-md text-xs font-semibold border transition-colors " +
                (importance === n ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50")}
            >
              {n}
            </button>
          ))}
        </div>

        {cand.source_article_url && (
          <a
            href={cand.source_article_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
          >
            source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-md px-2 py-1.5 mb-2 focus:outline-none focus:border-gray-400"
      />
      <textarea
        value={body || ""}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="w-full text-sm text-gray-600 border border-gray-200 rounded-md px-2 py-1.5 mb-3 focus:outline-none focus:border-gray-400 resize-none"
      />

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-gray-400 inline-flex items-center gap-2">
          publish time
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-700"
          />
        </label>

        {cand.topics && cand.topics.length > 0 && (
          <div className="text-xs text-gray-400">
            {cand.topics.join(", ")}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => act("reject")}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={() => act("approve")}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" /> Approve &amp; publish
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedQueuePage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genStats, setGenStats] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/feed-queue");
    const data = await res.json();
    setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDone = (id) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const generate = async () => {
    setGenerating(true);
    setGenStats(null);
    const res = await fetch("/api/admin/generate-candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 3, limit: 40 }),
    });
    const data = await res.json();
    setGenStats(data);
    setGenerating(false);
    load();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-gray-900">Feed Queue</h1>
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Generating…" : "Generate candidates"}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Review AI-drafted briefing items. Edit category, importance, text, or publish time, then approve to push live, or reject.
      </p>

      {genStats && (
        <div className="mb-5 text-xs text-gray-600 bg-gray-100 rounded-lg px-4 py-2">
          {genStats.error
            ? `Error: ${genStats.error}`
            : `Considered ${genStats.considered}, created ${genStats.created}, skipped ${genStats.skipped_not_worthy} (not worthy) + ${genStats.skipped_dupe} (dupes).`}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 py-8">Loading…</div>
      ) : candidates.length === 0 ? (
        <div className="text-sm text-gray-400 py-8">
          No pending candidates. Hit “Generate candidates” to mine recent news.
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((c) => (
            <CandidateCard key={c.id} cand={c} onDone={handleDone} />
          ))}
        </div>
      )}
    </div>
  );
}
