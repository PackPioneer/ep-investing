// SEO slug helpers.
// Investor URLs are `/investors/{name-slug}-{id}` so the firm name appears in the
// path for search ranking, while the trailing numeric id keeps them unique and
// backward-compatible with bare `/investors/{id}` links.

const DIACRITICS = /[̀-ͯ]/g;

export function slugify(str) {
  return (
    String(str || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(DIACRITICS, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/, "") || "investor"
  );
}

// Build the public path for an investor record ({ id, name }).
export function investorPath(inv) {
  if (!inv || inv.id == null) return "/investors";
  const s = slugify(inv.name);
  return `/investors/${s}-${inv.id}`;
}

// Extract the numeric id from a slug param like "trust-ventures-123" or a bare "123".
export function idFromSlug(param) {
  const raw = String(param || "");
  const m = raw.match(/(\d+)$/);
  return m ? m[1] : raw;
}
