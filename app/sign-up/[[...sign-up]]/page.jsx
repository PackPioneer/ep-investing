"use client";

import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Rss, Compass, BadgeCheck } from "lucide-react";

const FEATURES = [
  { icon: Rss, title: "Your feed", sub: "Companies, news & grants in your industries" },
  { icon: Compass, title: "Explore", sub: "The full network of companies & investors" },
  { icon: BadgeCheck, title: "Get discovered", sub: "List yourself as an expert" },
];

const clerkAppearance = {
  variables: {
    colorPrimary: "#2d6a4f",
    colorText: "#0f1a14",
    colorTextSecondary: "#4a5568",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-geist-sans), sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "shadow-none border border-[#e8eaee] bg-white rounded-2xl",
    header: "hidden",
    formButtonPrimary:
      "bg-[#2d6a4f] hover:bg-[#235a40] text-sm font-semibold normal-case shadow-none",
    formFieldInput:
      "border-[#dbdfe4] focus:border-[#2d6a4f] focus:ring-0 rounded-lg",
    formFieldLabel: "text-[#0f1a14]",
    footerActionLink: "text-[#2d6a4f] hover:text-[#235a40]",
    identityPreviewEditButtonIcon: "text-[#2d6a4f]",
  },
};

function SignUpInner() {
  const params = useSearchParams();
  const redirectUrl = params.get("redirect_url") || "/onboarding/individual";
  const emailParam = params.get("email");
  const email = emailParam && emailParam !== "None" ? emailParam : undefined;

  return (
    <div
      className="min-h-screen bg-[#f6f7f9] px-6 py-16 flex items-center justify-center"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-10 md:gap-14 items-center">
        {/* Left: brand pitch */}
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#2d6a4f] mb-4">
            {email ? "You're almost in" : "Join the network"}
          </p>
          <h1
            style={{ fontFamily: "var(--font-display), sans-serif" }}
            className="text-4xl md:text-5xl text-[#0f1a14] leading-tight mb-4"
          >
            Create your account
          </h1>
          <p className="text-[#4a5568] text-base leading-relaxed mb-8 max-w-md">
            Follow the industries you care about and get a feed of the companies,
            news, and grants that matter — built around you.
          </p>
          <div className="flex flex-col gap-3">
            {FEATURES.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-white border border-[#e8eaee] flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-[#2d6a4f]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0f1a14]">{title}</div>
                  <div className="text-xs text-[#4a5568] leading-snug">{sub}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#a0aec0] mt-8 font-mono">
            Free to join · Takes under a minute
          </p>
        </div>

        {/* Right: the embedded signup */}
        <div className="flex justify-center md:justify-end">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            forceRedirectUrl={redirectUrl}
            fallbackRedirectUrl={redirectUrl}
            initialValues={email ? { emailAddress: email } : undefined}
            appearance={clerkAppearance}
          />
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpInner />
    </Suspense>
  );
}
