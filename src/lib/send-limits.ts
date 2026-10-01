// Durable send limits (server-only).
//
// Counted in public.email_send_log (migration 0019), a table only the service
// role can touch. They are deliberately NOT counted from the leads or
// subscribers tables: both accept inserts from the public API with any
// created_at, so anyone could forge enough rows to trip a limit and switch the
// site's email off.
//
// Every function here fails open. If the log cannot be written or read (the
// migration has not been applied, the database hiccups), the answer is "no
// limit reached" and email goes out as it always did. A limiter that silences
// real couples because it is broken is worse than no limiter.

import { createHmac } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

type Admin = SupabaseClient<any, any, any>;

const TABLE = 'email_send_log';
// Longer than the longest window any limit uses (one day), and no longer.
const KEEP_MS = 2 * 24 * 60 * 60 * 1000;

// The same secret the page-view log salts its visitor ids with. Keyed, so a
// stored value cannot be turned back into an address by trying likely ones.
function keyed(value: string): string {
  const salt = process.env.TRACKING_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'send-limits';
  return createHmac('sha256', `send-limits:v1:${salt}`).update(value).digest('hex').slice(0, 32);
}

/**
 * A short, stable stand-in for an email address, so the log never holds one in
 * clear. Two spellings of one mailbox give the same key: letter case, a
 * "+tag" before the @ (which the big providers all deliver to the same
 * mailbox), and at Gmail the dots in the name. Without that, the per-address
 * limit is no limit: name+1@, name+2@ and so on all reach one inbox.
 */
export function addressKey(address: string): string {
  let a = address.trim().toLowerCase();
  const at = a.lastIndexOf('@');
  if (at > 0) {
    let local = a.slice(0, at);
    let domain = a.slice(at + 1);
    const plus = local.indexOf('+');
    if (plus > 0) local = local.slice(0, plus);
    if (domain === 'googlemail.com') domain = 'gmail.com';
    if (domain === 'gmail.com') local = local.replace(/\./g, '');
    a = `${local}@${domain}`;
  }
  return keyed(`address|${a}`);
}

/**
 * A stand-in for a visitor's network address, for the per-visitor limit. It
 * follows the page-view log's rule: keyed, and different every UTC day, so the
 * log can say "this many from one place in the last hour" and nothing more.
 */
export function visitorKey(ip: string, now: Date = new Date()): string {
  return keyed(`visitor|${now.toISOString().slice(0, 10)}|${ip}`);
}

function since(windowMs: number): string {
  return new Date(Date.now() - windowMs).toISOString();
}

/** How many events of this kind (and key, if given) are in the window. null = unknown. */
export async function countRecent(
  admin: Admin,
  kind: string,
  key: string | null,
  windowMs: number
): Promise<number | null> {
  let query = admin.from(TABLE).select('id', { count: 'exact', head: true }).eq('kind', kind).gte('created_at', since(windowMs));
  if (key !== null) query = query.eq('subject_key', key);
  const { count, error } = await query;
  return error ? null : count ?? 0;
}

/** Record one event. Returns false when the log is unavailable. */
export async function record(admin: Admin, kind: string, key: string | null): Promise<boolean> {
  const { error } = await admin.from(TABLE).insert({ kind, subject_key: key });
  if (error) {
    // Failing open must not also be failing silently: with the log gone (the
    // migration not applied, say) every limit is off, and that should be seen.
    console.error('[send-limits] the send log is unavailable, so the email limits are off', {
      kind,
      message: error.message,
    });
  }
  return !error;
}

/**
 * Record one event and say whether it is within the limit: true for the first
 * `max` events in the window, false after that. Recording first means that
 * requests arriving together each see the others. Unknown counts as allowed.
 */
export async function allow(
  admin: Admin,
  kind: string,
  key: string | null,
  max: number,
  windowMs: number
): Promise<boolean> {
  if (!(await record(admin, kind, key))) return true;
  const count = await countRecent(admin, kind, key, windowMs);
  return count === null || count <= max;
}

/**
 * Drop rows older than any window in use. Cheap, and safe to skip. It runs
 * when the quote form or the newsletter form is used, so on a quiet site a
 * row can outlive the two days until the next visitor does that.
 */
export async function prune(admin: Admin): Promise<void> {
  await admin.from(TABLE).delete().lt('created_at', new Date(Date.now() - KEEP_MS).toISOString());
}
