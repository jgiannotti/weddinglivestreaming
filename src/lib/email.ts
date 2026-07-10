// Central transactional-email helper (Resend).
//
// Every send in the app goes through sendEmail() so failures are logged and
// swallowed uniformly — email must never break a user-facing request. If
// RESEND_API_KEY is unset (e.g. local dev), sends silently no-op.

import { Resend } from 'resend';

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'noreply@weddinglivestreaming.com';
const FROM = `Wedding Live Streaming <${FROM_ADDRESS}>`;

// Where owner/admin alerts go (new leads, new claim requests).
export const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'joe@weddinglivestreaming.com';

// User-supplied values must be escaped before interpolation into email HTML.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html, replyTo });
    if (error) {
      console.error('[email] send failed:', subject, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send threw:', subject, err);
    return false;
  }
}
