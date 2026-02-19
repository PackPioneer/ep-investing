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
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-300 bg-white">
        <button onClick={() => setIsOpen(true)}>
          <Menu size={22} />
        </button>

        <h1 className="font-semibold">EP Investing</h1>

        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
  className={`
    fixed top-0 left-0 z-50 h-screen bg-white border-r border-neutral-300 flex flex-col transition-all duration-300
    ${collapsed ? "w-14" : "w-64"}
    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-300">
          {!collapsed && (
            <h1 className="text-lg font-semibold tracking-wide">
              EP Investing
            </h1>
          )}

          <div className="flex items-center gap-2">
            {/* Collapse Button (desktop only) */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:block p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Close Button (mobile only) */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {menu.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)} // close on click mobile
                className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition relative
                ${active
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
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

        {/* User */}
        <div className="border-t border-neutral-300 p-4 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />

          {!collapsed && user && (
            <div className="flex flex-col text-sm">
              <span className="font-medium">
                {user.fullName || "User"}
              </span>
              <span className="text-gray-500 text-xs">
                {user.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
