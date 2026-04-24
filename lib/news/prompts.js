/**
 * lib/news/prompts.js
 *
 * Phase 8 update: Aggressive disambiguation to push Haiku toward picking
 * the specific new categories (ipo, fund_close, earnings, leadership_change,
 * m_and_a) when signals exist, rather than defaulting to broader buckets.
 *
 * Key change from Phase 6:
 *  - Explicit "DECISION ORDER" instructs Haiku to check specific categories FIRST
 *    before falling through to broader ones.
 *  - Added signal words/phrases for each category.
 *  - Multi-topic articles now instructed to pick the PRIMARY subject, but with
 *    weighting toward specific categories.
 */

export const CLASSIFICATIONS = [
  'funding',
  'fund_close',
  'ipo',
  'earnings',
  'leadership_change',
  'policy',
  'm_and_a',
  'product',
  'regulatory',
  'market',
  'partnership',
  'other',
];

export const SECTOR_TAGS = [
  'solar', 'wind-energy', 'battery-storage', 'grid-storage', 'green-hydrogen',
  'ev-charging', 'electric-vehicles', 'carbon-credits', 'direct-air-capture',
  'saf-efuels', 'electric-aviation', 'nuclear-technologies', 'geothermal-energy',
  'clean-cooking', 'industrial-decarbonization', 'buildings-efficiency',
  'transmission', 'clean-heat', 'methane', 'air-quality', 'water', 'waste',
  'permitting', 'tax-incentives', 'disclosure', 'environmental-justice',
  'data-center-energy', 'heat-pumps', 'agriculture', 'forestry',
];

export function buildExtractionPrompt({ title, source, publishedAt, content }) {
  return `You are an analyst extracting structured data from a climate/energy industry news article.

Title: ${title}
Source: ${source ?? 'unknown'}
Published: ${publishedAt ?? 'unknown'}
Content:
${content}

Return a single JSON object:
{
  "classification": one of ${JSON.stringify(CLASSIFICATIONS)},
  "geography_tags": array of 0-5 ISO country codes or region names,
  "sector_tags": array of 0-5 tags from ${JSON.stringify(SECTOR_TAGS)},
  "entities": array of 0-10 {"type": ..., "name": ...}. Types: "company", "person", "policy", "agency", "fund".
  "deal_size_usd": integer USD amount if mentioned (e.g. $50M = 50000000), else null
}

CLASSIFICATION — DECISION ORDER. Check each of these in order. The FIRST one that matches wins:

1. "ipo"
   SIGNALS: "files S-1", "IPO", "initial public offering", "going public", "direct listing",
   "SPAC merger", "to go public", "confidential filing", "roadshow", "pre-IPO",
   "secondary offering" (when announced from private or newly-public entity), "prospectus".
   If article is primarily about a private company going public OR a newly-public company's
   listing/secondary, → "ipo".

2. "fund_close"
   SIGNALS: "closes fund", "hits hard cap", "final close", "first close", "fund announcement",
   "raised for fund", "new climate fund", "launches fund", "fundraise from LPs".
   The SUBJECT is an investment firm (VC, PE, growth equity, infrastructure, family office)
   raising capital from limited partners — NOT a startup raising.
   If the headline or lede is about an INVESTOR/FUND raising money, → "fund_close".
   Example: "TPG Rise Climate II closes at $1.5B" → fund_close.
   Example: "Company X raised $50M from TPG Rise Climate" → funding (NOT fund_close).

3. "earnings"
   SIGNALS: "Q1/Q2/Q3/Q4 earnings", "quarterly results", "beats estimates", "misses estimates",
   "guidance", "revenue miss", "raises full-year guidance", "EPS", "earnings call",
   "preliminary results", "profit warning", "analyst day".
   Company must be publicly-traded (has a ticker). If article discusses a public company's
   quarterly performance or forward guidance, → "earnings".

4. "leadership_change"
   SIGNALS: "named CEO/CTO/CFO", "appointed", "joins as", "steps down", "resigns",
   "promoted to", "elevated to", "new head of", "successor named", "board appointment",
   "interim CEO", "retires", "transitions to".
   If the PRIMARY subject of the article is an executive move, hire, departure, or board
   change, → "leadership_change". If hire coincides with funding but headline/lede emphasizes
   the person, pick leadership_change.

5. "m_and_a"
   SIGNALS: "acquires", "acquisition", "merger", "combines with", "to buy",
   "takes controlling stake", "divestiture", "spinoff", "sells unit to", "takeover".
   One company buys, combines with, or sells a controlling interest in another.
   If article describes a transaction where ownership transfers, → "m_and_a".
   Partnerships where no ownership changes are NOT m_and_a (see partnership).

6. "funding"
   SIGNALS: "Series A/B/C/D/seed", "raises $XM", "closes Series X round", "strategic investment",
   "venture round", "growth round", "pre-seed".
   The SUBJECT is an operating company (not a fund) raising capital.
   Only pick this if 1-5 above don't apply.

7. "policy"
   SIGNALS: legislation passed or proposed, executive orders, international agreements,
   multi-year plans, treaty commitments.

8. "regulatory"
   SIGNALS: agency rulemaking, proposed or final rules, permits, enforcement actions,
   Federal Register notices, FERC rulings, EPA determinations.

9. "product"
   SIGNALS: product launches, technology announcements, operational milestones, first
   deployments, certifications.

10. "partnership"
   SIGNALS: PPAs, offtake agreements, joint development, commercial agreements, MOUs,
   joint ventures where no controlling interest changes hands.

11. "market"
   SIGNALS: pricing, commodity movements, capacity buildouts with no single party,
   industry-wide trends, supply/demand analysis.

12. "other"
   ONLY use if nothing above fits. Use rarely.

TIE-BREAKERS:
- If the article genuinely could be two specific categories (e.g., a hire who also closed
  a funding round), pick the one the HEADLINE emphasizes.
- When ambiguous between a specific category (ipo, fund_close, earnings, leadership_change,
  m_and_a) and a broader one (funding, product, market, other), PREFER the specific one.
- Don't be afraid to pick the specific categories. They exist because they're valuable signals.

Output only the JSON, no markdown fences, no prose.`;
}

export function buildSummaryPrompt({ title, source, publishedAt, content }) {
  return `Summarize this climate/energy news article for a sophisticated investor audience.

Title: ${title}
Source: ${source ?? 'unknown'}
Published: ${publishedAt ?? 'unknown'}
Content:
${content}

Write 2-3 sentences (60-90 words) that capture:
- What happened
- The dollar amounts, parties, or regulatory bodies involved
- The most material implication for investors

Constraints:
- Factual and neutral. Don't speculate or add opinion.
- Skip basic industry context — the reader already knows the space.
- Don't use hedge words like "may", "could", "potentially" unless the article explicitly is uncertain.
- Output just the summary text, no preamble or headings.`;
}
