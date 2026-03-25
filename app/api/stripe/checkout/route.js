import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  researcher: process.env.NEXT_PUBLIC_STRIPE_PRICE_RESEARCHER,
  expert: process.env.NEXT_PUBLIC_STRIPE_PRICE_EXPERT,
  company: process.env.NEXT_PUBLIC_STRIPE_PRICE_COMPANY,
  investor: process.env.NEXT_PUBLIC_STRIPE_PRICE_INVESTOR,
};

export async function POST(req) {
  const { plan, email } = await req.json();
  const priceId = PRICE_IDS[plan];
  if (!priceId) return Response.json({ error: "Invalid plan" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
  });

  return Response.json({ url: session.url });
}