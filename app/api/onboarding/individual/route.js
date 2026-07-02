import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { INDUSTRY_SLUGS, MAX_INDUSTRIES } from "@/lib/industries";
import { ROLE_SLUGS } from "@/lib/roles";
import { INTENT_SLUGS } from "@/lib/intents";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  const body = await req.json();
  const { name, email, clerk_user_id, role, industries, intent } = body;
  const terms_agreed_at = body.terms_agreed_at || null;

  if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });
  if (!clerk_user_id) return NextResponse.json({ message: "Not signed in" }, { status: 401 });

  const cleanRole = ROLE_SLUGS.includes(role) ? role : null;
  const cleanIntent = INTENT_SLUGS.includes(intent) ? intent : null;
  const cleanIndustries = Array.isArray(industries)
    ? [...new Set(industries.filter((s) => INDUSTRY_SLUGS.includes(s)))].slice(0, MAX_INDUSTRIES)
    : [];

  const record = {
    type: "individual",
    name: name || null,
    email: email.toLowerCase().trim(),
    clerk_user_id,
    role: cleanRole,
    industries: cleanIndustries,
    intent: cleanIntent,
    onboarded_at: new Date().toISOString(),
    terms_agreed_at,
    status: "approved",
  };

  const { error } = await supabase
    .from("experts")
    .upsert(record, { onConflict: "clerk_user_id" });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  try {
    await getResend().emails.send({
      from: "EP Network <noreply@epinvesting.com>",
      to: email,
      subject: "Welcome to EP Network",
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
          <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
            <h2 style="margin: 0 0 8px; font-size: 24px; color: #0f1a14;">Welcome${name ? \`, \${name}\` : ""}.</h2>
            <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
              You're now part of EP Network. Your feed is tuned to the industries you follow — connect across the energy transition.
            </p>
            <a href="\${process.env.NEXT_PUBLIC_SITE_URL || "https://epinvesting.com"}/dashboard/individual" style="display: inline-block; background: #2d6a4f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-bottom: 16px;">Go to your dashboard →</a>
            <p style="color: #a0aec0; font-size: 11px; margin: 16px 0 0;">EP Network · epinvesting.com</p>
          </div>
        </div>
      `,
    });
  } catch (e) {}

  return NextResponse.json({ success: true });
}
