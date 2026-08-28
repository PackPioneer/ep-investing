import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { stripe, GROWTH_PRICE_CENTS, GROWTH_PLAN_NAME } from "@/lib/company-billing";

export const dynamic = "force-dynamic";
const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Resolve the company this user manages (org membership, then legacy owner fields).
async function resolveCompany(userId) {
  const supabase = db();
  try {
    const client = await clerkClient();
    const { data: memberships } = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
    const orgIds = (memberships || []).map((m) => m.organization.id);
    if (orgIds.length) {
      const { data } = await supabase.from("companies").select("id, name, stripe_customer_id")
        .in("clerk_organization_id", orgIds).order("id", { ascending: true }).limit(1);
      if (data && data[0]) return data[0];
    }
  } catch { /* ignore org lookup errors */ }
  const { data } = await supabase.from("companies").select("id, name, stripe_customer_id")
    .or(`clerk_user_id.eq.${userId},claimed_by_clerk_user_id.eq.${userId}`).order("id", { ascending: true }).limit(1);
  return (data && data[0]) || null;
}

// Start a Growth subscription checkout for the company the user manages.
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const company = await resolveCompany(userId);
  if (!company) return NextResponse.json({ error: "No company found for your account" }, { status: 404 });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  try {
    const supabase = db();
    // Reuse the company's Stripe customer if it has one, else create one keyed
    // to the company (kept separate from any personal member customer).
    let customerId = company.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        name: company.name || undefined,
        metadata: { plan: "company_growth", company_id: String(company.id) },
      });
      customerId = customer.id;
      await supabase.from("companies").update({ stripe_customer_id: customerId }).eq("id", company.id);
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: { name: GROWTH_PLAN_NAME },
          unit_amount: GROWTH_PRICE_CENTS,
          recurring: { interval: "month" },
        },
      }],
      metadata: { plan: "company_growth", company_id: String(company.id), clerk_user_id: userId },
      subscription_data: { metadata: { plan: "company_growth", company_id: String(company.id) } },
      success_url: `${base}/dashboard/company?upgraded=1`,
      cancel_url: `${base}/dashboard/company`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("subscribe-company error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
