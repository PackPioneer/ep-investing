"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Briefcase, Trash2, Edit3, ExternalLink, Eye } from "lucide-react";

export default function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/ngos/me/jobs")
      .then(r => r.json())
      .then(d => { setJobs(d.jobs ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!confirm("Delete this job posting? This cannot be undone.")) return;
    const res = await fetch(`/api/ngos/me/jobs/${id}`, { method: "DELETE" });
    if (res.ok) {
      setJobs(prev => prev.filter(j => j.id !== id));
    } else {
      alert("Delete failed");
    }
  }

  async function toggleStatus(job) {
    const newStatus = job.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/ngos/me/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">Job postings</h2>
          <p className="text-sm text-[#718096] mt-1">{jobs.length} posted</p>
        </div>
        <Link href="/dashboard/ngo/jobs/new"
          className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#235a40] transition-colors">
          <Plus size={13} /> New job
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-[#718096]">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#e2e6ed] rounded-2xl bg-white">
          <Briefcase size={32} className="text-[#d0d6e0] mx-auto mb-4" />
          <p className="text-sm text-[#4a5568] mb-1">No job postings yet</p>
          <p className="text-xs text-[#718096] mb-5">Hire from a pool of climate-focused candidates.</p>
          <Link href="/dashboard/ngo/jobs/new"
            className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#235a40] transition-colors">
            <Plus size={13} /> Post a job
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(j => (
            <div key={j.id} className="bg-white border border-[#e2e6ed] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-[#0f1a14]">{j.title}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      j.status === "active"
                        ? "border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f]"
                        : "border-[#e2e6ed] bg-[#f8f9fb] text-[#718096]"
                    }`}>
                      {j.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#718096] flex-wrap">
                    {j.location && <span>{j.location}</span>}
                    {j.type && <span>{j.type}</span>}
                    {j.sector && <span className="capitalize">{j.sector.replace(/-/g, " ")}</span>}
                    <span className="flex items-center gap-1"><Eye size={10} /> {j.views ?? 0} views</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {j.apply_url && (
                    <a href={j.apply_url} target="_blank" rel="noopener noreferrer"
                      className="text-[#718096] hover:text-[#2d6a4f] p-2 rounded-lg hover:bg-[#f8f9fb] transition-colors" title="Open apply URL">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  <button onClick={() => toggleStatus(j)}
                    className="text-xs font-mono text-[#4a5568] hover:text-[#2d6a4f] px-2 py-1 rounded hover:bg-[#f8f9fb] transition-colors">
                    {j.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                  <Link href={`/dashboard/ngo/jobs/${j.id}/edit`}
                    className="text-[#718096] hover:text-[#2d6a4f] p-2 rounded-lg hover:bg-[#f8f9fb] transition-colors" title="Edit">
                    <Edit3 size={14} />
                  </Link>
                  <button onClick={() => handleDelete(j.id)}
                    className="text-[#718096] hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
