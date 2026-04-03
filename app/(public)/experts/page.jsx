"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ExpertsPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14] flex items-center justify-center px-6" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-lg text-center">
        <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" /> Launching April 15
        </div>
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#0f1a14] mb-4">
          Expert network coming soon
        </h1>
        <p className="text-[#4a5568] text-sm leading-relaxed font-light mb-8">
          We're curating a vetted network of climate and energy specialists — available for consulting, advisory, and fractional roles. Join the waitlist to get early access.
        </p>
        <Link href="/onboarding/expert"
          className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors">
          Apply to join <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}