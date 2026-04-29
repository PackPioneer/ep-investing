/**
 * lib/admin.js
 *
 * Centralizes admin authorization. Use in server components, API routes,
 * and middleware where you need to verify the caller is an admin.
 *
 * Set ADMIN_USER_IDS in your Vercel env (Production, Preview, AND Development)
 * as a comma-separated list of Clerk user IDs:
 *
 *   ADMIN_USER_IDS=user_abc123,user_def456
 *
 * Trim whitespace, no quotes around the value.
 */

import { auth } from "@clerk/nextjs/server";

function getAdminIds() {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Server-side admin check. Returns the userId if admin, null otherwise.
 * Use in API routes:
 *
 *   const userId = await requireAdmin();
 *   if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });
 */
export async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const admins = getAdminIds();
  return admins.includes(userId) ? userId : null;
}

/**
 * Boolean check — is the given userId an admin?
 */
export function isAdmin(userId) {
  if (!userId) return false;
  return getAdminIds().includes(userId);
}
