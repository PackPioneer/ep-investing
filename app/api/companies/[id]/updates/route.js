import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(req, { params }) {
  const id = (await params).id;
  if (!id || id === "undefined") return Response.json([]);
  
  const { data, error } = await supabase
    .from("company_updates")
    .select("*")
    .eq("company_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}

export async function POST(req, { params }) {
  const { userId } = await auth();
  const id = (await params).id;

  let companyId = (!id || id === "undefined") ? null : id;

  if (!companyId) {
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();
    companyId = company?.id;
  }

  if (!companyId) return Response.json({ error: "Company not found" }, { status: 404 });

  const body = await req.json();
  const { data, error } = await supabase
    .from("company_updates")
    .insert([{ company_id: companyId, clerk_user_id: userId || null, ...body }])
    .select()
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
export async function DELETE(req, { params }) {
  const { userId } = await auth();
  const { searchParams } = new URL(req.url);
  const updateId = searchParams.get("update_id");

  if (!updateId) return Response.json({ error: "Missing update_id" }, { status: 400 });

  const { error } = await supabase
    .from("company_updates")
    .delete()
    .eq("id", updateId)
    .eq("clerk_user_id", userId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}