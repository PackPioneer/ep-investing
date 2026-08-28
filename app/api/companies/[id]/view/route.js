import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { resolveViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Record a profile view for analytics ("who viewed you"). Only signed-in viewers
// are recorded (high-signal, dedup-able); anonymous views are ignored. The owner
// viewing their own profile is never counted.
export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ ok: true, recorded: false });   // anonymous — skip

    const { id } = await params;
    const supabase = db();

    // Resolve the profile company (numeric id or slug).
    const isNumeric = /^\d+$/.test(String(id));
    const { data: company } = await supabase.from("companies")
      .select("id, looking_to_raise, is_hiring, seeking_partnerships").eq(isNumeric ? "id" : "slug", id).maybeSingle();
    if (!company) return Response.json({ ok: true, recorded: false });

    // Which signals were live at view time (for "signals seen" analytics).
    const signals = [];
    if (company.looking_to_raise) signals.push("raising");
    if (company.is_hiring) signals.push("hiring");
    if (company.seeking_partnerships) signals.push("partnership");

    // Identify the viewer (investor / company / NGO / individual).
    const v = await resolveViewer(supabase, userId);
    // Owner viewing their own profile — do not count.
    if (v.company_id && v.company_id === company.id) return Response.json({ ok: true, recorded: false, self: true });

    // Dedup: at most one recorded view per viewer per company per day.
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const { data: existing } = await supabase.from("company_profile_views")
      .select("id").eq("company_id", company.id).eq("viewer_clerk_user_id", userId)
      .gte("created_at", startOfDay.toISOString()).limit(1);
    if (existing && existing.length) return Response.json({ ok: true, recorded: false, deduped: true });

    const row = {
      company_id: company.id,
      viewer_clerk_user_id: userId,
      viewer_kind: v.kind,
      viewer_label: v.label,
      viewer_investor_id: v.investor_id,
      viewer_company_id: v.company_id,
      viewer_ngo_id: v.ngo_id,
      signals,
    };
    let { error: insErr } = await supabase.from("company_profile_views").insert(row);
    // Fall back if the signals column hasn't been migrated yet.
    if (insErr && /signals/i.test(insErr.message)) { delete row.signals; ({ error: insErr } = await supabase.from("company_profile_views").insert(row)); }
    // Fall back if the viewer_ngo_id column / 'ngo' kind hasn't been migrated yet.
    if (insErr && /ngo/i.test(insErr.message)) {
      delete row.viewer_ngo_id;
      if (row.viewer_kind === "ngo") { row.viewer_kind = "company"; }   // count NGO as a partner
      await supabase.from("company_profile_views").insert(row);
    }
    return Response.json({ ok: true, recorded: true });
  } catch {
    return Response.json({ ok: true, recorded: false });
  }
}
