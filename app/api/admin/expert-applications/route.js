import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("experts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data || []);
}

export async function PATCH(req) {
  const { id, status } = await req.json();

  const { data: expert, error } = await supabaseAdmin
    .from("experts")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (status === "approved" && expert?.email) {
    await getResend().emails.send({
      from: "EP Investing <noreply@epinvesting.com>",
      to: expert.email,
      subject: "You're in — EP Investing Expert Network",
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0f1a14;">
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">Welcome to the expert network</h1>
          <p style="font-size: 15px; line-height: 1.7; color: #4a5568; margin-bottom: 16px;">Hi ${expert.name},</p>
          <p style="font-size: 15px; line-height: 1.7; color: #4a5568; margin-bottom: 16px;">Your application to join the EP Investing expert network has been approved. Your profile is now live and visible to climate companies and investors on the platform.</p>
          <p style="font-size: 15px; line-height: 1.7; color: #4a5568; margin-bottom: 32px;">Sign in to manage your profile and start receiving enquiries.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/sign-in" style="display: inline-block; background: #2d6a4f; color: white; font-family: sans-serif; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
            Go to your dashboard →
          </a>
          <p style="font-size: 13px; color: #a0aec0; margin-top: 40px;">— The EP Investing Team</p>
        </div>
      `,
      text: `Hi ${expert.name}, your application to join the EP Investing expert network has been approved. Sign in at ${process.env.NEXT_PUBLIC_SITE_URL}/sign-in to manage your profile.`,
    });
  }

  if (status === "rejected" && expert?.email) {
    await getResend().emails.send({
      from: "EP Investing <noreply@epinvesting.com>",
      to: expert.email,
      subject: "Your EP Investing expert application",
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #0f1a14;">
          <h1 style="font-size: 28px; font-weight: 400; margin-bottom: 16px;">Application update</h1>
          <p style="font-size: 15px; line-height: 1.7; color: #4a5568; margin-bottom: 16px;">Hi ${expert.name},</p>
          <p style="font-size: 15px; line-height: 1.7; color: #4a5568; margin-bottom: 16px;">Thank you for applying to the EP Investing expert network. After reviewing your application, we're not able to move forward at this time.</p>
          <p style="font-size: 15px; line-height: 1.7; color: #4a5568;">We may revisit applications as the network grows. Thank you for your interest.</p>
          <p style="font-size: 13px; color: #a0aec0; margin-top: 40px;">— The EP Investing Team</p>
        </div>
      `,
      text: `Hi ${expert.name}, thank you for applying to the EP Investing expert network. After reviewing your application, we're not able to move forward at this time.`,
    });
  }

  return Response.json({ ok: true });
}