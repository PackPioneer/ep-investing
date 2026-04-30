"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Fellowship", "Volunteer"];
const SECTORS = [
  "solar", "wind-energy", "battery-storage", "green-hydrogen", "ev-charging", "electric-vehicles",
  "carbon-credits", "direct-air-capture", "saf-efuels", "nuclear-technologies", "geothermal-energy",
  "clean-cooking", "industrial-decarbonization", "buildings-efficiency", "transmission",
  "methane", "air-quality", "water", "waste", "environmental-justice", "agriculture", "forestry",
];

const inputClass = "w-full bg-white border border-[#d0d6e0] rounded-lg px-4 py-2.5 text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors";
const labelClass = "block text-xs font-mono text-[#4a5568] uppercase tracking-wider mb-1.5";

export default function EditJob() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/ngos/me/jobs/${id}`)
      .then(r => r.json())
      .then(d => { setForm(d.job); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ngos/me/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/dashboard/ngo/jobs");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-[#718096]">Loading...</div>;
  if (!form) return <div className="text-sm text-[#718096]">Job not found.</div>;

  const valid = form.title && form.apply_url;

  return (
    <div>
      <Link href="/dashboard/ngo/jobs" className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f1a14] mb-6">
        <ArrowLeft size={14} /> All jobs
      </Link>

      <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-6">Edit job</h2>

        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title ?? ""} onChange={e => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={form.location ?? ""} onChange={e => set("location", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select className={inputClass} value={form.type ?? ""} onChange={e => set("type", e.target.value)}>
                <option value="">—</option>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Sector</label>
            <select className={inputClass} value={form.sector ?? ""} onChange={e => set("sector", e.target.value)}>
              <option value="">—</option>
              {SECTORS.map(s => <option key={s} value={s}>{s.replace(/-/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea rows={6} className={inputClass + " resize-none"} value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Apply URL *</label>
            <input className={inputClass} value={form.apply_url ?? ""} onChange={e => set("apply_url", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Contact email</label>
            <input type="email" className={inputClass} value={form.contact_email ?? ""} onChange={e => set("contact_email", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select className={inputClass} value={form.status ?? "active"} onChange={e => set("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex justify-end pt-3 border-t border-[#e2e6ed]">
            <button onClick={handleSave} disabled={!valid || saving}
              className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-40 transition-colors">
              <Save size={13} /> {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
