import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { auth } from "@clerk/nextjs/server";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function emailDomain(email) {
  const parts = email?.split("@") ?? [];
  return parts[1]?.toLowerCase() ?? null;
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

export async function POST(req) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const {
      name, org_type, website_url, headquarters_country, headquarters_city,
      founded_year, short_description, bio, sector_tags, geography_focus,
      staff_size, annual_grants_budget_usd_range,
      open_to_partnerships, partnership_description,
      contact_email,
    } = body;

    if (!name || !org_type || !website_url || !contact_email) {
      return Response.json({ error: "Name, org type, website, and contact email are required" }, { status: 400 });
    }

    // Determine if email matches website (for verified flag)
    const eDomain = emailDomain(contact_email);
    const wDomain = urlDomain(website_url);
    const verified = eDomain && wDomain && (eDomain === wDomain || eDomain.endsWith("." + wDomain));

    // Generate slug, ensuring uniqueness
    let slug = slugify(name);
    const { data: existing } = await supabase
      .from("ngos")
      .select("id")
      .eq("slug", slug)
      .single();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const { data, error } = await supabase
      .from("ngos")
      .insert({
        slug, name, org_type, website_url, headquarters_country, headquarters_city,
        founded_year: founded_year ? parseInt(founded_year, 10) : null,
        short_description, bio,
        sector_tags: sector_tags ?? [],
        geography_focus: geography_focus ?? [],
        staff_size: staff_size || null,
        annual_grants_budget_usd_range: annual_grants_budget_usd_range || null,
        open_to_partnerships: !!open_to_partnerships,
        partnership_description: open_to_partnerships ? partnership_description : null,
        contact_email,
        clerk_user_id: userId || null,
        verified,
        status: "pending",
        claimable: false,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Notify admin
    await getResend().emails.send({
      from: "EP Investing <noreply@epinvesting.com>",
      to: "info@epinvesting.com",
      subject: `New NGO submission: ${name}`,
      html: `
        <p><strong>${name}</strong> (${org_type}) submitted an NGO profile.</p>
        <p>Website: ${website_url}</p>
        <p>Contact: ${contact_email}${verified ? " ✓ verified domain match" : " ⚠ domain mismatch"}</p>
        <p>HQ: ${headquarters_city ?? ""} ${headquarters_country ?? ""}</p>
        <p>Sectors: ${(sector_tags ?? []).join(", ")}</p>
        <p><a href="https://www.epinvesting.com/admin/ngos">Review in admin</a></p>
      `,
    });

    // Confirm to applicant
    await getResend().emails.send({
      from: "EP Investing <noreply@epinvesting.com>",
      to: contact_email,
      subject: "Your NGO profile is under review",
      html: `
        <p>Hi,</p>
        <p>Thanks for submitting <strong>${name}</strong> to EP Investing. We'll review your profile and follow up within a few business days.</p>
        <p>Once approved, you'll be able to log in, edit your profile, post grant programs and jobs, and connect with climate companies and partners.</p>
        <p>— The EP Investing Team</p>
      `,
    });

    return Response.json({ success: true, slug: data.slug });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
