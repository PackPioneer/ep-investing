"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, ArrowRight } from "lucide-react";

export default function AdminAddNGO() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");
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
