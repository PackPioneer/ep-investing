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
    .select("id, source, verified, category, type, company_id, company_name, counterparty, investors, amount_usd, currency_original, stage, instrument, commercial_volume, commercial_unit, geography, announced_date, confidence, is_hidden")
    .order("announced_date", { ascending: false })
    .limit(2000);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const visible = rows.filter((r) => !r.is_hidden && r.type !== "market_stat");
  const capital = visible.filter((r) => r.category === "capital" && r.amount_usd);

  const sum = (arr) => arr.reduce((s, r) => s + (r.amount_usd || 0), 0);
  const group = (arr, key) => {
    const m = {};
    for (const r of arr) { const k = r[key] || "unknown"; (m[k] ||= { count: 0, capital: 0 }); m[k].count++; m[k].capital += r.amount_usd || 0; }
    return Object.entries(m).map(([k, v]) => ({ key: k, ...v })).sort((a, b) => b.capital - a.capital);
  };
  const byMonth = {};
  for (const r of capital) { const mo = (r.announced_date || "").slice(0, 7); if (!mo) continue; (byMonth[mo] ||= { count: 0, capital: 0 }); byMonth[mo].count++; byMonth[mo].capital += r.amount_usd || 0; }
  const monthly = Object.entries(byMonth).map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);

  const amounts = capital.map((r) => r.amount_usd).sort((a, b) => a - b);
  const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : null;

  return Response.json({
    totals: {
      events: visible.length,
      dealCount: capital.length,
      capitalUsd: sum(capital),
      avgRound: capital.length ? Math.round(sum(capital) / capital.length) : null,
      medianRound: median,
      hidden: rows.filter((r) => r.is_hidden).length,
      marketStat: rows.filter((r) => r.type === "market_stat").length,
      unresolved: visible.filter((r) => !r.company_id).length,
      resolved: visible.filter((r) => r.company_id).length,
    },
    byType: group(capital, "type"),
    byGeo: group(capital, "geography").slice(0, 12),
    monthly,
    wire: visible.slice(0, 250),
  });
}
