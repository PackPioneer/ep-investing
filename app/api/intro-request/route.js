import { NextResponse } from "next/server";
import { Resend } from "resend";

const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@epinvesting.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "otto@epinvesting.com";

export async function POST(req) {
  const { investor_id, investor_name, email, message } = await req.json();

  if (!email || !investor_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const getResend = () => new Resend(process.env.RESEND_API_KEY);

  // Notify admin
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🤝 New intro request: ${investor_name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
          <div style="border-left: 4px solid #2d6a4f; padding-left: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 22px; color: #0f1a14;">New Introduction Request</h2>
            <p style="margin: 4px 0 0; color: #718096; font-family: monospace; font-size: 12px;">EP Investing</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #718096; font-family: monospace; font-size: 11px; width: 120px;">Investor</td>
              <td style="padding: 8px 0; color: #0f1a14; font-size: 14px;">${investor_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #718096; font-family: monospace; font-size: 11px;">From</td>
              <td style="padding: 8px 0; color: #0f1a14; font-size: 14px;">${email}</td>
            </tr>
          </table>
          ${message ? `
          <div style="margin-top: 16px; padding: 16px; background: #f8f9fb; border-radius: 8px; border: 1px solid #e2e6ed;">
            <p style="margin: 0; color: #4a5568; font-size: 13px; line-height: 1.6;">${message}</p>
          </div>` : ""}
        </div>
      </div>
    `,
  });

  // Confirm to requester
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Your intro request to ${investor_name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
          <h2 style="margin: 0 0 8px; font-size: 22px; color: #0f1a14;">Request received.</h2>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            We've received your introduction request to <strong>${investor_name}</strong> and will be in touch within 1–2 business days.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e6ed; margin: 24px 0;" />
          <p style="color: #a0aec0; font-size: 11px; font-family: monospace; margin: 0;">EP Investing · epinvesting.com</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
