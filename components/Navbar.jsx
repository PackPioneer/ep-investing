"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navItems = [
  { name: "Companies", href: "/search" },
  { name: "Investors", href: "/investors" },
  { name: "Grants", href: "/grants" },
  { name: "Experts", href: "/experts" },
  { name: "Jobs", href: "/jobs" },
  { name: "Insights", href: "/insights" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => { setIsOpen(false); }, [pathname]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[#e2e6ed] bg-[#f2f4f8]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-pulse" />
            <span style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#0f1a14]">
              EP Investment
            </span>
          </Link>

          {/* Desktop nav */}
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

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/get-matched"
              className="text-sm text-[#4a5568] border border-[#d0d6e0] rounded-md px-3 py-1.5 hover:text-[#0f1a14] hover:border-[#718096] transition-all">
              Get matched
            </Link>
            <Link href="/get-matched"
              className="text-sm bg-[#2d6a4f] text-[#f2f4f8] font-semibold rounded-md px-4 py-1.5 hover:bg-[#235a40] transition-all">
              Claim your company
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-[#4a5568] hover:text-[#0f1a14] transition-colors"
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
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
              <Link href="/get-matched"
                className="text-center py-3 rounded-lg text-sm text-[#4a5568] border border-[#d0d6e0] hover:text-[#0f1a14] transition-all">
                Get matched
              </Link>
              <Link href="/get-matched"
                className="text-center py-3 rounded-lg text-sm bg-[#2d6a4f] text-[#f2f4f8] font-semibold hover:bg-[#235a40] transition-all">
                Claim your company
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
