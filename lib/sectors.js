/**
 * Format a sector/industry tag from DB value to display label.
 * Handles special cases (SAF / E-Fuels, EV Charging) and falls back
 * to Title Case for everything else.
 */
export function formatSector(tag) {
  if (!tag) return "";

  const map = {
    saf_efuels: "SAF / E-Fuels",
    industrial_decarbonization: "Industrial Decarbonization",
    green_hydrogen: "Green Hydrogen",
    direct_air_capture: "Direct Air Capture",
    ev_charging: "EV Charging",
    nuclear_technologies: "Nuclear Technologies",
    battery_storage: "Battery Storage",
    electric_aviation: "Electric Aviation",
    carbon_credits: "Carbon Credits",
    grid_storage: "Grid Storage",
    wind_energy: "Wind Energy",
    clean_cooking: "Clean Cooking",
    "climate-tech": "Climate Tech",
    "market intelligence": "Market Intelligence",
    "saf efuels": "SAF / E-Fuels",
  };

  if (map[tag]) return map[tag];
  if (map[tag.toLowerCase()]) return map[tag.toLowerCase()];

  // Fallback: replace underscores/dashes with spaces, Title Case each word
  return tag
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}
