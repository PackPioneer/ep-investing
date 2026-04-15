import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(req, { params }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { updateId } = await params;

  const { error } = await supabase
    .from("company_updates")
    .delete()
    .eq("id", updateId)
    .eq("clerk_user_id", userId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}