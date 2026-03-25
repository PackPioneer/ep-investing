import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (error || !data) return Response.json({ error: "No company found" }, { status: 404 });
  return Response.json(data);
}