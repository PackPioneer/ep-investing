import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { category, details, email, page } = await req.json();
  if (!details || !details.trim()) return Response.json({ error: "details required" }, { status: 400 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase.from("feedback").insert({
    category: category || "feedback",
    details: details.trim().slice(0, 4000),
    email: email || null,
    page: page || null,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
