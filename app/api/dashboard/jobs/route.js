import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("clerk_user_id", userId)
    .single();

  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const { data, error } = await supabase
    .from("job_listings")
    .select("*")
    .eq("company", company.name)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ jobs: data, company });
}

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("clerk_user_id", userId)
    .single();

  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const body = await req.json();
  const { title, location, type, sector, description, contact_email } = body;

  const { data, error } = await supabase
    .from("job_listings")
    .insert({ title, company: company.name, location, type, sector, description, contact_email, status: "published" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();

  const { error } = await supabase
    .from("job_listings")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}