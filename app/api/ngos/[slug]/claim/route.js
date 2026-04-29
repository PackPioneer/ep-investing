import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

function emailDomain(email) {
  return email?.split("@")[1]?.toLowerCase() ?? null;
}

function urlDomain(url) {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });

    const { slug } = await params;
    const body = await req.json();
    const { claimant_name, claimant_email, claimant_role, message } = body;

    if (!claimant_name || !claimant_email) {
      return Response.json({ error: "Name and email required" }, { status: 400 });
    }

    // Find the NGO
    const { data: ngo, error: ngoErr } = await supabase
      .from("ngos")
      .select("id, name, slug, website_url, claimable, clerk_user_id")
      .eq("slug", slug)
      .single();

    if (ngoErr || !ngo) {
      return Response.json({ error: "Organization not found" }, { status: 404 });
    }

    if (!ngo.claimable || ngo.clerk_user_id) {
      return Response.json({ error: "This profile is not available to claim" }, { status: 400 });
    }

    // Check email domain match
    const eDomain = emailDomain(claimant_email);
    const wDomain = urlDomain(ngo.website_url);
    const email_domain_match = !!(eDomain && wDomain && (eDomain === wDomain || eDomain.endsWith("." + wDomain)));

    // Insert claim — unique index prevents duplicate pending claims from same user
    const { data: claim, error: insertErr } = await supabase
      .from("ngo_claims")
      .insert({
        ngo_id: ngo.id,
        clerk_user_id: userId,
        claimant_name,
        claimant_email,
        claimant_role: claimant_role || null,
        message: message || null,
        email_domain_match,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      // Most likely cause: unique constraint (already a pending claim from this user)
      if (insertErr.code === "23505") {
        return Response.json({ error: "You already have a pending claim for this organization" }, { status: 409 });
      }
      return Response.json({ error: insertErr.message }, { status: 500 });
    }

    // Notify admin
    try {
      await getResend().emails.send({
        from: "EP Investing <noreply@epinvesting.com>",
        to: "info@epinvesting.com",
        subject: `Claim request: ${ngo.name}`,
        html: `
          <p><strong>${claimant_name}</strong> (${claimant_email}) is requesting to claim <strong>${ngo.name}</strong>.</p>
          <p>Role: ${claimant_role || "—"}</p>
          <p>Domain match: ${email_domain_match ? "✓ verified" : "⚠ no match"}</p>
          ${message ? `<p>Message:<br>${message}</p>` : ""}
          <p><a href="https://www.epinvesting.com/admin/ngo-claims">Review in admin</a></p>
        `,
      });
    } catch (e) {
      console.error("Admin email failed:", e);
    }

    return Response.json({ success: true, claim_id: claim.id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
