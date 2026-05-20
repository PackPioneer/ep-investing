"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, Globe, Building2, AlertCircle } from "lucide-react";

export default function ClaimProfilePage() {
  const params = useParams();
  const { type, id } = params;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    claimant_name: "",
    claimant_email: "",
    claimant_role: "",
    claimant_linkedin_url: "",
    terms_agreed: false,
  });

  useEffect(() => {
    const endpoint = type === "company" ? `/api/companies/${id}` : `/api/investors/${id}`;
    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        if (!data || data.message === "Company not found" || data.message === "Investor not found") {
          setError("Profile not found.");
        } else if (data.claimed_by_clerk_user_id) {
          setError("This profile has already been claimed.");
        } else {
          setProfile(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load profile.");
        setLoading(false);
      });
  }, [type, id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_type: type,
          target_id: id,
          target_name: profile?.name,
          claimant_name: form.claimant_name,
          claimant_email: form.claimant_email,
          claimant_role: form.claimant_role,
          claimant_linkedin_url: form.claimant_linkedin_url,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError("Submission failed. Please try again.");
      }
    } catch {
      setError("Submission failed. Please try again.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center"
        style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        <div className="text-sm text-[#718096]">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
        style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-amber-600" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-2xl text-[#0f1a14] mb-3">Can't claim this</h1>
          <p className="text-[#4a5568] text-sm leading-relaxed mb-6">{error}</p>
          <Link href="/" className="text-sm text-[#2d6a4f] underline">Back to home</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
        style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-[#2d6a4f]" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-3xl text-[#0f1a14] mb-3">Claim submitted</h1>
          <p className="text-[#4a5568] text-sm leading-relaxed mb-6">
            Thanks. We'll review your claim for <strong>{profile.name}</strong> within 24 hours and email you at <strong>{form.claimant_email}</strong>.
          </p>
          <Link href="/" className="text-sm text-[#2d6a4f] underline">Back to home</Link>
        </div>
      </div>
    );
  }

  const profileUrl = type === "company" ? `/companies/${id}` : `/investors/${id}`;
  const profileLabel = type === "company" ? "company" : "investment firm";

  return (
    <div className="min-h-screen bg-[#f2f4f8] py-12 px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-xl mx-auto">

        <Link href={profileUrl} className="inline-flex items-center gap-1.5 text-xs text-[#718096] hover:text-[#0f1a14] mb-4 transition-colors">
          <ArrowLeft size={12} /> Back to profile
        </Link>

        <div className="mb-6">
          <h1 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-3xl text-[#0f1a14] mb-2">
            Claim {profile.name}
          </h1>
          <p className="text-sm text-[#4a5568] leading-relaxed">
            Confirm this is the right {profileLabel} and we'll grant you access to edit the profile, post updates, and connect with our network.
          </p>
        </div>

        {/* PROFILE PREVIEW */}
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 mb-6">
          <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-3">You're claiming</div>
          <div className="flex items-start gap-4">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt="" className="w-14 h-14 rounded-lg border border-[#e2e6ed] object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#eef1f6] border border-[#e2e6ed] flex items-center justify-center text-[#2d6a4f] flex-shrink-0">
                <Building2 size={20} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-[#0f1a14]">{profile.name}</div>
              {profile.url && (
                <a href={profile.url.startsWith("http") ? profile.url : `https://${profile.url}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#4a5568] hover:text-[#2d6a4f] mt-0.5">
                  <Globe size={11} /> {profile.url.replace(/https?:\/\//, "")}
                </a>
              )}
              {profile.website && !profile.url && (
                <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#4a5568] hover:text-[#2d6a4f] mt-0.5">
                  <Globe size={11} /> {profile.website.replace(/https?:\/\//, "")}
                </a>
              )}
              {profile.description && (
                <p className="text-xs text-[#4a5568] mt-2 leading-relaxed line-clamp-3">{profile.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* CLAIM FORM */}
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
          <div className="text-xs font-mono font-semibold text-[#2d6a4f] uppercase tracking-wide mb-4">About you</div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Your name *</label>
              <input value={form.claimant_name} onChange={e => setForm(p => ({ ...p, claimant_name: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
            </div>

            <div>
              <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Work email *</label>
              <input type="email" placeholder={`name@${profile.url?.replace(/https?:\/\//, "").replace(/\/$/, "") || "yourcompany.com"}`} value={form.claimant_email} onChange={e => setForm(p => ({ ...p, claimant_email: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              <p className="text-[11px] text-[#718096] mt-1.5">Use an email at this {profileLabel}'s domain to speed up verification.</p>
            </div>

            <div>
              <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Your role *</label>
              <input placeholder={type === "company" ? "e.g. CEO, Head of Marketing, Founder" : "e.g. Partner, Principal, Analyst"} value={form.claimant_role} onChange={e => setForm(p => ({ ...p, claimant_role: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
            </div>

            <div>
              <label className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1.5 block">Your LinkedIn URL *</label>
              <input type="url" placeholder="https://linkedin.com/in/yourname" value={form.claimant_linkedin_url} onChange={e => setForm(p => ({ ...p, claimant_linkedin_url: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-[#d0d6e0] bg-white focus:outline-none focus:border-[#2d6a4f]" />
              <p className="text-[11px] text-[#718096] mt-1.5">Helps us confirm you're with this organization.</p>
            </div>

            <label className="flex items-start gap-2.5 mt-2 text-xs text-[#4a5568] leading-relaxed">
              <input type="checkbox" checked={form.terms_agreed} onChange={e => setForm(p => ({ ...p, terms_agreed: e.target.checked }))}
                className="w-4 h-4 mt-0.5 accent-[#2d6a4f] flex-shrink-0" />
              <span>I confirm I'm authorized to represent this {profileLabel} and I agree to the <a href="/terms-and-conditions" target="_blank" className="text-[#2d6a4f] underline">Terms of Service</a> and <a href="/privacy-policy" target="_blank" className="text-[#2d6a4f] underline">Privacy Policy</a>.</span>
            </label>

            <button onClick={handleSubmit}
              disabled={submitting || !form.claimant_name || !form.claimant_email || !form.claimant_role || !form.claimant_linkedin_url || !form.terms_agreed}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Submitting..." : "Submit claim request"}
              {!submitting && <ArrowRight size={14} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
