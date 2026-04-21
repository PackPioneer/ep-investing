import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
const { url, description, funding_stage, business_model, looking_to_raise, is_hiring, seeking_partnerships, industry_tags,
  show_contact, primary_contact_name, primary_contact_email, secondary_contact_name, secondary_contact_email } = body;
  const { data, error } = await supabase
    .from("companies")
    .update({ url, description, funding_stage, business_model, looking_to_raise, is_hiring, seeking_partnerships, industry_tags, show_contact, primary_contact_name, primary_contact_email, secondary_contact_name, secondary_contact_email })
    .eq("clerk_user_id", userId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}