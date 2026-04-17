"use client";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_COLORS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

function ExpertRow({ expert, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateStatus = async (status) => {
    setSaving(true);
    await fetch("/api/admin/expert-applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: expert.id, status }),
    });
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-slate-900">{expert.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLORS[expert.status] || STATUS_COLORS.pending}`}>
              {expert.status || "pending"}
            </span>
          </div>
          <div className="text-sm text-slate-500 mt-0.5">{expert.email}</div>
          {expert.expertise_areas?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {expert.expertise_areas.slice(0, 3).map(a => (
                <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-400 font-mono">
            {new Date(expert.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-5 bg-slate-50 flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ["Location", expert.location],
              ["Rate", expert.hourly_rate],
              ["Availability", expert.availability],
              ["LinkedIn", expert.linkedin_url],
              ["Website", expert.website_url],
            ].filter(([,v]) => v).map(([k, v]) => (
              <div key={k}>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-1">{k}</div>
                <div className="text-sm text-slate-700">{v}</div>
              </div>
            ))}
          </div>
          {expert.bio && (
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-1">Bio</div>
              <p className="text-sm text-slate-700 leading-relaxed">{expert.bio}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => updateStatus("approved")} disabled={saving || expert.status === "approved"}
              className="flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-40">
              <CheckCircle size={13} /> Approve
            </button>
            <button onClick={() => updateStatus("rejected")} disabled={saving || expert.status === "rejected"}
              className="flex items-center gap-1.5 text-xs font-semibold bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-40">
              <XCircle size={13} /> Reject
            </button>
            <button onClick={() => updateStatus("pending")} disabled={saving || expert.status === "pending"}
              className="flex items-center gap-1.5 text-xs font-semibold border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-100 disabled:opacity-40">
              <Clock size={13} /> Reset to pending
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExpertApplications() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/expert-applications");
    const data = await res.json();
    setExperts(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = filter === "all" ? experts : experts.filter(e => e.status === filter);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Expert Applications</h1>
          <p className="text-sm text-slate-500 mt-1">{experts.length} total · {experts.filter(e => e.status === "pending").length} pending</p>
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg border capitalize transition-colors ${filter === f ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No applications found.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(e => <ExpertRow key={e.id} expert={e} onUpdate={fetchData} />)}
        </div>
      )}
    </div>
  );
}