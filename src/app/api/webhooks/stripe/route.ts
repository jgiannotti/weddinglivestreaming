import { NextResponse } from 'next/server';
import { getStripe, subscriptionPeriodEndMs, currentSubscription } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml, ADMIN_EMAIL } from '@/lib/email';
import { emailSiteUrl } from '@/lib/site-url';
import type Stripe from 'stripe';

// One lookup at Stripe (a few seconds at the very most) and a handful of
// queries per event.
export const maxDuration = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
// Featured runs a few days past the paid period so a card retry or a late
// webhook never drops a paying vendor to Basic.
const RENEWAL_GRACE_MS = 3 * DAY_MS;
// When a renewal payment fails, Featured stays for a week while Stripe retries
// the card. Stripe has usually already moved the period (and so our end date)
// a full month or year ahead by then, which would otherwise be free.
const PAST_DUE_GRACE_MS = 7 * DAY_MS;

type StoredStatus = 'active' | 'past_due' | 'canceled' | 'incomplete';

/** Stripe has more statuses than our enum. Writing an unknown one fails the row. */
function mapStatus(status: string): StoredStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
    case 'paused':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'incomplete';
  }
}

/**
 * Any failure to read or write answers 500, which makes Stripe send the event
 * again (it retries for up to three days). Answering 200 after a failed write
 * is how a paid renewal used to vanish without a trace.
 */
function retryLater(step: string, error: { message: string } | null | undefined, eventId: string) {
  console.error('[stripe webhook] could not finish, asking Stripe to resend', { step, eventId, message: error?.message });
  return NextResponse.json({ error: 'Temporary failure, please retry.' }, { status: 500 });
}

/** 23503: no such vendor. 22P02: the vendor id is not an id at all. Retrying cannot fix either. */
function unknownVendor(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === '23503' || code === '22P02';
}

function alreadyRecorded(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === '23505';
}

/**
 * Money came in for a vendor that is not here. Nobody finds that in a log, so
 * the owner is told. Returns false when the alert did not go out; the caller
 * then asks Stripe to send the event again, so it cannot end in silence.
 */
async function alertUnmatchedPayment(details: {
  eventId: string;
  subscriptionId: string;
  vendorId: string;
  customerId: string | null;
}): Promise<boolean> {
  console.error('[stripe webhook] payment for an unknown vendor', details);
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: 'A Featured payment could not be matched to a vendor',
    html: `
      <h2>Stripe took a Featured payment that the site cannot match to a vendor</h2>
      <p>The vendor named on the payment does not exist here (it may have been removed between checkout and payment), so nothing was made Featured.</p>
      <p><strong>Stripe subscription:</strong> ${escapeHtml(details.subscriptionId)}<br/>
      <strong>Stripe customer:</strong> ${escapeHtml(details.customerId ?? 'not given')}<br/>
      <strong>Vendor id on the payment:</strong> ${escapeHtml(details.vendorId)}</p>
      <p>What to do: open that subscription in Stripe to see who paid. Then either refund and cancel it there, or ask Claude to attach it to the right vendor.</p>
    `,
  });
}

/**
 * The owner hears about every new subscriber: it is the news they most want,
 * and the quickest check that the site and Stripe agree. Sent once, when the
 * subscription is first put on record, so a redelivered event does not repeat
 * it. Best effort: a failed email here must not fail the payment's handling.
 */
async function alertNewSubscriber(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  details: { vendorId: string; plan: 'monthly' | 'annual'; subscriptionId: string; paidThroughMs: number | null }
) {
  try {
    const { data } = await supabase
      .from('vendors')
      .select('business_name, listings(slug, status)')
      .eq('id', details.vendorId)
      .maybeSingle();
    const vendor = data as { business_name: string | null; listings: { slug: string; status: string }[] | null } | null;
    const name = escapeHtml(vendor?.business_name || 'A vendor');
    const live = (vendor?.listings ?? []).find((l) => l.status === 'approved');
    const site = emailSiteUrl();
    const paidThrough = details.paidThroughMs
      ? new Date(details.paidThroughMs).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
      : null;
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `New Featured subscriber: ${name}`,
      html: `
        <h2>A vendor just subscribed to Featured</h2>
        <p><strong>Business:</strong> ${name}<br/>
        <strong>Plan:</strong> ${details.plan === 'annual' ? 'annual' : 'monthly'}<br/>
        ${paidThrough ? `<strong>Paid through:</strong> ${paidThrough}<br/>` : ''}
        <strong>Stripe subscription:</strong> ${escapeHtml(details.subscriptionId)}</p>
        <p>The site switches their listing to Featured by itself when the payment comes in. ${
          live
            ? `<a href="${site}/listing/${live.slug}">Open the listing</a> to see the gold Featured badge. If it is not there within a few minutes, tell Claude.`
            : '<strong>This vendor has no live listing</strong>, so there is nothing for Featured to show on. Worth a look.'
        }</p>
      `,
    });
  } catch (err) {
    console.error('[stripe webhook] new-subscriber alert failed', err);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature: ${(err as Error).message}` }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Featured until at least `untilMs`. Never shortens a later date, and never
  // touches a listing that is Featured with no end date (set by hand): putting
  // a date on that one would turn a standing arrangement into one that ends.
  const featureUntil = (vendorId: string, untilMs: number) => {
    const iso = new Date(untilMs).toISOString();
    return supabase
      .from('listings')
      .update({ tier: 'featured', featured_until: iso })
      .eq('vendor_id', vendorId)
      .or(`tier.eq.basic,featured_until.lt.${iso}`);
  };

  // Does this vendor have another subscription that is still live?
  const otherLive = async (vendorId: string, exceptSubscriptionId: string) => {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('vendor_id', vendorId)
      .in('status', ['active', 'past_due'])
      .neq('external_id', exceptSubscriptionId)
      .limit(1);
    return { live: Boolean(data && data.length > 0), error };
  };

  // Known limit: the subscription row and the listings are written by separate
  // statements. Two events for one subscription handled within the same few
  // hundred milliseconds, with a real change at Stripe between their two
  // lookups, could leave the listings reflecting the earlier one until the
  // next event. Stripe's own sequences do not produce that. Closing it for
  // good means doing both writes in one SQL function that locks the row.
  //
  // An event is a picture of the subscription at the moment Stripe wrote it.
  // Stripe may deliver it late, twice, or after a newer one, and acting on an
  // old picture is how a paid-up vendor loses Featured or an unpaid one keeps
  // it. So every event is only a nudge: what gets applied is the subscription
  // as Stripe has it right now.
  //
  //   ok           the current subscription
  //   retry        Stripe could not be reached: answer 500, it resends later
  //   unavailable  Stripe answered but would not show it (no permission, not
  //                found): asking again cannot help, so the event's own
  //                picture is used, as this handler always did before
  const lookUp = async (subscriptionId: string) => {
    const now = await currentSubscription(subscriptionId);
    if (now.state === 'unavailable') {
      console.error('[stripe webhook] Stripe did not return the subscription; using the event as sent', {
        eventId: event.id,
        subscriptionId,
        reason: now.reason,
      });
    }
    return now;
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const vendorId = session.metadata?.vendor_id;
      const plan = session.metadata?.plan === 'annual' ? 'annual' : 'monthly';
      const externalId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (!vendorId || !externalId) break;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

      const now = await lookUp(externalId);
      if (now.state === 'retry') return retryLater('look up subscription', { message: now.reason }, event.id);
      // With nothing else to go on, a completed checkout means it was paid.
      const status: StoredStatus = now.state === 'ok' ? mapStatus(String(now.sub.status)) : 'active';
      const endMs = now.state === 'ok' ? subscriptionPeriodEndMs(now.sub) : null;

      // Checkout finished but the first payment has not gone through (some
      // payment methods settle later). Nothing to record yet: when it is paid,
      // the "active" update below records it.
      if (status === 'incomplete') break;

      const { error: insertErr } = await supabase.from('subscriptions').insert({
        vendor_id: vendorId,
        processor: 'stripe',
        external_customer_id: customerId,
        external_id: externalId,
        plan,
        status,
        ...(endMs !== null ? { current_period_end: new Date(endMs).toISOString() } : {}),
      });
      if (unknownVendor(insertErr)) {
        const told = await alertUnmatchedPayment({ eventId: event.id, subscriptionId: externalId, vendorId, customerId });
        if (!told) return retryLater('alert the owner', { message: 'the alert email did not send' }, event.id);
        break;
      }
      // Already recorded: this event was delivered before, or the "active"
      // update got here first. Carry on with the row there is.
      if (insertErr && !alreadyRecorded(insertErr)) {
        return retryLater('insert subscription', insertErr, event.id);
      }
      if (!insertErr && status === 'active') {
        await alertNewSubscriber(supabase, { vendorId, plan, subscriptionId: externalId, paidThroughMs: endMs });
      }

      const { data: stored, error: readErr } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('processor', 'stripe')
        .eq('external_id', externalId)
        .maybeSingle();
      if (readErr) return retryLater('read subscription', readErr, event.id);

      // Featured is switched on only for a subscription that is live both on
      // record and at Stripe. A replay after a cancellation, or a purchase
      // that reaches us after the subscription has already ended, records the
      // history and changes no listing.
      if (status !== 'active' || (stored as { status: StoredStatus } | null)?.status !== 'active') break;

      const untilMs =
        endMs !== null
          ? endMs + RENEWAL_GRACE_MS
          : Date.now() + (plan === 'annual' ? 365 : 30) * DAY_MS + RENEWAL_GRACE_MS;
      const { error: listErr } = await featureUntil(vendorId, untilMs);
      if (listErr) return retryLater('feature listings', listErr, event.id);
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const snapshot = event.data.object as Stripe.Subscription;
      const now = await lookUp(snapshot.id);
      if (now.state === 'retry') return retryLater('look up subscription', { message: now.reason }, event.id);
      const sub = now.state === 'ok' ? now.sub : snapshot;
      const status: StoredStatus =
        now.state === 'ok'
          ? mapStatus(String(sub.status))
          : event.type === 'customer.subscription.deleted'
            ? 'canceled'
            : mapStatus(String(snapshot.status));
      const endMs = subscriptionPeriodEndMs(sub);
      const endIso = endMs !== null ? new Date(endMs).toISOString() : null;

      type StoredRow = { vendor_id: string; status: StoredStatus; current_period_end: string | null };
      const readStored = () =>
        supabase
          .from('subscriptions')
          .select('vendor_id, status, current_period_end')
          .eq('processor', 'stripe')
          .eq('external_id', sub.id)
          .maybeSingle();

      const { data: storedRow, error: readErr } = await readStored();
      if (readErr) return retryLater('read subscription', readErr, event.id);
      let stored = storedRow as StoredRow | null;

      // Once cancelled, always cancelled. With the subscription read from
      // Stripe this cannot arise; it guards the case where the event is all
      // there is and it is an old one.
      if (stored?.status === 'canceled' && status !== 'canceled') break;

      let justRecorded = false;
      if (!stored) {
        // Nothing on record means this subscription has never made anything
        // Featured, so its ending, expiring or failing takes nothing away.
        // This is the abandoned checkout: Stripe keeps an "incomplete"
        // subscription carrying our metadata and expires it a day later.
        // Acting on that used to reset the vendor's listing, wiping a founding
        // grant made in the meantime.
        if (status !== 'active' && status !== 'past_due') break;

        // Live at Stripe but not on record: its purchase event has not arrived
        // (or never will). Record it now, so that a later failed payment or
        // cancellation has something to act on.
        const vendorId = sub.metadata?.vendor_id;
        if (!vendorId) break;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null;
        const { error: recordErr } = await supabase.from('subscriptions').insert({
          vendor_id: vendorId,
          processor: 'stripe',
          external_customer_id: customerId,
          external_id: sub.id,
          plan: sub.metadata?.plan === 'annual' ? 'annual' : 'monthly',
          status,
          ...(endIso ? { current_period_end: endIso } : {}),
        });
        if (unknownVendor(recordErr)) {
          const told = await alertUnmatchedPayment({ eventId: event.id, subscriptionId: sub.id, vendorId, customerId });
          if (!told) return retryLater('alert the owner', { message: 'the alert email did not send' }, event.id);
          break;
        }
        if (recordErr && !alreadyRecorded(recordErr)) return retryLater('record subscription', recordErr, event.id);

        if (!recordErr) {
          justRecorded = true;
          stored = { vendor_id: vendorId, status, current_period_end: endIso };
          if (status === 'active') {
            await alertNewSubscriber(supabase, {
              vendorId,
              plan: sub.metadata?.plan === 'annual' ? 'annual' : 'monthly',
              subscriptionId: sub.id,
              paidThroughMs: endMs,
            });
          }
        } else {
          // The purchase event recorded it in the same instant. Use its row.
          const again = await readStored();
          if (again.error || !again.data) return retryLater('read subscription', again.error, event.id);
          stored = again.data as StoredRow;
          // (status is live here, so a cancelled row stays cancelled.)
          if (stored.status === 'canceled') break;
        }
      }

      if (justRecorded) {
        // Recorded for the first time while already past due: it has given the
        // listings nothing, so there is nothing to pull back.
        if (status !== 'active') break;
      } else {
        // The period end only ever moves forward.
        const storedEndMs = stored.current_period_end ? new Date(stored.current_period_end).getTime() : null;
        const newEnd = endIso !== null && (storedEndMs === null || (endMs as number) > storedEndMs) ? endIso : null;

        let update = supabase
          .from('subscriptions')
          .update({ status, ...(newEnd ? { current_period_end: newEnd } : {}) })
          .eq('processor', 'stripe')
          .eq('external_id', sub.id);
        // Two events handled at the same moment: a cancellation recorded by
        // the other one must not be overwritten by this one.
        if (status !== 'canceled') update = update.neq('status', 'canceled');
        const { data: changed, error: updErr } = await update.select('id');
        if (updErr) return retryLater('update subscription', updErr, event.id);
        // Nothing changed, so the cancellation got there first. It also deals
        // with the listings; re-featuring them here would undo it.
        if (!changed || changed.length === 0) break;
      }

      const vendorId = stored.vendor_id;

      if (status === 'canceled') {
        // Back to Basic, unless this vendor has another live subscription
        // (a second one bought while the first was past due, for example).
        // Only listings with an end date are touched: a listing Featured with
        // no end date was set by hand and is not this subscription's to end.
        const other = await otherLive(vendorId, sub.id);
        if (other.error) return retryLater('read other subscriptions', other.error, event.id);
        if (!other.live) {
          const { error: downErr } = await supabase
            .from('listings')
            .update({ tier: 'basic', featured_until: null })
            .eq('vendor_id', vendorId)
            .not('featured_until', 'is', null);
          if (downErr) return retryLater('downgrade listings', downErr, event.id);
        }
      } else if (status === 'past_due') {
        // A payment failed. Pull the end date back to a week from now; if the
        // card goes through on a retry, the "active" event that follows puts
        // the full period back. Later events while it is still past due find
        // the date already inside the week and leave it alone.
        const other = await otherLive(vendorId, sub.id);
        if (other.error) return retryLater('read other subscriptions', other.error, event.id);
        if (!other.live) {
          const graceIso = new Date(Date.now() + PAST_DUE_GRACE_MS).toISOString();
          const { error: graceErr } = await supabase
            .from('listings')
            .update({ featured_until: graceIso })
            .eq('vendor_id', vendorId)
            .eq('tier', 'featured')
            .gt('featured_until', graceIso);
          if (graceErr) return retryLater('shorten listings', graceErr, event.id);
        }
      } else if (status === 'active' && endMs !== null) {
        // Paid: a new period, or a card that went through on a retry. Stripe
        // sends this event each time a new period starts. Without this branch
        // featured_until stayed at "checkout + 30 days": a monthly subscriber
        // would read as Basic from day 31 on while still being charged.
        const { error: listErr } = await featureUntil(vendorId, endMs + RENEWAL_GRACE_MS);
        if (listErr) return retryLater('extend listings', listErr, event.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
