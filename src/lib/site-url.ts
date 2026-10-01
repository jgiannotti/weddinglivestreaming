// The origin used for links inside emails.
//
// Emails are read long after they are sent and outside any browser session, so
// every link in one has to point at the real site. Reading
// NEXT_PUBLIC_SITE_URL directly was not safe for that: on a preview
// deployment it is the preview host (sign-in does not work there, so a claim
// link from such an email could never be completed), and the setup notes once
// told people to set it to the bare domain, which adds a redirect in front of
// every link. Local development is the one case where the configured value is
// the right one.

const CANONICAL = 'https://www.weddinglivestreaming.com';

export function emailSiteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(configured)) return configured;
  return CANONICAL;
}
