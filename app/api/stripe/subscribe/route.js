import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Monthly member subscription. Amount is env-configurable (cents); defaults to $19/mo.
const PRICE_CENTS = parseInt(process.env.STRIPE_MEMBER_PRICE_CENTS || "1900", 10);
const PLAN_NAME = process.env.STRIPE_MEMBER_PLAN_NAME || "EP Network Pro";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || (await req.json().catch(() => ({}))).email;
  if (!email) return NextResponse.json({ error: "No email on account" }, { status: 400 });

  try {
    // Create or reuse the customer
    const existing = await stripe.customers.list({ email, limit: 1 });
    const customer = existing.data[0] || (await stripe.customers.create({ email, metadata: { plan: "member" } }));

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: { name: PLAN_NAME },
          unit_amount: PRICE_CENTS,
          recurring: { interval: "month" },
        },
      }],
      metadata: { plan: "member", clerk_user_id: userId, email },
      subscription_data: { metadata: { plan: "member", clerk_user_id: userId } },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/individual?upgraded=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/individual`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("subscribe error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
