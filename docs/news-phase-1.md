# Phase 1 — News Ingestion Deploy Guide

This is what ships in Phase 1:

- **Supabase schema** for news_sources, news_articles, news_entities, policies, user_news_preferences, user_news_interactions, news_ingestion_runs
- **15 seed sources** across US/EU/UK/global, validated on seed
- **Ingestion library** with URL normalization, dedup, and audit logging
- **Vercel cron** that runs hourly
- **`/news` page** with auth gating, source + region filters, pagination

Not in Phase 1 (and NOT blocking on this): AI enrichment, summaries, personalization, policy tracker, digest emails.

---

## 1. Install dependencies

```bash
npm install rss-parser
```

Everything else (`@supabase/supabase-js`, `@clerk/nextjs`, `next`, `dotenv`) you already have.

## 2. Add env vars

Add to `.env.local` and to Vercel project settings:

```
CRON_SECRET=<generate a long random string, e.g. `openssl rand -hex 32`>
```

Everything else (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) you already have.

## 3. Enable pgvector (one-time, in Supabase dashboard)

Go to Supabase → Database → Extensions, search for `vector`, and enable it. Managed Supabase requires this to be done via the dashboard before a migration can use `CREATE EXTENSION vector`.

## 4. Run the migration

```bash
# Via Supabase CLI
supabase db push

# Or paste supabase/migrations/20260421000000_news_schema.sql into the
# Supabase SQL editor and run it.
```

The migration creates 7 tables and adds the RLS defense layer (no permissive policies — all access goes through service-role API routes, matching your existing pattern).

## 5. Seed the sources

```bash
node scripts/seed-news-sources.js
```

The script fetches every feed before inserting. Expected output:

```
  canary-media                    ✓ 20 items
  heatmap                         ✓ 15 items
  latitude-media                  ⚠ inactive — 404 Not Found
  ...
```

**Any source that fails validation is inserted with `active=false`.** Fix the URL in `scripts/news-sources-data.js` and re-run, or flip `active=true` manually in Supabase once the URL is corrected.

Sources I flagged in comments that need verification after seeding:
- `latitude-media` — Squarespace `?format=rss` pattern, may differ
- `cipher` — need to confirm exact feed path
- `the-energy-pioneer` — your own site; confirm `/rss` is exposed or we'll need to add it
- `businesswire-sustainability` — `vnsId` param changes occasionally
- `doe-press` — DOE reorganized their site in 2025
- `eu-commission-climate` — Drupal RSS with query params

If any of these are wrong, the seed script will flag them and they'll just be inactive until you fix the URL.

## 6. Run ingestion once manually

```bash
# Ingest all sources
node scripts/ingest-news-once.js

# Or test a single source
node scripts/ingest-news-once.js canary-media
```

You should see articles populated in `news_articles`. Every run also writes a row to `news_ingestion_runs` with counts and errors.

## 7. Deploy and verify cron

Push to Vercel. The `vercel.json` at the root registers the hourly cron (`0 * * * *`) pointing at `/api/cron/ingest-news`.

To manually trigger once on production:

```bash
curl https://epinvesting.com/api/cron/ingest-news \
  -H "Authorization: Bearer $CRON_SECRET"
```

Check Vercel's cron dashboard (Project → Cron Jobs) to confirm it's registered, and the Functions logs to watch the first few hourly runs.

## 8. Smoke test `/news`

- Visit `/news` logged out → should see 3 teaser headlines + paywall CTA
- Visit `/news` logged in → full feed with filter sidebar
- Try `?source=canary-media` and `?region=us` — filters should narrow results
- Pagination: `?page=2`

---

## File inventory

```
supabase/migrations/20260421000000_news_schema.sql   # DB schema (run once)
scripts/news-sources-data.js                         # The 15 sources, editable
scripts/seed-news-sources.js                         # Seed + validate
scripts/ingest-news-once.js                          # Manual ingestion (dev/debug)
lib/news/url-hash.js                                 # URL normalization + hash
lib/news/ingestion.js                                # Core ingestion logic
lib/news/access.js                                   # Paywall gating helper
app/api/cron/ingest-news/route.js                    # Vercel cron handler
app/news/page.jsx                                    # Public /news page
vercel.json                                          # Cron schedule config
```

If you already have a `vercel.json`, merge the `crons` array in rather than replacing the file.

## Debugging

**"No articles showing up on /news"**
- Check `news_ingestion_runs` — did the cron run? Any errors?
- Check `news_sources` — are sources `active=true`? What's in `last_error`?
- Run `node scripts/ingest-news-once.js <slug>` to test a single source interactively

**"Same article appearing twice"**
- The url_hash unique constraint should prevent this. If you see dupes, it means two RSS feeds are serving the same article with URLs that normalize to different hashes. Look at the two `url` fields in the DB and add the differing tracking param to `TRACKING_PARAMS` in `lib/news/url-hash.js`.

**"Feed is timing out / slow"**
- `parser` timeout is 20s per feed; 15 sources × 20s worst case = 5min, matches `maxDuration`. If one feed is consistently slow, bump its `fetch_interval_hours` in `news_sources` so it runs less often.

## What's next

Phase 2 (enrichment): pgvector embeddings, entity extraction via Claude Haiku, factual summaries, classification. The schema already has the columns waiting — Phase 2 is just the worker that fills them in.
