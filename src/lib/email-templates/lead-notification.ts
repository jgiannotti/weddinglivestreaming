// Sent to matched vendors when a couple submits the Get Free Quotes form.
// Wired in src/app/api/leads/route.ts. Callers must pass pre-escaped values.

import { emailSiteUrl } from '@/lib/site-url';

interface LeadNotificationParams {
  vendorName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  weddingDate?: string;
  venueCity?: string;
  venueState?: string;
  message?: string;
  /** The couple asked for the quote on this vendor's own profile page. */
  direct?: boolean;
}

export function leadNotificationEmail(params: LeadNotificationParams): { subject: string; html: string } {
  const { vendorName, leadName, leadEmail, leadPhone, weddingDate, venueCity, venueState, message, direct = false } = params;
  const site = emailSiteUrl();
  const intro = direct
    ? `Hi ${vendorName}, a couple just requested a quote from your profile on WeddingLiveStreaming.com.`
    : `Hi ${vendorName}, a couple just requested wedding livestream quotes on WeddingLiveStreaming.com, and your listing was one of the matches for their venue.`;

  const subject = direct
    ? `New quote request from your profile: ${leadName}`
    : `New quote request: ${leadName} is looking for a wedding live streaming vendor`;

  const detailRows = [
    ['Name', leadName],
    ['Email', leadEmail],
    ['Phone', leadPhone || 'Not given'],
    ['Wedding date', weddingDate || 'Not given'],
    ['Venue', [venueCity, venueState].filter(Boolean).join(', ') || 'Not given'],
  ]
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #6b5c60; border-bottom: 1px solid #ede3e5;">${label}</td>
          <td style="padding: 8px 12px; font-size: 14px; color: #35272c; border-bottom: 1px solid #ede3e5;">${value}</td>
        </tr>`
    )
    .join('');

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
          <h1 style="margin: 0 0 12px; font-size: 22px; color: #35272c;">You have a new quote request</h1>
          <p style="margin: 0 0 20px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            ${intro}
          </p>
          <table role="presentation" width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
            ${detailRows}
          </table>
          ${
            message
              ? `<p style="margin: 0 0 20px; font-size: 14px; color: #35272c; line-height: 1.5;"><strong>Message:</strong> ${message}</p>`
              : ''
          }
          <p style="margin: 0 0 20px; font-size: 14px; color: #35272c; line-height: 1.5;">
            Reply directly to this email to reach the couple, or manage your listing from your dashboard.
          </p>
          <a href="${site}/dashboard/leads" style="display: inline-block; background-color: #d49a35; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
            See your quote requests
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

  return { subject, html };
}
