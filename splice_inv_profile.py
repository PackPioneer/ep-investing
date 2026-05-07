#!/usr/bin/env python3
"""
Splice the new investor Profile tab into app/(public)/dashboard/investor/page.jsx
- Replaces the entire `{activeTab === "profile" && profileForm && ( ... )}` block
- Updates the profileForm initialization to include 2 new fields (tagline, twitter_url)
"""

import sys
from pathlib import Path

PAGE_PATH = Path("app/(public)/dashboard/investor/page.jsx")
NEW_BLOCK_PATH = Path("new_profile_block.jsx")

if not PAGE_PATH.exists():
    print(f"ERROR: {PAGE_PATH} not found.")
    sys.exit(1)

if not NEW_BLOCK_PATH.exists():
    print(f"ERROR: {NEW_BLOCK_PATH} not found.")
    sys.exit(1)

content = PAGE_PATH.read_text()
new_block = NEW_BLOCK_PATH.read_text()

ok = []

# === STEP 1 — Replace the profile tab block ===
start_marker = '{activeTab === "profile" && profileForm && ('
end_marker = '{/* GRANTS TAB */}'

start_idx = content.find(start_marker)
if start_idx == -1:
    print(f"ERROR: profile tab start marker not found")
    sys.exit(1)

end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print(f"ERROR: end marker (GRANTS TAB) not found")
    sys.exit(1)

# Walk back to start of the line containing the start marker
line_start = content.rfind("\n", 0, start_idx) + 1

# end_idx is at the start of "{/* GRANTS TAB */}"; we want to end just before its line begins
end_line_start = content.rfind("\n", 0, end_idx) + 1

old_block = content[line_start:end_line_start]
content = content[:line_start] + new_block.rstrip() + "\n\n" + content[end_line_start:]
ok.append(f"profile_block ({len(old_block)} -> {len(new_block.rstrip())} chars)")

# === STEP 2 — Update profileForm initialization to add tagline and twitter_url ===
old_init = '''        setProfileForm({
          name: data.profile?.name || "",
          firm: data.profile?.firm || "",
          focus: data.profile?.focus || "",
          stage: data.profile?.stage || "",
          check_size: data.profile?.check_size || "",
          thesis: data.profile?.thesis || "",
          linkedin: data.profile?.linkedin || "",
          website: data.profile?.website || "",
          location: data.profile?.location || "",
          point_of_contact: data.profile?.point_of_contact || "",
          previous_investments: data.profile?.previous_investments || "",
          round_preference: data.profile?.round_preference || "",
        });'''

new_init = '''        setProfileForm({
          name: data.profile?.name || "",
          firm: data.profile?.firm || "",
          focus: data.profile?.focus || "",
          stage: data.profile?.stage || "",
          check_size: data.profile?.check_size || "",
          thesis: data.profile?.thesis || "",
          linkedin: data.profile?.linkedin || "",
          website: data.profile?.website || "",
          location: data.profile?.location || "",
          point_of_contact: data.profile?.point_of_contact || "",
          previous_investments: data.profile?.previous_investments || "",
          round_preference: data.profile?.round_preference || "",
          tagline: data.profile?.tagline || "",
          twitter_url: data.profile?.twitter_url || "",
        });'''

if old_init in content:
    content = content.replace(old_init, new_init, 1)
    ok.append("profileForm_init")
else:
    print("WARN: profileForm initialization pattern not found")

PAGE_PATH.write_text(content)
print(f"OK: {', '.join(ok)}")
