import { createClient } from "@supabase/supabase-js";
import NgoProfileClient from "./NgoProfileClient";

const BASE_URL = "https://www.epinvesting.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export const revalidate = 3600;

const ORG_TYPE_LABELS = {
  international_ngo: "International NGO",
  igo: "Intergovernmental Organization",
  foundation: "Foundation",
  ngo: "NGO",
  nonprofit: "Nonprofit",
};

async function getNgo(slug) {
  const { data } = await supabase
    .from("ngos")
    .select("id, slug, name, org_type, short_description, bio, logo_url, website_url, headquarters_country")
    .eq("slug", slug)
    .single();
  return data;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const n = await getNgo(slug);
  if (!n) return { title: "Organization | EP Network" };

  const type = ORG_TYPE_LABELS[n.org_type] || "Organization";
  const title = `${n.name} — ${type} | EP Network`;
  const description = (n.short_description || n.bio || `${n.name} — a ${type} on EP Network, connecting organizations across the energy transition.`)
    .replace(/\s+/g, " ")
    .slice(0, 155);
  const canonical = `${BASE_URL}/ngos/${n.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, type: "website", siteName: "EP Network",
      images: n.logo_url ? [{ url: n.logo_url }] : [],
    },
    twitter: { card: "summary", title, description, images: n.logo_url ? [n.logo_url] : [] },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const n = await getNgo(slug);

  const jsonLd = n
    ? {
        "@context": "https://schema.org",
        "@type": "NGO",
        name: n.name,
        url: n.website_url || `${BASE_URL}/ngos/${n.slug}`,
        ...(n.logo_url ? { logo: n.logo_url } : {}),
        ...(n.short_description ? { description: n.short_description.replace(/\s+/g, " ").slice(0, 300) } : {}),
        ...(n.headquarters_country ? { address: { "@type": "PostalAddress", addressCountry: n.headquarters_country } } : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <NgoProfileClient />
    </>
  );
}
