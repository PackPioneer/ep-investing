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

export async function PATCH(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const supabase = db();
  const { id, action, review_note } = await req.json();
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

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
