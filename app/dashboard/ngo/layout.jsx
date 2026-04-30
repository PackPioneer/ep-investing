import { redirect } from "next/navigation";
import Link from "next/link";
import { getOwnedNgo } from "@/lib/ngo-owner";
import { Building2, Edit3, FileText, Briefcase, ExternalLink, Eye } from "lucide-react";

export default async function NGODashboardLayout({ children }) {
  const { userId, ngo } = await getOwnedNgo();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard/ngo");
  }

  if (!ngo) {
    redirect("/onboarding/ngo?reason=no-profile");
  }

  if (ngo.status !== "active") {
    return (
      <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center px-6"
        style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
        <div className="max-w-md text-center bg-white border border-[#e2e6ed] rounded-2xl p-8">
          <div className="w-12 h-12 rounded-full bg-[rgba(45,106,79,0.08)] border border-[#c8d8cc] flex items-center justify-center mx-auto mb-5">
            <Building2 size={20} className="text-[#2d6a4f]" />
          </div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-2">
            Profile under review
          </h2>
          <p className="text-sm text-[#4a5568] leading-relaxed mb-6">
            Your NGO profile for <strong>{ngo.name}</strong> is currently {ngo.status}. The dashboard unlocks once an admin approves your submission. We'll email you when it's ready.
          </p>
          <Link href="/" className="text-sm text-[#2d6a4f] hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const NAV = [
    { href: "/dashboard/ngo", label: "Overview", icon: Building2 },
    { href: "/dashboard/ngo/profile", label: "Edit profile", icon: Edit3 },
    { href: "/dashboard/ngo/grants", label: "Grants", icon: FileText },
    { href: "/dashboard/ngo/jobs", label: "Jobs", icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-[#f2f4f8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#e2e6ed]">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#718096] mb-1">NGO Dashboard</div>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
              {ngo.name}
            </h1>
          </div>
          <Link href={`/ngos/${ngo.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#2d6a4f] border border-[#d0d6e0] hover:border-[#2d6a4f] rounded-lg px-3 py-2 transition-colors">
            <Eye size={13} /> View public profile <ExternalLink size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">

          {/* Sidebar nav */}
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#4a5568] hover:bg-white hover:text-[#0f1a14] transition-colors whitespace-nowrap">
                <Icon size={14} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Main content */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
