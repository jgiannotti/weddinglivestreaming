import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

/**
 * End of the period Stripe has billed for, in ms, or null if the payload does
 * not carry one. Older API versions put current_period_end on the
 * subscription; newer ones (2025-03-31 onward) moved it onto each
 * subscription item. Reading only the old location would turn into
 * `new Date(NaN).toISOString()`, which throws and fails the whole webhook.
 */
export function subscriptionPeriodEndMs(sub: unknown): number | null {
  const s = (sub ?? {}) as {
    current_period_end?: unknown;
    items?: { data?: Array<{ current_period_end?: unknown }> };
  };
  const seconds = s.current_period_end ?? s.items?.data?.[0]?.current_period_end;
  return typeof seconds === 'number' && Number.isFinite(seconds) ? seconds * 1000 : null;
}

/** What Stripe says about a subscription right now. */
export type CurrentSubscription =
  | { state: 'ok'; sub: Stripe.Subscription }
  /** Stripe could not be reached, or was having trouble. Worth asking again later. */
  | { state: 'retry'; reason: string }
  /** Stripe answered, but not with the subscription (no permission, not found). Asking again will not help. */
  | { state: 'unavailable'; reason: string };

const TRANSIENT_STRIPE_ERRORS = new Set(['StripeConnectionError', 'StripeAPIError', 'StripeRateLimitError']);

/**
 * The subscription as Stripe has it now. Webhook events are pictures taken at
 * some earlier moment, and they can arrive late, twice or out of order; this
 * is the current truth to act on.
 *
 * Capped well under the SDK's defaults (80 seconds, three attempts), because
 * it runs inside a webhook that Stripe itself is waiting on.
 */
export async function currentSubscription(id: string): Promise<CurrentSubscription> {
  try {
    const sub = await getStripe().subscriptions.retrieve(id, {}, { timeout: 4000, maxNetworkRetries: 1 });
    return { state: 'ok', sub };
  } catch (err) {
    const e = (err ?? {}) as { type?: string; message?: string };
    const reason = `${e.type ?? 'error'}: ${e.message ?? String(err)}`;
    return TRANSIENT_STRIPE_ERRORS.has(String(e.type)) ? { state: 'retry', reason } : { state: 'unavailable', reason };
  }
}
