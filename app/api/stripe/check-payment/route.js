import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ hasPayment: false });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  // Check companies table first
  const { data: company } = await supabase
    .from("companies")
    .select("stripe_customer_id")
    .eq("clerk_user_id", userId)
    .single();

  // Check matched_requests for investors
  const { data: investor } = await supabase
    .from("matched_requests")
    .select("stripe_customer_id")
    .eq("clerk_user_id", userId)
    .single();

  const customerId = company?.stripe_customer_id || investor?.stripe_customer_id;

  // Resolve a customer id — from our tables, else by email in Stripe.
  let resolvedId = customerId;
  if (!resolvedId && email) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) resolvedId = customers.data[0].id;
  }
  if (!resolvedId) return NextResponse.json({ hasPayment: false });

  // Access is granted by an ACTIVE subscription (member Pro) OR a saved card
  // (legacy company/investor card-capture flow — kept so no one is locked out).
  try {
    const subs = await stripe.subscriptions.list({ customer: resolvedId, status: "active", limit: 1 });
    if (subs.data.length > 0) return NextResponse.json({ hasPayment: true, via: "subscription" });
    const methods = await stripe.paymentMethods.list({ customer: resolvedId, type: "card" });
    return NextResponse.json({ hasPayment: methods.data.length > 0, via: methods.data.length > 0 ? "card" : null });
  } catch {
    return NextResponse.json({ hasPayment: false });
  }
}