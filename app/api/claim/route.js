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

// =====================================================================
// POST — create a new claim request (from public /claim/[type]/[id] page)
// =====================================================================
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      profile_type, target_id, target_name,
      claimant_name, claimant_email, claimant_role, claimant_message, claimant_linkedin_url,
    } = body;

    if (!profile_type || !target_id || !claimant_name || !claimant_email || !claimant_role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!["company", "investor"].includes(profile_type)) {
      return NextResponse.json({ message: "Invalid profile type" }, { status: 400 });
    }

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
        claimant_linkedin_url: claimant_linkedin_url || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Claim insert error:", error);
      return NextResponse.json({ message: "Database error" }, { status: 500 });
    }

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
            ${claimant_linkedin_url ? `<li><strong>LinkedIn:</strong> <a href="${claimant_linkedin_url}">${claimant_linkedin_url}</a></li>` : ""}
            ${claimant_message ? `<li><strong>Message:</strong> ${claimant_message}</li>` : ""}
          </ul>
          <p>Review in admin: <a href="https://www.epinvesting.com/admin/claims">/admin/claims</a></p>
        `,
      });
    } catch (emailErr) {
      console.error("Email send error (non-blocking):", emailErr);
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("Claim POST error:", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

// =====================================================================
// GET — return merged list of claims from BOTH tables, normalized
// =====================================================================
export async function GET() {
  try {
    // Pull both tables in parallel
    const [oldRes, newRes] = await Promise.all([
      supabase.from("claims").select("*").order("created_at", { ascending: false }),
      supabase.from("claim_requests").select("*").order("created_at", { ascending: false }),
    ]);

    if (oldRes.error) console.error("Old claims fetch error:", oldRes.error);
    if (newRes.error) console.error("New claims fetch error:", newRes.error);

    const oldClaims = oldRes.data || [];
    const newClaims = newRes.data || [];

    // Normalize old claims (already in admin's expected shape)
    const normalizedOld = oldClaims.map(c => ({
      ...c,
      source: "onboarding",
    }));

    // Normalize new claim_requests to match the admin row shape
    const normalizedNew = newClaims.map(c => ({
      id: `cr_${c.id}`, // prefix so IDs don't collide with old claims
      raw_id: c.id, // keep the raw id for PATCH
      source: "profile_claim",
      profile_type: c.profile_type,
      target_id: c.target_id,
      // Map new field names to admin's expected names
      company_name: c.target_name || `${c.profile_type === "company" ? "Company" : "Investor"} #${c.target_id}`,
      company_url: null, // not collected in new flow (could enrich from target if needed)
      contact_name: c.claimant_name,
      contact_email: c.claimant_email,
      contact_role: c.claimant_role,
      description: c.claimant_message,
      plan: c.profile_type === "company" ? "Profile claim (company)" : "Profile claim (investor)",
      status: c.status,
      admin_notes: c.admin_notes,
      created_at: c.created_at,
      matched_company_id: null, // not applicable to new flow
    }));

    // Combine and sort by created_at (newest first)
    const all = [...normalizedOld, ...normalizedNew].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    return NextResponse.json(all);
  } catch (err) {
    console.error("Claim GET error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

// =====================================================================
// PATCH — update a claim's status or notes (table-aware via source)
// =====================================================================
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, status, admin_notes, matched_company_id } = body;

    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }

    // Determine which table based on id prefix
    const isNewClaim = typeof id === "string" && id.startsWith("cr_");
    const rawId = isNewClaim ? parseInt(id.replace("cr_", ""), 10) : id;
    const table = isNewClaim ? "claim_requests" : "claims";

    // Build update payload — only include fields that are relevant for the table
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    if (!isNewClaim && matched_company_id !== undefined) {
      updates.matched_company_id = matched_company_id;
    }

    // For new claims: when approved, also set the reviewed timestamp
    if (isNewClaim && status === "approved") {
      updates.reviewed_at = new Date().toISOString();
    }
    if (isNewClaim && status === "rejected") {
      updates.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", rawId)
      .select()
      .single();

    if (error) {
      console.error(`Claim PATCH error on ${table}:`, error);
      return NextResponse.json({ message: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Claim PATCH error:", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
