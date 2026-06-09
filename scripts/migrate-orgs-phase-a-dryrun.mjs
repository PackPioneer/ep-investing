/**
 * Session 1 — Org Migration, PHASE A (DRY RUN)
 *
 * READ-ONLY. Creates nothing in Clerk or Supabase.
 *
 * For each company that has clerk_user_id OR claimed_by_clerk_user_id set:
 *   - resolves the "creator" user (claimed_by wins, falls back to clerk_user_id)
 *   - checks that user still exists in Clerk
 *   - reports whether the company already has clerk_organization_id set
 *
 * Run from repo root:  node migrate-orgs-phase-a-dryrun.mjs
 * Requires CLERK_SECRET_KEY and SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
 * in your environment (e.g. via `node --env-file=.env.local migrate-orgs-phase-a-dryrun.mjs`
 * on Node 20+, or load however you normally do).
 */

import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLERK_SECRET_KEY) {
  console.error(
    "Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL), " +
      "SUPABASE_SERVICE_ROLE_KEY, and CLERK_SECRET_KEY."
  );
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: CLERK_SECRET_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// claimed_by wins, then fall back to the older signup linkage
function resolveCreator(row) {
  return row.claimed_by_clerk_user_id || row.clerk_user_id || null;
}

async function userExists(userId) {
  try {
    await clerk.users.getUser(userId);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("PHASE A — DRY RUN. Nothing will be created.\n");

  const { data: companies, error } = await supabase
    .from("companies")
    .select(
      "id, name, clerk_user_id, claimed_by_clerk_user_id, clerk_organization_id"
    )
    .or("clerk_user_id.not.is.null,claimed_by_clerk_user_id.not.is.null");

  if (error) {
    console.error("Supabase query failed:", error.message);
    process.exit(1);
  }

  console.log(`Found ${companies.length} candidate compan(ies).\n`);

  const rows = [];
  for (const c of companies) {
    const creator = resolveCreator(c);
    const exists = creator ? await userExists(creator) : false;
    rows.push({
      id: c.id,
      name: c.name,
      creatorUserId: creator,
      userExists: exists,
      alreadyHasOrg: !!c.clerk_organization_id,
      existingOrgId: c.clerk_organization_id || "",
    });
  }

  console.table(rows);

  const willCreate = rows.filter((r) => r.userExists && !r.alreadyHasOrg);
  const skipExisting = rows.filter((r) => r.alreadyHasOrg);
  const blocked = rows.filter((r) => !r.userExists);

  console.log("\nSummary if you run Phase B as-is:");
  console.log(`  Orgs that WOULD be created:        ${willCreate.length}`);
  console.log(`  Skipped (already have org id):     ${skipExisting.length}`);
  console.log(`  BLOCKED (creator user not found):  ${blocked.length}`);

  if (blocked.length) {
    console.log(
      "\n  Blocked rows need attention before Phase B — their stored user ID " +
        "no longer resolves in Clerk:"
    );
    blocked.forEach((r) =>
      console.log(`    - company ${r.id} (${r.name}) -> ${r.creatorUserId}`)
    );
  }

  console.log("\nDRY RUN COMPLETE. No data was written.");
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
