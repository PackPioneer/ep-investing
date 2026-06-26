import { createClient } from "@supabase/supabase-js";
import InvestorProfileClient from "./InvestorProfileClient";

const BASE_URL = "https://www.epinvesting.com";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export const revalidate = 3600;

async function getInvestor(id) {
  const { data } = await supabase
    .from("vc_firms")
    .select("id, name, description, logo_url")
    .eq("id", id)
    .single();
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const v = await getInvestor(id);
  if (!v) return { title: "Investor | EP Network" };

  const title = `${v.name} — Climate Investor | EP Network`;
  const description = (v.description || `${v.name} — a climate investor on EP Network, connecting partners across the energy transition.`)
    .replace(/\s+/g, " ")
    .slice(0, 155);
  const canonical = `${BASE_URL}/investors/${v.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title, description, url: canonical, type: "website", siteName: "EP Network",
      images: v.logo_url ? [{ url: v.logo_url }] : [],
    },
    twitter: { card: "summary", title, description, images: v.logo_url ? [v.logo_url] : [] },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const v = await getInvestor(id);

  const jsonLd = v
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: v.name,
        url: `${BASE_URL}/investors/${v.id}`,
        ...(v.logo_url ? { logo: v.logo_url } : {}),
        ...(v.description ? { description: v.description.replace(/\s+/g, " ").slice(0, 300) } : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <InvestorProfileClient />
    </>
  );
}
