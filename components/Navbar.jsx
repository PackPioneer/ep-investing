"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";

const navItems = [
  { name: "Companies", href: "/search" },
  { name: "Investors", href: "/investors" },
  { name: "Grants", href: "/grants" },
  { name: "Experts", href: "/experts" },
  { name: "Jobs", href: "/jobs" },
  { name: "Insights", href: "/insights" },
  { name: "Pricing", href: "/pricing" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  useEffect(() => { setIsOpen(false); setJoinOpen(false); }, [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#e2e6ed] bg-[#f2f4f8]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">

          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-pulse" />
            <span style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0f1a14]">
              EP Investing
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href}
                  className={`text-sm transition-colors ${isActive ? "text-[#2d6a4f]" : "text-[#4a5568] hover:text-[#0f1a14]"}`}>
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isLoaded && user ? (
              <>
                <Link href="/dashboard"
                  className="text-sm text-[#4a5568] border border-[#d0d6e0] rounded-md px-3 py-1.5 hover:text-[#0f1a14] hover:border-[#718096] transition-all">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <a href="https://accounts.epinvesting.com/sign-in"
                  className="text-sm text-[#4a5568] border border-[#d0d6e0] rounded-md px-3 py-1.5 hover:text-[#0f1a14] hover:border-[#718096] transition-all">
                  Sign in
                </a>
                <div className="relative">
                  <button onClick={() => setJoinOpen(v => !v)}
                    className="text-sm bg-[#2d6a4f] text-[#f2f4f8] font-semibold rounded-md px-4 py-1.5 hover:bg-[#235a40] transition-all">
                    Join EP Investing ▾
                  </button>
                  {joinOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setJoinOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-[#e2e6ed] rounded-xl shadow-lg z-50">
                        <Link href="/onboarding/company" onClick={() => setJoinOpen(false)}
                          className="flex flex-col px-4 py-3 hover:bg-[#f8f9fb] rounded-t-xl transition-colors">
                          <span className="text-sm font-semibold text-[#0f1a14]">🏢 I'm a Company</span>
                          <span className="text-xs text-[#718096] mt-0.5">Claim your profile</span>
                        </Link>
                        <div className="border-t border-[#e2e6ed]" />
                        <Link href="/onboarding/investor" onClick={() => setJoinOpen(false)}
                          className="flex flex-col px-4 py-3 hover:bg-[#f8f9fb] rounded-b-xl transition-colors">
                          <span className="text-sm font-semibold text-[#0f1a14]">📈 I'm an Investor</span>
                          <span className="text-xs text-[#718096] mt-0.5">Get deal flow access</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-[#4a5568] hover:text-[#0f1a14] transition-colors"
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 top-14 z-40 bg-[#f2f4f8] border-t border-[#e2e6ed] md:hidden">
          <div className="flex flex-col p-6 gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[rgba(45,106,79,0.06)] text-[#2d6a4f] border border-[#c8d8cc]"
                      : "text-[#4a5568] hover:bg-[#ffffff] hover:text-[#0f1a14]"
                  }`}>
                  {item.name}
                </Link>
              );
            })}
            <div className="border-t border-[#e2e6ed] mt-4 pt-4 flex flex-col gap-3">
              {isLoaded && user ? (
                <>
                  <Link href="/dashboard"
                    className="text-center py-3 rounded-lg text-sm text-[#4a5568] border border-[#d0d6e0]">
                    Dashboard
                  </Link>
                  <div className="flex justify-center">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <a href="https://accounts.epinvesting.com/sign-in"
                    className="text-center py-3 rounded-lg text-sm text-[#4a5568] border border-[#d0d6e0]">
                    Sign in
                  </a>
                  <Link href="/onboarding/company"
                    className="text-center py-3 rounded-lg text-sm bg-[#2d6a4f] text-[#f2f4f8] font-semibold hover:bg-[#235a40] transition-all">
                    🏢 Join as Company
                  </Link>
                  <Link href="/onboarding/investor"
                    className="text-center py-3 rounded-lg text-sm border border-[#2d6a4f] text-[#2d6a4f] font-semibold hover:bg-[#f0f7f4] transition-all">
                    📈 Join as Investor
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}