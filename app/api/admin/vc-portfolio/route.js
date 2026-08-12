import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TIMEOUT = 12000;
const hostOf = (u) => { try { return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, ""); } catch { return null; } };
const normName = (s) => (s || "").toLowerCase().replace(/&/g, " and ").replace(/\b(inc|ltd|llc|corp|co|the)\b/g, "").replace(/[^a-z0-9]+/g, "");

async function loadAll(supabase, table, cols) {
  const rows = []; let from = 0; const PAGE = 1000;
  for (;;) {
    const { data } = await supabase.from(table).select(cols).range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

async function linkOne(supabase, investorId, companyId, source) {
  await supabase.from("investor_portfolio").upsert(
    { investor_id: investorId, company_id: companyId, source },
    { onConflict: "investor_id,company_id", ignoreDuplicates: true }
  );
}

// Claude reads the portfolio page and returns [{ name, url }].
async function extractPortfolio(vcName, url) {
  if (!process.env.ANTHROPIC_API_KEY) return { companies: null, error: "No ANTHROPIC_API_KEY configured" };
  let pageText = "";
  try {
    const res = await fetch(url.startsWith("http") ? url : `https://${url}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const html = await res.text();
    // Keep anchor hrefs so Claude can see company domains, then strip the rest.
    const withLinks = html.replace(/<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi, " [$1] ");
    pageText = withLinks.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 16000);
  } catch (e) {
    return { companies: null, error: `Could not fetch page: ${e.message}` };
  }
  if (!pageText) return { companies: null, error: "Page had no readable text" };

  const prompt = `This is the portfolio page for the investor "${vcName}".
Extract the list of PORTFOLIO COMPANIES they have invested in.
Ignore press mentions, news outlets, the investor's own site, social links, team members, and navigation.

Page content (company website URLs appear in [square brackets]):
${pageText}

Return ONLY a JSON array. Each item: { "name": string, "url": string (the company's own website if visible, else "") }.
If you can't find a portfolio list, return []. Return ONLY the JSON array.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 3000, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(TIMEOUT * 3),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || "";
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return { companies: [] };
    const parsed = JSON.parse(m[0]);
    return { companies: Array.isArray(parsed) ? parsed.filter((c) => c && c.name) : [] };
  } catch (e) {
    return { companies: null, error: `Extraction failed: ${e.message}` };
  }
}

// GET ?investor_id= → current portfolio links (companies)
export async function GET(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const investorId = new URL(req.url).searchParams.get("investor_id");
  if (!investorId) return Response.json({ companies: [] });
  const supabase = db();
  const { data: links } = await supabase.from("investor_portfolio").select("company_id").eq("investor_id", investorId).limit(300);
  const ids = (links || []).map((l) => l.company_id);
  if (!ids.length) return Response.json({ companies: [] });
  const { data: companies } = await supabase.from("companies").select("id, name, slug, logo_url, is_hidden").in("id", ids).order("name");
  return Response.json({ companies: companies || [] });
}

export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { action } = body;
  const supabase = db();

  // Manual tag / untag
  if (action === "link" || action === "unlink") {
    const { investor_id, company_id } = body;
    if (!investor_id || !company_id) return Response.json({ error: "investor_id and company_id required" }, { status: 400 });
    if (action === "unlink") {
      await supabase.from("investor_portfolio").delete().eq("investor_id", investor_id).eq("company_id", company_id);
      return Response.json({ ok: true });
    }
    await linkOne(supabase, investor_id, company_id, "admin");
    return Response.json({ ok: true });
  }

  // Scrape a portfolio page
  if (action === "scrape") {
    const { investor_id, url } = body;
    if (!investor_id || !url || !url.trim()) return Response.json({ error: "investor_id and url required" }, { status: 400 });
    const { data: inv } = await supabase.from("vc_firms").select("id, name").eq("id", investor_id).maybeSingle();
    if (!inv) return Response.json({ error: "Investor not found" }, { status: 404 });

    const { companies: extracted, error } = await extractPortfolio(inv.name, url.trim());
    if (!extracted) return Response.json({ error: error || "Could not extract portfolio." }, { status: 422 });
    if (extracted.length === 0) return Response.json({ linked: [], pending: [], message: "No portfolio companies found on that page. You can tag companies manually below." });

    // Build directory match maps
    const dir = await loadAll(supabase, "companies", "id, name, url");
    const byHost = new Map(); const byName = new Map();
    for (const c of dir) {
      const h = hostOf(c.url || ""); if (h && !byHost.has(h)) byHost.set(h, c);
      const n = normName(c.name); if (n && !byName.has(n)) byName.set(n, c);
    }

    const linked = []; const pending = [];
    for (const item of extracted) {
      const host = hostOf(item.url || "");
      let match = (host && byHost.get(host)) || byName.get(normName(item.name));
      if (match) {
        await linkOne(supabase, inv.id, match.id, "scraped:portfolio");
        linked.push({ id: match.id, name: match.name });
      } else {
        // queue as a hidden company pending admin approval, then link
        const { data: created, error: insErr } = await supabase.from("companies").insert({
          name: item.name,
          url: host ? `https://${host}` : null,
          sector: "cleantech_company",
          is_hidden: true,
          enrichment_provenance: `scraped_from_vc_portfolio_pending:${inv.name}`,
        }).select("id, name").single();
        if (insErr) continue; // likely dup url; skip
        await linkOne(supabase, inv.id, created.id, "scraped:portfolio");
        pending.push({ id: created.id, name: created.name });
      }
    }

    return Response.json({ investor: inv, linked, pending, found: extracted.length });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
