import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

export async function GET(req) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";

  let query = supabase
    .from("ngo_claims")
    .select(`
      *,
      ngo:ngos ( id, slug, name, website_url, claimable, clerk_user_id )
    `)
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ claims: data ?? [] });
}
