/**
 * lib/news/access.js
 *
 * Central access check for news features. Isolated here so the switch to
 * hard paywall gating on July 15, 2026 is a single-file change.
 *
 * Current policy (pre-July 15, 2026): any authenticated user has access.
 * Post-July 15: authenticated + active paid subscription required.
 */

// ISO date when the free period ends
const FREE_PERIOD_END = new Date('2026-07-15T00:00:00Z');

/**
 * Returns true if the given user has access to gated news content.
 *
 * @param {object|null} user  The user record (from Clerk + Supabase join,
 *                            or null for unauthenticated visitors).
 * @returns {boolean}
 */
export function hasNewsAccess(user) {
  if (!user) return false;

  const now = new Date();
  if (now < FREE_PERIOD_END) {
    // Free period — anyone signed in can read.
    return true;
  }

  // TODO after July 15, 2026: check subscription status.
  // This requires the Stripe webhook (flagged as pending in the main build
  // doc) to be wired up first, so stripe_customer_id + subscription_status
  // are available on the user record.
  //
  // return user.subscription_status === 'active';

  return true; // placeholder — revisit when Stripe webhook lands
}

/**
 * Returns the number of teaser articles unauthenticated visitors can see.
 * Keeping this configurable so we can tune it based on conversion data.
 */
export const UNAUTH_TEASER_COUNT = 3;
