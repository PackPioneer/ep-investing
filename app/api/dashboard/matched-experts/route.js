import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: experts } = await supabase
    .from("experts")
    .select("id, name, email, location, expertise_areas, hourly_rate, availability")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return Response.json(experts || []);
}