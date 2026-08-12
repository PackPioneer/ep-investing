import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PENDING_MARK = "scraped_from_vc_portfolio_pending";

// Companies discovered via the VC-portfolio scraper that are hidden pending review.
export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const supabase = db();
  const { data } = await supabase
    .from("companies")
    .select("id, name, url, description, logo_url, industry_tags, enrichment_provenance, created_at")
    .eq("is_hidden", true)
    .order("created_at", { ascending: false })
    .limit(1000);

  const pending = (data || [])
    .filter((c) => String(c.enrichment_provenance || "").includes(PENDING_MARK))
    .map((c) => {
      const prov = String(c.enrichment_provenance || "");
      const investor = prov.includes(":") ? prov.split(":").slice(1).join(":") : null;
      return { ...c, investor_name: investor };
    });

  return Response.json({ companies: pending });
}

// Approve (unhide) or reject (delete company + its links).
export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return Response.json({ error: "id and valid action required" }, { status: 400 });
  }
  const supabase = db();

  if (action === "approve") {
    const { error } = await supabase
      .from("companies")
      .update({ is_hidden: false, enrichment_provenance: "scraped_from_vc_portfolio" })
      .eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true, status: "approved" });
  }

  // reject → remove the links then the company
  try { await supabase.from("investor_portfolio").delete().eq("company_id", id); } catch { /* table may differ */ }
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, status: "rejected" });
}
