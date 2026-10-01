import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { matchVendorsForLead, sourceVendorForListing } from '@/lib/data/leads';
import { sendEmail, escapeHtml, ADMIN_EMAIL, MIN_SEND_WINDOW_MS } from '@/lib/email';
import { leadNotificationEmail } from '@/lib/email-templates/lead-notification';
import { unclaimedLeadNotificationEmail } from '@/lib/email-templates/unclaimed-lead-notification';
import { leadConfirmationEmail } from '@/lib/email-templates/lead-confirmation';
import { claimUrlFor, signClaimToken } from '@/lib/claim-link';
import { unsubscribeUrlFor } from '@/lib/unsubscribe-link';
import { emailSiteUrl } from '@/lib/site-url';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { allow, addressKey, visitorKey, countRecent, record, prune } from '@/lib/send-limits';
import { mailtoAddress } from '@/lib/utils';

// Stricter than "something@something.tld" on purpose. The address ends up in
// mailto: links (the vendor's dashboard, the owner alert), where characters
// such as ? and & would let a crafted "address" add its own cc or body. An
// apostrophe is allowed: o'brien@example.com is a real kind of address.
const EMAIL_RE = /^[^\s@?&<>"`(),;:\\]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** A real calendar date in YYYY-MM-DD form, or ''. "2026-02-30" is not one. */
function calendarDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : '';
}

// The route sends up to five emails one after another (so each result is
// known before the next is written). The email phase keeps to a total of its
// own (EMAIL_PHASE_BUDGET_MS below); this is the platform's limit, set well
// above that so a slow mail provider can never get the request cut off before
// the owner alert, which goes last.
export const maxDuration = 60;

// One time budget for the emails to vendors and to the couple together. Each
// send is capped on its own (src/lib/email.ts), but several slow ones in a row
// would still add up to longer than a visitor will wait at a spinner. When the
// budget is spent the remaining emails are skipped: the request is saved
// either way, and the owner alert says exactly who was not told. The owner
// alert itself is not counted against it and is always attempted.
const EMAIL_PHASE_BUDGET_MS = 12_000;

/** A trimmed, length-capped string; anything else becomes ''. */
function text(value: unknown, max: number): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Unclaimed vendors hear about area matches at most once a week. A request
// made on the vendor's own profile is rarer and worth more, so it only waits
// out a one-day floor.
const AREA_TEASER_THROTTLE_MS = 7 * DAY_MS;
const DIRECT_TEASER_THROTTLE_MS = DAY_MS;

// Durable limits, counted in a server-only log (src/lib/send-limits.ts). The
// in-memory limiter below lives in one server instance and forgets everything
// on a cold start, so on its own it cannot stop this form being used to send
// mail in bulk: every request emails the address typed into it, up to three
// vendors, and the owner.
//
// All of them are far above anything real traffic produces (the site sees a
// handful of requests a month). When the site-wide, per-address or per-vendor
// limit trips, the request is still saved and still shows in /admin/leads and
// the vendor's dashboard; only email stops. The per-visitor limit turns the
// request away instead, like the in-memory one. If the log is unavailable the
// limits are simply off.
const FLOOD_LEADS_PER_HOUR = 30; // site-wide: past this, no email at all
// One visitor, counted durably and before the site-wide number, so that a
// single machine cannot use up the site-wide allowance and switch off email
// for everyone else. Far above what a couple, or a planner asking for several
// couples, would send.
const LEADS_PER_VISITOR_PER_HOUR = 10;
const CONFIRMATIONS_PER_ADDRESS_PER_DAY = 5; // "we got your request" to one address
const VENDOR_EMAILS_PER_HOUR = 5; // full-lead emails to one claimed vendor

export async function POST(request: Request) {
  // Best-effort flood guard. A couple submits this form once; five tries in
  // ten minutes from one address is a script.
  if (isRateLimited('leads', getClientIp(request), { windowMs: 10 * 60_000, maxRequests: 5 })) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend success without inserting.
  if (body?.website) {
    return NextResponse.json({ success: true });
  }

  const name = text(body?.name, 200);
  const email = text(body?.email, 254);
  const phone = text(body?.phone, 40);
  const venue_city = text(body?.venue_city, 120);
  const venue_state = text(body?.venue_state, 60);
  const budget = text(body?.budget, 80);
  const message = text(body?.message, 5000);
  const source_listing_id = typeof body?.source_listing_id === 'string' ? body.source_listing_id : null;
  // The column is a date; anything that is not a real date is dropped rather
  // than allowed to fail the whole request.
  const wedding_date = calendarDate(text(body?.wedding_date, 10));
  const guests = Number(body?.guest_count);
  const guest_count = Number.isFinite(guests) && guests > 0 ? Math.min(Math.round(guests), 100000) : null;

  if (!name || !email || !venue_state) {
    return NextResponse.json(
      { error: 'Name, email, and venue state are required.' },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Housekeeping for the send log: rows older than any limit's window go,
  // each time the form is used.
  await prune(supabase).catch(() => {});

  if (!(await allow(supabase, 'lead_visitor', visitorKey(getClientIp(request)), LEADS_PER_VISITOR_PER_HOUR, HOUR_MS))) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a while and try again.' },
      { status: 429 }
    );
  }

  // A request submitted from a vendor's own profile always reaches that
  // vendor, in the first slot. Location matching fills the rest.
  const sourceVendorId = await sourceVendorForListing(source_listing_id);
  const matched_vendor_ids = await matchVendorsForLead({
    state: venue_state,
    city: venue_city,
    sourceVendorId,
  });

  // Counted before anything is emailed, this request included.
  const flooded = !(await allow(supabase, 'lead_request', null, FLOOD_LEADS_PER_HOUR, HOUR_MS));

  const { error: insertErr } = await supabase.from('leads').insert({
    name,
    email,
    phone: phone || null,
    wedding_date: wedding_date || null,
    venue_city: venue_city || null,
    venue_state,
    guest_count,
    budget: budget || null,
    message: message || null,
    // Only a verified live listing id is stored; anything else is dropped.
    source_listing_id: sourceVendorId ? source_listing_id : null,
    matched_vendor_ids,
  });

  if (insertErr) {
    // The real reason goes to the server log. The visitor gets something they
    // can act on, not a database message.
    console.error('[leads] insert failed', { code: (insertErr as { code?: string }).code, message: insertErr.message });
    return NextResponse.json(
      { error: 'We could not save your request. Please check the form and try again.' },
      { status: 500 }
    );
  }

  const SITE = emailSiteUrl();

  if (flooded) {
    // Saved, but nobody is emailed. Tell the owner once an hour while it
    // lasts, not once per request. Checked before it is recorded, so two
    // requests arriving together send two alerts rather than none.
    if ((await countRecent(supabase, 'flood_alert', null, HOUR_MS)) === 0) {
      await record(supabase, 'flood_alert', null);
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Quote form paused its emails: more than ${FLOOD_LEADS_PER_HOUR} requests in the last hour`,
        html: `
          <h2>The quote request form is being used unusually heavily</h2>
          <p>More than ${FLOOD_LEADS_PER_HOUR} requests arrived in the last hour. That is far more than normal, so the site has stopped sending emails for new requests (to couples, to vendors and to you) until the rate drops.</p>
          <p>Every request is still saved. <a href="${SITE}/admin/leads">Open the leads queue</a> to see whether they are real.</p>
        `,
      });
    }
    return NextResponse.json({ success: true });
  }

  // Transactional email (Resend). Failures are logged inside sendEmail and
  // never fail the request — the lead is already safely stored above.
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    phone: phone ? escapeHtml(phone) : undefined,
    weddingDate: wedding_date ? escapeHtml(wedding_date) : undefined,
    venueCity: venue_city ? escapeHtml(venue_city) : undefined,
    venueState: escapeHtml(venue_state),
    message: message ? escapeHtml(message) : undefined,
  };

  // What happened with each matched vendor, for the owner alert below. This is
  // the follow-up list: at a handful of leads a month, a personal nudge to a
  // vendor who has a couple waiting is the highest-value thing an owner can do.
  // Every line reports what the mail provider said, not what we intended.
  const outcomes: string[] = [];
  let notifiedCount = 0;

  // (Read per request, so a test can shorten it.)
  const emailDeadline = Date.now() + (Number(process.env.LEAD_EMAIL_BUDGET_MS) || EMAIL_PHASE_BUDGET_MS);
  // A send is not started in the last few seconds of the budget: it would be
  // cut off and called a failure while the message may still be delivered.
  const outOfTime = () => emailDeadline - Date.now() < MIN_SEND_WINDOW_MS;

  // 1. Notify matched vendors. Claimed vendors (account email) get the full
  //    lead. Unclaimed vendors with a scraped public email get a TEASER +
  //    claim CTA instead — the supply-side growth loop. Teaser sends are
  //    throttled per vendor and honor opt_out.
  if (matched_vendor_ids.length > 0) {
    const { data: vendorRows } = await supabase
      .from('vendors')
      .select('id, business_name, user_id, profiles(email)')
      .in('id', matched_vendor_ids);

    // Keep the matched order (source vendor first, then by distance).
    const byId = new Map(((vendorRows as any[]) || []).map((v) => [v.id, v]));
    const ordered = matched_vendor_ids.map((id) => byId.get(id)).filter(Boolean) as any[];

    const unclaimed = ordered.filter((v) => !v.user_id);

    // Private contacts + a listing slug per unclaimed vendor (for the claim
    // link). Both looked up in bulk; service-role client bypasses RLS on
    // vendor_private_contacts by design.
    const [contactsRes, listingRes] = unclaimed.length
      ? await Promise.all([
          supabase
            .from('vendor_private_contacts')
            .select('vendor_id, public_email, public_phone, contact_form_url, opt_out, last_lead_notified_at')
            .in('vendor_id', unclaimed.map((v) => v.id)),
          supabase
            .from('listings')
            .select('vendor_id, slug')
            .in('vendor_id', unclaimed.map((v) => v.id))
            .eq('status', 'approved'),
        ])
      : [{ data: [] }, { data: [] }];

    const contactByVendor = new Map(
      ((contactsRes.data as any[]) || []).map((c) => [c.vendor_id, c])
    );
    const slugByVendor = new Map<string, string>();
    for (const l of (listingRes.data as any[]) || []) {
      if (!slugByVendor.has(l.vendor_id)) slugByVendor.set(l.vendor_id, l.slug);
    }

    // One at a time, and awaited: each outcome below is what really happened.
    for (const v of ordered) {
      const accountEmail = v?.profiles?.email;
      const direct = v.id === sourceVendorId;
      const label = `<strong>${escapeHtml(v.business_name || 'Unnamed vendor')}</strong>${direct ? ' (the profile the couple was on)' : ''}`;

      if (accountEmail) {
        // Claimed vendor: full lead details, reply-to the couple. Capped per
        // vendor so the form cannot be pointed at one business as a mail
        // cannon; a capped request is still in their dashboard.
        if (outOfTime()) {
          outcomes.push(
            `${label}: claimed. <strong>Not emailed, because the mail provider was too slow to answer.</strong> The request is in their dashboard. Worth telling them yourself.`
          );
          continue;
        }
        if (!(await allow(supabase, 'lead_vendor', v.id, VENDOR_EMAILS_PER_HOUR, HOUR_MS))) {
          outcomes.push(
            `${label}: claimed. Not emailed, because they were already sent ${VENDOR_EMAILS_PER_HOUR} requests in the last hour. It is in their dashboard.`
          );
          continue;
        }

        const notification = leadNotificationEmail({
          vendorName: escapeHtml(v.business_name || 'there'),
          leadName: safe.name,
          leadEmail: safe.email,
          leadPhone: safe.phone,
          weddingDate: safe.weddingDate,
          venueCity: safe.venueCity,
          venueState: safe.venueState,
          message: safe.message,
          direct,
        });
        if (await sendEmail({ to: accountEmail, replyTo: email, ...notification, deadline: emailDeadline })) {
          notifiedCount += 1;
          outcomes.push(`${label}: claimed. Full lead sent to their account email.`);
        } else {
          outcomes.push(
            `${label}: claimed, but <strong>the email to them did not send</strong>. The request is in their dashboard. Worth telling them yourself.`
          );
        }
        continue;
      }

      // Unclaimed vendor: teaser + claim hook, if we have a usable address.
      const contact = contactByVendor.get(v.id);
      const slug = slugByVendor.get(v.id);

      // The follow-up kit for the owner: whatever contact routes we have on
      // file. The claim link itself is deliberately NOT in this email. It is a
      // key to the vendor's profile and to the couples waiting on it, and this
      // message gets replied to and forwarded. Copy it from the admin page.
      const routes = [
        contact?.public_phone ? `phone ${escapeHtml(String(contact.public_phone))}` : null,
        contact?.contact_form_url
          ? `<a href="${escapeHtml(String(contact.contact_form_url))}">contact form</a>`
          : null,
        slug ? `their instant claim link, from <a href="${SITE}/admin/vendors">Vendors</a> (Copy claim link)` : null,
      ]
        .filter(Boolean)
        .join(', ');
      const followUp = routes ? ` Follow up: ${routes}.` : '';

      if (!slug) {
        outcomes.push(`${label}: unclaimed, no live listing found, not notified.`);
        continue;
      }
      if (contact?.opt_out) {
        outcomes.push(`${label}: unclaimed and opted out of lead emails. Not emailed.${followUp}`);
        continue;
      }
      if (!contact?.public_email) {
        outcomes.push(`${label}: unclaimed, no email on file. Not notified.${followUp}`);
        continue;
      }

      const throttleMs = direct ? DIRECT_TEASER_THROTTLE_MS : AREA_TEASER_THROTTLE_MS;
      if (
        contact.last_lead_notified_at &&
        Date.now() - new Date(contact.last_lead_notified_at).getTime() < throttleMs
      ) {
        outcomes.push(`${label}: unclaimed, already emailed recently so no new teaser.${followUp}`);
        continue;
      }

      if (outOfTime()) {
        // Not stamped as notified, so the next request is not throttled away.
        outcomes.push(
          `${label}: unclaimed. <strong>No teaser sent, because the mail provider was too slow to answer.</strong>${followUp}`
        );
        continue;
      }

      const unsubscribeUrl = unsubscribeUrlFor(SITE, v.id);
      const teaser = unclaimedLeadNotificationEmail({
        vendorName: escapeHtml(v.business_name || 'there'),
        claimUrl: claimUrlFor({ site: SITE, slug, vendorId: v.id, utmSource: 'lead-notification' }),
        unsubscribeUrl,
        weddingDate: safe.weddingDate,
        venueCity: safe.venueCity,
        venueState: safe.venueState,
        guestCount: guest_count ? escapeHtml(String(guest_count)) : undefined,
        direct,
        instant: signClaimToken(v.id) !== null,
      });
      const sent = await sendEmail({
        to: contact.public_email,
        ...teaser,
        deadline: emailDeadline,
        // Lets Gmail, Apple Mail and others show their own "unsubscribe" control.
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      });
      if (sent) {
        notifiedCount += 1;
        // Stamped straight away, not after the loop: if a later send stalls
        // and the request is cut off, this vendor must still count as told,
        // or the next request emails them again inside their quiet week.
        await supabase
          .from('vendor_private_contacts')
          .update({ last_lead_notified_at: new Date().toISOString() })
          .eq('vendor_id', v.id);
        outcomes.push(`${label}: unclaimed. Teaser sent to ${escapeHtml(String(contact.public_email))}.${followUp}`);
      } else {
        // Not stamped as notified, so the next request is not throttled away.
        outcomes.push(
          `${label}: unclaimed. <strong>The teaser to ${escapeHtml(String(contact.public_email))} did not send</strong> (the address may be wrong).${followUp}`
        );
      }
    }
  }

  // 2. Confirmation to the couple, after the vendor emails so the number in it
  //    is the number of vendors who were actually told. One address gets a
  //    handful of these a day at most.
  //    The owner alert says so whenever the couple did not get one.
  let confirmationNote = '';
  if (!(await allow(supabase, 'lead_confirmation', addressKey(email), CONFIRMATIONS_PER_ADDRESS_PER_DAY, DAY_MS))) {
    confirmationNote = `<p>No confirmation email went to the couple this time: that address has already been sent ${CONFIRMATIONS_PER_ADDRESS_PER_DAY} today.</p>`;
  } else {
    const confirmed =
      !outOfTime() &&
      (await sendEmail({
        to: email,
        ...leadConfirmationEmail({
          leadName: safe.name,
          venueCity: safe.venueCity,
          venueState: safe.venueState,
          notifiedCount,
        }),
        deadline: emailDeadline,
      }));
    if (!confirmed) {
      confirmationNote =
        '<p><strong>The confirmation email to the couple did not send.</strong> They have had nothing from the site, so it is worth writing to them yourself.</p>';
    }
  }

  // 3. Owner alert — every new lead, with what happened to each match so the
  //    owner can see at a glance whether anyone can actually answer the couple.
  //    Last, so it reports results. No Reply-To: a reply would quote this whole
  //    message, internal notes included, to the couple. The couple's address is
  //    a link instead.
  const outcomeHtml =
    outcomes.length > 0
      ? `<h3 style="margin:20px 0 8px">Matched vendors</h3><ol style="padding-left:20px;margin:0">${outcomes
          .map((o) => `<li style="margin-bottom:8px">${o}</li>`)
          .join('')}</ol>`
      : '<p><strong>No vendors matched this location.</strong></p>';
  const nobodyTold =
    notifiedCount === 0
      ? `<p><strong>Nobody was emailed about this request.</strong> This couple will not hear from a vendor unless you step in.${
          confirmationNote ? '' : ' The confirmation they received says we are following up with vendors ourselves.'
        }</p>`
      : '';
  const where = [venue_city, venue_state].filter(Boolean).join(', ');

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New lead: ${name} (${where}), ${notifiedCount} of ${matched_vendor_ids.length} matched vendor${matched_vendor_ids.length === 1 ? '' : 's'} emailed`,
    html: `
      <h2>New lead on WeddingLiveStreaming.com</h2>
      <p><strong>Name:</strong> ${safe.name}<br/>
      <strong>Email:</strong> <a href="mailto:${mailtoAddress(email)}">${safe.email}</a><br/>
      <strong>Phone:</strong> ${safe.phone || 'not given'}<br/>
      <strong>Wedding date:</strong> ${safe.weddingDate || 'not given'}<br/>
      <strong>Venue:</strong> ${[safe.venueCity, safe.venueState].filter(Boolean).join(', ')}<br/>
      <strong>Guests:</strong> ${guest_count ? escapeHtml(String(guest_count)) : 'not given'}<br/>
      <strong>Budget:</strong> ${budget ? escapeHtml(String(budget)) : 'not given'}<br/>
      <strong>Matched vendors:</strong> ${matched_vendor_ids.length}, emailed: ${notifiedCount}</p>
      ${safe.message ? `<p><strong>Message:</strong> ${safe.message}</p>` : ''}
      ${nobodyTold}
      ${confirmationNote}
      ${outcomeHtml}
      <p>To write to the couple, use the email link above rather than replying to this message.</p>
      <p><a href="${SITE}/admin/leads">Open the leads queue</a></p>
    `,
  });

  return NextResponse.json({ success: true });
}
