import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CAT_LABEL, CAT_COLOR, ctaLabelFor } from "@/lib/announcements/categories";
import { investorPath } from "@/lib/slug";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getAnnouncement(id) {
  if (!/^\d+$/.test(String(id))) return null;
  const { data } = await db().from("company_announcements")
    .select("*, company:companies(id, name, slug, logo_url, industry_tags)")
    .eq("id", id).eq("status", "published").maybeSingle();
  return data;
}

const usd = (n) => (n == null || n === "" ? null : "$" + Number(n).toLocaleString());
function metaLine(a) {
  const m = a.meta || {};
  const bits = [];
  if (!m.partners?.length && m.partner_name) bits.push(m.partner_name);
  if (m.round_type) bits.push(m.round_type);
  if (m.amount_usd) bits.push(usd(m.amount_usd));
  if (m.amount_target_usd) bits.push(`target ${usd(m.amount_target_usd)}`);
  if (m.lead_investor) bits.push(`led by ${m.lead_investor}`);
  if (m.product_name) bits.push(m.product_name);
  if (m.person_name) bits.push(`${m.person_name}${m.role ? `, ${m.role}` : ""}`);
  if (m.award_name) bits.push(m.award_name);
  if (m.grantor) bits.push(`from ${m.grantor}`);
  if (m.location) bits.push(m.location);
  return bits.join(" · ");
}
const when = (d) => (d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "");

export async function generateMetadata({ params }) {
  const { id } = await params;
  const a = await getAnnouncement(id);
  if (!a) return { title: "Announcement — EP Network" };
  const co = a.company;
  const title = `${co?.name ? co.name + ": " : ""}${a.title}`;
  const desc = (a.body || `${co?.name || "A climate & energy company"} on EP Network.`).slice(0, 160);
  return {
    title: `${title} — EP Network`,
    description: desc,
    alternates: { canonical: `https://epinvesting.com/announcements/${id}` },
    openGraph: { title, description: desc, url: `https://epinvesting.com/announcements/${id}`, type: "article", images: co?.logo_url ? [co.logo_url] : undefined },
    twitter: { card: "summary", title, description: desc, images: co?.logo_url ? [co.logo_url] : undefined },
  };
}

export default async function AnnouncementPage({ params }) {
  const { id } = await params;
  const a = await getAnnouncement(id);
  if (!a) notFound();
  const co = a.company;
  const cta = a.is_curated ? "Read release" : ctaLabelFor(a.category, a.meta);

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="max-w-2xl mx-auto px-5 py-10">
        <Link href="/announcements" className="text-xs text-slate-500 hover:text-emerald-700">← Newsroom</Link>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded" style={{ background: (CAT_COLOR[a.category] || "#64748b") + "1a", color: CAT_COLOR[a.category] || "#64748b" }}>{CAT_LABEL[a.category] || a.category}</span>
            <span className="text-xs text-slate-400 ml-auto">{when(a.published_at)}</span>
          </div>

          {co && (
            <Link href={`/companies/${co.id}`} className="flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold text-emerald-700 overflow-hidden">
                {co.logo_url ? <img src={co.logo_url} alt="" className="w-full h-full object-contain p-0.5" /> : (co.name?.[0] || "?")}
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">{co.name}</span>
            </Link>
          )}

          <h1 style={{ fontFamily: "var(--font-display), sans-serif" }} className="text-2xl font-bold text-slate-900 leading-snug mb-2">{a.title}</h1>
          {metaLine(a) && <div className="text-sm text-slate-500 mb-1">{metaLine(a)}</div>}
          {(() => {
            const invs = a.meta?.investors?.length ? a.meta.investors : (a.meta?.investor_id ? [{ id: a.meta.investor_id, name: a.meta.investor_name }] : []);
            return invs.length > 0 ? (
              <div className="text-sm text-slate-500 mb-1">Backed by {invs.map((iv, i) => <span key={iv.id}>{i > 0 ? ", " : ""}<Link href={investorPath(iv)} className="text-emerald-700 hover:underline font-medium">{iv.name}</Link></span>)}</div>
            ) : null;
          })()}
          {a.meta?.partners?.length > 0 && (
            <div className="text-sm text-slate-500 mb-1">In partnership with {a.meta.partners.map((p, i) => <span key={p.id ?? `t${i}`}>{i > 0 ? ", " : ""}{p.id ? <Link href={`/companies/${p.id}`} className="text-emerald-700 hover:underline font-medium">{p.name}</Link> : <span className="font-medium text-slate-600">{p.name}</span>}</span>)}</div>
          )}
          {a.body && <p className="text-[15px] text-slate-700 leading-relaxed mt-3">{a.body}</p>}

          <div className="flex items-center gap-3 flex-wrap mt-6 pt-5 border-t border-slate-100">
            {a.link_url && <a href={a.link_url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700">{cta} →</a>}
            {co && <Link href={`/companies/${co.id}`} className="text-sm font-semibold text-emerald-700 hover:underline">View {co.name} on EP →</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
