import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  let query = supabase.from("companies").select("*").neq("is_hidden", true);
  if (q) query = query.ilike("name", `%${q}%`).order("name", { ascending: true });
  else query = query.order("id", { ascending: false });

  const { data: companies, error } = await query.limit(limit);
  if (error) return Response.json({ message: error.message, details: error }, { status: 500 });
  return Response.json(companies);
}
