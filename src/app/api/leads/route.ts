import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { matchVendorsForLead } from '@/lib/data/leads';

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

  // TODO(Resend deferred): once RESEND_API_KEY is configured, email each
  // matched vendor (matched_vendor_ids) that a new lead is waiting, and send
  // the couple a confirmation email. Deferred by the site owner's choice —
  // no-op gracefully here.
  if (process.env.RESEND_API_KEY) {
    // Intentionally not implemented yet.
  }

  return NextResponse.json({ success: true });
}
