import { supabase } from "@/lib/supabase";
import { clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const { data, error } = await supabase
    .from("matched_requests")
    .select("*")
    .eq("path", "investor")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PATCH(req) {
  const body = await req.json();
  const { id, status, admin_notes } = body;

  const { data, error } = await supabase
    .from("matched_requests")
    .update({ status, admin_notes })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (!error && status === "approved" && data?.email) {
    try {
      const dashboardUrl = process.env.NEXT_PUBLIC_SITE_URL + "/dashboard/investor";
      let inviteUrl = dashboardUrl;

      try {
        const clerk = await clerkClient();
        const invitation = await clerk.invitations.createInvitation({
          emailAddress: data.email,
          redirectUrl: dashboardUrl,
          publicMetadata: { role: "investor" },
        });
        inviteUrl = invitation.url;
      } catch {
        console.log("User exists, sending direct link");
      }

      await getResend().emails.send({
        from: "EP Investing <noreply@send.epinvesting.com>",
        to: data.email,
        subject: "Your EP Investing investor access is ready",
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #0f1a14;">Welcome to EP Investing, ${data.name}!</h1>
            <p style="color: #4a5568; line-height: 1.6;">Your investor profile has been approved. You now have access to:</p>
            <ul style="color: #4a5568; line-height: 1.8;">
              <li>Full company signal feed</li>
              <li>Filter companies raising by stage</li>
              <li>Direct contact with verified founders</li>
              <li>Weekly curated deal digest</li>
            </ul>
            <a href="${inviteUrl}" style="display: inline-block; background: #2d6a4f; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-family: sans-serif; font-weight: 600; margin: 20px 0;">
              Access your investor dashboard →
            </a>
            <p style="color: #718096; font-size: 13px; margin-top: 30px;">Questions? Reply to this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Investor approval error:", err);
    }
  }

  return Response.json(data);
}