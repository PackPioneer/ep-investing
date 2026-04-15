import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(req, { params }) {
  const { data, error } = await supabase
    .from("company_updates")
    .select("*")
    .eq("company_id", params.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}

export async function POST(req, { params }) {
  const { userId } = await auth();
  
  let companyId = params.id;
  
  // If company_id is "undefined" or missing, look it up by clerk_user_id
  if (!companyId || companyId === "undefined") {
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