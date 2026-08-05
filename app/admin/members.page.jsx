"use client";
import { useState, useEffect } from "react";
import { Users, BadgeCheck, Clock, TrendingUp } from "lucide-react";
import { INDUSTRY_LABELS } from "@/lib/industries";
import { ROLE_LABELS } from "@/lib/roles";
import { INTENT_LABELS } from "@/lib/intents";

function daysAgo(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((d) => { setMembers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // stats
  const onboarded = members.filter((m) => m.onboarded_at);
  const joinedToday = onboarded.filter((m) => daysAgo(m.onboarded_at) === 0).length;
  const joinedWeek = onboarded.filter((m) => daysAgo(m.onboarded_at) <= 7).length;
  const listedCount = members.filter((m) => m.is_listed).length;
  const pendingListing = members.filter((m) => m.is_listed && m.status === "pending").length;

  // filters
  const filtered = members.filter((m) => {
    if (roleFilter && m.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!(m.email || "").toLowerCase().includes(q) && !(m.name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const roles = [...new Set(members.map((m) => m.role).filter(Boolean))];

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Members</h1>
        <p className="text-sm text-slate-500">Individuals who joined EP Network</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "Total members", value: members.length },
          { icon: TrendingUp, label: "Joined today", value: joinedToday },
          { icon: Clock, label: "Joined this week", value: joinedWeek },
          { icon: BadgeCheck, label: "Listed as experts", value: listedCount, sub: pendingListing > 0 ? pendingListing + " pending" : null },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className="text-slate-400" />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
            <div className="text-2xl font-semibold text-slate-900">{value}</div>
            {sub && <div className="text-xs text-amber-600 mt-0.5">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 w-64 focus:outline-none focus:border-slate-500" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-500">
          <option value="">All roles</option>
          {roles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} shown</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-slate-500 py-12 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-sm text-slate-500">
          No members yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Industries</th>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Expert</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{m.name || "—"}</div>
                    <div className="text-xs text-slate-500">{m.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{ROLE_LABELS[m.role] || m.role || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(m.industries || []).slice(0, 3).map((i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {INDUSTRY_LABELS[i] || i}
                        </span>
                      ))}
                      {(m.industries || []).length > 3 && (
                        <span className="text-xs text-slate-400">+{m.industries.length - 3}</span>
                      )}
                      {(!m.industries || m.industries.length === 0) && <span className="text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{INTENT_LABELS[m.intent] || m.intent || "—"}</td>
                  <td className="px-4 py-3">
                    {m.is_listed ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        m.status === "approved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {m.status === "approved" ? "Listed" : "Pending"}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(m.onboarded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}