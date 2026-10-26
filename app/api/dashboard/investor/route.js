import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { firmToProfile, patchToFirmFields, requestToFirmFields } from "@/lib/investor";

// Resolve (or self-heal) the single vc_firms profile for this investor user.
// 1. Firm already claimed by this user -> use it.
// 2. Else an approved onboarding request -> link its vc_firm, or lazily create one.
async function resolveFirm(userId) {
  const { data: claimed } = await supabase
    .from("vc_firms").select("*").eq("claimed_by_clerk_user_id", userId)
    .order("id", { ascending: true }).limit(1);
  if (claimed && claimed[0]) return claimed[0];

  const { data: reqs } = await supabase
    .from("matched_requests").select("*")
    .eq("clerk_user_id", userId).eq("path", "investor")
    .order("created_at", { ascending: false }).limit(1);
  const mr = reqs && reqs[0];
  if (!mr) return null;

  // Request already points at a firm — just claim it.
  if (mr.vc_firm_id) {
    const { data: f } = await supabase.from("vc_firms").select("*").eq("id", mr.vc_firm_id).maybeSingle();
    if (f) {
      if (f.claimed_by_clerk_user_id !== userId) {
        await supabase.from("vc_firms").update({ claimed_by_clerk_user_id: userId }).eq("id", f.id);
        f.claimed_by_clerk_user_id = userId;
      }
      return f;
    }
  }

  // Create a profile from the request (self-heal for legacy onboarded investors).
  const { data: created, error } = await supabase
    .from("vc_firms")
    .insert({ ...requestToFirmFields(mr), claimed_by_clerk_user_id: userId })
    .select().single();
  if (error || !created) return null;
  await supabase.from("matched_requests").update({ vc_firm_id: created.id }).eq("id", mr.id);
  return created;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const firm = await resolveFirm(userId);
  if (!firm) return Response.json({ error: "No investor profile found" }, { status: 404 });

  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, description, funding_stage, looking_to_raise, is_hiring, seeking_partnerships, industry_tags, target_geographies, business_model, logo_url")
    .order("created_at", { ascending: false })
    .limit(1500);

  return Response.json({ profile: firmToProfile(firm), companies: companies || [] });
}

export async function PATCH(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const firm = await resolveFirm(userId);
  if (!firm) return Response.json({ error: "No investor profile found" }, { status: 404 });

  const update = patchToFirmFields(await req.json());
  if (!Object.keys(update).length) return Response.json(firmToProfile(firm));

  const { data, error } = await supabase
    .from("vc_firms").update(update).eq("id", firm.id).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(firmToProfile(data));
}
