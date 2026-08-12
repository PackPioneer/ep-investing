import { createClient } from "@supabase/supabase-js";
import InvestorProfileClient from "./InvestorProfileClient";
import { idFromSlug, investorPath } from "@/lib/slug";

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
    .select("id, name, description, logo_url, investment_thesis, is_hidden")
    .eq("id", idFromSlug(id))
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
  const canonical = `${BASE_URL}${investorPath(v)}`;
  const thin = v.is_hidden || (!v.description && !v.investment_thesis) ||
    ((v.description || v.investment_thesis || "").replace(/\s+/g, " ").trim().length < 100);

  return {
    title,
    description,
    ...(thin ? { robots: { index: false, follow: true } } : {}),
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
        url: `${BASE_URL}${investorPath(v)}`,
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
