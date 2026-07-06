import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const getResend = () => new Resend(process.env.RESEND_API_KEY);

const VALID_CATEGORIES = ["company", "feature", "feedback"];

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid body" }, { status: 400 }); }

  const category = VALID_CATEGORIES.includes(body.category) ? body.category : "feedback";
  const details = (body.details || "").trim();
  const email = (body.email || "").trim() || null;

  if (!details) return NextResponse.json({ error: "Details required" }, { status: 400 });

  const { error } = await supabase.from("requests").insert({
    clerk_user_id: userId,
    email,
    category,
    details,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify Otto (best-effort)
  try {
    const label = { company: "Company suggestion", feature: "Feature request", feedback: "General feedback" }[category];
    await getResend().emails.send({
      from: "EP Network <noreply@epinvesting.com>",
      to: process.env.REQUESTS_NOTIFY_EMAIL || "otto@theenergypioneer.com",
      subject: "New member request: " + label,
      html: "<div style=\"font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px;\"><h2 style=\"font-size: 18px; color: #0f1a14;\">" + label + "</h2><p style=\"color: #4a5568; font-size: 14px; white-space: pre-wrap;\">" + details.replace(/</g, "&lt;") + "</p><p style=\"color: #a0aec0; font-size: 12px;\">From: " + (email || userId) + "</p></div>",
    });
  } catch (e) {}

  return NextResponse.json({ ok: true });
}