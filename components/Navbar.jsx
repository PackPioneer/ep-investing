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
      <nav className="sticky top-0 z-50 border-b border-[#1e2428] bg-[#0a0d0f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-[#c8f560] animate-pulse" />
            <span style={{ fontFamily: "Georgia, serif" }} className="text-base text-[#e8ede8]">
              EP Investing
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href}
                  className={`text-sm transition-colors ${isActive ? "text-[#c8f560]" : "text-[#6b7a72] hover:text-[#e8ede8]"}`}>
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/get-matched"
              className="text-sm text-[#6b7a72] border border-[#252c32] rounded-md px-3 py-1.5 hover:text-[#e8ede8] hover:border-[#4a5550] transition-all">
              Get matched
            </Link>
            <Link href="/get-matched"
              className="text-sm bg-[#c8f560] text-[#0a0d0f] font-semibold rounded-md px-4 py-1.5 hover:bg-[#d4ff6b] transition-all">
              Claim your company
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 text-[#6b7a72] hover:text-[#e8ede8] transition-colors"
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="fixed inset-0 top-14 z-40 bg-[#0a0d0f] border-t border-[#1e2428] md:hidden">
          <div className="flex flex-col p-6 gap-2">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[rgba(200,245,96,0.08)] text-[#c8f560] border border-[#1e2e24]"
                      : "text-[#6b7a72] hover:bg-[#111518] hover:text-[#e8ede8]"
                  }`}>
                  {item.name}
                </Link>
              );
            })}
            <div className="border-t border-[#1e2428] mt-4 pt-4 flex flex-col gap-3">
              <Link href="/get-matched"
                className="text-center py-3 rounded-lg text-sm text-[#6b7a72] border border-[#252c32] hover:text-[#e8ede8] transition-all">
                Get matched
              </Link>
              <Link href="/get-matched"
                className="text-center py-3 rounded-lg text-sm bg-[#c8f560] text-[#0a0d0f] font-semibold hover:bg-[#d4ff6b] transition-all">
                Claim your company
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
