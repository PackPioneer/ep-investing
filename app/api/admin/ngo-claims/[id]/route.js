import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req, { params }) {
  const adminId = await requireAdmin();
  if (!adminId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action, admin_notes } = body;

  if (!["approve", "reject"].includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  // Fetch claim with NGO info
  const { data: claim, error: fetchErr } = await supabase
    .from("ngo_claims")
    .select("*, ngo:ngos(id, slug, name)")
    .eq("id", id)
    .single();

  if (fetchErr || !claim) {
    return Response.json({ error: "Claim not found" }, { status: 404 });
  }

  if (claim.status !== "pending") {
    return Response.json({ error: "Claim already reviewed" }, { status: 400 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  // Update claim
  const { error: updateErr } = await supabase
    .from("ngo_claims")
    .update({
      status: newStatus,
      admin_notes: admin_notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq("id", id);

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 });
  }

  // On approve: transfer ownership to claimant
  if (action === "approve") {
    const { error: transferErr } = await supabase
      .from("ngos")
      .update({
        clerk_user_id: claim.clerk_user_id,
        claimable: false,
        contact_email: claim.claimant_email,
        verified: claim.email_domain_match,
        // status stays "active" — already was for seeded orgs
      })
      .eq("id", claim.ngo_id);

    if (transferErr) {
      return Response.json({ error: transferErr.message }, { status: 500 });
    }

    // Auto-reject any OTHER pending claims for this NGO
    await supabase
      .from("ngo_claims")
      .update({
        status: "rejected",
        admin_notes: "Auto-rejected: another claim was approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("ngo_id", claim.ngo_id)
      .eq("status", "pending");
  }

  // Send email
  if (claim.claimant_email) {
    try {
      if (action === "approve") {
        await getResend().emails.send({
          from: "EP Investing <noreply@epinvesting.com>",
          to: claim.claimant_email,
          subject: `You now manage ${claim.ngo.name} on EP Investing`,
          html: `
            <p>Hi ${claim.claimant_name},</p>
            <p>Your claim for <strong>${claim.ngo.name}</strong> has been approved. You can now log in and manage the profile.</p>
            <p>View profile: <a href="https://www.epinvesting.com/ngos/${claim.ngo.slug}">epinvesting.com/ngos/${claim.ngo.slug}</a></p>
            <p>Manage from your dashboard: <a href="https://www.epinvesting.com/dashboard/ngo">epinvesting.com/dashboard/ngo</a></p>
            <p>— The EP Investing Team</p>
          `,
        });
      } else {
        await getResend().emails.send({
          from: "EP Investing <noreply@epinvesting.com>",
          to: claim.claimant_email,
          subject: `Your claim request`,
          html: `
            <p>Hi ${claim.claimant_name},</p>
            <p>We weren't able to approve your claim for <strong>${claim.ngo.name}</strong> at this time.</p>
            ${admin_notes ? `<p>Note from review: ${admin_notes}</p>` : ""}
            <p>If you believe this is in error or have additional information to provide, please reply to this email.</p>
            <p>— The EP Investing Team</p>
          `,
        });
      }
    } catch (e) {
      console.error("Email send failed:", e);
    }
  }

  return Response.json({ success: true, status: newStatus });
}
