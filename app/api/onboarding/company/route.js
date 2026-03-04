// ============================================================
// FILE 1: app/api/onboarding/company/route.js
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "otto@epinvesting.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@epinvesting.com";

export async function POST(req) {
  const body = await req.json();
  const {
    company_name, website, contact_name, contact_email,
    contact_role, sector, stage, funding_round,
    location, description, funding_raised
  } = body;

  if (!company_name || !contact_name || !contact_email) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  // Save to Supabase
  const { data, error } = await supabase
    .from("claims")
    .insert({
      company_name, company_url: website, contact_name,
      contact_email, contact_role, description,
      plan: `${stage || "unknown"} · ${sector || "unknown"}`,
      status: "pending",
      admin_notes: `Funding: ${funding_raised || "n/a"} · Round: ${funding_round || "n/a"} · Location: ${location || "n/a"}`
    })
    .select().single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  // Notify admin
  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `🏢 New company claim: ${company_name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
          <div style="border-left: 4px solid #2d6a4f; padding-left: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 22px; color: #0f1a14;">New Company Claim</h2>
            <p style="margin: 4px 0 0; color: #718096; font-family: monospace; font-size: 12px;">EP Investment</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            ${[
              ["Company", company_name],
              ["Website", website],
              ["Contact", `${contact_name}${contact_role ? ` · ${contact_role}` : ""}`],
              ["Email", contact_email],
              ["Sector", sector],
              ["Stage", stage],
              ["Round", funding_round],
              ["Raised", funding_raised],
              ["Location", location],
            ].filter(([, v]) => v).map(([k, v]) => `
              <tr>
                <td style="padding: 8px 0; color: #718096; font-family: monospace; font-size: 11px; width: 100px; vertical-align: top;">${k}</td>
                <td style="padding: 8px 0; color: #0f1a14; font-size: 14px;">${v}</td>
              </tr>
            `).join("")}
          </table>
          ${description ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e6ed;"><p style="color: #4a5568; font-size: 13px; line-height: 1.6; margin: 0;">${description}</p></div>` : ""}
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://epinvesting.com"}/admin/claims"
              style="background: #2d6a4f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
              View in Admin →
            </a>
          </div>
        </div>
      </div>
    `,
  });

  // Confirm to user
  await resend.emails.send({
    from: FROM_EMAIL,
    to: contact_email,
    subject: `We received your claim for ${company_name}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
          <h2 style="margin: 0 0 8px; font-size: 24px; color: #0f1a14;">You're on the list, ${contact_name}.</h2>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            We've received your claim for <strong>${company_name}</strong> and will verify it within 1–2 business days.
            Once approved, your profile will be live and discoverable by investors on EP Investment.
          </p>
          <div style="background: #f8f9fb; border-radius: 12px; padding: 20px; border: 1px solid #e2e6ed; margin-bottom: 24px;">
            <p style="margin: 0; font-family: monospace; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Your submission</p>
            <p style="margin: 0; font-size: 14px; color: #0f1a14;"><strong>${company_name}</strong>${sector ? ` · ${sector.replace(/_/g, " ")}` : ""}${stage ? ` · ${stage}` : ""}</p>
          </div>
          <p style="color: #718096; font-size: 13px; margin: 0;">
            Questions? Reply to this email and we'll get back to you.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e6ed; margin: 24px 0;" />
          <p style="color: #a0aec0; font-size: 11px; font-family: monospace; margin: 0;">EP Investment · epinvesting.com</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json(data);
}
