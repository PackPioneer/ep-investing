#!/usr/bin/env python3
"""
Update admin/claims/page.jsx to:
1. Show a small 'source' badge per row (Onboarding vs Profile Claim)
2. For new profile claims, link to the underlying /companies/[id] or /investors/[id]
"""

import pathlib

p = pathlib.Path("app/admin/claims/page.jsx")
if not p.exists():
    print("ERROR: file not found")
    raise SystemExit(1)

content = p.read_text()

# ====================================================================
# Splice 1: Add source badge next to company name
# ====================================================================
old1 = '''        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">{claim.company_name || "No company name"}</span>
            {claim.company_url && (
              <a href={claim.company_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <ExternalLink size={12} />
              </a>
            )}
          </div>'''

new1 = '''        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm">{claim.company_name || "No company name"}</span>
            {claim.source === "profile_claim" ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">Profile Claim</span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 font-medium">Onboarding</span>
            )}
            {claim.company_url && (
              <a href={claim.company_url} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-slate-400 hover:text-slate-600 transition-colors">
                <ExternalLink size={12} />
              </a>
            )}
            {claim.source === "profile_claim" && claim.target_id && (
              <a href={claim.profile_type === "company" ? `/companies/${claim.target_id}` : `/investors/${claim.target_id}`}
                target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-[11px] text-blue-600 hover:text-blue-800 underline">
                View profile
              </a>
            )}
          </div>'''

ok = []
if old1 in content:
    content = content.replace(old1, new1, 1)
    ok.append("source_badge")
else:
    print("WARN: badge pattern not found")

if ok:
    p.write_text(content)
    print(f"OK: {','.join(ok)}")
else:
    print("ERROR: no patterns matched")
