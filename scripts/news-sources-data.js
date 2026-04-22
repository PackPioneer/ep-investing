/**
 * Phase 1 news sources.
 *
 * URLs use each publication's documented or commonly-used RSS path. The seed
 * script validates every feed before insert — broken URLs surface as warnings
 * in the console rather than silently becoming dead rows.
 *
 * Fields:
 *   slug              stable identifier (do not change once seeded)
 *   name              display name
 *   feed_url          RSS/Atom/API endpoint
 *   feed_type         'rss' | 'api' | 'scrape'
 *   homepage_url      for attribution links in the UI
 *   region            'us' | 'eu' | 'uk' | 'global' | 'china' | 'india' |
 *                     'latam' | 'africa' | 'mena' | 'apac'
 *   category          'climate_publication' | 'press_release' | 'policy' |
 *                     'analysis' | 'primary_journalism'
 *   credibility_tier  1 = primary/high-trust, 2 = reputable, 3 = watch-listed
 *   is_secondary_source  true when the source aggregates/analyzes other
 *                        outlets' reporting rather than doing its own
 *   attribution_label    shown as a small badge on article cards
 *   notes                engineering notes, not shown to users
 */

export const PHASE_1_SOURCES = [
  // --------------------------------------------------------------------------
  // Tier 1 — Climate publications (primary reporting)
  // --------------------------------------------------------------------------
  {
    slug: 'canary-media',
    name: 'Canary Media',
    feed_url: 'https://www.canarymedia.com/feed',
    feed_type: 'rss',
    homepage_url: 'https://www.canarymedia.com',
    region: 'us',
    category: 'climate_publication',
    credibility_tier: 1,
    is_secondary_source: false,
  },
  {
    slug: 'heatmap',
    name: 'Heatmap News',
    feed_url: 'https://heatmap.news/feed',
    feed_type: 'rss',
    homepage_url: 'https://heatmap.news',
    region: 'us',
    category: 'climate_publication',
    credibility_tier: 1,
    is_secondary_source: false,
  },
  {
    slug: 'latitude-media',
    name: 'Latitude Media',
    feed_url: 'https://www.latitudemedia.com/news?format=rss',
    feed_type: 'rss',
    homepage_url: 'https://www.latitudemedia.com',
    region: 'us',
    category: 'climate_publication',
    credibility_tier: 1,
    is_secondary_source: false,
    notes: 'Squarespace ?format=rss path. Verify on first run.',
  },
  {
    slug: 'cipher',
    name: 'Cipher',
    feed_url: 'https://www.ciphernews.com/feed',
    feed_type: 'rss',
    homepage_url: 'https://www.ciphernews.com',
    region: 'global',
    category: 'climate_publication',
    credibility_tier: 1,
    is_secondary_source: false,
    notes: 'Published by Breakthrough Energy. Verify feed URL on first run.',
  },
  {
    slug: 'ctvc',
    name: 'CTVC',
    feed_url: 'https://www.ctvc.co/rss',
    feed_type: 'rss',
    homepage_url: 'https://www.ctvc.co',
    region: 'global',
    category: 'analysis',
    credibility_tier: 1,
    is_secondary_source: false,
    notes: 'Climate Tech VC. Very high signal for deal flow.',
  },
  {
    slug: 'the-energy-pioneer',
    name: 'The Energy Pioneer',
    feed_url: 'https://www.theenergypioneer.com/rss',
    feed_type: 'rss',
    homepage_url: 'https://www.theenergypioneer.com',
    region: 'global',
    category: 'primary_journalism',
    credibility_tier: 1,
    is_secondary_source: false,
    attribution_label: 'EP Investing partner publication',
    notes: 'Own publication. If /rss path not live, scrape or add RSS to site.',
  },
  {
    slug: 'utility-dive',
    name: 'Utility Dive',
    feed_url: 'https://www.utilitydive.com/feeds/news/',
    feed_type: 'rss',
    homepage_url: 'https://www.utilitydive.com',
    region: 'us',
    category: 'climate_publication',
    credibility_tier: 1,
    is_secondary_source: false,
  },

  // --------------------------------------------------------------------------
  // Tier 2 — Secondary / analysis (global coverage layer)
  // --------------------------------------------------------------------------
  {
    slug: 'carbon-brief',
    name: 'Carbon Brief',
    feed_url: 'https://www.carbonbrief.org/feed/',
    feed_type: 'rss',
    homepage_url: 'https://www.carbonbrief.org',
    region: 'global',
    category: 'analysis',
    credibility_tier: 1,
    is_secondary_source: true,
    attribution_label: 'via Carbon Brief',
    notes: 'High-signal secondary source. Strong for China/India policy analysis.',
  },
  {
    slug: 'dialogue-earth',
    name: 'Dialogue Earth',
    feed_url: 'https://dialogue.earth/en/feed/',
    feed_type: 'rss',
    homepage_url: 'https://dialogue.earth',
    region: 'global',
    category: 'analysis',
    credibility_tier: 1,
    is_secondary_source: true,
    attribution_label: 'via Dialogue Earth',
    notes: 'Formerly China Dialogue. Strong Asia and LatAm climate coverage.',
  },
  {
    slug: 'climate-home-news',
    name: 'Climate Home News',
    feed_url: 'https://www.climatechangenews.com/feed/',
    feed_type: 'rss',
    homepage_url: 'https://www.climatechangenews.com',
    region: 'global',
    category: 'climate_publication',
    credibility_tier: 1,
    is_secondary_source: false,
    notes: 'Good non-Western coverage.',
  },

  // --------------------------------------------------------------------------
  // Press releases (company news, funding, partnerships)
  // --------------------------------------------------------------------------
  {
    slug: 'businesswire-sustainability',
    name: 'BusinessWire — Sustainability',
    feed_url: 'https://www.businesswire.com/portal/site/home/template.RSS/?vnsId=31422',
    feed_type: 'rss',
    homepage_url: 'https://www.businesswire.com',
    region: 'global',
    category: 'press_release',
    credibility_tier: 2,
    is_secondary_source: false,
    notes: 'Sustainability category feed. Verify vnsId; BW changes these occasionally.',
  },

  // --------------------------------------------------------------------------
  // US federal policy (free government APIs)
  // --------------------------------------------------------------------------
  {
    slug: 'federal-register-climate',
    name: 'Federal Register — Environmental Protection',
    feed_url: 'https://www.federalregister.gov/api/v1/documents.rss?conditions%5Btopics%5D%5B%5D=environmental-protection',
    feed_type: 'rss',
    homepage_url: 'https://www.federalregister.gov',
    region: 'us',
    category: 'policy',
    credibility_tier: 1,
    is_secondary_source: false,
    notes: 'Official Federal Register API filtered by environmental-protection topic.',
  },
  {
    slug: 'doe-press',
    name: 'US Department of Energy — News',
    feed_url: 'https://www.energy.gov/rss/articles.xml',
    feed_type: 'rss',
    homepage_url: 'https://www.energy.gov',
    region: 'us',
    category: 'policy',
    credibility_tier: 1,
    is_secondary_source: false,
    notes: 'Verify path — DOE reorganized their site in 2025.',
  },
  {
    slug: 'epa-press',
    name: 'US EPA — News Releases',
    feed_url: 'https://www.epa.gov/newsreleases/search/rss',
    feed_type: 'rss',
    homepage_url: 'https://www.epa.gov',
    region: 'us',
    category: 'policy',
    credibility_tier: 1,
    is_secondary_source: false,
  },

  // --------------------------------------------------------------------------
  // EU / UK policy
  // --------------------------------------------------------------------------
  {
    slug: 'eu-commission-climate',
    name: 'European Commission — Climate Action',
    feed_url: 'https://climate.ec.europa.eu/news_en?f%5B0%5D=oe_news_type%3Ahttp%3A//publications.europa.eu/resource/authority/resource-type/PRESS_REL&_format=rss',
    feed_type: 'rss',
    homepage_url: 'https://climate.ec.europa.eu',
    region: 'eu',
    category: 'policy',
    credibility_tier: 1,
    is_secondary_source: false,
    notes: 'EU Commission Drupal RSS. Verify on first run — query params may shift.',
  },
];
