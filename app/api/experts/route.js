import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, bio, expertise_areas, hourly_rate, availability, linkedin_url, website_url, location } = body;

    if (!name || !email) {
      return Response.json({ error: "Name and email are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("experts")
      .insert({ name, email, bio, expertise_areas, hourly_rate, availability, linkedin_url, website_url, location, status: "pending" })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Notify admin
    await resend.emails.send({
      from: "EP Investing <otto@epinvesting.com>",
      to: "otto@epinvesting.com",
      subject: `New expert application: ${name}`,
      html: `<p><strong>${name}</strong> (${email}) applied to join the expert network.</p><p>Expertise: ${expertise_areas?.join(", ")}</p><p>Location: ${location}</p><p>Rate: ${hourly_rate}</p>`,
    });

    // Confirm to applicant
    await resend.emails.send({
      from: "EP Investing <otto@epinvesting.com>",
      to: email,
      subject: "You're on the EP Investing expert waitlist",
      html: `<p>Hi ${name},</p><p>Thanks for applying to join the EP Investing expert network. We'll review your application and reach out before our April 15 launch.</p><p>— The EP Investing Team</p>`,
    });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from("experts")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}