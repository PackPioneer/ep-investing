"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Loader2, Compass, BadgeCheck, Rss, ArrowRight, Building2 } from "lucide-react";
import { INDUSTRY_LABELS } from "@/lib/industries";

export default function IndividualDashboard() {
  const { user, isLoaded } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    fetch("/api/dashboard/individual/feed")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    try {
      // lightweight: capture via posthog if present; always mark sent
      if (typeof window !== "undefined" && window.posthog) {
        window.posthog.capture("individual_feedback", { text: feedback.trim() });
      }
    } catch (e) {}
    setFeedbackSent(true);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-[70vh] bg-[#f2f4f8] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2d6a4f]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[#f2f4f8] flex items-center justify-center px-6" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        <div className="text-center">
          <p className="text-[#4a5568] mb-4">Please sign in to view your dashboard.</p>
          <a href="/sign-in" className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3">Sign in</a>
        </div>
      </div>
    );
  }

  const member = data?.member;
  const companies = data?.companies || [];
  const industries = member?.industries || [];
  const firstName = member?.name?.split(" ")[0] || user?.firstName || "there";

  return (
    <div className="min-h-screen bg-[#f2f4f8] px-6 py-10" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-3xl text-[#0f1a14] mb-2">
            Welcome back, {firstName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#4a5568]">Following:</span>
            {industries.length > 0 ? industries.map((slug) => (
              <span key={slug} className="text-xs bg-white border border-[#e2e6ed] rounded-full px-3 py-1 text-[#0f1a14]">
                {INDUSTRY_LABELS[slug] || slug}
              </span>
            )) : (
              <Link href="/onboarding/individual" className="text-xs text-[#2d6a4f] underline">Set up your industries</Link>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Link href="/search" className="flex items-center gap-3 bg-white border border-[#e2e6ed] rounded-xl p-4 hover:border-[#2d6a4f] transition-all">
            <Compass size={20} className="text-[#2d6a4f]" />
            <div>
              <div className="text-sm font-semibold text-[#0f1a14]">Explore the network</div>
              <div className="text-xs text-[#4a5568]">Browse all companies, investors & NGOs</div>
            </div>
          </Link>
          <Link href="/onboarding/expert" className="flex items-center gap-3 bg-white border border-[#e2e6ed] rounded-xl p-4 hover:border-[#2d6a4f] transition-all">
            <BadgeCheck size={20} className="text-[#2d6a4f]" />
            <div>
              <div className="text-sm font-semibold text-[#0f1a14]">List yourself as an expert</div>
              <div className="text-xs text-[#4a5568]">Get discovered by companies & investors</div>
            </div>
          </Link>
        </div>

        {/* Feed */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Rss size={18} className="text-[#2d6a4f]" />
            <h2 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-xl text-[#0f1a14]">Companies in your industries</h2>
          </div>

          {companies.length === 0 ? (
            <div className="bg-white border border-[#e2e6ed] rounded-xl p-8 text-center">
              <Building2 size={24} className="text-[#a0aec0] mx-auto mb-2" />
              <p className="text-sm text-[#4a5568]">No companies yet for your selected industries. <Link href="/onboarding/individual" className="text-[#2d6a4f] underline">Adjust your industries</Link>.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {companies.map((c) => (
                <Link key={c.id} href={`/companies/${c.slug || c.id}`}
                  className="flex items-start gap-3 bg-white border border-[#e2e6ed] rounded-xl p-4 hover:border-[#2d6a4f] transition-all">
                  <div className="w-10 h-10 rounded-lg bg-[#f2f4f8] border border-[#e2e6ed] flex items-center justify-center overflow-hidden shrink-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain"
                        onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <Building2 size={16} className="text-[#a0aec0]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0f1a14] truncate">{c.name}</div>
                    {c.description && <div className="text-xs text-[#4a5568] line-clamp-2 mt-0.5">{c.description}</div>}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(c.industry_tags || []).filter((t) => industries.includes(t)).slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] bg-[#eef4f0] text-[#2d6a4f] rounded-full px-2 py-0.5">{INDUSTRY_LABELS[t] || t}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="bg-white border border-[#e2e6ed] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#0f1a14] mb-1">What would make this more useful?</h3>
          <p className="text-xs text-[#4a5568] mb-3">We're building this for you — tell us what you'd want to see.</p>
          {feedbackSent ? (
            <p className="text-sm text-[#2d6a4f]">Thanks — we hear you.</p>
          ) : (
            <div className="flex gap-2">
              <input value={feedback} onChange={(e) => setFeedback(e.target.value)}
                placeholder="More news? Specific companies? A different view?"
                className="flex-1 text-sm border border-[#d0d6e0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#2d6a4f]" />
              <button onClick={sendFeedback}
                className="inline-flex items-center gap-1 bg-[#2d6a4f] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#235a40]">
                Send <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}