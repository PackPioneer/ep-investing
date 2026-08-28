import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const INTERESTS = ["network", "investor_intro", "partner_intro", "deal_flow", "rfp", "other"];
const INTEREST_LABEL = {
  network: "Access to the network (companies, investors, individuals)",
  investor_intro: "Warm intros to investors",
  partner_intro: "Partnership introductions",
  deal_flow: "Placement in investor deal-flow",
  rfp: "RFP / procurement priority",
  other: "Something else",
};

async function resolveCompany(userId) {
  const supabase = db();
  try {
    const client = await clerkClient();
    const { data: memberships } = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
    const orgIds = (memberships || []).map((m) => m.organization.id);
    if (orgIds.length) {
      const { data } = await supabase.from("companies").select("id, name")
        .in("clerk_organization_id", orgIds).order("id", { ascending: true }).limit(1);
      if (data && data[0]) return data[0];
    }
  } catch { /* ignore */ }
  const { data } = await supabase.from("companies").select("id, name")
    .or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`).order("id", { ascending: true }).limit(1);
  return (data && data[0]) || null;
}

// GET — has the company already submitted an inquiry? (so the tab can reflect it)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const company = await resolveCompany(userId);
  if (!company) return Response.json({ error: "No company found" }, { status: 404 });
  const { data } = await db().from("enterprise_inquiries")
    .select("id, interests, status, created_at").eq("company_id", company.id)
    .order("created_at", { ascending: false }).limit(5);
  return Response.json({ company, inquiries: data || [] });
}

// POST — company requests an enterprise conversation.
export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const company = await resolveCompany(userId);
  if (!company) return Response.json({ error: "No company found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const interests = Array.isArray(body.interests) ? body.interests.filter((i) => INTERESTS.includes(i)) : [];
  const note = (body.note || "").toString().slice(0, 2000);
  const contact_name = (body.contact_name || "").toString().slice(0, 200) || null;
  let contact_email = (body.contact_email || "").toString().slice(0, 200) || null;
  if (!contact_email) {
    try { const u = await currentUser(); contact_email = u?.emailAddresses?.[0]?.emailAddress || null; } catch {}
  }
  if (!interests.length && !note.trim()) return Response.json({ error: "Tell us what you're looking for." }, { status: 400 });

  const supabase = db();
  const { data, error } = await supabase.from("enterprise_inquiries").insert({
    company_id: company.id,
    company_name: company.name,
    interests,
    note: note || null,
    contact_name,
    contact_email,
    clerk_user_id: userId,
    status: "new",
  }).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Notify the EP team (best-effort).
  try {
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "EP Network <noreply@epinvesting.com>",
          to: "info@epinvesting.com",
          subject: `Enterprise inquiry: ${company.name}`,
          html: `
            <h2>New enterprise “talk to sales” inquiry</h2>
            <p><strong>Company:</strong> ${company.name}</p>
            <p><strong>Interested in:</strong> ${interests.map((i) => INTEREST_LABEL[i]).join(", ") || "—"}</p>
            <p><strong>Note:</strong> ${note || "—"}</p>
            <p><strong>Contact:</strong> ${contact_name || "—"} · ${contact_email || "—"}</p>
            <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/enterprise">Review in admin →</a></p>`,
        }),
      });
    }
  } catch { /* email failure shouldn't block */ }

  return Response.json({ ok: true, inquiry: data });
}
