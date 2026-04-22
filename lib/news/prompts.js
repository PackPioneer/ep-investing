/**
 * lib/news/prompts.js
 *
 * Prompts for the Phase 2 enrichment pipeline. Kept in one file so we can
 * iterate on prompt quality without touching the worker code.
 *
 * Two-call structure:
 *   1. Haiku — structured extraction (classification, tags, entities, deal size)
 *   2. Sonnet — prose summary
 *
 * Both prompts are designed to be EXTRACTIVE for facts (numbers, names) and
 * to REFUSE if the article content isn't enough to answer confidently.
 * Investors will catch a hallucinated funding amount immediately.
 */

// Valid values for the classification field, mirrored from the DB constraint
export const CLASSIFICATIONS = [
  'funding', 'policy', 'm_and_a', 'product',
  'regulatory', 'market', 'partnership', 'other',
];

// Valid sector tags. Keep this list deliberately small for Phase 2 — we can
// expand it after we see which tags Claude reaches for organically in
// "other"-style returns. Broader = better recall on personalization later.
export const SECTOR_TAGS = [
  'solar', 'wind', 'battery-storage', 'ev', 'ev-charging',
  'grid', 'transmission', 'hydrogen', 'geothermal', 'nuclear',
  'smr', 'fusion', 'carbon-capture', 'carbon-removal', 'cdr',
  'ccus', 'direct-air-capture', 'biofuels', 'saf', 'green-hydrogen',
  'green-steel', 'green-cement', 'industrial-decarbonization',
  'heat-pumps', 'building-electrification', 'efficiency',
  'smart-meters', 'vpp', 'demand-response', 'microgrids',
  'utility-scale-solar', 'distributed-solar', 'offshore-wind',
  'onshore-wind', 'long-duration-storage', 'mining', 'critical-minerals',
  'recycling', 'circular-economy', 'agriculture', 'food-tech',
  'alternative-protein', 'forestry', 'soil-carbon', 'oceans',
  'climate-risk', 'climate-adaptation', 'water',
  'fuel-cells', 'shipping', 'aviation', 'rail', 'heavy-duty-transport',
  'data-center-energy', 'ai-for-climate',
];

// Geography tags. Use ISO-2 for countries, sub-region strings for states/provinces.
// Free-form; Claude can return anything, we just give it hints.
export const GEOGRAPHY_HINTS = `
Country codes: US, CA, MX, BR, UK, EU, DE, FR, ES, IT, NL, DK, NO, SE,
CN, IN, JP, KR, AU, NZ, AE, SA, ZA, NG, KE, EG.
US states: California, Texas, New York, Massachusetts, Colorado, etc.
Regional: Europe, Southeast-Asia, MENA, Sub-Saharan-Africa, LatAm.
Global: use "Global" when the article isn't geographically bounded.
`.trim();

/**
 * Haiku prompt. Returns structured JSON with classification, tags, entities,
 * and deal size. This is the workhorse extraction call.
 *
 * NOTE: we instruct Haiku to return null rather than guess. A false "funding"
 * classification on a product-launch article would mess up the feed for every
 * investor who filters by funding events.
 */
export function buildExtractionPrompt({ title, source, publishedAt, content }) {
  const classificationList = CLASSIFICATIONS.join(', ');
  const sectorList = SECTOR_TAGS.join(', ');

  return `You are an extraction engine for a climate-tech investor intelligence platform. Given a news article, return a single JSON object with structured metadata. Do NOT include any prose outside the JSON.

<article>
<source>${source}</source>
<published>${publishedAt ?? 'unknown'}</published>
<title>${title}</title>
<content>
${content}
</content>
</article>

Return JSON with exactly these fields:

{
  "classification": one of [${classificationList}],
  "geography_tags": array of 0-4 location strings (${GEOGRAPHY_HINTS.replace(/\n/g, ' ')}),
  "sector_tags": array of 0-4 strings drawn from [${sectorList}] OR free-form tags if none fit,
  "entities": array of objects describing companies, people, policies, agencies, or funds mentioned. Each object: { "type": "company" | "person" | "policy" | "agency" | "fund", "name": string },
  "deal_size_usd": integer USD amount if the article states a specific funding amount, acquisition price, or investment size, otherwise null. Convert from millions/billions (e.g., "$50M" becomes 50000000). If multiple amounts, use the headline deal size.
}

Rules:
- If the article isn't clearly about one of the classifications, use "other".
- If an amount is given in another currency (€, £, CNY, INR), do NOT convert — return null rather than guess an exchange rate.
- If the article only mentions a company briefly without it being a subject, DO NOT include it in entities.
- Extract at most 10 entities. Prioritize subjects of the article over passing mentions.
- Return ONLY the JSON object. No markdown fences, no commentary.`;
}

/**
 * Sonnet prompt. Returns a 2-sentence factual summary.
 *
 * The emphasis on "what the article STATES" rather than "what the article is
 * about" forces extractive behavior — Sonnet won't editorialize or add context
 * from its training data.
 */
export function buildSummaryPrompt({ title, source, content }) {
  return `You are a climate-tech intelligence analyst. Summarize the following article in EXACTLY two sentences for a sophisticated investor audience.

<article>
<source>${source}</source>
<title>${title}</title>
<content>
${content}
</content>
</article>

Requirements:
- Sentence 1: what the article states happened — the who, what, and how much. Use specific numbers and named entities from the article.
- Sentence 2: the material implication for the climate-tech sector or related markets, drawn directly from what the article claims (not your general knowledge).
- Total length: 40-70 words across both sentences.
- Do NOT hedge with "according to the article" or "the piece reports". Write direct declarative prose.
- Do NOT speculate beyond what the article says. If the article doesn't state an implication, write a second sentence that contextualizes the event factually (e.g., comparable deals, regulatory context the article itself provides).
- Do NOT include markdown, quotation marks, or any formatting. Plain prose only.

Return ONLY the two-sentence summary. No preamble, no explanation.`;
}
