import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
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

  // Update claim status
  const { error: updateError } = await supabase
    .from("claims")
    .update({ status, admin_notes, matched_company_id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return NextResponse.json({ message: updateError.message }, { status: 500 });

  // Fetch full claim
  const { data: claim } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .single();

  if (!claim) return NextResponse.json({ message: "Claim not found" }, { status: 404 });

  if (status === "approved") {
    console.log("Approval triggered for:", claim.contact_email);

    // Find or create company
    let companyId = matched_company_id;

    if (!companyId) {
      const { data: newCompany, error: insertError } = await supabase
        .from("companies")
        .insert({
          name: claim.company_name,
          url: claim.company_url,
          description: claim.description,
          clerk_user_id: claim.clerk_user_id || null,
        })
        .select()
        .single();
      
      if (insertError) {
        console.error("Company insert error:", insertError.message);
        // Company may already exist - try to find it
        const { data: existingCompany } = await supabase
          .from("companies")
          .select("id")
          .ilike("name", claim.company_name)
          .single();
        companyId = existingCompany?.id || null;
      } else {
        companyId = newCompany?.id;
      }

      if (companyId) {
        await supabase
          .from("claims")
          .update({ matched_company_id: companyId })
          .eq("id", id);
      }
    }

    // Send approval email
    if (!claim.contact_email) {
      console.error("No contact email on claim", id);
      return NextResponse.json(claim);
    }

    console.log("Sending approval email to:", claim.contact_email);

    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/company`;
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/sign-in?redirect_url=${encodeURIComponent(dashboardUrl)}`;

    try {
      const result = await getResend().emails.send({
        from: "EP Investing <noreply@send.epinvesting.com>",
        to: claim.contact_email,
        subject: `Your ${claim.company_name} profile is ready on EP Investing`,
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
            <h1 style="font-family:Georgia,serif;font-size:22px;color:#0f1a14;margin:0 0 16px;">Welcome, ${claim.contact_name}!</h1>
            <p style="font-family:sans-serif;font-size:15px;color:#4a5568;line-height:1.6;margin:0 0 12px;">
              Your company profile for <strong>${claim.company_name}</strong> has been approved and is now live on EP Investing.
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
        text: `Welcome to EP Investing, ${claim.contact_name}!\n\nYour company profile for ${claim.company_name} has been approved.\n\nAccess your dashboard here: ${inviteUrl}\n\nQuestions? Reply to this email.\n\nEP Investing · epinvesting.com`,
      });
      console.log("Email sent:", JSON.stringify(result));
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }
  }

  return NextResponse.json(claim);}
