import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@epinvesting.com";

export async function POST(req) {
  const { email, plan } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Save to Supabase — upsert so duplicate emails don't error
  await supabase.from("waitlist").upsert(
    { email, plan: plan || "unknown", created_at: new Date().toISOString() },
    { onConflict: "email" }
  );

  // Send confirmation email
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "You're on the EP Investing waitlist",
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
          <div style="border-left: 4px solid #2d6a4f; padding-left: 16px; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 22px; color: #0f1a14;">You're on the list.</h2>
            <p style="margin: 6px 0 0; color: #718096; font-family: monospace; font-size: 12px;">EP Investing</p>
          </div>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
            Thanks for your interest in the <strong style="color: #0f1a14; text-transform: capitalize;">${plan || "Researcher"}</strong> plan.
            Subscriptions open on <strong style="color: #2d6a4f;">April 15th, 2025</strong> — we'll send you a reminder the moment signups go live.
          </p>
          <div style="background: #f8f9fb; border-radius: 12px; padding: 16px; border: 1px solid #e2e6ed; margin-bottom: 24px;">
            <p style="margin: 0; font-family: monospace; font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 1px;">In the meantime</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #0f1a14;">
              Browse our database of 1,300+ climate companies, 350+ investors, and 59 grants — all free until launch.
            </p>
          </div>
          <a href="https://epinvesting.com/search"
            style="display: inline-block; background: #2d6a4f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">
            Browse companies →
          </a>
          <hr style="border: none; border-top: 1px solid #e2e6ed; margin: 24px 0;" />
          <p style="color: #a0aec0; font-size: 11px; font-family: monospace; margin: 0;">EP Investing · epinvesting.com</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
