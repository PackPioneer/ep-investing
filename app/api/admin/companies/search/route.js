import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

export async function GET(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const { data } = await supabase
    .from("companies")
    .select("id, name, url")
    .ilike("name", `%${q}%`)
    .limit(8);

  return Response.json(data || []);
}
