import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import { pushAnnouncementToFeed, removeAnnouncementFromFeed } from "@/lib/announcements/feed";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Announcements publish instantly (vetted companies). This is a moderation view:
// take down / restore, and boost (the freemium hook).
export async function GET(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const status = new URL(req.url).searchParams.get("status") || "published";
  let q = db().from("company_announcements")
    .select("*, company:companies(id, name, slug, logo_url, industry_tags)")
    .order("created_at", { ascending: false }).limit(500);
  if (status !== "all") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}

// Admin posts a curated newsroom item (e.g. a press release sent to EP, or a
// company update pulled from their blog). Published + curated (newsroom-only).
export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { company_id, category, title, body, link_url, meta, published_at } = await req.json();
  if (!company_id || !title || !title.trim()) return Response.json({ error: "company_id and title required" }, { status: 400 });
  const supabase = db();
  const payload = {
    company_id,
    category: category || "other",
    title: title.trim(),
    body: body || null,
    link_url: link_url || null,
    meta: meta && typeof meta === "object" ? meta : {},
    status: "published",
    is_curated: true,
    published_at: published_at ? new Date(published_at).toISOString() : new Date().toISOString(),
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  };
  let { data, error } = await supabase.from("company_announcements").insert(payload).select().single();
  // If the is_curated column hasn't been added yet, fall back so posting still works.
  if (error && /is_curated/i.test(error.message)) {
    delete payload.is_curated;
    ({ data, error } = await supabase.from("company_announcements").insert(payload).select().single());
  }
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PATCH(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const supabase = db();
  const { id, action, review_note, fields } = await req.json();
  if (!id || !action) return Response.json({ error: "id and action required" }, { status: 400 });

  const { data: ann } = await supabase.from("company_announcements").select("*").eq("id", id).maybeSingle();
  if (!ann) return Response.json({ error: "Not found" }, { status: 404 });

  if (action === "takedown") {
    // Hide from public, the feed, and any tracker event it created.
    if (ann.tracker_event_id) await supabase.from("funding_events").update({ is_hidden: true }).eq("id", ann.tracker_event_id);
    try { await removeAnnouncementFromFeed(supabase, ann.id); } catch { /* non-fatal */ }
    await supabase.from("company_announcements").update({
      status: "rejected", reviewed_by: userId, reviewed_at: new Date().toISOString(), review_note: review_note || null,
    }).eq("id", id);
    return Response.json({ ok: true });
  }

  if (action === "restore") {
    if (ann.tracker_event_id) await supabase.from("funding_events").update({ is_hidden: false }).eq("id", ann.tracker_event_id);
    await supabase.from("company_announcements").update({ status: "published" }).eq("id", id);
    const { data: company } = await supabase.from("companies").select("id, name, industry_tags").eq("id", ann.company_id).maybeSingle();
    if (company) { try { await pushAnnouncementToFeed(supabase, company, ann); } catch { /* non-fatal */ } }
    return Response.json({ ok: true });
  }

  if (action === "feature" || action === "unfeature") {
    await supabase.from("company_announcements").update({ is_featured: action === "feature" }).eq("id", id);
    return Response.json({ ok: true });
  }

  if (action === "edit") {
    const f = fields || {};
    const CATS = ["partnership", "raise_open", "raise_close", "product", "award", "hire", "milestone", "expansion", "other"];
    const update = {};
    if (typeof f.title === "string" && f.title.trim()) update.title = f.title.trim();
    if (f.body !== undefined) update.body = f.body || null;
    if (f.link_url !== undefined) update.link_url = f.link_url || null;
    if (f.category && CATS.includes(f.category)) update.category = f.category;
    if (f.published_at) update.published_at = new Date(f.published_at).toISOString();
    if (Object.keys(update).length === 0) return Response.json({ error: "Nothing to update" }, { status: 400 });
    const { data, error } = await supabase.from("company_announcements").update(update).eq("id", id).select().single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, announcement: data });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
