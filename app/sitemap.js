import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.epinvesting.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cache the sitemap for 1 hour — Next will regenerate on the next request after.
export const revalidate = 3600;

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
  ].map(p => ({ ...p, lastModified: now }));

  // -------- COMPANIES (filtered to meaningful content) --------
  const { data: companies } = await supabase
    .from("companies")
    .select("id, description, last_scraped_at, created_at")
    .not("description", "is", null);

  const companyEntries = (companies || [])
    .filter(c => c.description && c.description.length > 50)
    .map(c => ({
      url: `${BASE_URL}/companies/${c.id}`,
      lastModified: new Date(c.last_scraped_at || c.created_at || now),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  // -------- INVESTORS --------
  const { data: investors } = await supabase
    .from("vc_firms")
    .select("id, created_at");
  const investorEntries = (investors || []).map(i => ({
    url: `${BASE_URL}/investors/${i.id}`,
    lastModified: new Date(i.created_at || now),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // -------- NGOs --------
  const { data: ngos } = await supabase
    .from("ngos")
    .select("slug, created_at");
  const ngoEntries = (ngos || []).map(n => ({
    url: `${BASE_URL}/ngos/${n.slug}`,
    lastModified: new Date(n.created_at || now),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // -------- GRANTS --------
  const { data: grants } = await supabase
    .from("grants")
    .select("id, created_at");
  const grantEntries = (grants || []).map(g => ({
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
