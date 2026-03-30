import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ isInvestor: false });

  const { data } = await supabase
    .from("matched_requests")
    .select("id")
    .eq("clerk_user_id", userId)
    .eq("path", "investor")
    .single();

  return Response.json({ isInvestor: !!data });
}