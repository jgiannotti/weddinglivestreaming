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
  /** Extra message headers, for example List-Unsubscribe. */
  headers?: Record<string, string>;
  /**
   * A point in time (ms since epoch) by which this send must be over, retry
   * included. For callers that send several emails inside one request and have
   * a total to keep to. Each attempt is capped at SEND_TIMEOUT_MS regardless.
   */
  deadline?: number;
}

/** The reverse of escapeHtml, for the one place escaped text must not appear: a subject line. */
export function unescapeHtml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&amp;/g, '&');
}

// One stalled request to the mail provider must not hold up everything queued
// behind it. A lead sends its emails one after another, the owner alert last.
const SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 8000;

// How long to wait after the provider says "too many requests" before the one
// retry. Its limit is per second, across the whole account.
const RATE_LIMIT_WAIT_MS = 1100;
/**
 * With less than this left before a caller's deadline, a send is not started.
 * The cut-off only stops us waiting; it does not call the message back. A send
 * begun with half a second to spare would often be cut off, reported as
 * failed, and delivered anyway. Three seconds is well past the provider's
 * normal answer time.
 */
export const MIN_SEND_WINDOW_MS = 3000;

type SendResult = { error: unknown } | 'timeout';

function sendWithTimeout(send: () => Promise<{ error: unknown }>, timeoutMs: number): Promise<SendResult> {
  return new Promise<SendResult>((resolve) => {
    // Not unref'd: this timer is the only thing guaranteed to settle the
    // promise when the provider never answers. It is cleared as soon as the
    // send comes back, so it never outlives a normal send.
    const timer = setTimeout(() => resolve('timeout'), timeoutMs);
    send().then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (err) => {
        clearTimeout(timer);
        resolve({ error: err });
      }
    );
  });
}

function isRateLimited(error: unknown): boolean {
  const e = (error ?? {}) as { name?: string; statusCode?: number };
  return e.statusCode === 429 || e.name === 'rate_limit_exceeded';
}

/**
 * Returns true only when the provider accepted the message. Callers that
 * record "we emailed this person" must use the result, not assume it.
 */
export async function sendEmail({ to, subject, html, replyTo, headers, deadline }: SendEmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  // Time left before the caller's deadline, if there is one.
  const beforeDeadline = () => (deadline === undefined ? Infinity : deadline - Date.now());
  try {
    if (beforeDeadline() < MIN_SEND_WINDOW_MS) {
      console.error('[email] not sent, out of time:', subject);
      return false;
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Templates are handed HTML-escaped values. A subject is plain text, so
    // "Tom &amp; Anna" there would be shown exactly like that.
    const message = { from: FROM, to, subject: unescapeHtml(subject), html, replyTo, ...(headers ? { headers } : {}) };
    // Each attempt gets the per-send cap, or what is left before the deadline
    // if that is sooner.
    const attempt = () =>
      sendWithTimeout(
        () => resend.emails.send(message) as Promise<{ error: unknown }>,
        Math.min(SEND_TIMEOUT_MS, beforeDeadline())
      );

    let result = await attempt();
    if (result !== 'timeout' && result.error && isRateLimited(result.error)) {
      // The provider limits requests per second across the whole account.
      // Wait out the window and try once more instead of dropping the message,
      // as long as there is still time to.
      if (beforeDeadline() - RATE_LIMIT_WAIT_MS >= MIN_SEND_WINDOW_MS) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WAIT_MS));
        result = await attempt();
      }
    }
    if (result === 'timeout') {
      console.error('[email] send timed out:', subject);
      return false;
    }
    if (result.error) {
      console.error('[email] send failed:', subject, result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send threw:', subject, err);
    return false;
  }
}
