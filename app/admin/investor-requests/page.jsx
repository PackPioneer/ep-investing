"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, MessageCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS = {
  pending: Clock,
  contacted: MessageCircle,
  approved: CheckCircle,
  rejected: XCircle,
};

function RequestRow({ request, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(request.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const Icon = STATUS_ICONS[request.status] || Clock;

  const updateStatus = async (status) => {
    setSaving(true);
    await fetch("/api/admin/investor-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: request.id, status, admin_notes: notes }),
    });
    setSaving(false);
    onUpdate();
  };

  const saveNotes = async () => {
    setSaving(true);
    await fetch("/api/admin/investor-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: request.id, status: request.status, admin_notes: notes }),
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${STATUS_COLORS[request.status]}`}>
          <Icon size={11} />
          {request.status}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 text-sm">{request.name}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {request.email}{request.firm ? ` · ${request.firm}` : ""}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            {new Date(request.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Focus", request.focus],
              ["Stage", request.stage],
              ["Check size", request.check_size],
              ["Path", request.path],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{k}</div>
                <div className="text-sm text-slate-700">{v}</div>
              </div>
            ))}
          </div>

          {request.notes && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</div>
              <p className="text-sm text-slate-700 leading-relaxed">{request.notes}</p>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Admin notes</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Internal notes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-green-500 resize-none" />
            <button onClick={saveNotes} disabled={saving}
              className="mt-2 text-xs text-green-700 font-medium hover:text-green-800 disabled:opacity-50">
              {saving ? "Saving…" : "Save notes"}
            </button>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Update status</div>
            <div className="flex flex-wrap gap-2">
              {["pending", "contacted", "approved", "rejected"].map(s => (
                <button key={s} onClick={() => updateStatus(s)} disabled={saving || request.status === s}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-40 ${
                    request.status === s ? STATUS_COLORS[s] : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <a href={"mailto:" + request.email + "?subject=Your EP Investing investor profile"}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#235a40]">
              <MessageCircle size={12} /> Reply via email
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInvestorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () => {
    fetch("/api/admin/investor-requests")
      .then(r => r.json())
      .then(data => { setRequests(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    contacted: requests.filter(r => r.status === "contacted").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Investor Requests</h1>
            <p className="text-sm text-slate-500 mt-1">Review incoming investor applications</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#2d6a4f]">{counts.pending}</div>
            <div className="text-xs text-slate-500">pending review</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {Object.entries(counts).map(([key, count]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === key ? "bg-[#2d6a4f] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}>
              {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 text-sm">No {filter === "all" ? "" : filter} requests yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(r => <RequestRow key={r.id} request={r} onUpdate={load} />)}
          </div>
        )}
      </div>
    </div>
  );
}