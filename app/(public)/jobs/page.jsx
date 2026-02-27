"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Clock, Briefcase, ArrowRight, CheckCircle, Search, Filter } from "lucide-react";

const SAMPLE_JOBS = [
  { id: 1, title: "Head of Business Development", company: "ChargePoint", location: "San Jose, CA", type: "Full-time", sector: "ev_charging", posted: "2 days ago" },
  { id: 2, title: "Senior Electrochemist", company: "Verdagy", location: "Moss Landing, CA", type: "Full-time", sector: "green_hydrogen", posted: "3 days ago" },
  { id: 3, title: "Climate Policy Analyst", company: "Spring Lane Capital", location: "Remote", type: "Full-time", sector: "climate_finance", posted: "5 days ago" },
  { id: 4, title: "Project Finance Associate", company: "Clean Energy Ventures", location: "Boston, MA", type: "Full-time", sector: "climate_finance", posted: "1 week ago" },
  { id: 5, title: "Nuclear Engineer", company: "Nano Nuclear Energy", location: "New York, NY", type: "Full-time", sector: "nuclear_technologies", posted: "1 week ago" },
  { id: 6, title: "Sales Engineer – EMEA", company: "Plug Power", location: "Remote / Europe", type: "Full-time", sector: "green_hydrogen", posted: "2 weeks ago" },
];

const SECTORS = ["All", "ev_charging", "green_hydrogen", "nuclear_technologies", "climate_finance", "battery_storage", "solar"];

function JobCard({ job }) {
  return (
    <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#2d6a4f] transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#e2e6ed] flex items-center justify-center text-sm font-bold text-[#2d6a4f] flex-shrink-0">
          {job.company[0]}
        </div>
        <div>
          <h3 className="font-semibold text-[#0f1a14] text-sm group-hover:text-[#2d6a4f] transition-colors">{job.title}</h3>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs text-[#4a5568]">{job.company}</span>
            <span className="flex items-center gap-1 text-xs text-[#718096] font-mono">
              <MapPin size={10} /> {job.location}
            </span>
            <span className="flex items-center gap-1 text-xs text-[#718096] font-mono">
              <Clock size={10} /> {job.posted}
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568]">
              {job.type}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#4a5568]">
              {job.sector.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>
      <button className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#f2f4f8] bg-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#235a40] transition-all">
        Apply <ArrowRight size={11} />
      </button>
    </div>
  );
}

function PostJobForm({ onDone }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", location: "", type: "Full-time", sector: "", description: "", contact_email: "" });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onDone();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-7 pb-6 border-b border-[#e2e6ed]">
          <Briefcase size={18} className="text-[#2d6a4f]" />
          <h2 className="font-semibold text-[#0f1a14]">Post a job</h2>
          <span className="ml-auto text-xs font-mono text-[#2d6a4f] px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6]">Free during beta</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {[
            { name: "title", label: "Job title", placeholder: "e.g. Senior Electrochemist", required: true },
            { name: "company", label: "Company name", placeholder: "e.g. Verdagy", required: true },
            { name: "location", label: "Location", placeholder: "e.g. San Jose, CA or Remote", required: true },
            { name: "contact_email", label: "Contact email", placeholder: "jobs@company.com", required: true, type: "email" },
          ].map(field => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#4a5568] tracking-wider uppercase">
                {field.label} <span className="text-[#2d6a4f]">*</span>
              </label>
              <input
                name={field.name}
                type={field.type || "text"}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required={field.required}
                className="bg-[#f2f4f8] border border-[#d0d6e0] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#718096] outline-none focus:border-[#2d6a4f] transition-colors"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#4a5568] tracking-wider uppercase">Type</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="bg-[#f2f4f8] border border-[#d0d6e0] rounded-lg px-4 py-3 text-sm text-[#0f1a14] outline-none focus:border-[#2d6a4f] transition-colors">
                {["Full-time", "Part-time", "Contract", "Fractional", "Advisory"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#4a5568] tracking-wider uppercase">Sector</label>
              <input name="sector" value={form.sector} onChange={handleChange}
                placeholder="e.g. green_hydrogen"
                className="bg-[#f2f4f8] border border-[#d0d6e0] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#718096] outline-none focus:border-[#2d6a4f] transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#4a5568] tracking-wider uppercase">Job description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Role responsibilities, requirements, what you're looking for…"
              rows={4}
              className="bg-[#f2f4f8] border border-[#d0d6e0] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#718096] outline-none focus:border-[#2d6a4f] transition-colors resize-none"
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm rounded-lg py-3.5 hover:bg-[#235a40] transition-all disabled:opacity-60 mt-2">
            {loading ? "Posting…" : "Post job listing"}
            {!loading && <ArrowRight size={14} />}
          </button>
          <p className="text-xs text-[#718096] font-mono text-center">We review all listings before publishing</p>
        </form>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const [view, setView] = useState("board"); // board | post | done
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");

  const filtered = SAMPLE_JOBS.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchSector = sector === "All" || j.sector === sector;
    return matchSearch && matchSector;
  });

  if (view === "done") return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.08)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#2d6a4f]" />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">Job submitted</h2>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-8">We'll review and publish your listing within 1 business day.</p>
        <button onClick={() => setView("board")} className="inline-flex items-center gap-2 bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
          View jobs board <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-16">

        <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
              Climate Jobs
            </div>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#0f1a14]">Jobs board</h1>
            <p className="text-[#4a5568] text-sm mt-2 font-light">Roles across the energy transition — from deep tech to climate finance.</p>
          </div>
          <button onClick={() => setView(view === "post" ? "board" : "post")}
            className="flex-shrink-0 flex items-center gap-2 bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#235a40] transition-all">
            {view === "post" ? "← Browse jobs" : <>Post a job <ArrowRight size={13} /></>}
          </button>
        </div>

        {view === "post" ? (
          <PostJobForm onDone={() => setView("done")} />
        ) : (
          <>
            {/* Search + filter */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex items-center gap-3 flex-1 bg-[#ffffff] border border-[#d0d6e0] rounded-xl px-4 py-3 focus-within:border-[#2d6a4f] transition-all">
                <Search size={14} className="text-[#718096]" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search job titles or companies…"
                  className="flex-1 bg-transparent text-sm text-[#0f1a14] placeholder-[#718096] outline-none" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {SECTORS.slice(0, 5).map(s => (
                  <button key={s} onClick={() => setSector(s)}
                    className={`text-xs font-mono px-3 py-2 rounded-lg border transition-all ${
                      sector === s
                        ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]"
                        : "border-[#e2e6ed] bg-[#ffffff] text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"
                    }`}>
                    {s === "All" ? "All" : s.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filtered.length > 0
                ? filtered.map(job => <JobCard key={job.id} job={job} />)
                : <div className="text-center py-20 text-[#718096] font-mono text-sm">No jobs found</div>
              }
            </div>

            <div className="mt-10 bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-7 text-center">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-2">Hiring in climate?</h3>
              <p className="text-sm text-[#4a5568] mb-5 font-light">Post your role to reach thousands of climate professionals.</p>
              <button onClick={() => setView("post")}
                className="inline-flex items-center gap-2 bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
                Post a job <ArrowRight size={13} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
