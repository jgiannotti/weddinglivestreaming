// Confirmation email sent to the couple right after they submit the
// Get Free Quotes form. Same visual system as lead-notification.ts.

interface LeadConfirmationParams {
  leadName: string;
  venueCity?: string;
  venueState?: string;
  matchedCount: number;
}

export function leadConfirmationEmail(params: LeadConfirmationParams): { subject: string; html: string } {
  const { leadName, venueCity, venueState, matchedCount } = params;

  const subject = 'We got your request — wedding live streaming quotes are on the way';

  const location = [venueCity, venueState].filter(Boolean).join(', ');
  const matchLine =
    matchedCount > 0
      ? `We&rsquo;ve matched your request with <strong>${matchedCount} vendor${matchedCount === 1 ? '' : 's'}</strong>${location ? ` serving ${location}` : ''} and they&rsquo;ll reach out directly.`
      : `We&rsquo;re lining up vendors${location ? ` for ${location}` : ''} now — as soon as one matches your date and location, you&rsquo;ll hear from them directly.`;

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
          <h1 style="margin: 0 0 12px; font-size: 22px; color: #35272c;">Thanks, ${leadName} — request received!</h1>
          <p style="margin: 0 0 16px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            ${matchLine}
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            In the meantime, you can browse vendors and compare packages yourself:
          </p>
          <a href="https://weddinglivestreaming.com/directory" style="display: inline-block; background-color: #d49a35; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
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

  return { subject, html };
}
