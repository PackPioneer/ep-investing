import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const body = await req.json();
  const { name, email, location, experience, job_types, sectors, open_to_remote } = body;

  if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });

  await supabase.from("matched_requests").insert({
    path: "researcher",
    name, email,
    notes: [
      location && `Location: ${location}`,
      experience && `Experience: ${experience}`,
      job_types?.length && `Job types: ${job_types.join(", ")}`,
      sectors?.length && `Sectors: ${sectors.join(", ")}`,
      `Open to remote: ${open_to_remote ? "Yes" : "No"}`,
    ].filter(Boolean).join("\n"),
    status: "approved",
  });

  if (email) {
    await resend.emails.send({
      from: "EP Investing <otto@epinvesting.com>",
      to: email,
      subject: "Welcome to EP Investing",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
          <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
            <h2 style="margin: 0 0 8px; font-size: 24px; color: #0f1a14;">Welcome${name ? `, ${name}` : ""}.</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
              You're now set up on EP Investing — the climate and energy intelligence platform.
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://epinvesting.com"}/jobs" style="display: inline-block; background: #2d6a4f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-bottom: 16px;">Browse jobs →</a>
            <p style="color: #a0aec0; font-size: 11px; margin: 16px 0 0;">EP Investing · epinvesting.com</p>
          </div>
        </div>
      `,
    });
  }

  return NextResponse.json({ success: true });
}