// Sent to UNCLAIMED vendors (at their scraped public email) when a couple's
// quote request matches them. Deliberately a TEASER: wedding details but no
// couple contact info — claiming the profile is the only way to respond,
// which is the entire supply-side growth loop.
//
// Callers must pass pre-escaped values (same contract as lead-notification).

import { FOUNDING_MONTHS } from '@/lib/founding-shared';
import { CLAIM_LINK_TTL_DAYS } from '@/lib/claim-link';

interface UnclaimedLeadNotificationParams {
  vendorName: string;
  claimUrl: string;
  unsubscribeUrl: string;
  weddingDate?: string;
  venueCity?: string;
  venueState?: string;
  guestCount?: string;
  /** The couple asked for the quote on this vendor's own profile page. */
  direct?: boolean;
  /**
   * claimUrl carries a signed token (src/lib/claim-link.ts), so the claim is
   * approved on the spot. Only promise "right away" when this is true.
   */
  instant?: boolean;
}

export function unclaimedLeadNotificationEmail(
  params: UnclaimedLeadNotificationParams
): { subject: string; html: string } {
  const {
    vendorName,
    claimUrl,
    unsubscribeUrl,
    weddingDate,
    venueCity,
    venueState,
    guestCount,
    direct = false,
    instant = false,
  } = params;

  const where = [venueCity, venueState].filter(Boolean).join(', ');
  const subject = direct
    ? 'A couple just requested a quote from your WeddingLiveStreaming.com profile'
    : where
      ? `A couple in ${where} just requested wedding livestream quotes`
      : 'A couple just requested wedding livestream quotes in your area';

  const detailRows = [
    ['Location', where || 'Your service area'],
    ['Wedding date', weddingDate || 'Not specified'],
    ['Guest count', guestCount || 'Not specified'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b5b60;white-space:nowrap">${label}</td><td style="padding:6px 0;font-weight:600;color:#251318">${value}</td></tr>`
    )
    .join('');

  const intro = direct
    ? `Hi ${vendorName}, a couple planning their wedding just requested a quote
        from your profile on WeddingLiveStreaming.com.`
    : `Hi ${vendorName}, a couple planning their wedding just used
        WeddingLiveStreaming.com to request quotes from live streaming
        professionals in your area, and your listing was one of their matches.`;

  const howClaimingWorks = instant
    ? `Claiming your profile is free and takes about two minutes. The button
        below is a personal claim link for your business and works for
        ${CLAIM_LINK_TTL_DAYS} days. Use it and your claim is approved right away, so
        you can reply to the couple today. No commissions, no booking fees.`
    : `Claiming your profile is free and takes about two minutes, and it lets
        you respond to this couple directly. No commissions, no booking fees.`;

  const whyYou = direct
    ? `and a couple requested a quote from your profile`
    : `and a couple's request matched your listing`;

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#251318">
      <h2 style="font-weight:600">You have a new quote request waiting</h2>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
        ${intro}
      </p>
      <table style="font-family:Helvetica,Arial,sans-serif;font-size:14px;border-collapse:collapse;margin:12px 0 20px">${detailRows}</table>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6">
        Their name and contact details are attached to your listing.
        ${howClaimingWorks}
      </p>
      <p style="margin:24px 0">
        <a href="${claimUrl}"
           style="font-family:Helvetica,Arial,sans-serif;background:#761E34;color:#FBF8F4;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:15px">
          Claim your free profile and see the request
        </a>
      </p>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#6b5b60">
        Founding vendor offer: claim your profile, add your starting price and a
        cover photo, and your listing is Featured free for ${FOUNDING_MONTHS} months. No card needed.
      </p>
      <hr style="border:none;border-top:1px solid #e8dfe2;margin:28px 0 12px"/>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6b5b60;line-height:1.6">
        You're receiving this because your business is listed in the
        WeddingLiveStreaming.com directory (profile built from public sources)
        ${whyYou}. Don't want these emails?
        <a href="${unsubscribeUrl}" style="color:#6b5b60">Opt out here</a>.
        Your listing stays up, but we'll stop emailing you about new requests.
      </p>
    </div>
  `;

  return { subject, html };
}
