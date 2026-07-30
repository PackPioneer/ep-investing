import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: rows, error } = await supabase
    .from("funding_events")
    .select("id, source, verified, category, type, company_id, company_name, counterparty, investors, amount_usd, stage, instrument, commercial_volume, commercial_unit, geography, sector, announced_date, confidence, is_hidden")
    .order("announced_date", { ascending: false })
    .limit(5000);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const visible = rows.filter((r) => !r.is_hidden && r.type !== "market_stat");
  return Response.json({
    events: visible,
    meta: {
      total: rows.length,
      hidden: rows.filter((r) => r.is_hidden).length,
      marketStat: rows.filter((r) => r.type === "market_stat").length,
    },
  });
}
