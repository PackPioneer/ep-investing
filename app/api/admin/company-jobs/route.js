import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TIMEOUT = 12000;

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) return null;
  return res.json();
}

// Detect a known ATS from a careers URL and return { ats, slug } or null.
function detectAts(rawUrl) {
  let u;
  try { u = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`); } catch { return null; }
  const host = u.hostname.replace(/^www\./, "");
  const seg = u.pathname.split("/").filter(Boolean);
  if (host.includes("lever.co")) return { ats: "lever", slug: seg[0] };
  if (host.includes("greenhouse.io")) return { ats: "greenhouse", slug: seg[0] };
  if (host.includes("ashbyhq.com")) return { ats: "ashby", slug: seg[0] };
  return null;
}

async function fetchLever(slug) {
  const d = await getJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!Array.isArray(d)) return null;
  return d.map((j) => ({ title: j.text, location: j.categories?.location || "—", apply_url: j.hostedUrl || null }));
}
async function fetchGreenhouse(slug) {
  const d = await getJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
  if (!Array.isArray(d?.jobs)) return null;
  return d.jobs.map((j) => ({ title: j.title, location: j.location?.name || "—", apply_url: j.absolute_url || null }));
}
async function fetchAshby(slug) {
  const d = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`);
  if (!Array.isArray(d?.jobs)) return null;
  return d.jobs.map((j) => ({ title: j.title, location: j.location || j.locationName || "—", apply_url: j.jobUrl || j.applyUrl || null }));
}

// Fallback: fetch the page, strip tags, ask Claude to pull structured jobs.
async function fetchViaClaude(company, url) {
  if (!process.env.ANTHROPIC_API_KEY) return { jobs: null, error: "No ANTHROPIC_API_KEY configured" };
  let pageText = "";
  try {
    const res = await fetch(url.startsWith("http") ? url : `https://${url}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(TIMEOUT),
    });
    const html = await res.text();
    pageText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 12000);
  } catch (e) {
    return { jobs: null, error: `Could not fetch page: ${e.message}` };
  }
  if (!pageText) return { jobs: null, error: "Page had no readable text" };

  const prompt = `Extract job listings from this careers page for ${company}.
URL: ${url}
Page content:
${pageText}

Return ONLY a JSON array. Each object: { "title": string, "location": string, "apply_url": string (use ${url} if none) }.
If no jobs are found return []. Return ONLY the JSON array.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(TIMEOUT * 3),
    });
    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() || "";
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return { jobs: [] };
    const parsed = JSON.parse(m[0]);
    return { jobs: Array.isArray(parsed) ? parsed : [] };
  } catch (e) {
    return { jobs: null, error: `Extraction failed: ${e.message}` };
  }
}

export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { company_id, url, sector: sectorOverride } = await req.json();
  if (!company_id || !url || !url.trim()) return Response.json({ error: "company_id and url are required" }, { status: 400 });

  const supabase = db();
  const { data: company } = await supabase.from("companies").select("id, name, sector, industry_tags").eq("id", company_id).maybeSingle();
  if (!company) return Response.json({ error: "Company not found" }, { status: 404 });

  // 1) Pull jobs — ATS API if recognized, else Claude extraction
  const detected = detectAts(url);
  let jobs = null, method = null, error = null;
  if (detected?.slug) {
    method = detected.ats;
    if (detected.ats === "lever") jobs = await fetchLever(detected.slug);
    else if (detected.ats === "greenhouse") jobs = await fetchGreenhouse(detected.slug);
    else if (detected.ats === "ashby") jobs = await fetchAshby(detected.slug);
    if (!jobs) error = `No jobs returned from ${detected.ats} board "${detected.slug}". Check the slug in the URL.`;
  } else {
    method = "ai";
    const r = await fetchViaClaude(company.name, url);
    jobs = r.jobs; error = r.error || null;
  }

  if (!jobs) return Response.json({ error: error || "Could not extract jobs from that URL." }, { status: 422 });
  jobs = jobs.filter((j) => j && j.title && String(j.title).trim());
  if (jobs.length === 0) return Response.json({ method, found: 0, inserted: 0, jobs: [], message: "No jobs found on that page." });

  // 2) Dedupe against what this company already has
  const { data: existing } = await supabase.from("job_listings").select("title").eq("company_id", company.id);
  const seen = new Set((existing || []).map((j) => (j.title || "").toLowerCase()));
  const sector = (sectorOverride && sectorOverride.trim()) || company.sector || (Array.isArray(company.industry_tags) ? company.industry_tags[0] : null) || null;

  const rows = jobs
    .filter((j) => !seen.has(String(j.title).toLowerCase()))
    .map((j) => ({
      title: String(j.title).trim(),
      company: company.name,
      company_id: company.id,
      location: j.location || "—",
      type: j.type || "Full-time",
      sector,
      apply_url: j.apply_url || (url.startsWith("http") ? url : `https://${url}`),
      status: "published",
    }));

  let inserted = 0;
  if (rows.length) {
    const { error: insErr } = await supabase.from("job_listings").insert(rows);
    if (insErr) return Response.json({ error: insErr.message }, { status: 500 });
    inserted = rows.length;
    await supabase.from("companies").update({ is_hiring: true }).eq("id", company.id);
  }

  return Response.json({
    method,
    company: { id: company.id, name: company.name },
    found: jobs.length,
    inserted,
    skipped: jobs.length - inserted,
    jobs: rows.map((r) => ({ title: r.title, location: r.location, apply_url: r.apply_url })),
  });
}
