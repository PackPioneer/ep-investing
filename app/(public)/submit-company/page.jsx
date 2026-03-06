"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function SubmitCompanyPage() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/submit-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          submitter_email: email.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(`"${data.company?.name}" has been added to our database.`);
        setUrl(""); setName(""); setDescription(""); setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f2f4f8] py-16 px-4">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Submit a company
          </h1>
          <p className="mt-3 text-slate-600">
            Know a climate or energy company that should be in our database?
            Add it here — we'll verify and publish it within 24 hours.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* URL — required */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Company website <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://company.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
            </div>

            {/* Name — optional */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Company name <span className="text-slate-400 font-normal">(optional — we'll detect it)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Acme Energy"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
            </div>

            {/* Description — optional */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                What do they do? <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="One or two sentences about the company..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition resize-none"
              />
            </div>

            {/* Email — optional */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your email <span className="text-slate-400 font-normal">(optional — we'll notify you when it's live)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
            </div>

            {/* Status messages */}
            {status === "success" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "loading" || !url.trim()}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : "Submit company"}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-xs text-slate-400 text-center">
          We only list companies working on climate and energy transition.
          Submissions are reviewed before publishing.
        </p>
      </div>
    </div>
  );
}
