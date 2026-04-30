import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req, { params }) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;

    const { data: claim, error: claimErr } = await supabase
      .from("ngo_claims")
      .select(`
        *,
        ngo:ngos(id, name, slug, clerk_user_id)
      `)
      .eq("id", id)
      .single();

    if (claimErr || !claim) {
      return Response.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.status !== "pending") {
      return Response.json({ error: "Claim is not pending" }, { status: 400 });
    }

    if (claim.ngo?.clerk_user_id) {
      return Response.json({ error: "NGO is already claimed" }, { status: 400 });
    }

    // Transfer ownership
    const { error: ngoErr } = await supabase
      .from("ngos")
      .update({
        clerk_user_id: claim.clerk_user_id,
        contact_email: claim.claimant_email,
        claimable: false,
      })
      .eq("id", claim.ngo_id);

    if (ngoErr) return Response.json({ error: ngoErr.message }, { status: 500 });

    // Mark claim approved
    const { error: updateErr } = await supabase
      .from("ngo_claims")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq("id", id);

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

    // Auto-reject other pending claims for this NGO
    await supabase
      .from("ngo_claims")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
        admin_notes: "Auto-rejected: another claim for this NGO was approved",
      })
      .eq("ngo_id", claim.ngo_id)
      .eq("status", "pending");

    // Notify claimant
    try {
      await getResend().emails.send({
        from: "EP Investing <noreply@epinvesting.com>",
        to: claim.claimant_email,
        subject: `${claim.ngo?.name} — claim approved`,
        html: `
          <p>Hi ${claim.claimant_name},</p>
          <p>Good news — your claim for <strong>${claim.ngo?.name}</strong> has been approved. You now own the profile on EP Investing.</p>
          <p>View your profile: <a href="https://www.epinvesting.com/ngos/${claim.ngo?.slug}">https://www.epinvesting.com/ngos/${claim.ngo?.slug}</a></p>
          <p>Soon you'll be able to log in to publish grant programs, post jobs, and edit your profile directly. We'll let you know when that's ready.</p>
          <p>— The EP Investing Team</p>
        `,
      });
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
