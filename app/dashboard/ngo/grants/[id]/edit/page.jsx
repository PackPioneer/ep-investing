"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

const SECTORS = [
  "solar", "wind-energy", "battery-storage", "green-hydrogen", "ev-charging", "electric-vehicles",
  "carbon-credits", "direct-air-capture", "saf-efuels", "nuclear-technologies", "geothermal-energy",
  "clean-cooking", "industrial-decarbonization", "buildings-efficiency", "transmission",
  "methane", "air-quality", "water", "waste", "environmental-justice", "agriculture", "forestry",
];

const inputClass = "w-full bg-white border border-[#d0d6e0] rounded-lg px-4 py-2.5 text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors";
const labelClass = "block text-xs font-mono text-[#4a5568] uppercase tracking-wider mb-1.5";

export default function EditGrant() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/ngos/me/grants/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.grant) {
          setForm({
            ...d.grant,
            deadline_date: d.grant.deadline_date?.split("T")[0] ?? "",
            industry_tags: d.grant.industry_tags ?? [],
            amount_min_usd: d.grant.amount_min_usd ?? "",
            amount_max_usd: d.grant.amount_max_usd ?? "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleTag = (tag) => set("industry_tags",
    form.industry_tags.includes(tag)
      ? form.industry_tags.filter(t => t !== tag)
      : [...form.industry_tags, tag]
  );

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/ngos/me/grants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      router.push("/dashboard/ngo/grants");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-[#718096]">Loading...</div>;
  if (!form) return <div className="text-sm text-[#718096]">Grant not found.</div>;

  const valid = form.title && form.application_url;

  return (
    <div>
      <Link href="/dashboard/ngo/grants" className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f1a14] mb-6">
        <ArrowLeft size={14} /> All grants
      </Link>

      <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-6">Edit grant</h2>

        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title ?? ""} onChange={e => set("title", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea rows={5} className={inputClass + " resize-none"} value={form.description ?? ""} onChange={e => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Min award (USD)</label>
              <input type="number" className={inputClass} value={form.amount_min_usd} onChange={e => set("amount_min_usd", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Max award (USD)</label>
              <input type="number" className={inputClass} value={form.amount_max_usd} onChange={e => set("amount_max_usd", e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Deadline</label>
            <input type="date" className={inputClass} value={form.deadline_date} onChange={e => set("deadline_date", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Application URL *</label>
            <input className={inputClass} value={form.application_url ?? ""} onChange={e => set("application_url", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Country</label>
            <input className={inputClass} value={form.country ?? ""} onChange={e => set("country", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Eligibility</label>
            <textarea rows={3} className={inputClass + " resize-none"} value={form.eligibility ?? ""} onChange={e => set("eligibility", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Sector tags</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map(s => (
                <button type="button" key={s} onClick={() => toggleTag(s)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    form.industry_tags.includes(s)
                      ? "border-[#2d6a4f] bg-[#2d6a4f] text-white"
                      : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"
                  }`}>
                  {s.replace(/-/g, " ")}
                </button>
              ))}
            </div>
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
