"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Friendly display labels for sector values
const SECTOR_LABELS = {
  solar: "Solar",
  climate_tech: "Climate Tech",
  clean_energy: "Clean Energy",
  climate_finance: "Climate Finance",
  battery_storage: "Battery Storage",
  ev_charging: "EV Charging",
  green_hydrogen: "Green Hydrogen",
  nuclear_technologies: "Nuclear Technologies",
  wind_energy: "Wind Energy",
  geothermal_energy: "Geothermal",
  carbon_credits: "Carbon Credits",
  direct_air_capture: "Direct Air Capture",
  industrial_decarbonization: "Industrial Decarbonization",
  saf_efuels: "SAF / E-fuels",
  electric_aviation: "Electric Aviation",
  grid_storage: "Grid Storage",
  clean_cooking: "Clean Cooking",
};
const formatSectorLabel = (key) => SECTOR_LABELS[key] || String(key).replace(/_/g, " ");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function JobCard({ job }) {
  const company = job.company || job.company_name;
  const canApply = job.apply_url || job.contact_email;
  const handleApply = () => {
    fetch(`/api/jobs/${job.id}/view`, { method: "POST" }).catch(() => {});
    if (job.apply_url) window.open(job.apply_url, "_blank", "noopener,noreferrer");
    else if (job.contact_email) window.location.href = `mailto:${job.contact_email}`;
  };
  return (
    <div className="bg-white border border-[#e8eaee] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#2d6a4f] transition-all group">
      <div className="flex items-start gap-4 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-sm font-bold text-[#2d6a4f] flex-shrink-0">
          {(company || "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-[#0f1a14] text-sm group-hover:text-[#2d6a4f] transition-colors">{job.title}</h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[#718096] font-mono">
            {company && (
              job.company_id ? (
                <Link href={`/companies/${job.company_id}`} className="text-[#4a5568] hover:text-[#2d6a4f] font-sans">{company}</Link>
              ) : (
                <span className="text-[#4a5568] font-sans">{company}</span>
              )
            )}
            {job.location && <span>{job.location}</span>}
            {(job.work_mode || job.experience_level) && <span>{[job.work_mode, job.experience_level].filter(Boolean).join(" · ").replace(/_/g, " ")}</span>}
            {job.created_at && <span>{fmtDate(job.created_at)}</span>}
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {job.type && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#f2f4f6] text-[#4a5568]">{String(job.type).replace(/_/g, " ")}</span>}
            {job.sector && <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#f2f4f6] text-[#4a5568]">{formatSectorLabel(job.sector)}</span>}
          </div>
        </div>
      </div>
      {canApply ? (
        <button onClick={handleApply}
          className="flex-shrink-0 text-xs font-semibold text-white bg-[#2d6a4f] px-4 py-2 rounded-lg hover:bg-[#235a40] transition-all">
          Apply →
        </button>
      ) : (
        <span className="flex-shrink-0 text-xs font-mono text-[#a0aec0]">No link</span>
      )}
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
      await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onDone();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-[#e8eaee] rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-7 pb-6 border-b border-[#e8eaee]">
          <h2 className="font-semibold text-[#0f1a14]">Post a job</h2>
          <span className="ml-auto text-xs font-mono text-[#2d6a4f] px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#f2f4f6]">Free during beta</span>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {[
            { name: "title", label: "Job title", placeholder: "e.g. Senior Electrochemist", required: true },
            { name: "company", label: "Company name", placeholder: "e.g. Verdagy", required: true },
            { name: "location", label: "Location", placeholder: "e.g. San Jose, CA or Remote", required: true },
            { name: "contact_email", label: "Contact email", placeholder: "jobs@company.com", required: true, type: "email" },
          ].map(field => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#4a5568] tracking-wider uppercase">{field.label} <span className="text-[#2d6a4f]">*</span></label>
              <input name={field.name} type={field.type || "text"} value={form[field.name]} onChange={handleChange}
                placeholder={field.placeholder} required={field.required}
                className="bg-[#f6f7f9] border border-[#dbdfe4] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#718096] outline-none focus:border-[#2d6a4f] transition-colors" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#4a5568] tracking-wider uppercase">Type</label>
              <select name="type" value={form.type} onChange={handleChange}
                className="bg-[#f6f7f9] border border-[#dbdfe4] rounded-lg px-4 py-3 text-sm text-[#0f1a14] outline-none focus:border-[#2d6a4f] transition-colors">
                {["Full-time", "Part-time", "Contract", "Fractional", "Advisory"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-[#4a5568] tracking-wider uppercase">Sector</label>
              <input name="sector" value={form.sector} onChange={handleChange} placeholder="e.g. green_hydrogen"
                className="bg-[#f6f7f9] border border-[#dbdfe4] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#718096] outline-none focus:border-[#2d6a4f] transition-colors" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#4a5568] tracking-wider uppercase">Job description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              placeholder="Role responsibilities, requirements..." rows={4}
              className="bg-[#f6f7f9] border border-[#dbdfe4] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#718096] outline-none focus:border-[#2d6a4f] transition-colors resize-none" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3.5 hover:bg-[#235a40] transition-all disabled:opacity-60 mt-2">
            {loading ? "Posting…" : "Post job listing →"}
          </button>
          <p className="text-xs text-[#718096] font-mono text-center">We review all listings before publishing</p>
        </form>
      </div>
    </div>
  );
}

const PAGE_SIZE = 30;

export default function JobsPage() {
  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApprovedCompany, setIsApprovedCompany] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Anyone signed in (has a profile) views free; signed-out visitors get a teaser.
  const gated = isLoaded && !user;

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/dashboard/company-status")
      .then(r => r.json())
      .then(d => setIsApprovedCompany(d.status === "approved"))
      .catch(() => {});
  }, [isLoaded, user]);

  useEffect(() => {
    fetch("/api/jobs")
      .then(r => r.json())
      .then(data => { setJobs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { setVisible(PAGE_SIZE); }, [search, sector]);

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.title?.toLowerCase().includes(search.toLowerCase()) || (j.company || j.company_name || "").toLowerCase().includes(search.toLowerCase());
    const matchSector = sector === "All" || j.sector === sector;
    return matchSearch && matchSector;
  });

  // Derive available sectors from actual job data — only show filters that have jobs.
  const sectorCounts = jobs.reduce((acc, j) => {
    if (j.sector) acc[j.sector] = (acc[j.sector] || 0) + 1;
    return acc;
  }, {});
  const availableSectors = ["All", ...Object.keys(sectorCounts).sort((a, b) => sectorCounts[b] - sectorCounts[a])];

  if (view === "done") return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h2 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-3xl text-[#0f1a14] mb-3">Job submitted</h2>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-8">We'll review and publish your listing within 1 business day.</p>
        <button onClick={() => setView("board")} className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
          View jobs board →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#f2f4f6] rounded-full px-3 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
              Climate Jobs
            </div>
            <h1 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-4xl text-[#0f1a14]">Jobs board</h1>
            <p className="text-[#4a5568] text-sm mt-2 font-light">Roles across the energy transition — from deep tech to climate finance.</p>
          </div>
          {isLoaded && !gated && (
            <button
              onClick={() => isApprovedCompany ? setView(view === "post" ? "board" : "post") : router.push(user ? "/onboarding/company" : "/sign-in")}
              className="flex-shrink-0 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#235a40] transition-all">
              {view === "post" ? "← Browse jobs" : isApprovedCompany ? "Post a job" : "Apply to post"}
            </button>
          )}
        </div>

        {gated ? (
          <GateTeaser jobs={jobs} loading={loading} />
        ) : view === "post" ? <PostJobForm onDone={() => setView("done")} /> : (
          <>
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex items-center gap-3 flex-1 bg-white border border-[#dbdfe4] rounded-xl px-4 py-3 focus-within:border-[#2d6a4f] transition-all">
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search job titles or companies…"
                  className="flex-1 bg-transparent text-sm text-[#0f1a14] placeholder-[#718096] outline-none" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {availableSectors.slice(0, 5).map(s => (
                  <button key={s} onClick={() => setSector(s)}
                    className={`text-xs font-mono px-3 py-2 rounded-lg border transition-all ${sector === s ? "border-[#2d6a4f] bg-[rgba(45,106,79,0.08)] text-[#2d6a4f]" : "border-[#e8eaee] bg-white text-[#4a5568] hover:border-[#2d6a4f] hover:text-[#2d6a4f]"}`}>
                    {s === "All" ? `All (${jobs.length})` : `${formatSectorLabel(s)} (${sectorCounts[s] || 0})`}
                  </button>
                ))}
              </div>
            </div>

            {!loading && (
              <p className="text-xs font-mono text-[#718096] mb-4">{filtered.length} role{filtered.length !== 1 ? "s" : ""}</p>
            )}

            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="text-center py-20 text-[#718096] font-mono text-sm">Loading jobs…</div>
              ) : filtered.length > 0 ? (
                filtered.slice(0, visible).map(job => <JobCard key={job.id} job={job} />)
              ) : (
                <div className="text-center py-20 text-[#718096] font-mono text-sm">No jobs found</div>
              )}
            </div>

            {!loading && filtered.length > visible && (
              <div className="text-center mt-6">
                <button onClick={() => setVisible(v => v + PAGE_SIZE)}
                  className="border border-[#dbdfe4] text-[#0f1a14] text-sm font-medium rounded-lg px-6 py-2.5 hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                  Show more ({filtered.length - visible} remaining)
                </button>
              </div>
            )}

            <div className="mt-10 bg-white border border-[#e8eaee] rounded-2xl p-7 text-center">
              <h3 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-xl text-[#0f1a14] mb-2">Hiring in climate?</h3>
              <p className="text-sm text-[#4a5568] mb-5 font-light">Post your role to reach thousands of climate professionals.</p>
              <button
                onClick={() => isApprovedCompany ? setView("post") : router.push(user ? "/onboarding/company" : "/sign-in")}
                className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
                {isApprovedCompany ? "Post a job" : "Apply to post a job"} →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Signed-out teaser: real listings blurred behind a sign-in prompt.
function GateTeaser({ jobs, loading }) {
  const teaser = jobs.slice(0, 6);
  return (
    <div className="relative">
      <div className="flex flex-col gap-3 blur-[6px] pointer-events-none select-none" aria-hidden="true">
        {(teaser.length > 0 ? teaser : Array.from({ length: 5 }).map((_, i) => ({ id: `s${i}`, title: "Climate role", company: "Company", location: "Remote" }))).map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-16">
        <div className="bg-white border border-[#e8eaee] rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#f2f4f6] rounded-full px-3 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" />
            Members only
          </div>
          <h3 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-2xl text-[#0f1a14] mb-2">
            Sign in to view climate jobs
          </h3>
          <p className="text-sm text-[#4a5568] leading-relaxed mb-6 font-light">
            The full jobs board is free — create your EP Network profile to browse {loading ? "" : `${jobs.length}+ `}roles across the energy transition.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/get-started"
              className="bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
              Create free profile
            </Link>
            <Link href="/sign-in"
              className="border border-[#dbdfe4] text-[#0f1a14] font-semibold text-sm rounded-lg px-6 py-3 hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
