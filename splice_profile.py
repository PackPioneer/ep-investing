#!/usr/bin/env python3
"""
Splices the new profile form into app/(public)/dashboard/company/page.jsx
Replaces from `<form onSubmit={saveProfile}` through its matching `</form>`.
"""

import sys
from pathlib import Path

PAGE_PATH = Path("app/(public)/dashboard/company/page.jsx")
NEW_FORM_PATH = Path("new_profile_form.jsx")

if not PAGE_PATH.exists():
    print(f"ERROR: {PAGE_PATH} not found.")
    sys.exit(1)

if not NEW_FORM_PATH.exists():
    print(f"ERROR: {NEW_FORM_PATH} not found.")
    sys.exit(1)

content = PAGE_PATH.read_text()
new_form = NEW_FORM_PATH.read_text()

start_marker = '<form onSubmit={saveProfile}'
end_marker = '</form>'

start_idx = content.find(start_marker)
if start_idx == -1:
    print(f"ERROR: Could not find '{start_marker}'")
    sys.exit(1)

end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print(f"ERROR: Could not find '{end_marker}' after the form open")
    sys.exit(1)

end_idx += len(end_marker)

line_start = content.rfind("\n", 0, start_idx) + 1
line_end = content.find("\n", end_idx)
if line_end == -1:
    line_end = len(content)

old_block = content[line_start:line_end]
new_content = content[:line_start] + new_form.rstrip() + content[line_end:]

PAGE_PATH.write_text(new_content)

print(f"Replaced {len(old_block)} chars with {len(new_form.rstrip())} chars")
print("Done. Now also update setForm hydration (line 79) and form useState.")
