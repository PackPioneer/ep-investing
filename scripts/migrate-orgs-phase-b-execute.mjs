/**
 * Session 1 — Org Migration, PHASE B (EXECUTE)
 *
 * IRREVERSIBLE. Creates Clerk Organizations and writes their IDs back to
 * companies.clerk_organization_id.
 *
 * Safety properties:
 *   - Idempotent: skips any company that already has clerk_organization_id set.
 *     Safe to re-run if it dies partway.
 *   - Re-verifies each creator user exists in Clerk at write time (does not
 *     trust the earlier dry run). Brimstone (dead user) is skipped automatically.
 *   - Writes org id to Supabase immediately after each create, so the DB always
 *     reflects what exists in Clerk even if the script stops midway.
 *   - createdBy makes that user an org:admin (matches "everyone is admin").
 *
 * Run from repo root:
 *   node --env-file=.env.local migrate-orgs-phase-b-execute.mjs
 *
 * Rollback (if needed): in Supabase,
 *   update companies set clerk_organization_id = null where id in (...);
 * then manually delete the created orgs from the Clerk dashboard.
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
  console.log("PHASE B — EXECUTE. This creates Clerk Organizations.\n");

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

  const results = { created: [], skippedHasOrg: [], skippedNoUser: [], failed: [] };

  for (const c of companies) {
    const label = `company ${c.id} (${c.name})`;

    // Idempotency: never create a second org for a company.
    if (c.clerk_organization_id) {
      console.log(`SKIP  ${label} — already has org ${c.clerk_organization_id}`);
      results.skippedHasOrg.push(c.id);
      continue;
    }

    const creator = resolveCreator(c);
    if (!creator) {
      console.log(`SKIP  ${label} — no creator user id resolved`);
      results.skippedNoUser.push(c.id);
      continue;
    }

    // Re-verify at write time (do not trust the dry run).
    if (!(await userExists(creator))) {
      console.log(`SKIP  ${label} — creator ${creator} not found in Clerk`);
      results.skippedNoUser.push(c.id);
      continue;
    }

    try {
      const org = await clerk.organizations.createOrganization({
        name: c.name,
        createdBy: creator,
      });

      const { error: upErr } = await supabase
        .from("companies")
        .update({ clerk_organization_id: org.id })
        .eq("id", c.id);

      if (upErr) {
        // Org was created but DB write failed — record loudly. Re-running will
        // try to create ANOTHER org for this company, so this needs manual fix:
        // either set clerk_organization_id = '<org.id>' by hand, or delete the
        // org in Clerk before re-running.
        console.error(
          `WARN  ${label} — org ${org.id} CREATED but DB write failed: ${upErr.message}`
        );
        console.error(
          `      Fix manually: set companies.clerk_organization_id='${org.id}' for id ${c.id}`
        );
        results.failed.push({ id: c.id, orgId: org.id, reason: upErr.message });
        continue;
      }

      console.log(`OK    ${label} — created org ${org.id}, written to DB`);
      results.created.push({ id: c.id, orgId: org.id });
    } catch (e) {
      console.error(`FAIL  ${label} — createOrganization threw: ${e.message}`);
      results.failed.push({ id: c.id, orgId: null, reason: e.message });
    }
  }

  console.log("\n================ SUMMARY ================");
  console.log(`Created:               ${results.created.length}`);
  console.log(`Skipped (had org):     ${results.skippedHasOrg.length}`);
  console.log(`Skipped (no/bad user): ${results.skippedNoUser.length}`);
  console.log(`Failed:                ${results.failed.length}`);
  if (results.created.length) {
    console.log("\nCreated orgs:");
    results.created.forEach((r) =>
      console.log(`  company ${r.id} -> ${r.orgId}`)
    );
  }
  if (results.failed.length) {
    console.log("\nNEEDS ATTENTION:");
    results.failed.forEach((r) =>
      console.log(`  company ${r.id} -> org ${r.orgId || "(none)"} — ${r.reason}`)
    );
  }
  console.log("\nDONE.");
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
