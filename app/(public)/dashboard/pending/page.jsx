"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function DashboardPending() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

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
      }
    }, 2000);

    // Stop polling after 30 seconds
    setTimeout(() => clearInterval(interval), 30000);
    return () => clearInterval(interval);
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#2d6a4f] border-t-transparent animate-spin mx-auto mb-6" />
        <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-3">
          Setting up your dashboard
        </h2>
        <p className="text-[#4a5568] text-sm leading-relaxed">
          Linking your account — this takes just a moment.
        </p>
      </div>
    </div>
  );
}