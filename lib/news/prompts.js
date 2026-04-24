/**
 * lib/news/prompts.js
 *
 * Phase 6 update: CLASSIFICATIONS expanded to support four new widget
 * types. The disambiguation hints in the extraction prompt tell Haiku
 * how to pick between categories that might overlap (e.g. a fund_close
 * vs a funding round).
 */

export const CLASSIFICATIONS = [
  'funding',           // startup raises money (Series A/B/C/D/seed)
  'fund_close',        // VC/PE/growth fund announces a new fund closing   [NEW]
  'ipo',               // IPO, direct listing, SPAC merger, S-1 filing      [NEW]
  'earnings',          // public company quarterly earnings or guidance    [NEW]
  'leadership_change', // exec hire, departure, promotion, board appointment [NEW]
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
  "geography_tags": array of 0-5 ISO country codes or region names (e.g. "US", "EU", "California", "China"),
  "sector_tags": array of 0-5 tags from ${JSON.stringify(SECTOR_TAGS)},
  "entities": array of 0-10 {"type": ..., "name": ...} objects. Types: "company", "person", "policy", "agency", "fund".
  "deal_size_usd": integer USD amount if a specific deal size is mentioned (e.g. $50M raise = 50000000), else null
}

Classification guidance — be strict about these distinctions:
- "funding" = startup or private company raises capital (Series A/B/C/D, seed, strategic investment). Subject is the company raising.
- "fund_close" = an investment firm (VC, PE, growth, infrastructure fund) announces a new fund closing or first close. Subject is the fund/firm raising capital from LPs.
- "ipo" = public offering, direct listing, SPAC merger, S-1 filing, pre-IPO roadshow. "IPO", "going public", "direct listing", "filed to go public" are strong signals.
- "earnings" = publicly-traded company reports quarterly earnings, issues guidance, or announces a profit warning. "Q3 earnings", "beats estimates", "guidance".
- "leadership_change" = exec hires, departures, promotions, or board appointments. "Joins as CEO", "named CTO", "steps down", "appointed to board". If coverage is also about funding, pick the primary subject of the article.
- "m_and_a" = merger, acquisition, or divestiture where one company buys/combines with another. Strategic partnerships where no controlling interest changes hands are "partnership" not "m_and_a".
- "policy" = legislation, executive orders, international agreements. Draft or enacted.
- "regulatory" = agency action on an existing policy (FERC rulings, EPA enforcement, permit decisions).
- "product" = product launch, technology announcement, operational milestone.
- "market" = market dynamics, pricing, commodity movements, capacity buildouts with no single dealing party.
- "partnership" = commercial agreement, PPA, offtake, joint development without ownership change.
- "other" = doesn't fit. Use sparingly.

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
