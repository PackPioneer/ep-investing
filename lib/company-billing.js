// Company (Growth-tier) billing + entitlement.
//
// Mirrors the individual flow: there's no Stripe webhook, so entitlement is
// checked live. A company has public-newsroom-board access if it has been
// manually granted it (companies.newsroom_access = true) OR it has an active
// Stripe subscription on its own customer.

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Growth price is env-configurable (cents). Defaults to $49/mo.
export const GROWTH_PRICE_CENTS = parseInt(process.env.STRIPE_COMPANY_PRICE_CENTS || "4900", 10);
export const GROWTH_PLAN_NAME = process.env.STRIPE_COMPANY_PLAN_NAME || "EP Network Growth";

// Does this company have Growth (public board) access?
// `company` must include newsroom_access and stripe_customer_id.
export async function companyHasBoardAccess(company) {
  if (!company) return false;
  if (company.newsroom_access === true) return true;        // manual grant
  const customer = company.stripe_customer_id;
  if (!customer) return false;
  try {
    const subs = await stripe.subscriptions.list({ customer, status: "active", limit: 3 });
    return subs.data.length > 0;
  } catch {
    return false;
  }
}
