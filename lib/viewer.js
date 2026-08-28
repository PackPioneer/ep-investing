// Resolve a signed-in Clerk user into an identifiable viewer for analytics.
// Investor (claimed vc_firm) → company (owner/claimant) → NGO (claimant) → individual.
// Companies and NGOs are "potential partners" in the UI; individuals stay anonymous.
export async function resolveViewer(supabase, userId) {
  const base = { kind: "individual", label: null, investor_id: null, company_id: null, ngo_id: null };
  if (!userId) return base;

  const { data: firm } = await supabase.from("vc_firms")
    .select("id, name").eq("claimed_by_clerk_user_id", userId).order("id", { ascending: true }).limit(1);
  if (firm && firm[0]) return { kind: "investor", label: firm[0].name || "An investor", investor_id: firm[0].id, company_id: null, ngo_id: null };

  const { data: co } = await supabase.from("companies")
    .select("id, name").or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`).order("id", { ascending: true }).limit(1);
  if (co && co[0]) return { kind: "company", label: co[0].name || "A company", investor_id: null, company_id: co[0].id, ngo_id: null };

  const { data: ngo } = await supabase.from("ngos")
    .select("id, name").eq("clerk_user_id", userId).order("id", { ascending: true }).limit(1);
  if (ngo && ngo[0]) return { kind: "ngo", label: ngo[0].name || "An organization", investor_id: null, company_id: null, ngo_id: ngo[0].id };

  return base;
}
