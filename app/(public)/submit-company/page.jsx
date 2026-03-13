"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2, TrendingUp, Users, Handshake } from "lucide-react";

export default function SubmitCompanyPage() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [lookingToRaise, setLookingToRaise] = useState(false);
  const [isHiring, setIsHiring] = useState(false);
  const [seekingPartnerships, setSeekingPartnerships] = useState(false);
  const [status, setStatus] = useState("idle");
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
          looking_to_raise: lookingToRaise,
          is_hiring: isHiring,
          seeking_partnerships: seekingPartnerships,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(`"${data.company?.name}" has been added to our database.`);
        setUrl(""); setName(""); setDescription(""); setEmail("");
        setLookingToRaise(false); setIsHiring(false); setSeekingPartnerships(false);
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const signals = [
    {
      key: "raise",
      value: lookingToRaise,
      set: setLookingToRaise,
      icon: TrendingUp,
      label: "Looking to raise investment",
      sublabel: "We'll surface your company to investors on the platform",
      color: "blue",
    },
    {
      key: "hiring",
      value: isHiring,
      set: setIsHiring,
      icon: Users,
      label: "Currently hiring",
      sublabel: "Show a hiring badge on your company profile",
      color: "violet",
    },
    {
      key: "partnerships",
      value: seekingPartnerships,
      set: setSeekingPartnerships,
      icon: Handshake,
      label: "Open to partnerships & expansion",
      sublabel: "Signal interest in new markets, channels, or strategic partners",
      color: "amber",
    },
  ];

  const colorMap = {
    blue:   { ring: "ring-blue-500",   bg: "bg-blue-50",   icon: "text-blue-600",   check: "bg-blue-600",   border: "border-blue-200" },
    violet: { ring: "ring-violet-500", bg: "bg-violet-50", icon: "text-violet-600", check: "bg-violet-600", border: "border-violet-200" },
    amber:  { ring: "ring-amber-500",  bg: "bg-amber-50",  icon: "text-amber-600",  check: "bg-amber-600",  border: "border-amber-200" },
  };

  return (
    <div className="min-h-screen bg-[#f2f4f8] py-16 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Submit a company</h1>
          <p className="mt-3 text-slate-600">
            Know a climate or energy company that should be in our database?
            Add it here — we'll verify and publish it within 24 hours.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Company website <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://company.com" required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Company name
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Acme Energy"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Company description
              </label>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="One or two sentences about the company..." rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition resize-none"
              />
            </div>

            {/* Signal toggles */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Company signals <span className="text-slate-400 font-normal">(optional — select all that apply)</span>
              </label>
              <div className="space-y-2.5">
                {signals.map(({ key, value, set, icon: Icon, label, sublabel, color }) => {
                  const c = colorMap[color];
                  return (
                    <button
                      key={key} type="button" onClick={() => set(!value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        value ? `${c.bg} ${c.border} ring-1 ${c.ring}` : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${value ? c.bg : "bg-white border border-slate-200"}`}>
                        <Icon size={16} className={value ? c.icon : "text-slate-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${value ? "text-slate-900" : "text-slate-700"}`}>{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        value ? `${c.check} border-transparent` : "border-slate-300"
                      }`}>
                        {value && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
              />
            </div>

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

            <button
              type="submit" disabled={status === "loading" || !url.trim()}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {status === "loading" ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : "Submit company"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs text-slate-400 text-center">
          We only list companies working on climate and energy transition.
          Submissions are reviewed before publishing.
        </p>
      </div>
    </div>
  );
}
