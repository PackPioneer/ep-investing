import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PENDING_MARK = "scraped_from_vc_portfolio_pending";
const VALID_TAGS = [
  "battery_storage", "carbon_credits", "clean_cooking", "direct_air_capture",
  "electric_aviation", "ev_charging", "geothermal_energy", "green_hydrogen",
  "grid_storage", "grid_monitoring", "industrial_decarbonization", "nuclear_technologies",
  "saf_efuels", "solar", "wind_energy", "electric_vehicles", "agtech", "maritime_shipping", "energy_generation", "energy_efficiency", "energy_management",
];

// ── lightweight site scrape (fetch-based, no puppeteer) ──────────────────────
function absolutize(candidate, baseUrl) { try { return new URL(candidate, baseUrl).href; } catch { return null; } }
function extractLogo(html, baseUrl) {
  if (!html) return null;
  let m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (m?.[1]) return absolutize(m[1], baseUrl);
  m = html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
  if (m?.[1]) return absolutize(m[1], baseUrl);
  return null;
}
function metaContent(html, keys) {
  for (const k of keys) {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]+content=["']([^"']+)["']`, "i"))
           || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${k}["']`, "i"));
    if (m?.[1]) return m[1].trim();
  }
  return null;
}
async function scrapeSite(url) {
  const target = url.startsWith("http") ? url : `https://${url}`;
  const res = await fetch(target, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const html = await res.text();
  const title = metaContent(html, ["og:site_name", "og:title"]) || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim() || null;
  const description = metaContent(html, ["og:description", "description"]);
  const host = new URL(res.url || target).hostname;
  let logo = extractLogo(html, res.url || target);
  if (!logo) {
    try { const lr = await fetch(`https://logo.clearbit.com/${host}`, { method: "HEAD", signal: AbortSignal.timeout(3000) }); if (lr.ok) logo = `https://logo.clearbit.com/${host}`; } catch {}
  }
  if (!logo) logo = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  return { title, description, logo };
}
async function classifyTags(name, description) {
  if (!process.env.ANTHROPIC_API_KEY) return [];
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 100, messages: [{ role: "user", content: `Classify this climate company into 1-3 tags from this list only:\n${VALID_TAGS.join(", ")}\n\nCompany: ${name}\nDescription: ${description || ""}\n\nReply with ONLY a JSON array, e.g. ["solar","battery_storage"]` }] }),
      signal: AbortSignal.timeout(12000),
    });
    const data = await res.json();
    const text = (data?.content?.[0]?.text || "[]").replace(/```[a-z]*\n?|\n?```/g, "").trim();
    const tags = JSON.parse(text);
    return Array.isArray(tags) ? tags.filter((t) => VALID_TAGS.includes(t)) : [];
  } catch { return []; }
}

// ── list pending ─────────────────────────────────────────────────────────────
export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await db()
    .from("companies")
    .select("id, name, url, description, logo_url, industry_tags, enrichment_provenance, created_at")
    .eq("is_hidden", true)
    .order("created_at", { ascending: false })
    .limit(1000);
  const pending = (data || [])
    .filter((c) => String(c.enrichment_provenance || "").includes(PENDING_MARK))
    .map((c) => {
      const prov = String(c.enrichment_provenance || "");
      return { ...c, investor_name: prov.includes(":") ? prov.split(":").slice(1).join(":") : null };
    });
  return Response.json({ companies: pending });
}

// ── approve (enrich + unhide) / reject (delete) ──────────────────────────────
export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) return Response.json({ error: "id and valid action required" }, { status: 400 });
  const supabase = db();

  if (action === "reject") {
    try { await supabase.from("investor_portfolio").delete().eq("company_id", id); } catch {}
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, status: "rejected" });
  }

  // approve → build a real company page from the site, then unhide
  const { data: co } = await supabase.from("companies").select("id, name, url, description, logo_url, industry_tags").eq("id", id).maybeSingle();
  if (!co) return Response.json({ error: "Company not found" }, { status: 404 });

  const update = { is_hidden: false, enrichment_provenance: "scraped_from_vc_portfolio" };

  if (co.url) {
    try {
      const site = await scrapeSite(co.url);
      // Prefer a cleaner scraped name only if the current one looks like a bare host
      if (site.title && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(co.name || "")) update.name = site.title.split(/[|\-–—]/)[0].trim().slice(0, 100);
      if (!co.description && site.description) update.description = site.description.slice(0, 500);
      if ((!co.logo_url || /s2\/favicons/.test(co.logo_url)) && site.logo) update.logo_url = site.logo;
      if (!Array.isArray(co.industry_tags) || co.industry_tags.length === 0) {
        const tags = await classifyTags(update.name || co.name, update.description || co.description);
        if (tags.length) update.industry_tags = tags;
      }
    } catch { /* enrichment best-effort — approve anyway */ }
  }

  // Give it a pretty slug for SEO-friendly company URLs
  const finalName = update.name || co.name || "company";
  update.slug = `${slugify(finalName)}-${co.id}`;

  const { error } = await supabase.from("companies").update(update).eq("id", co.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, status: "approved", enriched: !!co.url });
}
