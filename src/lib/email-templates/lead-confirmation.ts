// Confirmation email sent to the couple right after they submit the
// Get Free Quotes form. Same visual system as lead-notification.ts.
//
// The number in this email is the number of vendors we actually emailed, not
// the number the matcher returned. A matched vendor we have no address for, or
// one that opted out, has not been told anything, and the couple was being
// promised a reply from them.

import { ADMIN_EMAIL } from '@/lib/email';
import { emailSiteUrl } from '@/lib/site-url';

interface LeadConfirmationParams {
  leadName: string;
  venueCity?: string;
  venueState?: string;
  /** Vendors that were sent this request by email just now. */
  notifiedCount: number;
}

export function leadConfirmationEmail(
  params: LeadConfirmationParams
): { subject: string; html: string; replyTo: string } {
  const { leadName, venueCity, venueState, notifiedCount } = params;

  const subject = 'We got your wedding live streaming request';

  const location = [venueCity, venueState].filter(Boolean).join(', ');
  const matchLine =
    notifiedCount > 0
      ? `We sent your request to <strong>${notifiedCount} wedding livestream vendor${notifiedCount === 1 ? '' : 's'}</strong>${location ? ` for ${location}` : ''}. Vendors who are available for your date will contact you directly. If you have not heard from anyone in a few days, reply to this email and we will help.`
      : `We could not reach a vendor${location ? ` for ${location}` : ''} automatically, so we are following up with vendors ourselves. If you have questions in the meantime, reply to this email.`;

  const html = `
  <div style="background-color: #fbfaf8; padding: 32px 16px; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #ede3e5;">
      <tr>
        <td style="background-color: #913049; padding: 24px 32px;">
          <span style="color: #fbfaf8; font-size: 20px; font-weight: bold;">WeddingLiveStreaming.com</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px;">
          <h1 style="margin: 0 0 12px; font-size: 22px; color: #35272c;">Thanks, ${leadName}. We have your request.</h1>
          <p style="margin: 0 0 16px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            ${matchLine}
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            In the meantime, you can browse vendors and compare packages yourself:
          </p>
          <a href="${emailSiteUrl()}/directory" style="display: inline-block; background-color: #d49a35; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
            Browse the directory
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 32px; background-color: #f3e2e7;">
          <p style="margin: 0; font-size: 12px; color: #6b5c60;">
            WeddingLiveStreaming.com &middot; Every love story deserves every guest.
          </p>
        </td>
      </tr>
    </table>
  </div>`;

  return { subject, html, replyTo: ADMIN_EMAIL };
}
