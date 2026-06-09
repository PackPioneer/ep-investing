import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Resolve the caller's company org. Returns { orgId, isMember } or null userId.
// A user belongs to exactly one company org in this model, so we take the first
// membership whose org id matches a company row.
async function resolveUserOrg(userId) {
  const client = await clerkClient();
  const { data: memberships } =
    await client.users.getOrganizationMembershipList({ userId, limit: 100 });
  const orgIds = memberships.map((m) => m.organization.id);
  if (orgIds.length === 0) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("id, name, clerk_organization_id")
    .in("clerk_organization_id", orgIds)
    .maybeSingle();

  if (!company) return null;
  return { orgId: company.clerk_organization_id, company };
}

// =====================================================================
// GET — list current members + pending invitations for the caller's org
// =====================================================================
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolved = await resolveUserOrg(userId);
  if (!resolved) {
    return NextResponse.json({ error: "No company organization" }, { status: 404 });
  }

  try {
    const client = await clerkClient();
    const [membersRes, invitesRes] = await Promise.all([
      client.organizations.getOrganizationMembershipList({
        organizationId: resolved.orgId,
        limit: 100,
      }),
      client.organizations.getOrganizationInvitationList({
        organizationId: resolved.orgId,
        status: ["pending"],
      }),
    ]);

    const members = membersRes.data.map((m) => ({
      userId: m.publicUserData?.userId || null,
      email: m.publicUserData?.identifier || null,
      firstName: m.publicUserData?.firstName || null,
      lastName: m.publicUserData?.lastName || null,
      role: m.role,
      joinedAt: m.createdAt,
      isSelf: m.publicUserData?.userId === userId,
    }));

    const pending = invitesRes.data.map((i) => ({
      id: i.id,
      email: i.emailAddress,
      role: i.role,
      createdAt: i.createdAt,
    }));

    return NextResponse.json({ members, pending });
  } catch (err) {
    console.error("Team GET error:", err);
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }
}

// =====================================================================
// POST — invite a new member by email (as org:admin per the equal-members model)
// =====================================================================
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const email = (body?.email || "").trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const resolved = await resolveUserOrg(userId);
  if (!resolved) {
    return NextResponse.json({ error: "No company organization" }, { status: 404 });
  }

  try {
    const client = await clerkClient();
    await client.organizations.createOrganizationInvitation({
      organizationId: resolved.orgId,
      inviterUserId: userId,
      emailAddress: email,
      role: "org:admin",
      redirectUrl: "https://www.epinvesting.com/sign-up",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Clerk throws if the email is already a member or already invited.
    const msg =
      err?.errors?.[0]?.longMessage ||
      err?.errors?.[0]?.message ||
      "Failed to send invitation";
    console.error("Team POST error:", err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// =====================================================================
// DELETE — remove a member by their userId (cannot remove self here)
// =====================================================================
export async function DELETE(req) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const targetUserId = body?.targetUserId;
  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  }
  if (targetUserId === userId) {
    return NextResponse.json(
      { error: "Use the leave action to remove yourself" },
      { status: 400 }
    );
  }

  const resolved = await resolveUserOrg(userId);
  if (!resolved) {
    return NextResponse.json({ error: "No company organization" }, { status: 404 });
  }

  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganizationMembership({
      organizationId: resolved.orgId,
      userId: targetUserId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Team DELETE error:", err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 400 });
  }
}
