"use client";

import { useState, useEffect, useRef } from "react";
import { Save, CheckCircle } from "lucide-react";

const SECTORS = [
  "solar", "wind-energy", "battery-storage", "grid-storage", "green-hydrogen",
  "ev-charging", "electric-vehicles", "carbon-credits", "direct-air-capture",
  "saf-efuels", "nuclear-technologies", "geothermal-energy", "clean-cooking",
  "industrial-decarbonization", "buildings-efficiency", "transmission",
  "methane", "air-quality", "water", "waste", "permitting",
  "environmental-justice", "agriculture", "forestry",
];

const STAFF_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const BUDGET_RANGES = ["<1M", "1-10M", "10-100M", "100M+"];

const inputClass = "w-full bg-white border border-[#d0d6e0] rounded-lg px-4 py-2.5 text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors";
const labelClass = "block text-xs font-mono text-[#4a5568] uppercase tracking-wider mb-1.5";

export default function NGOProfileEditor() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    fetch("/api/ngos/me")
      .then(r => r.json())
      .then(data => {
        if (data.ngo) {
          setForm({
            ...data.ngo,
            geography_focus_input: (data.ngo.geography_focus ?? []).join(", "),
            sector_tags: data.ngo.sector_tags ?? [],
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]
  }));

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const geography_focus = form.geography_focus_input
        .split(",").map(s => s.trim()).filter(Boolean);

      const payload = { ...form, geography_focus };
      delete payload.geography_focus_input;
      delete payload.id;
      delete payload.slug;
      delete payload.clerk_user_id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.status;
      delete payload.verified;
      delete payload.claimable;

      const res = await fetch("/api/ngos/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      // Scroll to top so the success banner is visible
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setError(e.message);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-[#718096]">Loading...</div>;
  if (!form) return <div className="text-sm text-[#718096]">No profile found.</div>;

  return (
    <div ref={topRef} className="bg-white border border-[#e2e6ed] rounded-2xl p-7">

      {/* Saved banner */}
      {saved && (
        <div className="mb-5 p-3 bg-[rgba(45,106,79,0.08)] border border-[#c8d8cc] rounded-lg flex items-center gap-2.5 text-[#2d6a4f] text-sm font-semibold">
          <CheckCircle size={16} />
          Profile changes saved
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">Edit profile</h2>
      </div>

      <div className="flex flex-col gap-5">

        <div>
          <label className={labelClass}>Organization name *</label>
          <input className={inputClass} value={form.name ?? ""} onChange={e => set("name", e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Website URL</label>
          <input className={inputClass} value={form.website_url ?? ""} onChange={e => set("website_url", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>HQ City</label>
            <input className={inputClass} value={form.headquarters_city ?? ""} onChange={e => set("headquarters_city", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>HQ Country</label>
            <input className={inputClass} value={form.headquarters_country ?? ""} onChange={e => set("headquarters_country", e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelClass}>One-line description</label>
          <input className={inputClass} value={form.short_description ?? ""} onChange={e => set("short_description", e.target.value.slice(0, 200))} maxLength={200} />
          <p className="text-[10px] text-[#a0aec0] mt-1">{(form.short_description ?? "").length}/200</p>
        </div>

        <div>
          <label className={labelClass}>Mission statement</label>
          <textarea rows={5} className={inputClass + " resize-none"} value={form.bio ?? ""} onChange={e => set("bio", e.target.value.slice(0, 1500))} maxLength={1500} />
          <p className="text-[10px] text-[#a0aec0] mt-1">{(form.bio ?? "").length}/1500</p>
        </div>

        <div>
          <label className={labelClass}>Sectors of focus</label>
          <div className="flex flex-wrap gap-1.5">
            {SECTORS.map(s => (
              <button type="button" key={s} onClick={() => toggleArr("sector_tags", s)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  form.sector_tags.includes(s)
                    ? "border-[#2d6a4f] bg-[#2d6a4f] text-white"
                    : "border-[#e2e6ed] text-[#4a5568] hover:border-[#2d6a4f]"
                }`}>
                {s.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Geographic focus</label>
          <input className={inputClass} value={form.geography_focus_input} onChange={e => set("geography_focus_input", e.target.value)}
            placeholder="United States, India, Sub-Saharan Africa (comma-separated)" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Staff size</label>
            <select className={inputClass} value={form.staff_size ?? ""} onChange={e => set("staff_size", e.target.value || null)}>
              <option value="">—</option>
              {STAFF_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Annual grants budget</label>
            <select className={inputClass} value={form.annual_grants_budget_usd_range ?? ""} onChange={e => set("annual_grants_budget_usd_range", e.target.value || null)}>
              <option value="">—</option>
              {BUDGET_RANGES.map(b => <option key={b} value={b}>${b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Founded year</label>
          <input type="number" className={inputClass} value={form.founded_year ?? ""} onChange={e => set("founded_year", e.target.value ? parseInt(e.target.value, 10) : null)} />
        </div>

        <div className="border-t border-[#e2e6ed] pt-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1" checked={!!form.open_to_partnerships}
              onChange={e => set("open_to_partnerships", e.target.checked)} />
            <div>
              <div className="text-sm font-semibold text-[#0f1a14]">Open to international partnerships</div>
              <div className="text-xs text-[#718096] mt-0.5">Get a partnership badge on your profile.</div>
            </div>
          </label>
        </div>

        {form.open_to_partnerships && (
          <div>
            <label className={labelClass}>Partnership description</label>
            <textarea rows={3} className={inputClass + " resize-none"} value={form.partnership_description ?? ""}
              onChange={e => set("partnership_description", e.target.value.slice(0, 500))} maxLength={500}
              placeholder="What kind of partnerships are you looking for?" />
          </div>
        )}

        <div>
          <label className={labelClass}>Contact email (visible to signed-in users only)</label>
          <input type="email" className={inputClass} value={form.contact_email ?? ""} onChange={e => set("contact_email", e.target.value)} />
        </div>

        <div className="flex justify-end pt-3 border-t border-[#e2e6ed]">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#235a40] disabled:opacity-40 transition-colors">
            <Save size={13} /> {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
