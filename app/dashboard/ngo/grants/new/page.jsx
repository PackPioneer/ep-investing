"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewGrant() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "",
    amount_min_usd: "", amount_max_usd: "", currency: "USD",
    deadline_date: "",
    application_url: "",
    country: "",
    industry_tags: [],
    eligibility: "",
  });

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
      const res = await fetch("/api/ngos/me/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      router.push("/dashboard/ngo/grants");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const valid = form.title && form.application_url;

  return (
    <div>
      <Link href="/dashboard/ngo/grants" className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f1a14] mb-6">
        <ArrowLeft size={14} /> All grants
      </Link>

      <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-6">New grant program</h2>

        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Title *</label>
            <input className={inputClass} value={form.title} onChange={e => set("title", e.target.value)}
              placeholder="e.g. 2026 Climate Justice Innovation Awards" />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea rows={5} className={inputClass + " resize-none"} value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="What is this grant for? Who is eligible? What problem does it solve?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Min award (USD)</label>
              <input type="number" className={inputClass} value={form.amount_min_usd} onChange={e => set("amount_min_usd", e.target.value)} placeholder="50000" />
            </div>
            <div>
              <label className={labelClass}>Max award (USD)</label>
              <input type="number" className={inputClass} value={form.amount_max_usd} onChange={e => set("amount_max_usd", e.target.value)} placeholder="500000" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Application deadline</label>
            <input type="date" className={inputClass} value={form.deadline_date} onChange={e => set("deadline_date", e.target.value)} />
          </div>

          <div>
            <label className={labelClass}>Application URL *</label>
            <input className={inputClass} value={form.application_url} onChange={e => set("application_url", e.target.value)}
              placeholder="https://yourorg.org/apply" />
          </div>

          <div>
            <label className={labelClass}>Country / region</label>
            <input className={inputClass} value={form.country} onChange={e => set("country", e.target.value)}
              placeholder="Global, United States, Sub-Saharan Africa, etc." />
          </div>

          <div>
            <label className={labelClass}>Eligibility (brief)</label>
            <textarea rows={3} className={inputClass + " resize-none"} value={form.eligibility} onChange={e => set("eligibility", e.target.value)}
              placeholder="Who can apply? Companies, individuals, non-profits, etc." />
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

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end pt-3 border-t border-[#e2e6ed]">
            <button onClick={handleSave} disabled={!valid || saving}
              className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-40 transition-colors">
              <Save size={13} /> {saving ? "Publishing..." : "Publish grant"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
