import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, escapeHtml } from '@/lib/email';
import { ensureProfile } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const { listingId, vendorId, name, phone, subject, body: messageBody } = body;

  const supabase = await createClient();
  // Clerk session -> public.profiles row. profiles.id is the same uuid the
  // old Supabase auth user carried, so every `user.id` below is unchanged.
  const user = await ensureProfile();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  // Insert message
  const { error: insertErr } = await supabase.from('messages').insert({
    from_user_id: user.id,
    to_vendor_id: vendorId,
    listing_id: listingId,
    subject,
    body: messageBody,
    sender_email: user.email,
    sender_name: name,
    sender_phone: phone,
  });
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Increment inquiry counter on the listing
  try {
    await supabase.rpc('increment_inquiry_count', { listing_id: listingId });
  } catch {
    /* counter increment is non-critical */
  }

  // Send email notification to vendor (sendEmail no-ops without RESEND_API_KEY
  // and swallows failures — the message row above is already stored).
  const { data: vendor } = await supabase
    .from('vendors')
    .select('business_name, user_id, profiles!inner(email)')
    .eq('id', vendorId)
    .single();
  const vendorEmail = (vendor as any)?.profiles?.email;
  if (vendorEmail) {
    await sendEmail({
      to: vendorEmail,
      replyTo: user.email!,
      subject: `New inquiry: ${subject}`,
      html: `
        <h2>New inquiry on WeddingLiveStreaming.com</h2>
        <p><strong>From:</strong> ${escapeHtml(String(name || ''))} (${escapeHtml(user.email || '')})${phone ? ` · ${escapeHtml(String(phone))}` : ''}</p>
        <p><strong>Subject:</strong> ${escapeHtml(String(subject || ''))}</p>
        <hr/>
        <p style="white-space:pre-line">${escapeHtml(String(messageBody || ''))}</p>
        <hr/>
        <p>Reply directly to this email to respond.</p>
      `,
    });
  }

  return NextResponse.json({ ok: true });
}
