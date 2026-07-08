import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from("experts")
    .select("id, name, email, role, industries, intent, is_listed, status, onboarded_at, created_at")
    .eq("type", "individual")
    .order("onboarded_at", { ascending: false, nullsFirst: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}