import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getDealflow } from "@/lib/markets/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  try {
    return Response.json(await getDealflow(supabase));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
