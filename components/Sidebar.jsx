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
  ChevronDown,
  Menu,
  X,
  Plus,
  Rss,
  Sparkles,
  Megaphone,
  Briefcase,
} from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";

const menu = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Members", href: "/admin/members", icon: Users },
  {
    group: "Directory", icon: Building2, children: [
      { name: "Companies", href: "/admin/companies" },
      { name: "Manage Investors", href: "/admin/manage-investors" },
      { name: "Manage NGOs", href: "/admin/manage-ngos" },
    ],
  },
  {
    group: "Add", icon: Plus, children: [
      { name: "Add company", href: "/admin/add-company" },
      { name: "Add NGO", href: "/admin/add-ngo" },
      { name: "Add investor", href: "/admin/add-investor" },
    ],
  },
  { name: "Claims", href: "/admin/claims", icon: Building2 },
  { name: "VC Portfolios", href: "/admin/vc-portfolio", icon: Building2 },
  { name: "Portfolio Review", href: "/admin/portfolio-review", icon: Building2 },
  { name: "Newsroom", href: "/admin/announcements", icon: Megaphone },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Feed Queue", href: "/admin/feed-queue", icon: Rss },
  { name: "Enrichment", href: "/admin/enrichment-queue", icon: Sparkles },
  { name: "Enrich One", href: "/admin/enrich-one", icon: Sparkles },
  { name: "Investors", href: "/admin/investors", icon: Users },
  { name: "Investor Requests", href: "/admin/investor-requests", icon: Users },
  { name: "Expert Applications", href: "/admin/expert-applications", icon: Users },
  { name: "Researchers", href: "/admin/researchers", icon: Users },
  { name: "Grants", href: "/admin/grants", icon: Landmark },
  { name: "Subscribers", href: "/admin/subscribers", icon: Mail },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const [collapsed, setCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  const NavLink = ({ href, name, Icon, indented }) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        onClick={() => setIsOpen(false)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${indented && !collapsed ? "pl-9" : ""} ${active ? "bg-emerald-600 text-white shadow-sm" : "text-gray-600 hover:bg-neutral-100"}`}
      >
        {active && <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500 rounded-r-full" />}
        <Icon size={18} />
        {!collapsed && <span className="text-sm font-medium">{name}</span>}
        {collapsed && (
          <span className="absolute left-full ml-3 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 z-10">{name}</span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ================= MOBILE TOP BAR ================= */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-40">
        <button onClick={() => setIsOpen(true)}>
          <Menu size={22} />
        </button>
        <h1 className="font-semibold tracking-tight">EP Investing</h1>
        <UserButton fallbackRedirectUrl="/" />
      </div>

      {/* ================= OVERLAY ================= */}
      {isOpen && (
        <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" />
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
          {!collapsed && <h1 className="text-lg font-semibold tracking-tight">EP Investing</h1>}
          <div className="flex items-center gap-2">
            <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 transition">
              <ChevronLeft size={18} className={`transition ${collapsed ? "rotate-180" : ""}`} />
            </button>
            <button onClick={() => setIsOpen(false)} className="md:hidden p-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ================= MENU ================= */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-4 space-y-1">
          {menu.map((item) => {
            // Grouped, collapsible section
            if (item.children) {
              // When the rail is collapsed there's no room for headers — flatten.
              if (collapsed) {
                return item.children.map((c) => <NavLink key={c.href} href={c.href} name={c.name} Icon={item.icon} />);
              }
              const isActive = item.children.some((c) => pathname === c.href);
              const open = openGroups[item.group] ?? isActive;
              return (
                <div key={item.group}>
                  <button
                    onClick={() => setOpenGroups((p) => ({ ...p, [item.group]: !(p[item.group] ?? isActive) }))}
                    className="w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-neutral-100 transition-all"
                  >
                    <item.icon size={18} />
                    <span className="text-sm font-medium flex-1 text-left">{item.group}</span>
                    <ChevronDown size={15} className={`transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && item.children.map((c) => <NavLink key={c.href} href={c.href} name={c.name} Icon={item.icon} indented />)}
                </div>
              );
            }
            // Flat item
            return <NavLink key={item.href} href={item.href} name={item.name} Icon={item.icon} />;
          })}
        </nav>

        {/* ================= USER ================= */}
        <div className="border-t border-neutral-200 p-4 flex items-center gap-3">
          <UserButton fallbackRedirectUrl="/" />
          {!collapsed && user && (
            <div className="flex flex-col text-sm">
              <span className="font-medium">{user.fullName || "User"}</span>
              <span className="text-gray-500 text-xs truncate">{user.primaryEmailAddress?.emailAddress}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
