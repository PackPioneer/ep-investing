import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const { email, plan } = await req.json();

  if (!email || !plan) {
    return NextResponse.json({ message: "Missing email or plan" }, { status: 400 });
  }

  // Create or retrieve customer
  const customers = await stripe.customers.list({ email, limit: 1 });
  const customer = customers.data.length > 0
    ? customers.data[0]
    : await stripe.customers.create({ email, metadata: { plan } });

  // Update plan in metadata if customer already existed
  if (customers.data.length > 0) {
    await stripe.customers.update(customer.id, { metadata: { plan } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customer.id,
    currency: "usd",
    metadata: { plan, email },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing/success?plan=${plan}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}