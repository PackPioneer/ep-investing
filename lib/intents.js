// lib/intents.js
// "What are you here to do" onboarding question — sales-segmentation data.

export const INTENTS = [
  { slug: "stay_informed", label: "Stay informed on the industry" },
  { slug: "find_companies", label: "Discover companies & startups" },
  { slug: "track_market", label: "Track the market & competitors" },
  { slug: "find_collaborators", label: "Find collaborators & partners" },
  { slug: "career", label: "Explore career opportunities" },
  { slug: "source_deals", label: "Source deals & investments" },
  { slug: "get_listed", label: "Get discovered / list myself as an expert" },
];

export const INTENT_LABELS = Object.fromEntries(
  INTENTS.map((i) => [i.slug, i.label])
);

export const INTENT_SLUGS = INTENTS.map((i) => i.slug);