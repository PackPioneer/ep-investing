import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = company.id + "-pitch-deck.pdf";

  const { error: uploadError } = await supabaseAdmin.storage
    .from("pitch-decks")
    .upload(filename, buffer, { contentType: "application/pdf", upsert: true });

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage
    .from("pitch-decks")
    .getPublicUrl(filename);

  await supabase
    .from("companies")
    .update({ pitch_deck_url: urlData.publicUrl })
    .eq("id", company.id);

  return Response.json({ url: urlData.publicUrl });
}
export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  await supabaseAdmin.from("companies").update({ pitch_deck_url: null }).eq("id", company.id);
  return Response.json({ ok: true });
}