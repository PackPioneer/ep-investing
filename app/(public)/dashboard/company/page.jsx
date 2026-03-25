"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function CompanyDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/sign-in"); return; }
    
    fetch("/api/dashboard/company")
      .then(r => r.json())
      .then(data => {
        if (!data || data.error) { router.push("/"); return; }
        setCompany(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isLoaded, user]);

  if (loading) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-2">
          {company?.name} Dashboard
        </h1>
        <p className="text-sm text-[#4a5568] mb-8">Manage your company profile, jobs, and updates.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Profile Views</div>
            <div className="text-3xl font-bold text-[#0f1a14]">—</div>
          </div>
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Open Jobs</div>
            <div className="text-3xl font-bold text-[#0f1a14]">—</div>
          </div>
          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
            <div className="text-xs font-mono text-[#718096] uppercase tracking-wide mb-1">Updates Posted</div>
            <div className="text-3xl font-bold text-[#0f1a14]">—</div>
          </div>
        </div>

        {/* Sections coming next */}
        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 mb-4">
          <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-4">Profile Settings</h2>
          <p className="text-sm text-[#718096]">Edit your company description, tags, and signals.</p>
        </div>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 mb-4">
          <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-4">Job Postings</h2>
          <p className="text-sm text-[#718096]">Manage your open roles.</p>
        </div>

        <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
          <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-4">Recent Updates</h2>
          <p className="text-sm text-[#718096]">Post updates about your company.</p>
        </div>
      </div>
    </div>
  );
}
```

Then we need the API route to fetch the company. Create:
```
mkdir -p "app/api/dashboard" && touch "app/api/dashboard/company/route.js"