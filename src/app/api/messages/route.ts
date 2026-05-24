import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  const body = await request.json();
  const { listingId, vendorId, name, phone, subject, body: messageBody } = body;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  // Send email notification to vendor
  if (process.env.RESEND_API_KEY) {
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('business_name, user_id, profiles!inner(email)')
        .eq('id', vendorId)
        .single();
      const vendorEmail = (vendor as any)?.profiles?.email;
      if (vendorEmail) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@weddinglivestreaming.com',
          to: vendorEmail,
          replyTo: user.email!,
          subject: `New inquiry: ${subject}`,
          html: `
            <h2>New inquiry on WeddingLiveStreaming.com</h2>
            <p><strong>From:</strong> ${name} (${user.email})${phone ? ` · ${phone}` : ''}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr/>
            <p style="white-space:pre-line">${messageBody}</p>
            <hr/>
            <p>Reply directly to this email to respond.</p>
          `,
        });
      }
    } catch (err) {
      console.error('Email failed:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
