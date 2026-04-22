# Phase 2 — AI Enrichment Deploy Guide

Phase 2 adds AI-generated summaries, classification, geography/sector tags, and entity extraction to every article. The `/news` page starts showing AI summaries instead of raw RSS excerpts. Personalization and embeddings remain deferred to Phase 3.

## Files added or changed

```
lib/news/prompts.js          NEW  — Haiku + Sonnet prompt templates
lib/news/enrichment.js       NEW  — Per-article enrichment worker
app/api/cron/ingest-news/route.js   CHANGED — runs enrichment after ingestion
scripts/enrich-backfill.js   NEW  — Backfill existing articles
app/news/page.jsx            CHANGED — shows summary_factual when available
```

## 1. Install the Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

## 2. Add your Anthropic API key to env vars

You said you already have a key. Add it in two places:

**Local** — append to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

**Vercel** — Project Settings → Environment Variables → add `ANTHROPIC_API_KEY`, paste the value, check Production / Preview / Development, save.

## 3. Drop the new files into your project

Download the Phase 2 zip and unzip in Downloads. Then from your `ep-investing` root:

```bash
cp -r ~/Downloads/ep-phase-2/lib/. lib/
cp -r ~/Downloads/ep-phase-2/scripts/. scripts/
cp -r ~/Downloads/ep-phase-2/app/. app/
```

The `app/api/cron/ingest-news/route.js` and `app/news/page.jsx` will overwrite your Phase 1 versions — that's expected.

## 4. Backfill the 195 existing articles

Rather than waiting for the daily cron to chip through them 30 at a time (would take a week), run the backfill from your terminal. This processes everything in a few minutes.

```bash
node scripts/enrich-backfill.js
```

Expected output:
```
Pending articles to enrich: 195
Processing up to 195 articles in batches of 50 (concurrency 5).

  Batch 1: 49✓ 1✗ (42.3s) — running total: 49/50
  Batch 2: 50✓ 0✗ (38.7s) — running total: 99/100
  Batch 3: 48✓ 2✗ (41.0s) — running total: 147/150
  Batch 4: 45✓ 0✗ (35.2s) — running total: 192/195
  ...

Done. Enriched 192 articles, 3 failed.
Pending remaining: 0
```

A few failures are normal — usually articles where the RSS content was too short for the model to summarize, or an entity insert conflict. Not worth chasing unless the failure rate exceeds ~10%.

**Cost check:** ~195 articles × $0.0085 = ~$1.70. You'll see this hit your Anthropic billing within a few hours.

## 5. Verify in the database

Open Supabase → Table Editor → `news_articles`. Click into a few rows and check:

- `summary_factual` — should contain 2-sentence prose summary
- `classification` — should be one of: funding, policy, m_and_a, product, regulatory, market, partnership, other
- `geography_tags` and `sector_tags` — should be arrays of short strings
- `deal_size_usd` — should be populated for funding/M&A articles, null for others
- `enrichment_status` — should be 'done' for successes, 'failed' for errors

Also check `news_entities` — one row per entity mentioned. For a well-enriched article, expect 3-8 entity rows.

## 6. Deploy

```bash
git add .
git commit -m "Phase 2: AI enrichment pipeline"
git push
```

Vercel auto-deploys. Once live, the next daily cron run will ingest new articles AND enrich them in the same invocation.

## 7. Verify `/news` is showing summaries

Visit `/news` in your browser. Article cards should now show AI-generated 2-sentence summaries instead of truncated RSS excerpts. Summaries will be noticeably denser and more useful — they'll state the specific numbers and named entities instead of trailing off mid-sentence.

Articles that failed enrichment still fall back to the RSS excerpt, so users always see *something*.

## What's running now

- Every day at 6 AM UTC: cron fetches new articles from 8 feeds, then enriches up to 30 of them with Claude
- If any articles fail enrichment, they're retried on the next run (up to 3 attempts)
- Failed articles stay in the DB but are skipped by the retry logic after 3 attempts — you can manually reset them with a SQL update if you want to try again

## Debugging

**"Cron ran but no articles got enriched"**
Check `news_articles` — any rows with `enrichment_status = 'failed'` and an `enrichment_error`? Most common cause: missing `ANTHROPIC_API_KEY` in Vercel.

**"Summaries look wrong or hallucinated"**
Open `lib/news/prompts.js` and tune the prompt. The summary prompt has specific guardrails against hallucination, but you can tighten them further if you see issues. After changing prompts, reset some articles to `enrichment_status='pending'` and re-run the backfill to regenerate.

**"Cron is timing out"**
On Vercel Hobby your maxDuration is capped at 10s, which can't fit ingestion+enrichment. Either upgrade to Pro ($20/mo, 300s timeout) or drop `ENRICH_PER_RUN` to something tiny like 3 in `route.js`.

## What's next (Phase 3)

- OpenAI embeddings for semantic search
- Personalized "For You" tabs in investor + company dashboards
- User feedback loop (thumbs up/save) feeding the ranking
- Investor emphasis modes (portfolio / dealflow / thesis)
