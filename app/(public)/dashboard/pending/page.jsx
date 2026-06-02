"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function DashboardPending() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    // Poll every 2 seconds to check if account is linked
    const interval = setInterval(async () => {
      const res = await fetch("/api/dashboard/detect");
      const data = await res.json();
      if (data.type === "company") {
        clearInterval(interval);
        router.push("/dashboard/company");
      } else if (data.type === "investor") {
        clearInterval(interval);
        router.push("/dashboard/investor");
      } else if (data.type === "ngo") {
        clearInterval(interval);
        router.push("/dashboard/ngo");
      } else if (data.type === "expert") {
        clearInterval(interval);
        router.push("/dashboard/expert");
      }
    }, 2000);

    // Stop polling after 30 seconds and show an error state
    const timeoutId = setTimeout(() => {
      clearInterval(interval);
      setTimedOut(true);
    }, 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      {timedOut ? (
        <div className="max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-6 text-amber-600 text-xl">!</div>
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-2xl text-[#0f1a14] mb-3">
            Something went wrong
          </h2>
          <p className="text-[#4a5568] text-sm leading-relaxed mb-6">
            We couldn't finish setting up your dashboard. This usually clears up on its own — try refreshing in a minute. If it persists, contact us and we'll sort it out.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => window.location.reload()}
              className="bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#235a40] transition-colors">
              Refresh
            </button>
            <a href="mailto:info@epinvesting.com?subject=Dashboard%20not%20loading"
              className="text-sm text-[#2d6a4f] hover:underline">
              Email support
            </a>
          </div>
        </div>
      ) : (
        <div className="max-w-md text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[#2d6a4f] border-t-transparent animate-spin mx-auto mb-6" />
          <h2 style={{ fontFamily: 'var(--font-display), sans-serif' }} className="text-2xl text-[#0f1a14] mb-3">
            Setting up your dashboard
          </h2>
          <p className="text-[#4a5568] text-sm leading-relaxed">
            Linking your account — this takes just a moment.
          </p>
        </div>
      )}
    </div>
  );
}