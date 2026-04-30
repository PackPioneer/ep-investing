/**
 * lib/ngo-owner.js
 *
 * Helper to find the NGO owned by the signed-in user.
 *
 * v1 behavior: if a user owns multiple NGOs, returns the first one
 * (lowest id). Org switcher is a v2 enhancement.
 *
 * Returns:
 *   { userId: string, ngo: object } - signed in AND owns an NGO
 *   { userId: string, ngo: null }   - signed in but no NGO yet
 *   { userId: null, ngo: null }     - not signed in
 */

import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function getOwnedNgo() {
  const { userId } = await auth();
  if (!userId) return { userId: null, ngo: null };

  const { data, error } = await supabase
    .from("ngos")
    .select("*")
    .eq("clerk_user_id", userId)
    .order("id", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return { userId, ngo: null };
  return { userId, ngo: data };
}

/**
 * Lighter version that only checks ownership of a SPECIFIC NGO id.
 * Use in mutation routes for grant/job ops to verify the user owns
 * the NGO they're trying to publish under.
 */
export async function userOwnsNgo(userId, ngoId) {
  if (!userId || !ngoId) return false;
  const { data, error } = await supabase
    .from("ngos")
    .select("id")
    .eq("id", ngoId)
    .eq("clerk_user_id", userId)
    .single();
  return !error && !!data;
}
