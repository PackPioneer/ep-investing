import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";

export async function POST(req, { params }) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;

    const { error } = await supabase
      .from("ngos")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
