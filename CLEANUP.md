# Cleanup / Tech-Debt Backlog

Running list of known issues to fix when there's time. Newest at top.

## Industry slug inconsistency (`geothermal` / `industrial_decarb`)
The canonical tags are `geothermal_energy` and `industrial_decarbonization`
(used in DB `industry_tags`, `VALID_TAGS`, `lib/industries.js`, `formatSector`).
Some UI still uses the short forms. Fixed the search filter + the two intake
forms; these remain:

- **Homepage category tiles** (`app/(public)/page.jsx`, ~lines 21-31): tiles run
  a *text search* (`/search?q=<slug>`) instead of applying the industry filter.
  The "Industrial Decarb" tile searches the literal string `industrial_decarb`
  and finds nothing. Proper fix: point tiles at the industry filter
  (`/search?industry=<canonical_tag>`) and have the search page read an
  `industry` query param to preset `industryFilter`. Hardcoded counts on these
  tiles (39, 37, etc.) are also stale.
- **Insights filter** (`app/(public)/insights/page.jsx`, line 7): `SECTORS`
  includes `industrial_decarb`. Check how existing insights rows are tagged
  before changing.
- **Admin reports picker** (`app/admin/reports/new/page.jsx`, line 134): includes
  `industrial_decarb` and `geothermal`. Same — check existing report tags first.
- **Scrapers** (`scripts/scrape-jobs.js`, `scrape-grants.js`,
  `scrape-vc-portfolios.js`): use `geothermal` as job-sector labels / keyword
  maps. Separate taxonomy, low priority, but worth aligning.

## Company data quality
- **Domain-as-name scraper bug**: root cause fixed in `submit-company/route.js`
  (prettifies hostname fallback). Backlog of ~60 existing rows cleaned via
  `fix-company-names-batch.mjs`. Watch for new ones.
- **Junk/government entries**: `utah.gov` (id 1528), `hawaii.gov` (id 1529) — decide
  whether to hide (`is_hidden=true`) or delete. Likely scraped by mistake.
- **REVIEW-flagged names** from the batch fix (best-guesses, verify): Hy24,
  Verde Hydrogen, Firefly Fusion, Avalanche Energy, Offshore Wind, NEVA
  Aerospace, Flyv, Becaps.
- **Fervo Energy (id 992)** is mis-tagged `industrial_decarbonization` — should be
  `geothermal_energy`.
- **`business_model` holding prose instead of a code**: the field is meant to be a
  short code (`b2b`, `b2c`, `b2g`, `hardware`, `software`, `project_developer`,
  `marketplace`) but some companies (e.g. EX-Fusion, AMEA earlier) have a full
  paragraph stored there. Card UI now renders long values as a clean block, but
  prose values don't match the Business Model filter. Write a sweep to flag every
  company whose `business_model` isn't one of the valid codes, then shorten them.
- **Duplicate company profiles**: the scraper/auto-discovery creates two rows for
  the same company (often one with a scraped page-title name + full quick facts,
  another with the correct name + logo but sparse facts) — e.g. AMEA Power,
  QuantumScape (2652/1546). Fix one at a time with `inspect-company.mjs` +
  `merge-companies.mjs --keep --loser`. Better: a periodic dedupe sweep that
  flags rows sharing the same root domain (normalize url → hostname) so they can
  be merged before users spot them. Root cause worth checking: `cron_auto_discovery`
  inserts without a strong dedupe on domain.

## Logos
- Many `logo_url`s point at company sites that block hotlinking → render blank.
  Consider a sweep (like the name sweep) to switch blank/hotlink-protected logos
  to the Google favicon proxy, or host wordmarks in Supabase storage.

## Scraper name extraction
- `scrapeUrl` often fails to extract a real company name, which is why the
  hostname fallback fired so often. Improving name extraction would reduce
  reliance on the fallback.

## From earlier handoff (still open)
- HubSpot segment filter is case-sensitive (`yes` vs `Yes`) — new WordPress
  signups get `Yes` and won't match.
- Rotate the HubSpot Service Key (partial exposed in chat).
- `status` field overloaded (member-active vs expert-listing-approved) — consider
  a separate `listing_status` column.
