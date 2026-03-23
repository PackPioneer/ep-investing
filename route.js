import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

export async function GET(req, { params }) {
  const { id } = params;
  const { data, error } = await supabase
    .from("company_updates")
    .select("*")
    .eq("company_id", id)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}

export async function POST(req, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const { title, body, link, type } = await req.json();

  if (!title) return Response.json({ error: "Title required" }, { status: 400 });

  const { data, error } = await supabase
    .from("company_updates")
    .insert({ company_id: id, clerk_user_id: userId, title, body, link, type })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}