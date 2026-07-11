import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { matchVendorsForLead } from '@/lib/data/leads';
import { sendEmail, escapeHtml, ADMIN_EMAIL } from '@/lib/email';
import { leadNotificationEmail } from '@/lib/email-templates/lead-notification';
import { unclaimedLeadNotificationEmail } from '@/lib/email-templates/unclaimed-lead-notification';
import { leadConfirmationEmail } from '@/lib/email-templates/lead-confirmation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = await request.json();
  const {
    name,
    email,
    phone,
    wedding_date,
    venue_city,
    venue_state,
    guest_count,
    budget,
    message,
    source_listing_id,
    website, // honeypot
  } = body;

  // Honeypot: bots fill hidden fields. Pretend success without inserting.
  if (website) {
    return NextResponse.json({ success: true });
  }

  if (!name || !email || !venue_state) {
    return NextResponse.json(
      { error: 'Name, email, and venue state are required.' },
      { status: 400 }
    );
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const matched_vendor_ids = await matchVendorsForLead({ state: venue_state, city: venue_city });

  const supabase = await createAdminClient();
  const { error: insertErr } = await supabase.from('leads').insert({
    name,
    email,
    phone: phone || null,
    wedding_date: wedding_date || null,
    venue_city: venue_city || null,
    venue_state,
    guest_count: guest_count || null,
    budget: budget || null,
    message: message || null,
    source_listing_id: source_listing_id || null,
    matched_vendor_ids,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Transactional email (Resend). Failures are logged inside sendEmail and
  // never fail the request — the lead is already safely stored above.
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    phone: phone ? escapeHtml(String(phone)) : undefined,
    weddingDate: wedding_date ? escapeHtml(String(wedding_date)) : undefined,
    venueCity: venue_city ? escapeHtml(String(venue_city)) : undefined,
    venueState: escapeHtml(String(venue_state)),
    message: message ? escapeHtml(String(message)) : undefined,
  };

  const sends: Promise<boolean>[] = [];

  // 1. Confirmation to the couple.
  const confirmation = leadConfirmationEmail({
    leadName: safe.name,
    venueCity: safe.venueCity,
    venueState: safe.venueState,
    matchedCount: matched_vendor_ids.length,
  });
  sends.push(sendEmail({ to: email, ...confirmation }));

  // 2. Notify matched vendors. Claimed vendors (account email) get the full
  //    lead. Unclaimed vendors with a scraped public email get a TEASER +
  //    claim CTA instead — the supply-side growth loop. Teaser sends are
  //    throttled to one per vendor per 7 days and honor opt_out.
  if (matched_vendor_ids.length > 0) {
    const { data: vendorRows } = await supabase
      .from('vendors')
      .select('id, business_name, user_id, profiles(email)')
      .in('id', matched_vendor_ids);

    const unclaimed = ((vendorRows as any[]) || []).filter((v) => !v.user_id);

    // Private contacts + a listing slug per unclaimed vendor (for the claim
    // link). Both looked up in bulk; service-role client bypasses RLS on
    // vendor_private_contacts by design.
    const [contactsRes, listingRes] = unclaimed.length
      ? await Promise.all([
          supabase
            .from('vendor_private_contacts')
            .select('vendor_id, public_email, opt_out, last_lead_notified_at')
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

    const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.weddinglivestreaming.com';
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const notifiedUnclaimed: string[] = [];

    for (const v of (vendorRows as any[]) || []) {
      const accountEmail = v?.profiles?.email;

      if (accountEmail) {
        // Claimed vendor: full lead details, reply-to the couple.
        const notification = leadNotificationEmail({
          vendorName: escapeHtml(v.business_name || 'there'),
          leadName: safe.name,
          leadEmail: safe.email,
          leadPhone: safe.phone,
          weddingDate: safe.weddingDate,
          venueCity: safe.venueCity,
          venueState: safe.venueState,
          message: safe.message,
        });
        sends.push(sendEmail({ to: accountEmail, replyTo: email, ...notification }));
        continue;
      }

      // Unclaimed vendor: teaser + claim hook, if we have a usable address.
      const contact = contactByVendor.get(v.id);
      const slug = slugByVendor.get(v.id);
      if (!contact?.public_email || contact.opt_out || !slug) continue;
      if (
        contact.last_lead_notified_at &&
        Date.now() - new Date(contact.last_lead_notified_at).getTime() < SEVEN_DAYS_MS
      ) {
        continue;
      }

      const teaser = unclaimedLeadNotificationEmail({
        vendorName: escapeHtml(v.business_name || 'there'),
        claimUrl: `${SITE}/claim/${slug}?utm_source=lead-notification`,
        unsubscribeUrl: `${SITE}/api/lead-notify/unsubscribe?v=${v.id}`,
        weddingDate: safe.weddingDate,
        venueCity: safe.venueCity,
        venueState: safe.venueState,
        guestCount: guest_count ? escapeHtml(String(guest_count)) : undefined,
      });
      sends.push(sendEmail({ to: contact.public_email, ...teaser }));
      notifiedUnclaimed.push(v.id);
    }

    if (notifiedUnclaimed.length > 0) {
      await supabase
        .from('vendor_private_contacts')
        .update({ last_lead_notified_at: new Date().toISOString() })
        .in('vendor_id', notifiedUnclaimed);
    }
  }

  // 3. Owner alert — every new lead, with match count for triage.
  sends.push(
    sendEmail({
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `New lead: ${name} (${[venue_city, venue_state].filter(Boolean).join(', ')}) — ${matched_vendor_ids.length} vendor match${matched_vendor_ids.length === 1 ? '' : 'es'}`,
      html: `
        <h2>New lead on WeddingLiveStreaming.com</h2>
        <p><strong>Name:</strong> ${safe.name}<br/>
        <strong>Email:</strong> ${safe.email}<br/>
        <strong>Phone:</strong> ${safe.phone || '—'}<br/>
        <strong>Wedding date:</strong> ${safe.weddingDate || '—'}<br/>
        <strong>Venue:</strong> ${[safe.venueCity, safe.venueState].filter(Boolean).join(', ')}<br/>
        <strong>Guests:</strong> ${guest_count ? escapeHtml(String(guest_count)) : '—'}<br/>
        <strong>Budget:</strong> ${budget ? escapeHtml(String(budget)) : '—'}<br/>
        <strong>Matched vendors:</strong> ${matched_vendor_ids.length}</p>
        ${safe.message ? `<p><strong>Message:</strong> ${safe.message}</p>` : ''}
        <p><a href="https://weddinglivestreaming.com/admin/leads">Open the leads queue</a></p>
      `,
    })
  );

  await Promise.allSettled(sends);

  return NextResponse.json({ success: true });
}
