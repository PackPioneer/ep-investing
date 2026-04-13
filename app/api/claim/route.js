import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const { userId } = await auth();
  const body = await req.json();
  const { company_name, company_url, contact_name, contact_email, contact_role, description, plan } = body;

  if (!contact_name || !contact_email || !plan) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("claims")
    .insert({
      company_name, company_url, contact_name,
      contact_email, contact_role, description, plan,
      status: "pending",
      clerk_user_id: userId || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req) {
  const body = await req.json();
  const { id, status, admin_notes, matched_company_id } = body;

  const { error: updateError } = await supabase
    .from("claims")
    .update({ status, admin_notes, matched_company_id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return NextResponse.json({ message: updateError.message }, { status: 500 });

  // Fetch full claim data
  const { data } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .single();

  if (status === "approved" && data) {
    let companyId = matched_company_id;

    // If no existing company matched, create a new one
    if (!companyId) {
      const { data: newCompany } = await supabase
        .from("companies")
        .insert({
          name: data.company_name,
          url: data.company_url,
          description: data.description,
          clerk_user_id: data.clerk_user_id || null,
        })
        .select()
        .single();
      companyId = newCompany?.id;

      await supabase
        .from("claims")
        .update({ matched_company_id: companyId })
        .eq("id", id);
    } else if (data.clerk_user_id) {
      await supabase
        .from("companies")
        .update({ clerk_user_id: data.clerk_user_id })
        .eq("id", companyId);
    }

    // Send invitation email
    if (data.contact_email) {
      try {
        const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/company`;
        const signUpUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/sign-up?email=${encodeURIComponent(data.contact_email)}&redirect_url=${encodeURIComponent(dashboardUrl)}`;
        let inviteUrl = signUpUrl;      

        try {
          const clerk = await clerkClient();
          const invitation = await clerk.invitations.createInvitation({
            emailAddress: data.contact_email,
            redirectUrl: dashboardUrl,
            publicMetadata: { role: "company", company_id: companyId },
            notify: false, // we send our own email, suppress Clerk's default
         });
          inviteUrl = invitation.url;
        } catch (inviteErr) {
          console.error("Clerk invitation error:", inviteErr?.message || inviteErr);
        }

        console.log("Sending approval email to:", data.contact_email);
        const emailResult = await getResend().emails.send({
          from: "EP Investing <noreply@send.epinvesting.com>",
          to: data.contact_email,
          subject: `Your ${data.company_name} profile is ready on EP Investing`,
          html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f2f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e6ed;overflow:hidden;">
        <tr>
          <td style="background:#0f1a14;padding:24px 32px;">
            <span style="font-family:Georgia,serif;font-size:20px;color:#ffffff;font-weight:bold;">EP Investing</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#0f1a14;margin:0 0 16px;">Welcome, ${data.contact_name}!</h1>
            <p style="font-family:sans-serif;font-size:15px;color:#4a5568;line-height:1.6;margin:0 0 12px;">
              Your company profile for <strong>${data.company_name}</strong> has been approved and is now live on EP Investing.
            </p>
            <p style="font-family:sans-serif;font-size:15px;color:#4a5568;line-height:1.6;margin:0 0 20px;">
              Click below to set up your account and access your dashboard:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#2d6a4f;border-radius:8px;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;font-family:sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                    Access your dashboard →
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-family:sans-serif;font-size:13px;color:#718096;line-height:1.6;margin:0 0 8px;">From your dashboard you can:</p>
            <ul style="font-family:sans-serif;font-size:13px;color:#4a5568;line-height:1.8;margin:0 0 24px;padding-left:20px;">
              <li>Edit your company profile and tags</li>
              <li>Post job openings</li>
              <li>Upload your pitch deck</li>
              <li>Add funding round details</li>
              <li>Get matched with relevant investors</li>
            </ul>
            <p style="font-family:sans-serif;font-size:13px;color:#718096;">Questions? Reply to this email and we'll help.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e6ed;">
            <p style="font-family:sans-serif;font-size:11px;color:#a0aec0;margin:0;">
              EP Investing · Climate & Energy Intelligence Platform<br>
              You're receiving this because your company was approved on epinvesting.com
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
          text: `Welcome to EP Investing, ${data.contact_name}!\n\nYour company profile for ${data.company_name} has been approved and is now live on EP Investing.\n\nAccess your dashboard here: ${inviteUrl}\n\nFrom your dashboard you can edit your company profile, post jobs, upload your pitch deck, and get matched with investors.\n\nQuestions? Reply to this email.\n\nEP Investing · epinvesting.com`,
        });
        console.log("Email result:", JSON.stringify(emailResult));
      } catch (err) {
        console.error("Email error:", err);
      }
    }
  }

  return NextResponse.json(data);
}