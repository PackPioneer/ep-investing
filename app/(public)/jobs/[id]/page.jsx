import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

const BASE_URL = "https://www.epinvesting.com";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export const revalidate = 3600;

const EMPLOYMENT = {
  "full-time": "FULL_TIME", "full_time": "FULL_TIME",
  "part-time": "PART_TIME", "part_time": "PART_TIME",
  "contract": "CONTRACTOR", "contractor": "CONTRACTOR",
  "internship": "INTERN", "intern": "INTERN",
  "fractional": "PART_TIME", "advisory": "OTHER", "temporary": "TEMPORARY",
};
const fmtType = (t) => (t ? String(t).replace(/_/g, " ") : null);

async function getJob(id) {
  if (!/^\d+$/.test(String(id))) return null;
  const { data } = await supabase.from("job_listings").select("*").eq("id", id).eq("status", "published").maybeSingle();
  return data;
}

// Build a human description from whatever fields exist.
function buildDescription(j) {
  const parts = [];
  if (j.role_overview) parts.push(j.role_overview);
  if (j.description) parts.push(j.description);
  if (j.responsibilities) parts.push(`Responsibilities: ${j.responsibilities}`);
  if (j.requirements) parts.push(`Requirements: ${j.requirements}`);
  if (j.nice_to_haves) parts.push(`Nice to have: ${j.nice_to_haves}`);
  if (parts.length === 0) parts.push(`${j.title}${j.company ? ` at ${j.company}` : ""}${j.location ? ` — ${j.location}` : ""}.`);
  return parts.join("\n\n");
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const j = await getJob(id);
  if (!j) return { title: "Job | EP Network" };
  const title = `${j.title}${j.company ? ` at ${j.company}` : ""} | EP Network`;
  const description = buildDescription(j).replace(/\s+/g, " ").slice(0, 155);
  const canonical = `${BASE_URL}/jobs/${j.id}`;
  return {
    title, description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", siteName: "EP Network" },
    twitter: { card: "summary", title, description },
  };
}

export default async function JobPage({ params }) {
  const { id } = await params;
  const j = await getJob(id);
  if (!j) notFound();

  // Company (for hiring-organization logo + profile link)
  let company = null;
  if (j.company_id) {
    const { data } = await supabase.from("companies").select("id, name, slug, logo_url, url").eq("id", j.company_id).maybeSingle();
    company = data;
  }

  const posted = j.created_at ? new Date(j.created_at) : new Date();
  const validThrough = j.application_deadline ? new Date(j.application_deadline) : new Date(posted.getTime() + 60 * 864e5);
  const remote = /remote|anywhere|telecommute/i.test(`${j.location || ""} ${j.work_mode || ""}`);
  const description = buildDescription(j);
  const applyHref = j.apply_url || (j.contact_email ? `mailto:${j.contact_email}` : null);

  const jobLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: j.title,
    description: `<p>${description.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
    datePosted: posted.toISOString().slice(0, 10),
    validThrough: validThrough.toISOString().slice(0, 10),
    employmentType: EMPLOYMENT[String(j.type || "").toLowerCase()] || "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: j.company || "Confidential",
      ...(company?.url ? { sameAs: company.url } : {}),
      ...(company?.logo_url ? { logo: company.logo_url } : {}),
    },
    identifier: { "@type": "PropertyValue", name: j.company || "EP Network", value: String(j.id) },
    ...(applyHref ? { directApply: true } : {}),
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "US" } }
      : { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: j.location || "Unspecified", addressCountry: "US" } } }),
    ...(j.salary_min || j.salary_max
      ? { baseSalary: { "@type": "MonetaryAmount", currency: j.salary_currency || "USD", value: { "@type": "QuantitativeValue", ...(j.salary_min ? { minValue: j.salary_min } : {}), ...(j.salary_max ? { maxValue: j.salary_max } : {}), unitText: "YEAR" } } }
      : {}),
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobLd) }} />
      <div className="max-w-2xl mx-auto px-5 py-10">
        <Link href="/jobs" className="text-xs text-[#718096] hover:text-[#2d6a4f]">← Jobs board</Link>

        <div className="bg-white border border-[#e8eaee] rounded-2xl p-7 mt-4">
          <div className="flex items-start gap-4">
            {company?.logo_url ? (
              <img src={company.logo_url} alt="" className="w-12 h-12 rounded-lg object-contain border border-[#e8eaee] p-1 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[#f2f4f6] flex items-center justify-center text-base font-bold text-[#2d6a4f] flex-shrink-0">{(j.company || "?")[0]}</div>
            )}
            <div className="min-w-0">
              <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl text-[#0f1a14] leading-tight">{j.title}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-[#718096] font-mono">
                {j.company && (company ? <Link href={`/companies/${company.slug || company.id}`} className="text-[#4a5568] font-sans hover:text-[#2d6a4f]">{j.company}</Link> : <span className="text-[#4a5568] font-sans">{j.company}</span>)}
                {j.location && <span>{j.location}</span>}
                {fmtType(j.type) && <span>{fmtType(j.type)}</span>}
                {(j.work_mode || j.experience_level) && <span>{[j.work_mode, j.experience_level].filter(Boolean).join(" · ").replace(/_/g, " ")}</span>}
              </div>
            </div>
          </div>

          {(j.sector || (Array.isArray(j.sector_tags) && j.sector_tags.length)) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {[j.sector, ...(Array.isArray(j.sector_tags) ? j.sector_tags : [])].filter(Boolean).slice(0, 5).map((s, i) => (
                <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#f2f4f6] text-[#4a5568]">{String(s).replace(/_/g, " ")}</span>
              ))}
            </div>
          )}

          {(j.salary_min || j.salary_max) && (
            <div className="text-sm text-[#0f1a14] mt-4">
              <span className="text-[11px] font-mono uppercase tracking-wide text-[#718096] mr-2">Compensation</span>
              {j.salary_currency || "USD"} {j.salary_min ? Number(j.salary_min).toLocaleString() : ""}{j.salary_min && j.salary_max ? "–" : ""}{j.salary_max ? Number(j.salary_max).toLocaleString() : ""}
            </div>
          )}

          <div className="mt-5 text-[15px] text-[#4a5568] leading-relaxed whitespace-pre-line">{description}</div>

          {applyHref && (
            <a href={applyHref} target={j.apply_url ? "_blank" : undefined} rel="noopener noreferrer"
              className="inline-block mt-6 text-sm font-semibold bg-[#2d6a4f] text-white px-6 py-3 rounded-lg hover:bg-[#235a40] transition-colors">
              Apply →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
