// Unit tests for the pure logic behind the vendor-funnel fixes.
//
//   npx tsx scripts/test-vendor-funnel.ts
//
// No database, no network. Covers: signed claim links, signed unsubscribe
// links, the founding-vendor rules, listing slug/photo-name handling, friendly
// error mapping, the Stripe renewal date, the after-sign-in return path, which
// requests count as a page view, the dashboard's counting window, and the
// origin used for links in emails.

import assert from 'node:assert/strict';

process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-service-key';

import { signClaimToken, verifyClaimToken, claimUrlFor, CLAIM_LINK_TTL_DAYS } from '../src/lib/claim-link';
import { foundingView, addMonths, FOUNDING_MONTHS, type FoundingListingRow } from '../src/lib/founding-shared';
import { safeUploadName, slugCandidates, friendlySubmitError, photoProblem, MAX_PHOTO_BYTES } from '../src/lib/listing-submit';
import { subscriptionPeriodEndMs } from '../src/lib/stripe';
import { safeNextPath } from '../src/lib/safe-next';
import { signUnsubscribe, verifyUnsubscribe, unsubscribeUrlFor } from '../src/lib/unsubscribe-link';
import { isDocumentRequest } from '../src/lib/track-request';
import { statsWindow, STATS_WINDOW_DAYS, AI_ASSISTANT_AGENTS } from '../src/lib/data/vendor-stats';
import { emailSiteUrl } from '../src/lib/site-url';
import { escapeHtml, unescapeHtml } from '../src/lib/email';
import { addressKey, visitorKey, allow } from '../src/lib/send-limits';
import { mailtoAddress } from '../src/lib/utils';
import { RELEASE_DATE, dayAfterRelease, endOfReleaseDayMs, unsignedLinksSentBeforeMs } from '../src/lib/release';

let passed = 0;
const pending: Promise<void>[] = [];
function test(name: string, fn: () => void | Promise<void>) {
  const pass = () => {
    passed += 1;
    console.log(`PASS ${name}`);
  };
  const fail = (err: unknown) => {
    console.error(`FAIL ${name}`);
    console.error(err);
    process.exitCode = 1;
  };
  try {
    const result = fn();
    if (result instanceof Promise) pending.push(result.then(pass, fail));
    else pass();
  } catch (err) {
    fail(err);
  }
}

const VENDOR_A = '11111111-1111-4111-8111-111111111111';
const VENDOR_B = '22222222-2222-4222-8222-222222222222';
const DAY = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------- claim links
test('claim token verifies for the vendor it was minted for', () => {
  const token = signClaimToken(VENDOR_A)!;
  assert.ok(token);
  assert.equal(verifyClaimToken(token, VENDOR_A), true);
});

test('claim token for one vendor never opens another', () => {
  const token = signClaimToken(VENDOR_A)!;
  assert.equal(verifyClaimToken(token, VENDOR_B), false);
});

test('claim token expires after the TTL', () => {
  const now = Date.UTC(2026, 9, 1);
  const token = signClaimToken(VENDOR_A, now)!;
  assert.equal(verifyClaimToken(token, VENDOR_A, now + (CLAIM_LINK_TTL_DAYS - 1) * DAY), true);
  assert.equal(verifyClaimToken(token, VENDOR_A, now + (CLAIM_LINK_TTL_DAYS + 1) * DAY), false);
});

test('extending the expiry by hand breaks the signature', () => {
  const token = signClaimToken(VENDOR_A)!;
  const [exp, sig] = token.split('.');
  const later = (parseInt(exp, 36) + 365 * 86400).toString(36);
  assert.equal(verifyClaimToken(`${later}.${sig}`, VENDOR_A), false);
});

test('garbage, empty and oversized tokens are rejected without throwing', () => {
  for (const bad of ['', '.', 'abc', 'abc.', '.abc', 'zzzz.!!!!', 'a.b.c', 'x'.repeat(500), null, undefined]) {
    assert.equal(verifyClaimToken(bad as any, VENDOR_A), false);
  }
});

test('a token signed with a different key is rejected', () => {
  const token = signClaimToken(VENDOR_A)!;
  const original = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'a-rotated-key';
  try {
    assert.equal(verifyClaimToken(token, VENDOR_A), false);
  } finally {
    process.env.SUPABASE_SERVICE_ROLE_KEY = original;
  }
});

test('CLAIM_LINK_SECRET overrides the service key', () => {
  const withServiceKey = signClaimToken(VENDOR_A)!;
  process.env.CLAIM_LINK_SECRET = 'dedicated-secret';
  try {
    assert.equal(verifyClaimToken(withServiceKey, VENDOR_A), false);
    assert.equal(verifyClaimToken(signClaimToken(VENDOR_A)!, VENDOR_A), true);
  } finally {
    delete process.env.CLAIM_LINK_SECRET;
  }
});

test('with no signing key at all, nothing is minted and nothing verifies', () => {
  const original = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    assert.equal(signClaimToken(VENDOR_A), null);
    assert.equal(verifyClaimToken('abc.def', VENDOR_A), false);
    assert.equal(
      claimUrlFor({ site: 'https://x.test', slug: 'acme', vendorId: VENDOR_A }),
      'https://x.test/claim/acme'
    );
  } finally {
    process.env.SUPABASE_SERVICE_ROLE_KEY = original;
  }
});

test('claim URL carries a token that survives a URL round trip', () => {
  const url = new URL(claimUrlFor({ site: 'https://x.test', slug: 'acme-films', vendorId: VENDOR_A, utmSource: 'lead-notification' }));
  assert.equal(url.pathname, '/claim/acme-films');
  assert.equal(url.searchParams.get('utm_source'), 'lead-notification');
  assert.equal(verifyClaimToken(url.searchParams.get('t'), VENDOR_A), true);
  // The claim page re-encodes it into ?next= for the sign-up redirect.
  const next = `/claim/acme-films?t=${encodeURIComponent(url.searchParams.get('t')!)}`;
  const back = new URL(`https://x.test/auth/register?next=${encodeURIComponent(next)}`).searchParams.get('next')!;
  assert.equal(verifyClaimToken(new URL(`https://x.test${back}`).searchParams.get('t'), VENDOR_A), true);
});

// ------------------------------------------------------------ founding offer
const base: FoundingListingRow = {
  id: 'l1',
  status: 'approved',
  tier: 'basic',
  featured_until: null,
  starting_price_cents: null,
  hero_image_url: null,
};
const now = new Date('2026-10-01T12:00:00Z');

test('founding: approved listing with price and photo is ready', () => {
  const v = foundingView([{ ...base, starting_price_cents: 90000, hero_image_url: 'https://x/y.jpg' }], false, now);
  assert.deepEqual(v, { state: 'ready' });
});

test('founding: reports exactly what is missing', () => {
  assert.deepEqual(foundingView([base], false, now), { state: 'incomplete', missing: ['price', 'photo'] });
  assert.deepEqual(foundingView([{ ...base, starting_price_cents: 90000 }], false, now), { state: 'incomplete', missing: ['photo'] });
  assert.deepEqual(foundingView([{ ...base, hero_image_url: 'https://x/y.jpg' }], false, now), { state: 'incomplete', missing: ['price'] });
});

test('founding: a pending listing waits for approval even when complete', () => {
  const v = foundingView([{ ...base, status: 'pending', starting_price_cents: 90000, hero_image_url: 'u' }], false, now);
  assert.deepEqual(v, { state: 'pending' });
});

test('founding: a running grant shows as active with its end date', () => {
  const until = '2027-04-01T12:00:00.000Z';
  const v = foundingView([{ ...base, tier: 'featured', featured_until: until, starting_price_cents: 1, hero_image_url: 'u' }], false, now, '2026-10-01T12:00:00.000Z');
  assert.deepEqual(v, { state: 'active', until });
});

test('founding: Featured some other way is never described as the founding offer', () => {
  const complete = { ...base, starting_price_cents: 1, hero_image_url: 'u' };
  // A purchase whose subscription record has not landed yet: dated Featured, no grant.
  assert.deepEqual(foundingView([{ ...complete, tier: 'featured', featured_until: '2026-11-03T00:00:00.000Z' }], false, now), { state: 'none' });
  // Featured with no end date, set by hand.
  assert.deepEqual(foundingView([{ ...complete, tier: 'featured', featured_until: null }], false, now), { state: 'none' });
  // The same, on an account whose free period was used long ago: nothing has "ended" for them.
  assert.deepEqual(foundingView([{ ...complete, tier: 'featured', featured_until: null }], false, now, '2025-01-01T00:00:00.000Z'), { state: 'none' });
});

test('founding: once used up it is never offered again', () => {
  const v = foundingView(
    [{ ...base, tier: 'featured', featured_until: '2026-06-01T00:00:00Z', starting_price_cents: 1, hero_image_url: 'u' }],
    false,
    now
  );
  assert.deepEqual(v, { state: 'none' });
});

test('founding: with the grant on record, an ended period reads as ended, with its date', () => {
  const grantedAt = '2026-01-10T00:00:00.000Z';
  const ended = '2026-07-10T00:00:00.000Z';
  const v = foundingView(
    [{ ...base, tier: 'featured', featured_until: ended, starting_price_cents: 1, hero_image_url: 'u' }],
    false,
    now,
    grantedAt
  );
  assert.deepEqual(v, { state: 'ended', endedOn: ended });
});

test('founding: a cleanup job resetting the listing never makes the offer available again', () => {
  // downgrade_expired_featured() (migration 0002) leaves an expired listing as
  // tier basic, featured_until null: exactly what a brand-new listing looks like.
  const reset = { ...base, tier: 'basic', featured_until: null, starting_price_cents: 90000, hero_image_url: 'u' };
  assert.deepEqual(foundingView([reset], false, now), { state: 'ready' }, 'without the marker this is the bug');
  const v = foundingView([reset], false, now, '2026-01-10T00:00:00.000Z');
  assert.equal(v.state, 'ended');
  assert.equal((v as any).endedOn, addMonths(new Date('2026-01-10T00:00:00.000Z'), FOUNDING_MONTHS).toISOString());
  // Deleting the listing and starting over does not help either.
  assert.equal(foundingView([], false, now, '2026-01-10T00:00:00.000Z').state, 'ended');
  assert.equal(foundingView([{ ...base, status: 'pending' }], false, now, '2026-01-10T00:00:00.000Z').state, 'ended');
});

test('founding: ended early by hand gives no made-up end date', () => {
  // Granted last month, set back to Basic by an admin: the six months have not passed.
  const v = foundingView([{ ...base, starting_price_cents: 1, hero_image_url: 'u' }], false, now, '2026-09-01T00:00:00.000Z');
  assert.deepEqual(v, { state: 'ended', endedOn: null });
});

test('founding: a rejected listing is not described as waiting for review', () => {
  assert.deepEqual(foundingView([{ ...base, status: 'rejected' }], false, now), { state: 'rejected' });
  assert.deepEqual(foundingView([{ ...base, status: 'rejected' }, { ...base, id: 'l2', status: 'pending' }], false, now), { state: 'pending' });
});

test('founding: paying and formerly paying customers are excluded', () => {
  const complete = { ...base, starting_price_cents: 90000, hero_image_url: 'u' };
  assert.deepEqual(foundingView([complete], true, now), { state: 'none' });
});

test('founding: no listings at all reads as pending, not as an error', () => {
  assert.deepEqual(foundingView([], false, now), { state: 'pending' });
});

test(`founding: the grant runs ${FOUNDING_MONTHS} calendar months`, () => {
  assert.equal(addMonths(new Date('2026-10-01T00:00:00Z'), FOUNDING_MONTHS).toISOString(), '2027-04-01T00:00:00.000Z');
});

// --------------------------------------------------------------- listing form
test('photo names that Storage rejects are made safe, extension kept', () => {
  // macOS screenshot: narrow no-break space before PM.
  assert.equal(safeUploadName('Screenshot 2026-09-12 at 3.45.10 PM.png'), 'Screenshot-2026-09-12-at-3-45-10-PM.png');
  assert.equal(safeUploadName('IMG_1234 (1).JPG'), 'IMG-1234-1.jpg');
  assert.equal(safeUploadName('cérémonie été.jpeg'), 'ceremonie-ete.jpeg');
  assert.equal(safeUploadName('💍.webp'), 'photo.webp');
  assert.equal(safeUploadName('no-extension'), 'no-extension');
  assert.match(safeUploadName('a'.repeat(300) + '.png'), /^a{60}\.png$/);
  for (const name of ['a b#c%d[e].png', '../../etc/passwd', 'weird\u0000name.jpg']) {
    assert.match(safeUploadName(name), /^[A-Za-z0-9.-]+$/);
  }
});

test('a cover photo must be a JPG, PNG or WebP under 15 MB', () => {
  assert.equal(photoProblem(null), null);
  assert.equal(photoProblem({ size: 1000, type: 'image/jpeg' }), null);
  assert.equal(photoProblem({ size: 1000, type: 'image/png' }), null);
  assert.equal(photoProblem({ size: MAX_PHOTO_BYTES, type: 'image/webp' }), null);
  assert.match(photoProblem({ size: MAX_PHOTO_BYTES + 1, type: 'image/jpeg' })!, /larger than 15 MB/);
  for (const type of ['text/html', 'image/svg+xml', 'application/pdf', 'image/gif', '']) {
    assert.match(photoProblem({ size: 1000, type })!, /JPG, PNG or WebP/, type);
  }
});

test('slug candidates fall back to city, then city + state, then a random suffix', () => {
  const c = slugCandidates('Acme Films, LLC', 'St. Petersburg', 'Florida');
  assert.equal(c[0], 'acme-films-llc');
  assert.equal(c[1], 'acme-films-llc-st-petersburg');
  assert.equal(c[2], 'acme-films-llc-st-petersburg-florida');
  assert.match(c[3], /^acme-films-llc-[a-z0-9]{1,5}$/);
  assert.equal(new Set(c).size, c.length);
});

test('a business name with no usable characters still yields a slug', () => {
  const c = slugCandidates('💍✨', '', '');
  assert.equal(c[0], 'vendor');
  assert.ok(c.length >= 2);
});

test('database errors become messages a vendor can act on', () => {
  assert.match(friendlySubmitError({ code: '23505', message: 'duplicate key value violates unique constraint "vendors_slug_key"' }), /Claim page/);
  assert.match(friendlySubmitError({ code: '42501', message: 'new row violates row-level security policy' }), /sign-in expired/i);
  assert.match(friendlySubmitError(new TypeError('Failed to fetch')), /connection/);
  const generic = friendlySubmitError({ message: 'some internal detail: relation "x" does not exist' });
  assert.match(generic, /could not save your listing/i);
  assert.doesNotMatch(generic, /relation|constraint|violates/);
  assert.match(friendlySubmitError(null), /could not save your listing/i);
});

// ------------------------------------------------------------------- stripe
test('Stripe period end is read from either payload shape', () => {
  assert.equal(subscriptionPeriodEndMs({ current_period_end: 1_800_000_000 }), 1_800_000_000_000);
  assert.equal(subscriptionPeriodEndMs({ items: { data: [{ current_period_end: 1_800_000_001 }] } }), 1_800_000_001_000);
  assert.equal(subscriptionPeriodEndMs({}), null);
  assert.equal(subscriptionPeriodEndMs({ current_period_end: 'soon' }), null);
  assert.equal(subscriptionPeriodEndMs(null), null);
});

// ------------------------------------------------------- after-sign-in path
test('the return path after sign-in keeps every path this site generates', () => {
  const token = signClaimToken(VENDOR_A)!;
  for (const ok of [
    '/dashboard',
    '/dashboard/leads?claimed=1',
    '/submit-listing',
    '/listing/acme-films/contact',
    '/dashboard/listings/bbbbbbbb-0000-4000-8000-000000000004/edit',
    `/claim/acme-films?t=${encodeURIComponent(token)}`,
  ]) {
    assert.equal(safeNextPath(ok), ok);
  }
  // The signed claim link must still verify after the round trip.
  const back = safeNextPath(`/claim/acme-films?t=${encodeURIComponent(token)}`);
  assert.equal(verifyClaimToken(new URL(`https://x.test${back}`).searchParams.get('t'), VENDOR_A), true);
});

test('the return path after sign-in can never leave this site', () => {
  const hostile = [
    '//evil.com',
    '///evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    '/\r/evil.com',
    '/\t\\evil.com',
    '\t//evil.com',
    ' //evil.com',
    '/.//evil.com',
    '/..//evil.com',
    '/a/..//evil.com',
    '/%2e//evil.com',
    '/%2E%2E//evil.com',
    'https://evil.com',
    'http:evil.com',
    'javascript:alert(1)',
    'evil.com',
    'dashboard',
    '',
    null,
    undefined,
    42,
    ['/dashboard', '//evil.com'],
  ];
  for (const bad of hostile) {
    const out = safeNextPath(bad as any);
    assert.equal(out, '/dashboard', `expected fallback for ${JSON.stringify(bad)}`);
  }
  // Whatever comes back, a browser resolving it stays on our origin.
  for (const anything of [...hostile, '/ok', '/a/../b', '/a/./b//c', '/@evil.com', '/%2F%2Fevil.com', '/x?y=//evil.com#//evil.com']) {
    const out = safeNextPath(anything as any);
    assert.equal(new URL(out, 'https://www.weddinglivestreaming.com').origin, 'https://www.weddinglivestreaming.com');
  }
  assert.equal(safeNextPath('//evil.com', '/'), '/');
});

// ------------------------------------------------------ unsubscribe links
test('unsubscribe signature is bound to one vendor and is not a claim token', () => {
  const sig = signUnsubscribe(VENDOR_A)!;
  assert.ok(sig);
  assert.equal(verifyUnsubscribe(sig, VENDOR_A), true);
  assert.equal(verifyUnsubscribe(sig, VENDOR_B), false);
  for (const bad of ['', 'x', sig.slice(0, -1), sig + 'a', 'x'.repeat(300), null, undefined]) {
    assert.equal(verifyUnsubscribe(bad as any, VENDOR_A), false);
  }
  // Keys are separated by purpose: neither kind of link works as the other.
  const claim = signClaimToken(VENDOR_A)!;
  assert.equal(verifyUnsubscribe(claim, VENDOR_A), false);
  assert.equal(verifyUnsubscribe(claim.split('.')[1], VENDOR_A), false);
  assert.equal(verifyClaimToken(`${claim.split('.')[0]}.${sig}`, VENDOR_A), false);

  const url = new URL(unsubscribeUrlFor('https://x.test', VENDOR_A));
  assert.equal(url.pathname, '/api/lead-notify/unsubscribe');
  assert.equal(url.searchParams.get('v'), VENDOR_A);
  assert.equal(verifyUnsubscribe(url.searchParams.get('s'), VENDOR_A), true);
});

test('an opt-out link keeps working when its own secret is set later, and is not tied to the claim secret', () => {
  const saved = { own: process.env.UNSUBSCRIBE_SECRET, claim: process.env.CLAIM_LINK_SECRET, service: process.env.SUPABASE_SERVICE_ROLE_KEY };
  try {
    delete process.env.UNSUBSCRIBE_SECRET;
    const early = signUnsubscribe(VENDOR_A)!; // signed with the service-role key
    assert.equal(verifyUnsubscribe(early, VENDOR_A), true);

    // Giving opt-out links their own secret afterwards must not break the ones already in inboxes.
    process.env.UNSUBSCRIBE_SECRET = 'a-new-secret-for-opt-out-links';
    assert.equal(verifyUnsubscribe(early, VENDOR_A), true, 'links signed before the secret was set still work');
    const later = signUnsubscribe(VENDOR_A)!;
    assert.notEqual(later, early, 'new links are signed with the new secret');
    assert.equal(verifyUnsubscribe(later, VENDOR_A), true);
    assert.equal(verifyUnsubscribe(later, VENDOR_B), false);

    // With their own secret, rotating the other keys leaves them alone.
    process.env.CLAIM_LINK_SECRET = 'rotated-claim-secret';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'rotated-service-key';
    assert.equal(verifyUnsubscribe(later, VENDOR_A), true, 'survives a rotation of the claim secret and the service key');
    assert.equal(verifyUnsubscribe(early, VENDOR_A), false, 'the early link was tied to the old service key');
  } finally {
    for (const [name, value] of [['UNSUBSCRIBE_SECRET', saved.own], ['CLAIM_LINK_SECRET', saved.claim], ['SUPABASE_SERVICE_ROLE_KEY', saved.service]] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

// ------------------------------------------------------------ page views
test('only page loads count as a page view, never a background fetch', () => {
  const h = (init: Record<string, string>) => new Headers(init);
  const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
  const OLD_SAFARI = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1';
  const HTML = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

  assert.equal(isDocumentRequest(h({ 'user-agent': CHROME, 'sec-fetch-dest': 'document' })), true, 'a person loading the page');
  assert.equal(isDocumentRequest(h({ 'user-agent': CHROME, 'sec-fetch-dest': 'empty' })), false, 'link prefetch or in-app fetch');
  assert.equal(isDocumentRequest(h({ 'user-agent': CHROME, 'sec-fetch-dest': 'iframe' })), false);
  // A page Chrome preloads from a search result is opened without a second
  // request, so it has to count, or visits from search go missing.
  assert.equal(isDocumentRequest(h({ 'user-agent': CHROME, 'sec-fetch-dest': 'document', 'sec-purpose': 'prefetch;prerender' })), true);

  // Crawlers send no fetch metadata and must still be logged, whatever they accept.
  assert.equal(isDocumentRequest(h({})), true);
  assert.equal(isDocumentRequest(h({ 'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)', accept: '*/*' })), true);
  assert.equal(isDocumentRequest(h({ 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', accept: '*/*' })), true);
  assert.equal(isDocumentRequest(h({ 'user-agent': 'ChatGPT-User/1.0', accept: 'text/html' })), true);

  // An older browser without fetch metadata: told apart by what it asks for.
  assert.equal(isDocumentRequest(h({ 'user-agent': OLD_SAFARI, accept: HTML })), true, 'its page loads count');
  assert.equal(isDocumentRequest(h({ 'user-agent': OLD_SAFARI, accept: '*/*' })), false, 'its link prefetches do not');
  assert.equal(isDocumentRequest(h({ 'user-agent': OLD_SAFARI })), true, 'no accept header at all: counted, as before');
});

test('dashboard counts from the day the counter was fixed, then over a rolling 30 days', () => {
  const floor = '2026-10-02';
  // Ten days after the fix: only those ten days are counted, and the label says so.
  assert.deepEqual(statsWindow(new Date('2026-10-12T15:00:00Z'), floor), { since: floor, partialWindow: true, notStarted: false });
  // The day the rolling window catches up with the floor.
  assert.deepEqual(statsWindow(new Date('2026-11-01T00:00:00Z'), floor), { since: '2026-10-02', partialWindow: false, notStarted: false });
  // The day before the floor (the release day): counting has not started, and
  // the dashboard says "starts", not "0 views since tomorrow".
  assert.deepEqual(statsWindow(new Date('2026-10-01T23:59:00Z'), floor), { since: floor, partialWindow: true, notStarted: true });
  // The floor day itself, from its first minute (UTC): counting has started.
  assert.deepEqual(statsWindow(new Date('2026-10-02T00:00:00Z'), floor), { since: floor, partialWindow: true, notStarted: false });
  // Well after: a plain 30-day window.
  const later = statsWindow(new Date('2027-03-15T12:00:00Z'), floor);
  assert.equal(later.partialWindow, false);
  assert.equal(later.since, new Date(Date.UTC(2027, 2, 15) - STATS_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10));
});

test('the AI assistant count leaves out the training crawlers', () => {
  assert.equal(AI_ASSISTANT_AGENTS.includes('GPTBot'), false);
  assert.equal(AI_ASSISTANT_AGENTS.includes('ClaudeBot'), false);
  for (const kept of ['ChatGPT-User', 'OAI-SearchBot', 'Claude-User', 'Claude-SearchBot', 'Perplexity-User', 'PerplexityBot']) {
    assert.ok(AI_ASSISTANT_AGENTS.includes(kept), kept);
  }
});

// ------------------------------------------------------------ email links
test('links in emails always point at the real site', () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    const expect = (value: string | undefined, out: string) => {
      if (value === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = value;
      assert.equal(emailSiteUrl(), out, String(value));
    };
    expect(undefined, 'https://www.weddinglivestreaming.com');
    expect('https://www.weddinglivestreaming.com', 'https://www.weddinglivestreaming.com');
    expect('https://www.weddinglivestreaming.com/', 'https://www.weddinglivestreaming.com');
    expect('https://weddinglivestreaming.com', 'https://www.weddinglivestreaming.com');
    expect('https://weddinglivestreaming-git-preview-joe.vercel.app', 'https://www.weddinglivestreaming.com');
    expect('http://localhost:3000', 'http://localhost:3000');
    expect('http://localhost:3099/', 'http://localhost:3099');
    expect('https://localhost.evil.com', 'https://www.weddinglivestreaming.com');
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  }
});

// ------------------------------------------------------- subjects, limits
test('an address in a mailto link cannot smuggle in a cc, a subject or a body', () => {
  assert.equal(mailtoAddress('couple@example.com'), 'couple@example.com');
  assert.equal(mailtoAddress("o'brien@example.com"), "o'brien@example.com");
  const crafted = mailtoAddress('a@b.com?cc=evil@x.com&body=hi there');
  assert.equal(/[?&\s]/.test(crafted), false, crafted);
  assert.equal(crafted.startsWith('a@b.com'), true);
});

test('a subject line shows what the couple typed, not its HTML-escaped form', () => {
  for (const typed of ['Tom & Anna', "O'Brien <3 \"vows\"", 'a &lt; b', '&amp;', 'R&D &amp;&lt;tag&gt;', 'plain']) {
    assert.equal(unescapeHtml(escapeHtml(typed)), typed, typed);
  }
  assert.equal(unescapeHtml('Tom &amp; Anna&rsquo;s wedding'), 'Tom & Anna’s wedding');
});

test('send limits count one mailbox once, however the address is typed', () => {
  const key = addressKey('Couple@Example.com');
  assert.match(key, /^[0-9a-f]{32}$/);
  assert.equal(addressKey('  couple@example.COM '), key);
  assert.notEqual(addressKey('couple2@example.com'), key);
  assert.equal(key.includes('example'), false, 'the log never holds the address itself');
});

test('send limits treat spellings of one mailbox as one mailbox', () => {
  const key = addressKey('plus.test@gmail.com');
  for (const same of ['Plus.Test@Gmail.com', 'plustest@gmail.com', 'plus.test+venue@gmail.com', 'p.l.u.s.t.e.s.t+x+y@googlemail.com']) {
    assert.equal(addressKey(same), key, same);
  }
  // Dots only vanish at Gmail; a +tag is dropped everywhere.
  assert.notEqual(addressKey('a.b@example.com'), addressKey('ab@example.com'));
  assert.equal(addressKey('a.b+wedding@example.com'), addressKey('a.b@example.com'));
  assert.notEqual(addressKey('other@gmail.com'), key);
  // A leading + is part of the name, not a tag.
  assert.notEqual(addressKey('+tag@example.com'), addressKey('@example.com'));
});

test('the visitor key is not the address, and is a different one every day', () => {
  const a = visitorKey('203.0.113.7', new Date('2026-10-01T23:59:00Z'));
  assert.match(a, /^[0-9a-f]{32}$/);
  assert.equal(visitorKey('203.0.113.7', new Date('2026-10-01T00:00:00Z')), a, 'stable within a day');
  assert.notEqual(visitorKey('203.0.113.7', new Date('2026-10-02T00:00:00Z')), a, 'rotates at midnight UTC');
  assert.notEqual(visitorKey('203.0.113.8', new Date('2026-10-01T23:59:00Z')), a);
});

// A stand-in for the service-role client: just the calls send-limits makes.
function fakeLog(opts: { insertFails?: boolean; countFails?: boolean; count?: number }) {
  const calls = { inserts: 0, counts: 0 };
  const client = {
    from: () => ({
      insert: async () => {
        calls.inserts += 1;
        return { error: opts.insertFails ? { message: 'relation "email_send_log" does not exist' } : null };
      },
      select: () => {
        calls.counts += 1;
        const q: any = {
          eq: () => q,
          gte: () => q,
          then: (resolve: (v: unknown) => void) =>
            resolve({ count: opts.count ?? 0, error: opts.countFails ? { message: 'timeout' } : null }),
        };
        return q;
      },
    }),
  };
  return { client: client as any, calls };
}

// (This one prints a "[send-limits] the send log is unavailable" line: that
// is the code under test saying so, not a failure.)
test('send limits: allowed up to the limit, refused after it, and never refused because the log is broken', async () => {
  assert.equal(await allow(fakeLog({ count: 5 }).client, 'k', null, 5, 1000), true, 'the fifth of five is allowed');
  assert.equal(await allow(fakeLog({ count: 6 }).client, 'k', null, 5, 1000), false, 'the sixth is not');
  const missing = fakeLog({ insertFails: true, count: 999 });
  assert.equal(await allow(missing.client, 'k', null, 5, 1000), true, 'no log table (migration not applied): email goes out');
  assert.equal(missing.calls.counts, 0);
  assert.equal(await allow(fakeLog({ countFails: true }).client, 'k', 'key', 5, 1000), true, 'a count that fails is not a refusal');
});

test('the release date is a real day, and the two things hung off it agree', () => {
  assert.match(RELEASE_DATE, /^\d{4}-\d{2}-\d{2}$/);
  const start = Date.parse(`${RELEASE_DATE}T00:00:00Z`);
  assert.ok(Number.isFinite(start), 'parses as a date');
  assert.equal(new Date(start).toISOString().slice(0, 10), RELEASE_DATE, 'and is a day that exists');
  assert.equal(endOfReleaseDayMs(), start + DAY);
  assert.equal(dayAfterRelease(), new Date(start + DAY).toISOString().slice(0, 10));
  assert.ok(dayAfterRelease() > RELEASE_DATE);
  assert.equal(unsignedLinksSentBeforeMs(), start + 8 * DAY, 'unsigned opt-out links: a week of slack past the release day');
});

Promise.all(pending).then(() => console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}`));
