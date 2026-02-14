"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navItems = [
  "Companies",
  "Investors",
  "Grants",
  "Jobs",
  "Experts",
  "Insights",
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-sm "
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              scrolled ? "h-14" : "h-20"
            }`}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-linear-to-br from-green-500 to-green-700 rounded-md shadow-sm group-hover:scale-105 transition" />
              <span className="font-semibold text-lg tracking-tight text-slate-900">
                EP Investing
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              {navItems.map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="relative group"
                >
                  <span className="transition-colors group-hover:text-slate-900">
                    {item}
                  </span>

                  {/* Premium Underline Animation */}
                  <span className="absolute left-0 -bottom-1 w-0 h-0.5 bg-green-600 transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Desktop CTA */}
              <button className="hidden md:inline-flex relative overflow-hidden px-5 py-2 rounded-md bg-green-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all">
                <span className="relative z-10">Get Matched</span>
                <span className="absolute inset-0 bg-linear-to-r from-green-500 to-green-700 opacity-0 hover:opacity-100 transition-opacity duration-300" />
              </button>

              {/* Mobile Hamburger */}
              <button
                className="md:hidden p-2"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? (
                  <X className="w-6 h-6 text-slate-800" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-800" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 w-full bg-white z-40 pt-24 pb-10 px-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-6 text-lg font-medium text-slate-700">
              {navItems.map((item) => (
                <Link
                  key={item}
                  href="#"
                  onClick={() => setIsOpen(false)}
                  className="border-b pb-3 hover:text-green-600 transition"
                >
                  {item}
                </Link>
              ))}

              <button className="mt-6 bg-green-600 text-white py-3 rounded-md shadow-md hover:shadow-lg transition">
                Get Matched
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
