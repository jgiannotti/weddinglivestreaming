import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { matchVendorsForLead } from '@/lib/data/leads';
import { sendEmail, escapeHtml, ADMIN_EMAIL } from '@/lib/email';
import { leadNotificationEmail } from '@/lib/email-templates/lead-notification';
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

  // 2. Notify matched vendors that have an account email (claimed vendors).
  //    Seeded/unclaimed vendors have no user yet — their leads wait in admin.
  if (matched_vendor_ids.length > 0) {
    const { data: vendorRows } = await supabase
      .from('vendors')
      .select('business_name, profiles(email)')
      .in('id', matched_vendor_ids);
    for (const v of (vendorRows as any[]) || []) {
      const vendorEmail = v?.profiles?.email;
      if (!vendorEmail) continue;
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
      sends.push(sendEmail({ to: vendorEmail, replyTo: email, ...notification }));
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
