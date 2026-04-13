import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getPostHogClient } from "@/lib/posthog-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const getResend = () => new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "otto@epinvesting.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@epinvesting.com";

export async function POST(req) {
  const body = await req.json();
  const {
    name, email, firm, role, sectors, stages, check_sizes, geographies, thesis, how_heard,
    show_contact, primary_contact_name, primary_contact_email,
    secondary_contact_name, secondary_contact_email
  } = body;

  if (!name || !email) {
    return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("matched_requests")
    .insert({
      path: "investor",
      name, email, firm,
      focus: sectors?.join(", "),
      stage: stages?.join(", "),
      show_contact: show_contact ?? true,
      primary_contact_name: primary_contact_name || name,
      primary_contact_email: primary_contact_email || email,
      secondary_contact_name: secondary_contact_name || null,
      secondary_contact_email: secondary_contact_email || null,
      notes: [
        thesis && `Thesis: ${thesis}`,
        check_sizes?.length && `Check size: ${check_sizes.join(", ")}`,
        geographies?.length && `Geographies: ${geographies.join(", ")}`,
        how_heard && `How heard: ${how_heard}`,
        role && `Role: ${role}`,
      ].filter(Boolean).join("\n"),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const posthog = getPostHogClient();
  posthog.identify({ distinctId: email, properties: { email, name, firm } });
  posthog.capture({
    distinctId: email,
    event: "investor_onboarding_submitted",
    properties: { email, firm, sectors, stages, check_sizes, geographies, source: "server" },
  });

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New investor: ${name}${firm ? ` · ${firm}` : ""}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
          <h2 style="margin: 0 0 8px; font-size: 22px; color: #0f1a14;">New Investor Profile</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${[
              ["Name", name], ["Email", email], ["Firm", firm], ["Role", role],
              ["Sectors", sectors?.join(", ")], ["Stages", stages?.join(", ")],
              ["Check size", check_sizes?.join(", ")], ["Geographies", geographies?.join(", ")],
              ["Primary contact", primary_contact_name ? `${primary_contact_name} · ${primary_contact_email}` : null],
              ["Secondary contact", secondary_contact_name ? `${secondary_contact_name} · ${secondary_contact_email}` : null],
              ["Discoverable", show_contact ? "Yes" : "No"],
              ["How heard", how_heard],
            ].filter(([, v]) => v).map(([k, v]) => `
              <tr>
                <td style="padding: 8px 0; color: #718096; font-family: monospace; font-size: 11px; width: 130px; vertical-align: top;">${k}</td>
                <td style="padding: 8px 0; color: #0f1a14; font-size: 14px;">${v}</td>
              </tr>
            `).join("")}
          </table>
          ${thesis ? `<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e6ed;"><p style="font-family: monospace; font-size: 11px; color: #718096; margin: 0 0 8px;">THESIS</p><p style="color: #4a5568; font-size: 13px; line-height: 1.6; margin: 0;">${thesis}</p></div>` : ""}
          <div style="margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://epinvesting.com"}/admin" style="background: #2d6a4f; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600;">View in Admin →</a>
          </div>
        </div>
      </div>
    `,
  });

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Welcome to EP Investing${firm ? `, ${firm}` : ""}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f2f4f8;">
        <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e6ed;">
          <h2 style="margin: 0 0 8px; font-size: 24px; color: #0f1a14;">You're in, ${name}.</h2>
          <p style="color: #4a5568; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            We've received your investor profile and will start matching you to relevant climate and energy companies.
            ${sectors?.length ? `You'll see deal flow across <strong>${sectors.slice(0, 2).map(s => s.replace(/_/g, " ")).join(" and ")}</strong>${sectors.length > 2 ? ` and ${sectors.length - 2} more sectors` : ""}.` : ""}
          </p>
          <div style="background: #f8f9fb; border-radius: 12px; padding: 20px; border: 1px solid #e2e6ed; margin-bottom: 24px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://epinvesting.com"}/search" style="color: #2d6a4f; font-size: 14px; font-weight: 600; text-decoration: none;">Browse 1,300+ climate companies →</a>
          </div>
          <p style="color: #a0aec0; font-size: 11px; font-family: monospace; margin: 0;">EP Investing · epinvesting.com</p>
        </div>
      </div>
    `,
  });

  return NextResponse.json(data);
}