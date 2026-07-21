"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, ArrowRight } from "lucide-react";

const INDUSTRY_TAGS = [
  "battery_storage", "carbon_credits", "clean_cooking", "consultancy", "circular_economy",  "direct_air_capture",
  "electric_aviation", "ev_charging", "geothermal_energy", "green_hydrogen",
  "grid_storage", "industrial_decarbonization", "nuclear_technologies",
  "saf_efuels", "solar", "wind_energy", "energy_generation", "energy_efficiency",
];

const FUNDING_STAGES = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C" },
  { value: "growth", label: "Growth" },
  { value: "public", label: "Public" },
];

export default function AdminAddCompany() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // Optional detail fields
  const [foundingYear, setFoundingYear] = useState("");
  const [hqCity, setHqCity] = useState("");
  const [hqCountry, setHqCountry] = useState("");
  const [fundingStage, setFundingStage] = useState("");
  const [tagline, setTagline] = useState("");
  const [industryTags, setIndustryTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim() || !name.trim()) {
      toast.error("URL and name are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/add-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          name: name.trim(),
          description: description.trim(),
          founding_year: foundingYear ? parseInt(foundingYear) : null,
          headquarters_city: hqCity.trim() || null,
          headquarters_country: hqCountry.trim() || null,
          funding_stage: fundingStage || null,
          tagline: tagline.trim() || null,
          industry_tags: industryTags.length > 0 ? industryTags : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create");
        setSubmitting(false);
        return;
      }
      toast.success(`Created: ${data.name}`);
      router.push(`/companies/${data.id}`);
    } catch (e) {
      toast.error(e.message || "Network error");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-2">
        <Plus size={20} className="text-emerald-600" />
        <h1 className="text-2xl font-semibold text-slate-900">Add company</h1>
      </div>
      <p className="text-sm text-slate-500 mb-8">
        Paste a URL and name. The system will scrape the page, fetch a logo, and classify sector tags. Takes ~15 seconds. The new company will be claimable — share the profile link with the prospect.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">URL *</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://acme.com"
            disabled={submitting}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Company name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Acme Energy"
            disabled={submitting}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Description (optional)</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 500))}
            placeholder="Leave blank to auto-scrape from the website"
            disabled={submitting}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors resize-none disabled:bg-slate-50"
          />
          <p className="text-[11px] text-slate-400 mt-1">If blank, the og:description from the page will be used.</p>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Details (optional)</div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="One-line pitch, e.g. Affordable batteries for the grid"
              disabled={submitting}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Founding year</label>
              <input
                type="number"
                value={foundingYear}
                onChange={e => setFoundingYear(e.target.value)}
                placeholder="e.g. 2019"
                min="1900"
                max="2030"
                disabled={submitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Funding stage</label>
              <select
                value={fundingStage}
                onChange={e => setFundingStage(e.target.value)}
                disabled={submitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50">
                <option value="">Unknown</option>
                {FUNDING_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">HQ city</label>
              <input
                type="text"
                value={hqCity}
                onChange={e => setHqCity(e.target.value)}
                placeholder="e.g. San Francisco"
                disabled={submitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">HQ country</label>
              <input
                type="text"
                value={hqCountry}
                onChange={e => setHqCountry(e.target.value)}
                placeholder="e.g. United States"
                disabled={submitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Industry tags</label>
            <div className="flex flex-wrap gap-1.5">
              {INDUSTRY_TAGS.map(tag => {
                const active = industryTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setIndustryTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                    disabled={submitting}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    } disabled:opacity-40`}>
                    {tag.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Click to add or remove. Picking tags here skips AI classification.</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !url.trim() || !name.trim()}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold text-sm rounded-lg py-3 hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {submitting ? "Creating… (this takes ~15s)" : <>Create company <ArrowRight size={14} /></>}
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          On success, you'll be redirected to the public profile so you can copy the link.
        </p>
      </div>
    </div>
  );
}
