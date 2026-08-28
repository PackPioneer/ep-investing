import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { resolveViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Record a click on an announcement's action item (its CTA button), so the
// company can see engagement. Fire-and-forget from the public CTA links.
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(String(id))) return Response.json({ ok: true, recorded: false });
    const supabase = db();

    const { data: ann } = await supabase.from("company_announcements")
      .select("id, company_id").eq("id", id).maybeSingle();
    if (!ann) return Response.json({ ok: true, recorded: false });

    const { userId } = await auth();
    const v = await resolveViewer(supabase, userId);
    // Don't count the company clicking its own action item.
    if (v.company_id && ann.company_id && v.company_id === ann.company_id) return Response.json({ ok: true, recorded: false, self: true });

    const row = {
      announcement_id: ann.id,
      company_id: ann.company_id || null,
      clicker_clerk_user_id: userId || null,
      clicker_kind: v.kind,
      clicker_label: v.label,
    };
    let { error } = await supabase.from("announcement_clicks").insert(row);
    if (error && /ngo/i.test(error.message)) { if (row.clicker_kind === "ngo") row.clicker_kind = "company"; await supabase.from("announcement_clicks").insert(row); }
    return Response.json({ ok: true, recorded: true });
  } catch {
    return Response.json({ ok: true, recorded: false });
  }
}
