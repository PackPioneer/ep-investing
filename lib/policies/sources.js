/**
 * lib/policies/sources.js
 *
 * Registry of policy sources we ingest from. Each source has a unique slug,
 * a fetcher type, and source-specific config.
 *
 * Federal Register sources use agency slugs from federalregister.gov/agencies.
 * Cross-reference:
 *   https://www.federalregister.gov/agencies/environmental-protection-agency
 *   https://www.federalregister.gov/agencies/energy-department
 *   https://www.federalregister.gov/agencies/federal-energy-regulatory-commission
 *   https://www.federalregister.gov/agencies/nuclear-regulatory-commission
 *
 * We deliberately start narrow (4 agencies) so the ingestion doesn't drown
 * in non-climate content. Expanding later is a one-line addition here.
 */

export const POLICY_SOURCES = [
  // --------------------------------------------------------------------------
  // US Federal — primary sources via Federal Register API (no key needed)
  // --------------------------------------------------------------------------
  {
    slug: 'us-epa',
    name: 'US EPA',
    type: 'federal_register',
    jurisdiction: 'US',
    agency_name: 'Environmental Protection Agency',
    agency_slug: 'environmental-protection-agency',
    credibility_tier: 1,
    is_secondary: false,
  },
  {
    slug: 'us-doe',
    name: 'US Department of Energy',
    type: 'federal_register',
    jurisdiction: 'US',
    agency_name: 'Department of Energy',
    agency_slug: 'energy-department',
    credibility_tier: 1,
    is_secondary: false,
  },
  {
    slug: 'us-ferc',
    name: 'US FERC',
    type: 'federal_register',
    jurisdiction: 'US',
    agency_name: 'Federal Energy Regulatory Commission',
    agency_slug: 'federal-energy-regulatory-commission',
    credibility_tier: 1,
    is_secondary: false,
  },
  {
    slug: 'us-nrc',
    name: 'US Nuclear Regulatory Commission',
    type: 'federal_register',
    jurisdiction: 'US',
    agency_name: 'Nuclear Regulatory Commission',
    agency_slug: 'nuclear-regulatory-commission',
    credibility_tier: 1,
    is_secondary: false,
  },

  // --------------------------------------------------------------------------
  // EU / UK — primary sources. Ingested via RSS since EUR-Lex and gov.uk
  // both publish structured feeds. Added to news_sources in Phase 1 for the
  // news corpus; re-ingested here into the policies table.
  // --------------------------------------------------------------------------
  
  {
    slug: 'uk-desnz',
    name: 'UK DESNZ',
    type: 'rss',
    feed_url: 'https://www.gov.uk/government/organisations/department-for-energy-security-and-net-zero.atom',
    jurisdiction: 'UK',
    credibility_tier: 1,
    is_secondary: false,
  },

  // --------------------------------------------------------------------------
  // Secondary sources for non-Western regions. These are already ingested
  // into news_articles — Phase 4A doesn't re-ingest; instead the UI shows
  // classification='policy' articles from these sources alongside the
  // primary policies. This keeps coverage honest without pretending we have
  // primary MEE / MoEFCC data.
  // --------------------------------------------------------------------------
  // (intentionally empty — handled via news_articles with policy classification)
];

/**
 * Convenience lookup by slug.
 */
export function getSourceBySlug(slug) {
  return POLICY_SOURCES.find((s) => s.slug === slug) ?? null;
}
