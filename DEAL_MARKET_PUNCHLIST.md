# Deal-flow & Market pages — pre-launch punch-list

A review of `/admin/markets` and `/admin/dealflow` before they go investor-facing.
Each item tagged **[blocker]** (fix before launch), **[polish]** (should-do), or
**[later]** (nice-to-have). Add your own items under "Gundy's additions" at the bottom.

---

## A. Cross-cutting (both pages)

1. **[blocker] Strip internal framing.** Remove admin-only language before investors see it:
   - "admin preview" badge (both pages)
   - "This is the part investors pay for" (deal-flow subtitle)
   - "X to add" on the Company-linked stat (markets) — that's a backlog note for us, not investors
2. **[blocker] Data hygiene on "Currently raising."** The self-reported list currently shows test noise (e.g. The Energy Pioneer at "$2000"). Filter out obviously-invalid raise targets and our own test entries so the panel looks credible.
3. **[polish] "As of" freshness.** Add a last-updated timestamp to the public-ticker basket and to the funding wire, so nobody assumes a stale price/round is live.
4. **[polish] Mobile pass.** Filter row and the wide wire table need a check on small screens (horizontal scroll is fine, but confirm the filter chips wrap cleanly).

## B. Markets page (`/admin/markets`)

5. **[polish] Date-range filter.** Everything is all-time right now. Add a range (Last 90 days / YTD / 12 mo / All) — investors think in recent windows.
6. **[polish] Geography chart reconciliation.** "Capital by geography" excludes region-tagged events, so it won't sum to "Capital tracked." Add a one-line footnote ("country-tagged deals only") so it doesn't look like a bug.
7. **[later] Sort the wire.** Let users sort by amount as well as date.
8. **[later] Default wire length.** Collapsed to 5 may feel thin — consider 8–10 before "show more."
9. **[polish] Save-search discoverability.** "Save search + alert" only appears once a filter is active. Add a subtle hint so investors discover the alerting feature.

## C. Deal-flow page (`/admin/dealflow`)

10. **[blocker] Rewrite the subtitle** in investor-appropriate language (drop "the part investors pay for").
11. **[polish] External-link cue.** Press rows that aren't in the directory open the source article — add a small external-link icon so it's clear they leave the site.
12. **[polish] Thin-panel copy.** "Currently raising" and "Likely raising soon" will be light at launch. Make the empty/near-empty states reassuring ("fills as companies announce on EP") rather than looking broken.
13. **[keep] Methodology note.** The "How these signals are derived" disclaimer is in — verify it reads well to an outside investor.
14. **[later] Sector/geo filters on deal-flow** to match the markets page (currently no filtering on the three panels).

## D. Trust & credibility

15. **[blocker] Confirm no bad company names** leak into the wire or panels (the domain-name / scraped-title issue we fixed earlier — spot-check).
16. **[polish] Attribution.** Consider a small "sources: news wire, SEC, self-reported" line so investors understand where data comes from.

---

## Gundy's additions

- (add yours here)
-
-
