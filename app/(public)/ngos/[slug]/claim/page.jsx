"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle, Lock } from "lucide-react";

const inputClass = "w-full bg-white border border-[#d0d6e0] rounded-lg px-4 py-3 text-sm text-[#0f1a14] placeholder-[#a0aec0] outline-none focus:border-[#2d6a4f] transition-colors";
const labelClass = "block text-xs font-mono text-[#4a5568] uppercase tracking-wider mb-1.5";

export default function ClaimNGO() {
  const { slug } = useParams();
  const { isSignedIn, isLoaded, user } = useUser();
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    claimant_name: "",
    claimant_email: "",
    claimant_role: "",
    message: "",
  });

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/ngos/${slug}`)
      .then(r => r.json())
      .then(data => { setNgo(data.ngo); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Pre-fill name and email from Clerk if available
  useEffect(() => {
    if (isSignedIn && user) {
      const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      setForm(f => ({
        ...f,
        claimant_name: f.claimant_name || fullName,
        claimant_email: f.claimant_email || email,
      }));
    }
  }, [isSignedIn, user]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/ngos/${slug}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !isLoaded) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!ngo) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center text-[#4a5568]">
      Organization not found.
    </div>
  );

  if (!ngo.claimable || ngo.clerk_user_id) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-md text-center">
        <AlertCircle size={32} className="text-amber-500 mx-auto mb-4" />
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-2">Already claimed</h2>
        <p className="text-sm text-[#4a5568] mb-6">
          This profile has already been claimed. If you believe this is in error, please contact us.
        </p>
        <Link href={`/ngos/${slug}`} className="text-sm text-[#2d6a4f] hover:underline">
          ← Back to profile
        </Link>
      </div>
    </div>
  );

  if (!isSignedIn) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-md text-center">
        <Lock size={32} className="text-[#2d6a4f] mx-auto mb-4" />
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-2">Sign in to claim</h2>
        <p className="text-sm text-[#4a5568] mb-6">
          To claim <strong>{ngo.name}</strong>, sign in with your work email at the organization's domain.
        </p>
        <SignInButton mode="modal" forceRedirectUrl={`/ngos/${slug}/claim`}>
          <button className="bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors flex items-center gap-2 mx-auto">
            Sign in <ArrowRight size={14} />
          </button>
        </SignInButton>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.1)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#2d6a4f]" />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">Claim submitted</h2>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-8">
          Your claim for <strong>{ngo.name}</strong> is under review. We'll follow up within a few business days.
        </p>
        <Link href={`/ngos/${slug}`} className="inline-flex items-center gap-2 text-sm text-[#2d6a4f] hover:underline">
          ← Back to profile
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">

        <Link href={`/ngos/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f1a14] transition-colors mb-8">
          <ArrowLeft size={14} /> Back to {ngo.name}
        </Link>

        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-2">
          Claim {ngo.name}
        </h1>
        <p className="text-sm text-[#4a5568] mb-8">
          Submit a claim to take ownership of this profile. We'll verify your association with the organization before approving.
        </p>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 flex flex-col gap-5">
          <div>
            <label className={labelClass}>Your name *</label>
            <input className={inputClass} value={form.claimant_name}
              onChange={e => setForm({...form, claimant_name: e.target.value})}
              placeholder="Jane Smith" />
          </div>

          <div>
            <label className={labelClass}>Work email *</label>
            <input className={inputClass} type="email" value={form.claimant_email}
              onChange={e => setForm({...form, claimant_email: e.target.value})}
              placeholder={`you@${ngo.website_url ? new URL(ngo.website_url.startsWith("http") ? ngo.website_url : `https://${ngo.website_url}`).hostname.replace(/^www\./, "") : "yourorg.org"}`} />
            <p className="text-[10px] text-[#a0aec0] mt-1">
              Use an email at your organization's domain for fastest verification.
            </p>
          </div>

          <div>
            <label className={labelClass}>Your role</label>
            <input className={inputClass} value={form.claimant_role}
              onChange={e => setForm({...form, claimant_role: e.target.value})}
              placeholder="e.g. Communications Director" />
          </div>

          <div>
            <label className={labelClass}>Why you should manage this profile</label>
            <textarea rows={4} className={inputClass + " resize-none"} value={form.message}
              onChange={e => setForm({...form, message: e.target.value.slice(0, 1000)})}
              placeholder="Briefly explain your role at the organization and why you should be the profile owner."
              maxLength={1000} />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button onClick={handleSubmit}
            disabled={!form.claimant_name || !form.claimant_email || submitting}
            className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 ml-auto">
            {submitting ? "Submitting..." : "Submit claim"} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
