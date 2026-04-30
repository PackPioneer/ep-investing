import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/admin";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req, { params }) {
  const userId = await requireAdmin();
  if (!userId) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;

    const { data: ngo, error: fetchErr } = await supabase
      .from("ngos")
      .select("id, name, slug, contact_email, status")
      .eq("id", id)
      .single();

    if (fetchErr || !ngo) {
      return Response.json({ error: "NGO not found" }, { status: 404 });
    }

    if (ngo.status === "active") {
      return Response.json({ error: "NGO is already active" }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from("ngos")
      .update({ status: "active" })
      .eq("id", id);

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500 });

    if (ngo.contact_email) {
      try {
        await getResend().emails.send({
          from: "EP Investing <noreply@epinvesting.com>",
          to: ngo.contact_email,
          subject: `${ngo.name} is now live on EP Investing`,
          html: `
            <p>Hi,</p>
            <p>Good news — your NGO profile for <strong>${ngo.name}</strong> has been approved and is now live on EP Investing.</p>
            <p>View your profile: <a href="https://www.epinvesting.com/ngos/${ngo.slug}">https://www.epinvesting.com/ngos/${ngo.slug}</a></p>
            <p>Soon you'll be able to log in to publish grant programs, post jobs, and edit your profile directly. We'll let you know when that's ready.</p>
            <p>— The EP Investing Team</p>
          `,
        });
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
