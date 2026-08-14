// Sent once to every new account (Google or email/password) after their first
// successful sign-in. Wired in src/lib/welcome.ts. Callers must pass
// pre-escaped values.

interface WelcomeAccountParams {
  displayName: string | null; // pre-escaped; null → generic greeting
  role: 'couple' | 'vendor' | 'admin';
}

const SITE = 'https://www.weddinglivestreaming.com';

function shell(inner: string): string {
  return `
  <div style="background-color: #fbfaf8; padding: 32px 16px; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #ede3e5;">
      <tr>
        <td style="background-color: #913049; padding: 24px 32px;">
          <span style="color: #fbfaf8; font-size: 20px; font-weight: bold;">WeddingLiveStreaming.com</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 32px;">
          ${inner}
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
}

export function welcomeAccountEmail(params: WelcomeAccountParams): { subject: string; html: string } {
  const { displayName, role } = params;
  const greeting = displayName ? `Welcome, ${displayName}!` : 'Welcome!';

  if (role === 'vendor') {
    const subject = 'Welcome to WeddingLiveStreaming.com — let’s get your business found';
    const html = shell(`
          <h1 style="margin: 0 0 12px; font-size: 22px; color: #35272c;">${greeting}</h1>
          <p style="margin: 0 0 16px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            Your vendor account is ready. Couples across the country use our directory to find
            wedding live streaming professionals — here&rsquo;s how to make sure they find you:
          </p>
          <p style="margin: 0 0 8px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            1. <a href="${SITE}/submit-listing" style="color: #913049;">Create your listing</a> — add your services, coverage area, and photos.
          </p>
          <p style="margin: 0 0 8px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            2. Already listed? <a href="${SITE}/directory" style="color: #913049;">Find your profile</a> and claim it.
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            3. Add the <a href="${SITE}/vendor-badge" style="color: #913049;">vendor badge</a> to your website to build trust with couples.
          </p>
          <a href="${SITE}/submit-listing" style="display: inline-block; background-color: #d49a35; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
            Create my listing
          </a>`);
    return { subject, html };
  }

  const subject = 'Welcome to WeddingLiveStreaming.com — every guest, no matter the distance';
  const html = shell(`
          <h1 style="margin: 0 0 12px; font-size: 22px; color: #35272c;">${greeting}</h1>
          <p style="margin: 0 0 16px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            Your account is ready. Whether grandma is three states away or friends are overseas,
            a wedding live stream means nobody misses your big day. Here&rsquo;s where to start:
          </p>
          <p style="margin: 0 0 8px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            &bull; <a href="${SITE}/directory" style="color: #913049;">Browse vendors</a> near your venue and message them directly.
          </p>
          <p style="margin: 0 0 20px; font-size: 15px; color: #6b5c60; line-height: 1.5;">
            &bull; New to live streaming? Our <a href="${SITE}/guides" style="color: #913049;">guides</a> cover costs, questions to ask, and how it all works.
          </p>
          <a href="${SITE}/directory" style="display: inline-block; background-color: #d49a35; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: bold;">
            Browse vendors
          </a>`);
  return { subject, html };
}
