import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import { getQuotes } from "@/lib/markets/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  return Response.json(await getQuotes(supabase));
}
