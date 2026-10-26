import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve the investor's unified vc_firms profile.
  let { data: firms } = await supabaseAdmin
    .from("vc_firms").select("id").eq("claimed_by_clerk_user_id", userId)
    .order("id", { ascending: true }).limit(1);
  let firm = firms && firms[0];
  if (!firm) {
    const { data: mr } = await supabaseAdmin
      .from("matched_requests").select("vc_firm_id").eq("clerk_user_id", userId).eq("path", "investor")
      .order("created_at", { ascending: false }).limit(1);
    if (mr && mr[0]?.vc_firm_id) firm = { id: mr[0].vc_firm_id };
  }
  if (!firm) return Response.json({ error: "No investor found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop();
  const filename = `investor-${firm.id}-logo.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("logos")
    .upload(filename, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabaseAdmin.storage.from("logos").getPublicUrl(filename);

  await supabaseAdmin
    .from("vc_firms")
    .update({ logo_url: urlData.publicUrl })
    .eq("id", firm.id);

  return Response.json({ url: urlData.publicUrl });
}