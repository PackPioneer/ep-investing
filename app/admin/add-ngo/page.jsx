"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, ArrowRight } from "lucide-react";

const SECTOR_OPTIONS = [
  "agriculture", "air-quality", "buildings-efficiency", "carbon-credits",
  "clean-cooking", "clean-heat", "direct-air-capture", "disclosure",
  "electric-vehicles", "environmental-justice", "forestry", "geothermal-energy",
  "green-hydrogen", "industrial-decarbonization", "methane", "nuclear-technologies",
  "permitting", "saf-efuels", "solar", "transmission", "water", "wind-energy",
];

const GRANTS_BUDGET_OPTIONS = ["< 1M", "1-10M", "10-100M", "100M+"];

// Parse human shorthand like "4B" or "500M" into a raw number.
function parseEndowment(input) {
  if (!input || !input.trim()) return null;
  const s = input.trim().toUpperCase().replace(/[$,\s]/g, "");
  const match = s.match(/^([0-9.]+)([KMB]?)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const suffix = match[2];
  const multiplier = suffix === "B" ? 1e9 : suffix === "M" ? 1e6 : suffix === "K" ? 1e3 : 1;
  return Math.round(num * multiplier);
}

export default function AdminAddNGO() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
  // Optional detail fields
  const [foundedYear, setFoundedYear] = useState("");
  const [hqCity, setHqCity] = useState("");
  const [hqCountry, setHqCountry] = useState("");
  const [endowment, setEndowment] = useState("");
  const [grantsBudget, setGrantsBudget] = useState("");
  const [sectorTags, setSectorTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !websiteUrl.trim()) {
      toast.error("Name and website URL are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/add-ngo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website_url: websiteUrl.trim(),
          description: description.trim(),
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          headquarters_city: hqCity.trim() || null,
          headquarters_country: hqCountry.trim() || null,
          total_endowment_usd: parseEndowment(endowment),
          annual_grants_budget_usd_range: grantsBudget || null,
          sector_tags: sectorTags.length > 0 ? sectorTags : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create");
        setSubmitting(false);
        return;
      }
      toast.success(`Created: ${data.name}`);
      router.push(`/ngos/${data.slug}`);
    } catch (e) {
      toast.error(e.message || "Network error");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-2">
        <Plus size={20} className="text-emerald-600" />
        <h1 className="text-2xl font-semibold text-slate-900">Add NGO</h1>
      </div>
      <p className="text-sm text-slate-500 mb-8">
        Paste a website URL and name. The system will scrape a description and logo. Takes ~5 seconds. The new NGO will be claimable — share the profile link with the prospect.
      </p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">NGO name *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Climate Action Network"
            disabled={submitting}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Website URL *</label>
          <input
            type="text"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="https://climateaction.org"
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
          <p className="text-[11px] text-slate-400 mt-1">If blank, the og:description from the website will be used.</p>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Details (optional)</div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Founded year</label>
              <input
                type="number"
                value={foundedYear}
                onChange={e => setFoundedYear(e.target.value)}
                placeholder="e.g. 1924"
                min="1700"
                max="2030"
                disabled={submitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Annual grants budget</label>
              <select
                value={grantsBudget}
                onChange={e => setGrantsBudget(e.target.value)}
                disabled={submitting}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50">
                <option value="">Unknown</option>
                {GRANTS_BUDGET_OPTIONS.map(opt => <option key={opt} value={opt}>${opt}</option>)}
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
                placeholder="e.g. Detroit"
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
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Total endowment (USD)</label>
            <input
              type="text"
              value={endowment}
              onChange={e => setEndowment(e.target.value)}
              placeholder="e.g. 4B, 500M, or 4000000000"
              disabled={submitting}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors disabled:bg-slate-50"
            />
            <p className="text-[11px] text-slate-400 mt-1">Accepts shorthand (4B, 500M, 25K) or raw number.</p>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Sector focus</label>
            <div className="flex flex-wrap gap-1.5">
              {SECTOR_OPTIONS.map(tag => {
                const active = sectorTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSectorTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                    disabled={submitting}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    } disabled:opacity-40`}>
                    {tag.replace(/-/g, " ")}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">Click to add or remove. Pick all that apply.</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || !websiteUrl.trim()}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold text-sm rounded-lg py-3 hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          {submitting ? "Creating… (this takes ~5s)" : <>Create NGO <ArrowRight size={14} /></>}
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          On success, you'll be redirected to the public profile so you can copy the link.
        </p>
      </div>
    </div>
  );
}
