"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import posthog from "posthog-js";
import { INDUSTRIES, MAX_INDUSTRIES } from "@/lib/industries";
import { ROLES } from "@/lib/roles";
import { INTENTS } from "@/lib/intents";

function ProgressBar({ step }) {
  const steps = ["You", "Industries", "Goal"];
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
              i + 1 < step ? "bg-[#2d6a4f] border-[#2d6a4f] text-white" :
              i + 1 === step ? "bg-white border-[#2d6a4f] text-[#2d6a4f]" :
              "bg-white border-[#d0d6e0] text-[#a0aec0]"
            }`}>
              {i + 1 < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-[10px] font-mono ${i + 1 === step ? "text-[#2d6a4f]" : "text-[#a0aec0]"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-4 transition-all ${i + 1 < step ? "bg-[#2d6a4f]" : "bg-[#e2e6ed]"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

const cardBtn = (active) =>
  `w-full text-left bg-white border rounded-xl p-4 transition-all ${
    active ? "border-[#2d6a4f] ring-1 ring-[#2d6a4f]" : "border-[#e2e6ed] hover:border-[#2d6a4f]"
  }`;

export default function IndividualOnboarding() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [intent, setIntent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggleIndustry = (slug) => {
    setIndustries((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_INDUSTRIES) return prev; // cap
      return [...prev, slug];
    });
  };

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/onboarding/individual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.fullName || null,
          email: user?.primaryEmailAddress?.emailAddress,
          clerk_user_id: user?.id,
          role, industries, intent,
          terms_agreed_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Something went wrong");
      }
      posthog.capture("individual_onboarded", { role, intent, industry_count: industries.length });
      router.push("/dashboard/individual");
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#2d6a4f]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        <div className="max-w-md w-full text-center">
          <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-3xl text-[#0f1a14] mb-3">Join EP Network</h1>
          <p className="text-[#4a5568] text-sm mb-6">Create a free account to set up your personalized feed.</p>
          <a href="/sign-up?redirect_url=/onboarding/individual" className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors">
            Sign up free <ArrowRight size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6 py-12" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-lg w-full">
        <ProgressBar step={step} />

        {/* Step 1 — Role */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-3xl text-[#0f1a14] mb-2">What best describes you?</h1>
              <p className="text-[#4a5568] text-sm">This helps us tailor what you see.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => (
                <button key={r.slug} onClick={() => setRole(r.slug)} className={cardBtn(role === r.slug)}>
                  <span className="text-sm font-semibold text-[#0f1a14]">{r.label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-8">
              <button disabled={!role} onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors disabled:opacity-40">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Industries */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-3xl text-[#0f1a14] mb-2">Which industries do you follow?</h1>
              <p className="text-[#4a5568] text-sm">Pick up to {MAX_INDUSTRIES}. Your feed is built from these.</p>
              <p className="text-xs font-mono text-[#2d6a4f] mt-2">{industries.length} / {MAX_INDUSTRIES} selected</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {INDUSTRIES.map((ind) => {
                const active = industries.includes(ind.slug);
                const disabled = !active && industries.length >= MAX_INDUSTRIES;
                return (
                  <button key={ind.slug} onClick={() => toggleIndustry(ind.slug)} disabled={disabled}
                    className={`text-sm rounded-full px-4 py-2 border transition-all ${
                      active ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" :
                      disabled ? "bg-white text-[#c0c6d0] border-[#e2e6ed] cursor-not-allowed" :
                      "bg-white text-[#0f1a14] border-[#d0d6e0] hover:border-[#2d6a4f]"
                    }`}>
                    {ind.label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 text-[#4a5568] font-semibold text-sm px-4 py-3 hover:text-[#0f1a14]">
                <ArrowLeft size={16} /> Back
              </button>
              <button disabled={industries.length === 0} onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors disabled:opacity-40">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Intent */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-3xl text-[#0f1a14] mb-2">What are you here to do?</h1>
              <p className="text-[#4a5568] text-sm">Last one — this shapes what we build for you.</p>
            </div>
            <div className="flex flex-col gap-3">
              {INTENTS.map((it) => (
                <button key={it.slug} onClick={() => setIntent(it.slug)} className={cardBtn(intent === it.slug)}>
                  <span className="text-sm font-semibold text-[#0f1a14]">{it.label}</span>
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-red-600 mt-4 text-center">{error}</p>}
            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 text-[#4a5568] font-semibold text-sm px-4 py-3 hover:text-[#0f1a14]">
                <ArrowLeft size={16} /> Back
              </button>
              <button disabled={!intent || busy} onClick={submit}
                className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors disabled:opacity-40">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <>Finish <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}