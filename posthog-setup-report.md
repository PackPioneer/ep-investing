# PostHog Analytics Setup Report

**Project:** EP Investment
**Date:** 2026-03-23
**Integration type:** Next.js App Router (v16.1.6), client + server-side

---

## Dashboard

[Analytics basics](https://us.posthog.com/project/353808/dashboard/1390333) — pinned, 5 insights

---

## Events tracked

| Event | Trigger | File(s) | Properties |
|---|---|---|---|
| `search_performed` | User submits search | `app/(public)/page.jsx`, `app/(public)/search/page.jsx` | `query`, `source` (`homepage` \| `search_page`) |
| `newsletter_subscribed` | Email capture form submitted | `app/(public)/page.jsx` | `email`, `source` |
| `search_filter_applied` | Industry filter chip clicked on search page | `app/(public)/search/page.jsx` | `filter_type`, `filter_value`, `query` |
| `grant_external_link_clicked` | External link on a grant card clicked | `app/(public)/grants/page.jsx` | `grant_title`, `grant_id`, `url` |
| `investor_onboarding_submitted` | Investor onboarding form completed | `app/(public)/onboarding/investor/page.jsx`, `app/api/onboarding/investor/route.js` | `email`, `firm`, `sectors`, `stages`, `check_sizes`, `geographies` |
| `company_onboarding_submitted` | Company onboarding form completed | `app/(public)/onboarding/company/page.jsx`, `app/api/onboarding/company/route.js` | `email`, `company_name`, `sector`, `stage`, `funding_round`, `looking_to_raise`, `is_hiring`, `seeking_partnerships` |
| `get_matched_submitted` | Get-matched form completed | `app/(public)/get-matched/page.jsx`, `app/api/get-matched/route.js` | `path`, `email`, `name`, `source` |

### Identity calls

`posthog.identify()` is called at every form submission with the user's email as the distinct ID. Properties sent:

| Page | Properties |
|---|---|
| Investor onboarding | `email`, `name`, `firm` |
| Company onboarding | `email`, `name`, `company` |
| Get matched | `email`, `name` |
| Newsletter | `email` |

---

## Files created / modified

| File | Change |
|---|---|
| `instrumentation-client.js` | Created — client-side PostHog init (Next.js 15.3+ pattern) |
| `lib/posthog-server.js` | Created — server-side singleton PostHog client |
| `next.config.mjs` | Updated — added `/ingest` reverse proxy rewrites + `skipTrailingSlashRedirect` |
| `.env.local` | Updated — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST` |
| `app/(public)/page.jsx` | Added `search_performed`, `newsletter_subscribed` |
| `app/(public)/search/page.jsx` | Added `search_performed`, `search_filter_applied` |
| `app/(public)/grants/page.jsx` | Added `grant_external_link_clicked` |
| `app/(public)/onboarding/investor/page.jsx` | Added `investor_onboarding_submitted` + identify |
| `app/(public)/onboarding/company/page.jsx` | Added `company_onboarding_submitted` + identify |
| `app/(public)/get-matched/page.jsx` | Added `get_matched_submitted` + identify |
| `app/api/onboarding/investor/route.js` | Added server-side `investor_onboarding_submitted` |
| `app/api/onboarding/company/route.js` | Added server-side `company_onboarding_submitted` |
| `app/api/get-matched/route.js` | Added server-side `get_matched_submitted` |

---

## Dashboard insights

| Insight | Type | URL |
|---|---|---|
| Investor onboarding funnel | Funnel | https://us.posthog.com/project/353808/insights/a8NTbkdO |
| Company onboarding funnel | Funnel | https://us.posthog.com/project/353808/insights/ruN7LOFJ |
| Searches performed over time | Trend (line) | https://us.posthog.com/project/353808/insights/FVymIHj0 |
| Signups & subscriptions | Trend (bar) | https://us.posthog.com/project/353808/insights/CyxdqOAM |
| Grant link clicks by grant title | Trend (bar value) | https://us.posthog.com/project/353808/insights/MwZM4AK0 |
