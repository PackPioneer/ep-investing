import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

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
        let inviteUrl = dashboardUrl;

        try {
          const clerk = await clerkClient();
          const invitation = await clerk.invitations.createInvitation({
            emailAddress: data.contact_email,
            redirectUrl: dashboardUrl,
            publicMetadata: { role: "company", company_id: companyId },
          });
          inviteUrl = invitation.url;
        } catch (inviteErr) {
          console.error("Clerk invitation error:", inviteErr?.message || inviteErr);
        }

        console.log("Sending approval email to:", data.contact_email);
        const emailResult = await resend.emails.send({
          from: "EP Investing <noreply@send.epinvesting.com>",
          to: data.contact_email,
          subject: `Your ${data.company_name} profile is ready on EP Investing`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="font-size: 24px; color: #0f1a14;">Welcome to EP Investing, ${data.contact_name}!</h1>
              <p style="color: #4a5568; line-height: 1.6;">Your company profile for <strong>${data.company_name}</strong> has been approved and is now live on EP Investing.</p>
              <p style="color: #4a5568; line-height: 1.6;">Click the button below to access your company dashboard where you can:</p>
              <ul style="color: #4a5568; line-height: 1.8;">
                <li>Edit your company description and tags</li>
                <li>Post job openings</li>
                <li>Share company updates</li>
                <li>Upload your pitch deck</li>
                <li>Add funding round details</li>
              </ul>
              <a href="${inviteUrl}" style="display: inline-block; background: #2d6a4f; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-family: sans-serif; font-weight: 600; margin: 20px 0;">
                Access your dashboard →
              </a>
              <p style="color: #718096; font-size: 13px; margin-top: 30px;">If you have any questions, reply to this email.</p>
            </div>
          `,
        });
        console.log("Email result:", JSON.stringify(emailResult));
      } catch (err) {
        console.error("Email error:", err);
      }
    }
  }

  return NextResponse.json(data);
}