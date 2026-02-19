"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Landmark,
  Mail,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Investors", href: "/admin/investors", icon: Users },
  { name: "Companies", href: "/admin/companies", icon: Building2 },
  { name: "Grants", href: "/admin/grants", icon: Landmark },
  { name: "Subscribers", href: "/admin/subscribers", icon: Mail },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const [collapsed, setCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ================= MOBILE TOP BAR ================= */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-40">
        <button onClick={() => setIsOpen(true)}>
          <Menu size={22} />
        </button>

        <h1 className="font-semibold tracking-tight">
          EP Investing
        </h1>

        <UserButton fallbackRedirectUrl="/" />
      </div>

      {/* ================= OVERLAY ================= */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white border-r border-neutral-200 flex flex-col transition-all duration-300
          ${collapsed ? "w-16" : "w-64"}
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
          {!collapsed && (
            <h1 className="text-lg font-semibold tracking-tight">
              EP Investing
            </h1>
          )}

          <div className="flex items-center gap-2">
            {/* Collapse */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 transition"
            >
              <ChevronLeft
                size={18}
                className={`transition ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Close (Mobile) */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ================= MENU ================= */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menu.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-neutral-100"
                }`}
              >
                {/* Active Indicator */}
                {active && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500 rounded-r-full" />
                )}

                <Icon size={18} />

                {!collapsed && (
                  <span className="text-sm font-medium">
                    {item.name}
                  </span>
                )}

                {/* Tooltip */}
                {collapsed && (
                  <span className="absolute left-full ml-3 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ================= USER ================= */}
        <div className="border-t border-neutral-200 p-4 flex items-center gap-3">
          <UserButton fallbackRedirectUrl="/" />

          {!collapsed && user && (
            <div className="flex flex-col text-sm">
              <span className="font-medium">
                {user.fullName || "User"}
              </span>

              <span className="text-gray-500 text-xs truncate">
                {user.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
