"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";

const PLAN_LABELS = {
  researcher: { name: "Researcher", price: "$9/month", date: "July 15, 2025" },
  expert: { name: "Expert", price: "$49/month", date: "July 15, 2025" },
  company: { name: "Company", price: "$99/month", date: "July 15, 2025" },
  investor: { name: "Investor", price: "$149/month", date: "July 15, 2025" },
};

export default function PricingSuccess() {
  const params = useSearchParams();
  const plan = params.get("plan") || "company";
  const tier = PLAN_LABELS[plan] || PLAN_LABELS.company;

  return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(45,106,79,0.08)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-[#2d6a4f]" />
        </div>
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">
          You're locked in
        </h1>
        <p className="text-[#4a5568] text-sm leading-relaxed mb-2">
          Your <strong>{tier.name}</strong> plan is reserved at <strong>{tier.price}</strong>.
        </p>
        <p className="text-[#718096] text-sm leading-relaxed mb-8">
          Your card will not be charged until <strong>{tier.date}</strong>. You'll receive a reminder email before then.
        </p>
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6 mb-8 text-left">
          <p className="text-xs font-mono text-[#718096] uppercase tracking-widest mb-3">What happens next</p>
          <ul className="flex flex-col gap-3">
            {[
              "Full platform access opens April 15th",
              "No charge until July 15, 2025",
              "Cancel anytime before July 15th — no fee",
              "Reminder email sent 7 days before billing starts",
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-[#4a5568]">
                <CheckCircle size={14} className="text-[#2d6a4f] mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-all">
          Go to dashboard <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}