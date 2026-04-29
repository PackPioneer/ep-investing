import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req, { params }) {
  const adminId = await requireAdmin();
  if (!adminId) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action } = body; // "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  // Fetch the NGO so we can email the contact
  const { data: ngo, error: fetchErr } = await supabase
    .from("ngos")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !ngo) {
    return Response.json({ error: "NGO not found" }, { status: 404 });
  }

  const newStatus = action === "approve" ? "active" : "rejected";

  const { error: updateErr } = await supabase
    .from("ngos")
    .update({ status: newStatus })
    .eq("id", id);

  if (updateErr) {
    return Response.json({ error: updateErr.message }, { status: 500 });
  }

  // Send email notification
  if (ngo.contact_email) {
    try {
      if (action === "approve") {
        await getResend().emails.send({
          from: "EP Investing <noreply@epinvesting.com>",
          to: ngo.contact_email,
          subject: `${ngo.name} is now live on EP Investing`,
          html: `
            <p>Your NGO profile is approved and live.</p>
            <p>View it: <a href="https://www.epinvesting.com/ngos/${ngo.slug}">epinvesting.com/ngos/${ngo.slug}</a></p>
            <p>You can now log in and edit your profile, post grant programs, and add job openings from your dashboard at <a href="https://www.epinvesting.com/dashboard/ngo">epinvesting.com/dashboard/ngo</a>.</p>
            <p>Thanks for joining the EP Investing community.</p>
            <p>— The EP Investing Team</p>
          `,
        });
      } else {
        await getResend().emails.send({
          from: "EP Investing <noreply@epinvesting.com>",
          to: ngo.contact_email,
          subject: `Your EP Investing submission`,
          html: `
            <p>Thanks for your interest in listing <strong>${ngo.name}</strong> on EP Investing.</p>
            <p>After review, we're not able to approve this submission at this time. If you believe this is in error or have additional information to provide, please reply to this email.</p>
            <p>— The EP Investing Team</p>
          `,
        });
      }
    } catch (e) {
      console.error("Email send failed:", e);
      // Don't fail the request if email fails
    }
  }

  return Response.json({ success: true, status: newStatus });
}
