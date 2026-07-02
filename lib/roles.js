// lib/roles.js
// Single source of truth for the role an individual selects at onboarding.
// role is self-described identity (distinct from `is_listed`, which is the
// opt-in "listed as expert" state).

export const ROLES = [
  { slug: "consultant", label: "Consultant" },
  { slug: "analyst", label: "Analyst" },
  { slug: "researcher", label: "Researcher / Academic" },
  { slug: "journalist", label: "Journalist / Media" },
  { slug: "policy_maker", label: "Policy Maker / Government" },
  { slug: "industry_pro", label: "Industry Professional" },
  { slug: "investor_individual", label: "Investor (individual / angel)" },
  { slug: "student", label: "Student" },
  { slug: "interested", label: "Interested Party" },
  { slug: "other", label: "Other" },
];

export const ROLE_LABELS = Object.fromEntries(
  ROLES.map((r) => [r.slug, r.label])
);

export const ROLE_SLUGS = ROLES.map((r) => r.slug);