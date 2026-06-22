import { createClient } from "@supabase/supabase-js";
import { formatSector } from "@/lib/sectors";
import CompanyProfileClient from "./CompanyProfileClient";

const BASE_URL = "https://www.epinvesting.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export const revalidate = 3600;

async function getCompany(idOrSlug) {
  const isNumeric = /^\d+$/.test(String(idOrSlug));
  const { data } = await supabase
    .from("companies")
    .select("id, name, slug, description, sector, industry_tags, logo_url, url, headquarters_city, headquarters_country, location")
    .eq(isNumeric ? "id" : "slug", idOrSlug)
    .single();
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const c = await getCompany(id);
  if (!c) return { title: "Company | EP Investing" };

  const sector =
    (c.industry_tags && c.industry_tags[0] && formatSector(c.industry_tags[0])) ||
    (c.sector && formatSector(c.sector)) ||
    "Climate Tech";
  const title = `${c.name} — ${sector} | EP Investing`;
  const description = (c.description || `${c.name} — a ${sector} company on EP Investing, the climate investing platform.`)
    .replace(/\s+/g, " ")
    .slice(0, 155);
  const canonical = `${BASE_URL}/companies/${c.slug || c.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "EP Investing",
      images: c.logo_url ? [{ url: c.logo_url }] : [],
    },
    twitter: {
      card: c.logo_url ? "summary" : "summary",
      title,
      description,
      images: c.logo_url ? [c.logo_url] : [],
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const c = await getCompany(id);

  // JSON-LD Organization structured data so search engines understand the entity.
  const jsonLd = c
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: c.name,
        url: c.url || `${BASE_URL}/companies/${c.slug || c.id}`,
        ...(c.logo_url ? { logo: c.logo_url } : {}),
        ...(c.description ? { description: c.description.replace(/\s+/g, " ").slice(0, 300) } : {}),
        ...(c.location || c.headquarters_city
          ? { address: { "@type": "PostalAddress", addressLocality: c.headquarters_city || c.location, addressCountry: c.headquarters_country || undefined } }
          : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CompanyProfileClient />
    </>
  );
}
