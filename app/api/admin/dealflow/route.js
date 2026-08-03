import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";
import { getDealflow } from "@/lib/markets/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  try {
    return Response.json(await getDealflow(supabase));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
