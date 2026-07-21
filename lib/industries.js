// lib/industries.js
// Single source of truth for the industries an individual can follow.
// Slugs MUST match the values stored in companies.industry_tags so the
// personalized feed filters correctly against existing data.

export const INDUSTRIES = [
  { slug: "industrial_decarbonization", label: "Industrial Decarbonization" },
  { slug: "battery_storage", label: "Battery Storage" },
  { slug: "electric_aviation", label: "Electric Aviation" },
  { slug: "green_hydrogen", label: "Green Hydrogen" },
  { slug: "solar", label: "Solar" },
  { slug: "ev_charging", label: "EV Charging" },
  { slug: "clean_cooking", label: "Clean Cooking" },
  { slug: "nuclear_technologies", label: "Nuclear Technologies" },
  { slug: "wind_energy", label: "Wind Energy" },
  { slug: "carbon_credits", label: "Carbon Credits" },
  { slug: "saf_efuels", label: "SAF & E-Fuels" },
  { slug: "direct_air_capture", label: "Direct Air Capture" },
  { slug: "grid_storage", label: "Grid Storage" },
  { slug: "geothermal_energy", label: "Geothermal Energy" },
  { slug: "energy_generation", label: "Energy Generation" },
  { slug: "energy_efficiency", label: "Energy Efficiency" },
];

export const INDUSTRY_LABELS = Object.fromEntries(
  INDUSTRIES.map((i) => [i.slug, i.label])
);

export const INDUSTRY_SLUGS = INDUSTRIES.map((i) => i.slug);

export const MAX_INDUSTRIES = 5;