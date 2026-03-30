import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  if (!adminEmails.includes(sessionClaims?.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const { data } = await supabase
    .from("companies")
    .select("id, name, url")
    .ilike("name", `%${q}%`)
    .limit(8);

  return Response.json(data || []);
}