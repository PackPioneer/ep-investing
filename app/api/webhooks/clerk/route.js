import { Webhook } from "svix";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id"),
    "svix-timestamp": req.headers.get("svix-timestamp"),
    "svix-signature": req.headers.get("svix-signature"),
  };

  let event;
  try {
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    event = wh.verify(payload, headers);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created") {
    const { id: clerk_user_id, email_addresses } = event.data;
    const email = email_addresses?.[0]?.email_address;
    if (!email) return Response.json({ ok: true });

    // Check if email matches a pending company claim
    const { data: claim } = await supabase
      .from("claims")
      .select("matched_company_id")
      .eq("contact_email", email)
      .eq("status", "approved")
      .single();

  if (claim) {
    if (claim.matched_company_id) {
     // Link to existing matched company
     await supabase
      .from("companies")
      .update({ clerk_user_id })
      .eq("id", claim.matched_company_id);
    } else {
     // Link to company created from this claim (matched by name)
     await supabase
      .from("companies")
      .update({ clerk_user_id })
      .eq("name", claim.company_name)
      .is("clerk_user_id", null);
    }
}

    // Check if email matches an approved investor request
    const { data: investor } = await supabase
      .from("matched_requests")
      .select("id")
      .eq("email", email)
      .eq("status", "approved")
      .eq("path", "investor")
      .single();

    if (investor) {
      await supabase
        .from("matched_requests")
        .update({ clerk_user_id })
        .eq("id", investor.id);
    }
  }

  return Response.json({ ok: true });
}