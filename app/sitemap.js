import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.epinvesting.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cache the sitemap for 1 hour — Next regenerates on the next request after.
export const revalidate = 3600;

// Supabase caps a single select at 1000 rows. Paginate to get everything.
async function fetchAll(table, columns, filter) {
  const all = [];
  const PAGE = 1000;
  let from = 0;
  while (true) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1);
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export default async function sitemap() {
  const now = new Date();

  // -------- STATIC PAGES --------
  const staticPages = [
    { url: BASE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${BASE_URL}/companies`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/investors`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/ngos`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${BASE_URL}/grants`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${BASE_URL}/jobs`, priority: 0.9, changeFrequency: "daily" },
    { url: `${BASE_URL}/experts`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE_URL}/insights`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${BASE_URL}/pricing`, priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE_URL}/ngos/about`, priority: 0.5, changeFrequency: "monthly" },
  ].map((p) => ({ ...p, lastModified: now }));

  // -------- COMPANIES (slug URLs, only meaningful content, all rows) --------
  const companies = await fetchAll(
    "companies",
    "id, slug, description, last_scraped_at, created_at, is_hidden",
    (q) => q.not("description", "is", null)
  );
  const companyEntries = companies
    .filter((c) => c.description && c.description.length > 50 && !c.is_hidden && c.slug)
    .map((c) => ({
      url: `${BASE_URL}/companies/${c.slug}`,
      lastModified: new Date(c.last_scraped_at || c.created_at || now),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  // -------- INVESTORS (still id URLs — no slug column yet) --------
  const investors = await fetchAll("vc_firms", "id, created_at");
  const investorEntries = investors.map((i) => ({
    url: `${BASE_URL}/investors/${i.id}`,
    lastModified: new Date(i.created_at || now),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // -------- NGOs (slug URLs) --------
  const ngos = await fetchAll("ngos", "slug, created_at");
  const ngoEntries = ngos
    .filter((n) => n.slug)
    .map((n) => ({
      url: `${BASE_URL}/ngos/${n.slug}`,
      lastModified: new Date(n.created_at || now),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  // -------- GRANTS --------
  const grants = await fetchAll("grants", "id, created_at");
  const grantEntries = grants.map((g) => ({
    url: `${BASE_URL}/grants/${g.id}`,
    lastModified: new Date(g.created_at || now),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...companyEntries,
    ...investorEntries,
    ...ngoEntries,
    ...grantEntries,
  ];
}
