import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const getResend = () => new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@epinvesting.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@epinvesting.com";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      profile_type, target_id, target_name,
      claimant_name, claimant_email, claimant_role, claimant_message,
    } = body;

    // Basic validation
    if (!profile_type || !target_id || !claimant_name || !claimant_email || !claimant_role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!["company", "investor"].includes(profile_type)) {
      return NextResponse.json({ message: "Invalid profile type" }, { status: 400 });
    }

    // Insert into claim_requests
    const { data, error } = await supabase
      .from("claim_requests")
      .insert({
        profile_type,
        target_id: parseInt(target_id, 10),
        target_name: target_name || null,
        claimant_name,
        claimant_email,
        claimant_role,
        claimant_message: claimant_message || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Claim insert error:", error);
      return NextResponse.json({ message: "Database error" }, { status: 500 });
    }

    // Email Otto for review
    try {
      const profileUrl = profile_type === "company"
        ? `https://www.epinvesting.com/companies/${target_id}`
        : `https://www.epinvesting.com/investors/${target_id}`;

      await getResend().emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `New claim request: ${target_name || target_id}`,
        html: `
          <h2>New claim request</h2>
          <p><strong>${claimant_name}</strong> (${claimant_email}) wants to claim a ${profile_type} profile.</p>
          <ul>
            <li><strong>Profile:</strong> ${target_name || target_id} (<a href="${profileUrl}">view</a>)</li>
            <li><strong>Type:</strong> ${profile_type}</li>
            <li><strong>Role at organization:</strong> ${claimant_role}</li>
            ${claimant_message ? `<li><strong>Message:</strong> ${claimant_message}</li>` : ""}
          </ul>
          <p>Review in Supabase: <code>claim_requests</code> table, id ${data.id}</p>
        `,
      });
    } catch (emailErr) {
      console.error("Email send error (non-blocking):", emailErr);
      // Continue — claim was saved even if email failed
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("Claim POST error:", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
