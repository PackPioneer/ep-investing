"use client";

import { useState } from "react";

const CATS = [
  { id: "feature", label: "Request a feature" },
  { id: "company", label: "Suggest a company" },
  { id: "feedback", label: "General feedback" },
];

export default function FeedbackLink({ className = "hover:text-[#2d6a4f] transition-colors text-left" }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("feature");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!details.trim()) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, details, email, page: typeof window !== "undefined" ? window.location.pathname : null }),
      });
      setSent(true); setDetails("");
    } catch (e) {}
    setSending(false);
  };

  return (
    <>
      <button onClick={() => { setOpen(true); setSent(false); }} className={className}>Feedback</button>
      {open && (
        <div onClick={() => setOpen(false)} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl border border-[#e8eaee] p-6">
            <div className="flex items-start justify-between mb-1">
              <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl font-bold text-[#0f1a14]">Share feedback</h2>
              <button onClick={() => setOpen(false)} className="text-[#a0aec0] hover:text-[#4a5568] text-lg leading-none">✕</button>
            </div>
            {sent ? (
              <div className="bg-[#eef4f0] border border-[#c9e0d3] rounded-xl p-4 mt-3">
                <span className="text-sm text-[#2d6a4f] font-medium">Thanks — we've got it.</span>
                <button onClick={() => setSent(false)} className="text-xs text-[#2d6a4f] underline ml-2">Send another</button>
              </div>
            ) : (
              <div className="space-y-4 mt-3">
                <div className="flex flex-wrap gap-1.5">
                  {CATS.map((c) => (
                    <button key={c.id} onClick={() => setCat(c.id)}
                      className={`text-xs rounded-full px-3 py-1.5 border transition-all ${cat === c.id ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#0f1a14] border-[#dbdfe4] hover:border-[#2d6a4f]"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4}
                  placeholder={cat === "company" ? "Which company should we add? Include a website if you have it." : cat === "feature" ? "What would make EP Network more useful?" : "What's on your mind?"}
                  className="w-full text-sm border border-[#dbdfe4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional, if you'd like a reply)" className="w-full text-sm border border-[#dbdfe4] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
                <button onClick={submit} disabled={sending || !details.trim()} className="bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-[#235a40] disabled:opacity-40">{sending ? "Sending…" : "Send"}</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
