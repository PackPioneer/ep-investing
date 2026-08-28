import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { resolveViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CTAS = ["website", "jobs", "contact"];

// Record a click on a company profile call-to-action. Fire-and-forget.
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { cta } = await req.json().catch(() => ({}));
    if (!CTAS.includes(cta)) return Response.json({ ok: true, recorded: false });
    const supabase = db();

    const isNumeric = /^\d+$/.test(String(id));
    const { data: company } = await supabase.from("companies").select("id").eq(isNumeric ? "id" : "slug", id).maybeSingle();
    if (!company) return Response.json({ ok: true, recorded: false });

    const { userId } = await auth();
    const v = await resolveViewer(supabase, userId);
    // Don't count the company clicking its own CTA.
    if (v.company_id && v.company_id === company.id) return Response.json({ ok: true, recorded: false, self: true });

    const row = {
      company_id: company.id,
      cta,
      clicker_clerk_user_id: userId || null,
      clicker_kind: v.kind,
      clicker_label: v.label,
    };
    let { error } = await supabase.from("company_cta_clicks").insert(row);
    if (error && /ngo/i.test(error.message)) { if (row.clicker_kind === "ngo") row.clicker_kind = "company"; await supabase.from("company_cta_clicks").insert(row); }
    return Response.json({ ok: true, recorded: true });
  } catch {
    return Response.json({ ok: true, recorded: false });
  }
}
