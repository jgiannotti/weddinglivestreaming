// Prep only — not yet wired to Resend. See src/app/api/leads/route.ts and api/subscribe/route.ts for TODO markers where these will be used once RESEND_API_KEY is configured.

interface WelcomeSubscriberParams {
  email: string;
}

export function welcomeSubscriberEmail(params: WelcomeSubscriberParams): { subject: string; html: string } {
  const { email } = params;

  const subject = "You're subscribed — welcome to WeddingLiveStreaming.com";

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
          <h1 style="margin: 0 0 12px; font-size: 22px; color: #35272c;">You&rsquo;re in!</h1>
          <p style="margin: 0 0 16px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            Thanks for subscribing with ${email}. We&rsquo;ll send you occasional tips and deals for planning your wedding live stream — no spam, just the good stuff.
          </p>
          <a href="https://weddinglivestreaming.com/directory" style="display: inline-block; background-color: #d49a35; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
            Browse vendors
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
