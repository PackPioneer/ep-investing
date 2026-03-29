import { supabase } from "@/lib/supabase";

export async function POST(req, { params }) {
  const { id } = params;
  await supabase.rpc("increment_job_views", { job_id: id });
  return Response.json({ ok: true });
}
