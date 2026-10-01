// End-to-end tests for the vendor funnel. They call the real route handlers,
// which talk to a real Postgres through PostgREST with every migration and RLS
// policy in place. Only two things are faked: who is signed in (Clerk) and the
// mail transport (Resend), so every email the app would send can be inspected.
//
//   sudo POSTGREST_BIN=/path/to/postgrest scripts/e2e/start.sh
//   npx tsx --tsconfig scripts/e2e/tsconfig.json scripts/e2e/run.ts
//
// Why this exists: the bugs that have actually hurt this site (the claim
// outage, the missing storage policies) were all "the page loads but the
// action fails". Reading code does not catch that class. Doing the action does.

import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { execSync } from 'node:child_process';

const JWT_SECRET = 'e2e-local-jwt-secret-not-used-anywhere-real-0123456789';
const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
function jwt(payload: Record<string, unknown>): string {
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({ exp: Math.floor(Date.now() / 1000) + 3600, ...payload });
  const sig = createHmac('sha256', JWT_SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

// Environment the app code reads. Set before any app module is imported.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:3056';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = jwt({ role: 'anon' });
process.env.SUPABASE_SERVICE_ROLE_KEY = jwt({ role: 'service_role' });
process.env.NEXT_PUBLIC_SITE_URL = 'https://www.weddinglivestreaming.com';
process.env.RESEND_API_KEY = 'e2e';
process.env.ADMIN_NOTIFICATION_EMAIL = 'owner@e2e.test';
// Offline only: these let the Stripe SDK verify signatures the tests make themselves.
process.env.STRIPE_SECRET_KEY = 'sk_test_e2e_not_a_real_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_e2e_not_a_real_secret';
// So the "mail provider never answers" test takes under a second, not eight.
process.env.EMAIL_SEND_TIMEOUT_MS = '700';

import { createClient as createSupabase } from '@supabase/supabase-js';
import Stripe from 'stripe';

const g = globalThis as any;
g.__E2E_SENT__ = [];
g.__E2E_USER__ = null;

interface Sent { to: string | string[]; subject: string; html: string; replyTo?: string }
const sent = (): Sent[] => g.__E2E_SENT__;
const clearSent = () => { g.__E2E_SENT__ = []; };
const mailTo = (addr: string) => sent().filter((m) => (Array.isArray(m.to) ? m.to.includes(addr) : m.to === addr));

function signInAs(user: { id: string; email: string } | null) {
  g.__E2E_USER__ = user ? { ...user, token: jwt({ sub: user.id, role: 'authenticated' }) } : null;
}

const db = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

async function must<T>(p: PromiseLike<{ data: T; error: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`db: ${error.message}`);
  return data;
}

// Straight to the local database, for the few things the REST layer cannot do
// (simulating a failure with a trigger). Same cluster scripts/e2e/start.sh made.
function psql(statements: string): string {
  return execSync('psql -q -At -v ON_ERROR_STOP=1 -h /var/lib/postgresql/wls_rehearsal -p 54329 -U postgres wls', { input: statements }).toString().trim();
}

function post(path: string, body: unknown, ip = '10.0.0.1'): Request {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

let passed = 0;
let failed = 0;
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(err);
  }
}

// ------------------------------------------------------------------ fixtures
// Four unclaimed seeded vendors around Tampa at increasing distance, and one
// claimed vendor in Orlando. Contact coverage mirrors production: some have an
// email, one opted out, one only has a contact form.
const V = {
  near:   { id: 'aaaaaaaa-0000-4000-8000-000000000001', name: 'Near Films',        slug: 'near-films',        lat: 27.951, lng: -82.457 },
  optout: { id: 'aaaaaaaa-0000-4000-8000-000000000002', name: 'Opted Out Video',   slug: 'opted-out-video',   lat: 27.990, lng: -82.457 },
  form:   { id: 'aaaaaaaa-0000-4000-8000-000000000003', name: 'Form Only Studio',  slug: 'form-only-studio',  lat: 28.040, lng: -82.457 },
  far:    { id: 'aaaaaaaa-0000-4000-8000-000000000004', name: 'Far & Away Media',  slug: 'far-away-media',    lat: 28.200, lng: -82.457 },
};
const L = (v: { id: string }) => v.id.replace('aaaaaaaa', 'bbbbbbbb');

// Empty every table the tests write to, so the suite can be re-run against a
// stack that is already up.
async function reset() {
  for (const [table, key] of [
    ['page_views', 'id'], ['email_send_log', 'id'], ['subscribers', 'id'], ['messages', 'id'], ['claim_requests', 'id'],
    ['leads', 'id'], ['subscriptions', 'id'], ['vendor_private_contacts', 'vendor_id'],
    ['listings', 'id'], ['vendors', 'id'], ['profiles', 'id'], ['cities', 'id'],
  ] as const) {
    await must(db.from(table).delete().not(key, 'is', null));
  }
}

async function seed() {
  await reset();
  await must(db.from('cities').insert([
    { name: 'Tampa', state_code: 'FL', lat: 27.9506, lng: -82.4572, population: 400000, slug: 'tampa' },
    { name: 'Orlando', state_code: 'FL', lat: 28.5384, lng: -81.3789, population: 300000, slug: 'orlando' },
  ]));
  await must(db.from('vendors').insert(
    Object.values(V).map((v) => ({ id: v.id, user_id: null, business_name: v.name, slug: v.slug, source: 'seeded' }))
  ));
  await must(db.from('listings').insert(
    Object.values(V).map((v) => ({
      id: L(v), vendor_id: v.id, title: v.name, slug: v.slug, description: 'Seeded profile.',
      city: 'Tampa', state: 'Florida', lat: v.lat, lng: v.lng, status: 'approved', tier: 'basic',
      service_radius_miles: 60,
    }))
  ));
  // Every row carries every key: PostgREST fills a key missing from one row of
  // a bulk insert with NULL, not with the column default.
  await must(db.from('vendor_private_contacts').insert([
    { vendor_id: V.near.id,   public_email: 'hello@nearfilms.test', public_phone: '813-555-0101', contact_form_url: null, opt_out: false },
    { vendor_id: V.optout.id, public_email: 'info@optedout.test',   public_phone: null,           contact_form_url: null, opt_out: true },
    { vendor_id: V.form.id,   public_email: null,                   public_phone: '813-555-0103', contact_form_url: 'https://formonly.test/contact?a=1&b=2', opt_out: false },
    { vendor_id: V.far.id,    public_email: 'team@faraway.test',    public_phone: null,           contact_form_url: null, opt_out: false },
  ]));
  await must(db.from('profiles').insert([
    { id: 'cccccccc-0000-4000-8000-00000000000a', email: 'owner@e2e.test', role: 'admin', clerk_user_id: 'user_admin' },
  ]));
}

const ADMIN = { id: 'user_admin', email: 'owner@e2e.test' };
const CLAIMANT = { id: 'user_claimant', email: 'team@faraway.test' };
const OTHER = { id: 'user_other', email: 'someone@else.test' };
const NEWVENDOR = { id: 'user_newvendor', email: 'new@vendor.test' };

async function main() {
  await seed();

  const leads = await import('../../src/app/api/leads/route');
  const instant = await import('../../src/app/api/claims/instant/route');
  const claims = await import('../../src/app/api/claims/route');
  const founding = await import('../../src/app/api/founding/route');
  const submitted = await import('../../src/app/api/listings/submitted/route');
  const adminListings = await import('../../src/app/api/admin/listings/[id]/route');
  const adminClaims = await import('../../src/app/api/admin/claims/[id]/route');
  const subscribe = await import('../../src/app/api/subscribe/route');
  const { getListingTraffic } = await import('../../src/lib/data/vendor-stats');

  const couple = (n: number) => ({
    name: `Couple ${n}`, email: `couple${n}@e2e.test`, phone: '555-000-0000', wedding_date: '2027-05-01',
    venue_city: 'Tampa', venue_state: 'Florida', guest_count: 120,
  });

  let farClaimUrl = '';
  let nearClaimUrl = '';
  let nearUnsubscribeUrl = '';

  // ------------------------------------------------------------ lead routing
  await test('lead from a city page: nearest three matched, only reachable vendors emailed', async () => {
    clearSent();
    const res = await leads.POST(post('/api/leads', couple(1), '10.1.0.1'));
    assert.equal(res.status, 200);

    const row = (await must(db.from('leads').select('*').eq('email', 'couple1@e2e.test').single())) as any;
    assert.deepEqual(row.matched_vendor_ids, [V.near.id, V.optout.id, V.form.id]);
    assert.equal(row.source_listing_id, null);

    const confirmation = mailTo('couple1@e2e.test');
    assert.equal(confirmation.length, 1, 'couple gets a confirmation');
    // Three vendors matched, but only one could be emailed. The couple is told one.
    assert.match(confirmation[0].html, /sent your request to <strong>1 wedding livestream vendor<\/strong>/);
    assert.doesNotMatch(confirmation[0].html, /3 vendors/);
    assert.equal(confirmation[0].replyTo, 'owner@e2e.test', 'a couple who replies reaches a person');

    const teaser = mailTo('hello@nearfilms.test');
    assert.equal(teaser.length, 1, 'vendor with an email gets the teaser');
    assert.match(teaser[0].subject, /A couple in Tampa, Florida just requested/);
    assert.doesNotMatch(teaser[0].html, /couple1@e2e\.test|555-000-0000|Couple 1/, 'teaser never leaks the couple');
    assert.match(teaser[0].html, /approved right away/, 'signed link is promised as instant');
    assert.match(teaser[0].html, /works for\s+14 days/, 'and says how long the link lasts');
    nearClaimUrl = teaser[0].html.match(/href="(https:\/\/www\.weddinglivestreaming\.com\/claim\/near-films\?[^"]+)"/)![1].replace(/&amp;/g, '&');
    // One-click unsubscribe for mail clients, with a signed link.
    const listUnsub = (teaser[0] as any).headers?.['List-Unsubscribe'] as string;
    assert.match(listUnsub, /^<https:\/\/www\.weddinglivestreaming\.com\/api\/lead-notify\/unsubscribe\?v=aaaaaaaa-0000-4000-8000-000000000001&s=[A-Za-z0-9_-]{40,}>$/);
    assert.equal((teaser[0] as any).headers?.['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
    nearUnsubscribeUrl = listUnsub.slice(1, -1);

    assert.equal(mailTo('info@optedout.test').length, 0, 'opted-out vendor is not emailed');

    const alert = mailTo('owner@e2e.test');
    assert.equal(alert.length, 1);
    assert.match(alert[0].html, /Near Films<\/strong>: unclaimed\. Teaser sent to hello@nearfilms\.test/);
    assert.match(alert[0].html, /Opted Out Video<\/strong>: unclaimed and opted out/);
    assert.match(alert[0].html, /Form Only Studio<\/strong>: unclaimed, no email on file/);
    assert.match(alert[0].html, /href="https:\/\/formonly\.test\/contact\?a=1&amp;b=2">contact form/, 'form URL is escaped');
    assert.match(alert[0].subject, /1 of 3 matched vendors emailed/);
    // The alert gets replied to and forwarded. It must not carry a working
    // claim link, and a reply must not go to the couple with all this quoted.
    assert.doesNotMatch(alert[0].html, /\/claim\/[a-z-]+\?[^"]*t=/, 'no signed claim link in the owner alert');
    assert.match(alert[0].html, /their instant claim link, from <a href="https:\/\/www\.weddinglivestreaming\.com\/admin\/vendors">Vendors<\/a>/);
    assert.equal(alert[0].replyTo, undefined);
    assert.match(alert[0].html, /<a href="mailto:couple1@e2e\.test">couple1@e2e\.test<\/a>/);
  });

  await test('quote requested on a vendor profile always reaches that vendor, first', async () => {
    clearSent();
    const res = await leads.POST(post('/api/leads', { ...couple(2), source_listing_id: L(V.far) }, '10.1.0.2'));
    assert.equal(res.status, 200);

    const row = (await must(db.from('leads').select('*').eq('email', 'couple2@e2e.test').single())) as any;
    assert.deepEqual(row.matched_vendor_ids, [V.far.id, V.near.id, V.optout.id], 'source vendor first, then nearest');
    assert.equal(row.source_listing_id, L(V.far));

    const teaser = mailTo('team@faraway.test');
    assert.equal(teaser.length, 1);
    assert.equal(teaser[0].subject, 'A couple just requested a quote from your WeddingLiveStreaming.com profile');
    assert.match(teaser[0].html, /requested a quote\s+from your profile/);
    farClaimUrl = teaser[0].html.match(/href="(https:\/\/www\.weddinglivestreaming\.com\/claim\/far-away-media\?[^"]+)"/)![1].replace(/&amp;/g, '&');

    assert.equal(mailTo('hello@nearfilms.test').length, 0, 'area match emailed a minute ago is throttled');
    assert.match(mailTo('owner@e2e.test')[0].html, /Far &amp; Away Media<\/strong> \(the profile the couple was on\)/);
  });

  await test('a bad source listing id is ignored instead of failing the lead', async () => {
    clearSent();
    const res = await leads.POST(post('/api/leads', { ...couple(3), source_listing_id: 'not-a-uuid' }, '10.1.0.3'));
    assert.equal(res.status, 200);
    const row = (await must(db.from('leads').select('*').eq('email', 'couple3@e2e.test').single())) as any;
    assert.equal(row.source_listing_id, null);
    assert.equal(row.matched_vendor_ids.length, 3);
  });

  await test('honeypot and missing fields never create a lead', async () => {
    const before = (await must(db.from('leads').select('id'))) as any[];
    assert.equal((await leads.POST(post('/api/leads', { ...couple(4), website: 'http://spam' }, '10.1.0.4'))).status, 200);
    assert.equal((await leads.POST(post('/api/leads', { name: 'x' }, '10.1.0.4'))).status, 400);
    const after = (await must(db.from('leads').select('id'))) as any[];
    assert.equal(after.length, before.length);
  });

  await test('one address hammering the lead form is rate limited', async () => {
    const codes: number[] = [];
    for (let i = 0; i < 7; i++) {
      codes.push((await leads.POST(post('/api/leads', { name: 'x' }, '10.9.9.9'))).status);
    }
    assert.deepEqual(codes, [400, 400, 400, 400, 400, 429, 429]);
  });

  // ------------------------------------------------- what really got sent
  await test('a teaser the mail provider rejects is reported as failed and does not use up the vendor’s slot', async () => {
    // Near Films was emailed in the first test; clear that so only this request matters.
    await must(db.from('vendor_private_contacts').update({ last_lead_notified_at: null }).eq('vendor_id', V.near.id));
    g.__E2E_FAIL_TO__ = new Set(['hello@nearfilms.test']);
    clearSent();
    try {
      const res = await leads.POST(post('/api/leads', couple(6), '10.1.0.6'));
      assert.equal(res.status, 200);
    } finally {
      g.__E2E_FAIL_TO__ = undefined;
    }
    const alert = mailTo('owner@e2e.test');
    assert.equal(alert.length, 1, 'the owner alert still goes out');
    assert.match(alert[0].html, /The teaser to hello@nearfilms\.test did not send/);
    assert.match(alert[0].html, /Nobody was emailed about this request/);
    assert.match(alert[0].subject, /0 of 3 matched vendors emailed/);
    const contact = (await must(db.from('vendor_private_contacts').select('last_lead_notified_at').eq('vendor_id', V.near.id).single())) as any;
    assert.equal(contact.last_lead_notified_at, null, 'not stamped as notified, so the next request is not throttled away');
    // The couple is not promised replies from vendors nobody told.
    const confirmation = mailTo('couple6@e2e.test');
    assert.equal(confirmation.length, 1);
    assert.match(confirmation[0].html, /could not reach a vendor for Tampa, Florida automatically/);
    assert.doesNotMatch(confirmation[0].html, /sent your request to/);
  });

  await test('a mail provider that never answers cannot hold up the request or the owner alert', async () => {
    // Near Films has no stamp (the failed send above), so it is tried again.
    g.__E2E_HANG_TO__ = new Set(['hello@nearfilms.test']);
    clearSent();
    const started = Date.now();
    try {
      const res = await leads.POST(post('/api/leads', couple(11), '10.1.0.11'));
      assert.equal(res.status, 200);
    } finally {
      g.__E2E_HANG_TO__ = undefined;
    }
    assert.ok(Date.now() - started < 5000, 'gave up on the stalled send and carried on');
    const alert = mailTo('owner@e2e.test');
    assert.equal(alert.length, 1, 'the owner alert still goes out, after the stalled send');
    assert.match(alert[0].html, /The teaser to hello@nearfilms\.test did not send/);
    assert.equal(mailTo('couple11@e2e.test').length, 1, 'and so does the couple’s confirmation');
  });

  await test('real addresses and odd input are accepted; nothing typed into the form can break the request', async () => {
    clearSent();
    // An apostrophe is a normal part of an address.
    const obrien = await leads.POST(post('/api/leads', { ...couple(12), email: "mary.o'brien@e2e.test", venue_city: '', venue_state: 'Alaska' }, '10.1.0.12'));
    assert.equal(obrien.status, 200);
    assert.equal(mailTo("mary.o'brien@e2e.test").length, 1);
    // A date that does not exist is dropped, not allowed to fail the insert.
    const badDate = await leads.POST(post('/api/leads', { ...couple(13), wedding_date: '2026-02-30', guest_count: 'lots', venue_city: '', venue_state: 'Alaska' }, '10.1.0.13'));
    assert.equal(badDate.status, 200);
    const row = (await must(db.from('leads').select('wedding_date, guest_count').eq('email', 'couple13@e2e.test').single())) as any;
    assert.equal(row.wedding_date, null);
    assert.equal(row.guest_count, null);
    // An "address" built to smuggle a cc into a mailto link is refused.
    const smuggle = await leads.POST(post('/api/leads', { ...couple(14), email: 'a@b.co?cc=victim@x.test' }, '10.1.0.14'));
    assert.equal(smuggle.status, 400);
    // Names with markup characters reach the owner alert escaped in the body and plain in the subject.
    clearSent();
    await leads.POST(post('/api/leads', { ...couple(15), name: 'Tom & Anna <b>O\'Neil</b>', venue_city: '', venue_state: 'Alaska' }, '10.1.0.15'));
    const alert = mailTo('owner@e2e.test')[0];
    assert.match(alert.subject, /^New lead: Tom & Anna <b>O'Neil<\/b> \(Alaska\)/);
    assert.match(alert.html, /Tom &amp; Anna &lt;b&gt;O&#39;Neil&lt;\/b&gt;/);
    assert.doesNotMatch(alert.html, /<b>O'Neil<\/b>/);
    const confirmation = mailTo('couple15@e2e.test')[0];
    assert.match(confirmation.html, /Thanks, Tom &amp; Anna &lt;b&gt;/);
  });

  await test('a rate-limit answer from the mail provider is retried, not dropped', async () => {
    const { sendEmail } = await import('../../src/lib/email');
    clearSent();
    g.__E2E_RATE_LIMITED__ = 0;
    g.__E2E_RATE_LIMIT_ONCE__ = true;
    const started = Date.now();
    const ok = await sendEmail({ to: 'retry@e2e.test', subject: 'retry', html: '<p>x</p>' });
    assert.equal(ok, true);
    assert.equal(g.__E2E_RATE_LIMITED__, 1);
    assert.equal(mailTo('retry@e2e.test').length, 1);
    assert.ok(Date.now() - started >= 1000, 'waited out the window before retrying');

    // Templates are handed HTML-escaped values; a subject line is plain text.
    clearSent();
    await sendEmail({ to: 'subject@e2e.test', subject: 'New quote request: Tom &amp; Anna, Coeur d&#39;Alene', html: '<p>x</p>' });
    assert.equal(mailTo('subject@e2e.test')[0].subject, "New quote request: Tom & Anna, Coeur d'Alene");
  });

  // ---------------------------------------------------------- durable limits
  await test('one address gets at most five confirmations a day, however it is typed and however many forms are sent', async () => {
    clearSent();
    const typed = ['couple7@e2e.test', 'Couple7@e2e.test', 'COUPLE7@E2E.TEST', 'couple7@E2E.test', 'couple7@e2e.test', 'Couple7@E2E.test', 'couple7@e2e.test'];
    for (const [i, email] of typed.entries()) {
      // A state with no vendors, so these requests do not touch the vendors other tests use.
      const res = await leads.POST(post('/api/leads', { ...couple(7), email, venue_city: '', venue_state: 'Alaska', name: `Repeat ${i}` }, `10.6.0.${i + 1}`));
      assert.equal(res.status, 200);
    }
    const confirmations = sent().filter((m) => typeof m.to === 'string' && m.to.toLowerCase() === 'couple7@e2e.test');
    assert.equal(confirmations.length, 5);
    const rows = (await must(db.from('leads').select('id').ilike('email', 'couple7@e2e.test'))) as any[];
    assert.equal(rows.length, 7, 'every request is still saved');
    // The log holds a hash, never the address.
    const logged = (await must(db.from('email_send_log').select('subject_key').eq('kind', 'lead_confirmation'))) as any[];
    assert.ok(logged.length >= 7);
    assert.ok(logged.every((r) => /^[0-9a-f]{32}$/.test(r.subject_key)), 'addresses are stored hashed');
  });

  await test('the per-address limit cannot be sidestepped with +tags or Gmail dots, and the owner is told who got no confirmation', async () => {
    const startedAt = new Date().toISOString();
    clearSent();
    const typed = ['plus.test@gmail.com', 'plus.test+1@gmail.com', 'plustest+venue@gmail.com', 'p.l.u.s.test@googlemail.com', 'PlusTest+2@Gmail.com', 'plustest+3@gmail.com', 'plus.test+4@gmail.com'];
    for (const [i, email] of typed.entries()) {
      const res = await leads.POST(post('/api/leads', { ...couple(20), email, venue_city: '', venue_state: 'Alaska', name: `Tagged ${i}` }, `10.6.1.${i + 1}`));
      assert.equal(res.status, 200);
    }
    const confirmations = sent().filter((m) => typeof m.to === 'string' && /@(gmail|googlemail)\.com$/i.test(m.to));
    assert.equal(confirmations.length, 5, 'seven spellings of one mailbox, five confirmations');
    const alerts = mailTo('owner@e2e.test');
    assert.equal(alerts.length, 7);
    assert.equal(alerts.filter((m) => /No confirmation email went to the couple this time: that address has already been sent 5 today/.test(m.html)).length, 2);
    // Keep the hour's request count where the flood test below expects it.
    await must(db.from('leads').delete().like('name', 'Tagged %'));
    await must(db.from('email_send_log').delete().eq('kind', 'lead_request').gte('created_at', startedAt));
  });

  await test('one visitor cannot use up the site-wide allowance: a durable per-visitor limit comes first', async () => {
    const { visitorKey } = await import('../../src/lib/send-limits');
    const ip = '10.6.2.1';
    const startedAt = new Date().toISOString();
    const requestsLogged = async () => ((await must(db.from('email_send_log').select('id').eq('kind', 'lead_request'))) as any[]).length;
    // Ten requests from this visitor in the last hour are already in the log
    // (handled by other server instances, say, which the in-memory limiter
    // on this one never saw).
    await must(db.from('email_send_log').insert(Array.from({ length: 10 }, () => ({ kind: 'lead_visitor', subject_key: visitorKey(ip) }))));
    const before = await requestsLogged();
    clearSent();
    const res = await leads.POST(post('/api/leads', { ...couple(21), venue_city: '', venue_state: 'Alaska' }, ip));
    assert.equal(res.status, 429);
    assert.equal(((await must(db.from('leads').select('id').eq('email', 'couple21@e2e.test'))) as any[]).length, 0, 'not saved');
    assert.equal(sent().length, 0, 'nobody emailed');
    assert.equal(await requestsLogged(), before, 'and not counted toward the site-wide limit');

    // Someone else is unaffected.
    const other = await leads.POST(post('/api/leads', { ...couple(21), venue_city: '', venue_state: 'Alaska' }, '10.6.2.2'));
    assert.equal(other.status, 200);

    // What is stored is not the address, and is different every day.
    const logged = (await must(db.from('email_send_log').select('subject_key').eq('kind', 'lead_visitor'))) as any[];
    assert.ok(logged.length >= 12);
    assert.ok(logged.every((r) => /^[0-9a-f]{32}$/.test(r.subject_key) && !r.subject_key.includes('10.6')));
    assert.notEqual(visitorKey(ip, new Date('2026-10-01T12:00:00Z')), visitorKey(ip, new Date('2026-10-02T12:00:00Z')));
    assert.notEqual(visitorKey(ip), visitorKey('10.6.2.2'));

    await must(db.from('leads').delete().eq('email', 'couple21@e2e.test'));
    await must(db.from('email_send_log').delete().eq('kind', 'lead_request').gte('created_at', startedAt));
  });

  await test('a slow mail provider cannot make the couple wait out every send in turn: the vendor and couple emails share one time budget', async () => {
    const startedAt = new Date().toISOString();
    const stamps = (await must(db.from('vendor_private_contacts').select('vendor_id, last_lead_notified_at').in('vendor_id', [V.near.id, V.far.id]))) as any[];
    await must(db.from('vendor_private_contacts').update({ last_lead_notified_at: null }).in('vendor_id', [V.near.id, V.far.id]));
    // Everyone but the owner hangs. A single send gives up after 0.7 seconds
    // (set at the top of this file). The phase is given 3.5 seconds here, and a
    // send is only started with at least 3 seconds left: so the first is tried,
    // and what follows is skipped rather than begun with no time to finish.
    process.env.LEAD_EMAIL_BUDGET_MS = '3500';
    g.__E2E_HANG_TO__ = new Set(['hello@nearfilms.test', 'team@faraway.test', 'couple22@e2e.test']);
    clearSent();
    const started = Date.now();
    let res: Response;
    try {
      res = await leads.POST(post('/api/leads', { ...couple(22), source_listing_id: L(V.far) }, '10.1.0.22'));
    } finally {
      delete process.env.LEAD_EMAIL_BUDGET_MS;
      g.__E2E_HANG_TO__ = undefined;
    }
    try {
      assert.equal(res.status, 200, 'the couple is told it worked, because the request is saved');
      assert.ok(Date.now() - started < 3000, `did not wait out every stalled send in turn (${Date.now() - started} ms)`);
      const alert = mailTo('owner@e2e.test');
      assert.equal(alert.length, 1, 'the owner alert still goes out');
      assert.match(alert[0].html, /The teaser to team@faraway\.test did not send/, 'the first send was tried and gave up');
      assert.match(alert[0].html, /Near Films<\/strong>: unclaimed\. <strong>No teaser sent, because the mail provider was too slow to answer/, 'the next was skipped, and said so');
      assert.match(alert[0].html, /The confirmation email to the couple did not send/);
      assert.doesNotMatch(alert[0].html, /The confirmation they received says/, 'no claim about an email that never went');
      assert.equal(mailTo('couple22@e2e.test').length, 0);
      assert.equal(((await must(db.from('leads').select('id').eq('email', 'couple22@e2e.test'))) as any[]).length, 1, 'saved');
      const after = (await must(db.from('vendor_private_contacts').select('last_lead_notified_at').in('vendor_id', [V.near.id, V.far.id]))) as any[];
      assert.ok(after.every((r) => r.last_lead_notified_at === null), 'nobody is marked as told, so the next request tries them again');
    } finally {
      for (const s of stamps) {
        await must(db.from('vendor_private_contacts').update({ last_lead_notified_at: s.last_lead_notified_at }).eq('vendor_id', s.vendor_id));
      }
      await must(db.from('leads').delete().eq('email', 'couple22@e2e.test'));
      await must(db.from('email_send_log').delete().eq('kind', 'lead_request').gte('created_at', startedAt));
    }
  });

  await test('a flood of requests is saved but stops all email, and the owner is told once', async () => {
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const existing = ((await must(db.from('email_send_log').select('id').eq('kind', 'lead_request').gte('created_at', hourAgo))) as any[]).length;
    assert.ok(existing < 30, `the suite stays under the flood limit on its own (${existing})`);
    await must(db.from('email_send_log').insert(
      Array.from({ length: 30 - existing }, () => ({ kind: 'lead_request', subject_key: 'filler' }))
    ));

    clearSent();
    assert.equal((await leads.POST(post('/api/leads', { ...couple(8), source_listing_id: L(V.far) }, '10.7.0.1'))).status, 200);
    assert.equal(mailTo('couple8@e2e.test').length, 0, 'no confirmation');
    assert.equal(mailTo('team@faraway.test').length, 0, 'no vendor email');
    const paused = mailTo('owner@e2e.test');
    assert.equal(paused.length, 1);
    assert.match(paused[0].subject, /Quote form paused its emails: more than 30 requests in the last hour/);

    clearSent();
    assert.equal((await leads.POST(post('/api/leads', couple(9), '10.7.0.2'))).status, 200);
    assert.equal(sent().length, 0, 'the next request during the flood sends nothing at all');
    const saved = (await must(db.from('leads').select('email').in('email', ['couple8@e2e.test', 'couple9@e2e.test']))) as any[];
    assert.equal(saved.length, 2, 'both are still saved for the owner to review');

    // Put the hour back the way it was for the tests that follow.
    await must(db.from('email_send_log').delete().eq('subject_key', 'filler'));
    await must(db.from('email_send_log').delete().eq('kind', 'flood_alert'));
    await must(db.from('leads').delete().in('email', ['couple8@e2e.test', 'couple9@e2e.test']));
  });

  await test('nobody outside the server can trip the limits: forged rows are ignored and the log is closed', async () => {
    const anon = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    // The public API still accepts lead rows directly, with any date on them.
    const { error: forgeErr } = await anon.from('leads').insert(
      Array.from({ length: 40 }, (_, i) => ({ name: `Forged ${i}`, email: 'couple10@e2e.test', venue_state: 'Alaska', created_at: '2099-01-01T00:00:00Z' }))
    );
    assert.equal(forgeErr, null, 'this is the hole the limits must not depend on');
    const { error: subErr } = await anon.from('subscribers').insert(
      Array.from({ length: 30 }, (_, i) => ({ email: `forged${i}@flood.test`, created_at: '2099-01-01T00:00:00Z' }))
    );
    assert.equal(subErr, null);

    try {
    // The send log itself is out of reach.
    const { error: logWrite } = await anon.from('email_send_log').insert({ kind: 'lead_request', subject_key: null });
    assert.ok(logWrite, 'the public API cannot write the send log');
    const { data: logRead } = await anon.from('email_send_log').select('id').limit(1);
    assert.deepEqual(logRead ?? [], [], 'or read it');

    // Forty forged leads, five of them would have been "this address today". A real request still gets its emails.
    clearSent();
    assert.equal((await leads.POST(post('/api/leads', { ...couple(10), venue_city: '', venue_state: 'Alaska' }, '10.7.1.1'))).status, 200);
    assert.equal(mailTo('couple10@e2e.test').length, 1, 'the couple still gets a confirmation');
    assert.equal(mailTo('owner@e2e.test').length, 1, 'and the owner still gets the alert');
    assert.doesNotMatch(mailTo('owner@e2e.test')[0].subject, /paused/);

    // And the newsletter welcome is not switched off by forged subscribers.
    clearSent();
    assert.equal((await subscribe.POST(post('/api/subscribe', { email: 'realsub@e2e.test', source: 'footer' }, '10.7.1.2'))).status, 200);
    assert.equal(mailTo('realsub@e2e.test').length, 1);
    } finally {
      await must(db.from('leads').delete().like('name', 'Forged %'));
      await must(db.from('subscribers').delete().like('email', '%@flood.test'));
      await must(db.from('subscribers').delete().eq('email', 'realsub@e2e.test'));
    }
  });

  // -------------------------------------------------------------- unsubscribe
  const unsub = await import('../../src/app/api/lead-notify/unsubscribe/route');
  const { UNSIGNED_UNSUBSCRIBE_ACCEPTED_UNTIL } = await import('../../src/lib/unsubscribe-link');
  const optedOut = async (id: string) =>
    ((await must(db.from('vendor_private_contacts').select('opt_out').eq('vendor_id', id).single())) as any).opt_out as boolean;

  await test('opening the unsubscribe link changes nothing; pressing the button does', async () => {
    assert.equal(await optedOut(V.near.id), false);

    // What a mail security scanner does before a person ever sees the email.
    const page = await unsub.GET(new Request(nearUnsubscribeUrl));
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Stop quote request emails\?/);
    assert.match(html, /<form method="post"/);
    assert.equal(await optedOut(V.near.id), false, 'a scanner opening the link does not opt the vendor out');

    // A forged signature gets nowhere, by GET or by POST.
    const forged = nearUnsubscribeUrl.replace(/s=[^&]+/, 's=' + 'A'.repeat(43));
    const forgedGet = await unsub.GET(new Request(forged));
    assert.equal(forgedGet.status, 404);
    assert.match(await forgedGet.text(), /no longer valid/);
    assert.equal((await unsub.POST(new Request(forged, { method: 'POST', headers: { 'x-forwarded-for': '10.8.0.1' } }))).status, 400);
    assert.equal(await optedOut(V.near.id), false);

    // One vendor's signature does not work for another vendor's id.
    const swapped = nearUnsubscribeUrl.replace(V.near.id, V.far.id);
    assert.equal((await unsub.POST(new Request(swapped, { method: 'POST', headers: { 'x-forwarded-for': '10.8.0.1' } }))).status, 400);
    assert.equal(await optedOut(V.far.id), false);

    // The button on the page: an ordinary form post.
    const u = new URL(nearUnsubscribeUrl);
    const res = await unsub.POST(
      new Request('http://localhost/api/lead-notify/unsubscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '10.8.0.2' },
        body: new URLSearchParams({ v: u.searchParams.get('v')!, s: u.searchParams.get('s')! }).toString(),
      })
    );
    assert.equal(res.status, 200);
    assert.match(await res.text(), /won&rsquo;t receive any more quote request emails/);
    assert.equal(await optedOut(V.near.id), true);
    await must(db.from('vendor_private_contacts').update({ opt_out: false }).eq('vendor_id', V.near.id));
  });

  await test('a mail client’s one-click unsubscribe works; old unsigned links only for vendors last emailed before signing', async () => {
    const { endOfReleaseDayMs, unsignedLinksSentBeforeMs } = await import('../../src/lib/release');
    // RFC 8058: the client POSTs "List-Unsubscribe=One-Click" to the link itself.
    const oneClick = await unsub.POST(
      new Request(nearUnsubscribeUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '10.8.0.3' },
        body: 'List-Unsubscribe=One-Click',
      })
    );
    assert.equal(oneClick.status, 200);
    assert.equal(await optedOut(V.near.id), true);
    await must(db.from('vendor_private_contacts').update({ opt_out: false }).eq('vendor_id', V.near.id));

    const bare = (id: string, ip: string) =>
      unsub.POST(new Request(`http://localhost/api/lead-notify/unsubscribe?v=${id}`, { method: 'POST', headers: { 'x-forwarded-for': ip } }));
    const stamp = (id: string, iso: string | null) =>
      must(db.from('vendor_private_contacts').update({ last_lead_notified_at: iso }).eq('vendor_id', id));
    const inGrace = Date.now() < UNSIGNED_UNSUBSCRIBE_ACCEPTED_UNTIL;
    const farStamp = ((await must(db.from('vendor_private_contacts').select('last_lead_notified_at').eq('vendor_id', V.far.id).single())) as any).last_lead_notified_at;

    // Never emailed: a bare id for this vendor cannot be from one of our emails.
    const never = await bare(V.form.id, '10.8.0.4');
    assert.equal(never.status, inGrace ? 404 : 400);
    assert.equal(await optedOut(V.form.id), false);

    // Last emailed well AFTER links were signed: that email carries a signed link, so a bare id is not from us either.
    await stamp(V.far.id, new Date(unsignedLinksSentBeforeMs() + 5 * 86_400_000).toISOString());
    const afterSigning = await bare(V.far.id, '10.8.0.5');
    assert.equal(afterSigning.status, inGrace ? 404 : 400, 'told plainly that nothing happened');
    assert.equal(await optedOut(V.far.id), false);

    // Last emailed BEFORE links were signed: the old-style link in that email is honoured until the grace period ends.
    await stamp(V.far.id, new Date(endOfReleaseDayMs() - 10 * 86_400_000).toISOString());
    await bare(V.far.id, '10.8.0.6');
    assert.equal(await optedOut(V.far.id), inGrace);

    // Emailed a few days after the date in release.ts (a deploy that slipped, with
    // the old code still sending unsigned links): that vendor can still opt out.
    await must(db.from('vendor_private_contacts').update({ opt_out: false }).eq('vendor_id', V.far.id));
    await stamp(V.far.id, new Date(endOfReleaseDayMs() + 3 * 86_400_000).toISOString());
    await bare(V.far.id, '10.8.0.7');
    assert.equal(await optedOut(V.far.id), inGrace, 'a week of slack past the release day');

    await must(db.from('vendor_private_contacts').update({ opt_out: false, last_lead_notified_at: farStamp }).eq('vendor_id', V.far.id));
  });

  // ---------------------------------------------------------- account matching
  await test('signing in never adopts another person’s older account through a look-alike address', async () => {
    await must(db.from('profiles').insert([
      { id: 'eeeeeeee-0000-4000-8000-000000000001', email: 'jxdoe@e2e.test', role: 'admin', clerk_user_id: null },
      { id: 'eeeeeeee-0000-4000-8000-000000000002', email: 'Mixed.Case@E2E.test', role: 'vendor', clerk_user_id: null },
    ]));
    const { ensureProfile } = await import('../../src/lib/auth');

    // In a LIKE pattern "_" matches any one character, "%" any run of them,
    // and PostgREST adds "*". None of them may reach across to another address.
    for (const [id, email] of [
      ['user_underscore', 'j_doe@e2e.test'],
      ['user_percent', '%@e2e.test'],
      ['user_star', '*doe@e2e.test'],
      ['user_prefix', 'jxdoe@e2e.tes%'],
    ] as const) {
      signInAs({ id, email });
      const profile = (await ensureProfile())!;
      assert.ok(profile, email);
      assert.notEqual(profile.id, 'eeeeeeee-0000-4000-8000-000000000001', email);
      assert.equal(profile.role, 'couple', `${email} gets a new account, not the old admin one`);
    }
    const untouched = (await must(db.from('profiles').select('clerk_user_id').eq('id', 'eeeeeeee-0000-4000-8000-000000000001').single())) as any;
    assert.equal(untouched.clerk_user_id, null);

    // The same address in a different case is the same person, and is adopted.
    signInAs({ id: 'user_mixed', email: 'mixed.case@e2e.test' });
    const adopted = (await ensureProfile())!;
    assert.equal(adopted.id, 'eeeeeeee-0000-4000-8000-000000000002');
    assert.equal(adopted.role, 'vendor');
    signInAs(null);
  });

  // ----------------------------------------------------------- instant claim
  const farToken = () => new URL(farClaimUrl).searchParams.get('t')!;
  const nearToken = () => new URL(nearClaimUrl).searchParams.get('t')!;

  await test('instant claim needs a signed-in user', async () => {
    signInAs(null);
    const res = await instant.POST(post('/api/claims/instant', { listing_id: L(V.far), token: farToken() }, '10.2.0.1'));
    assert.equal(res.status, 401);
  });

  await test('a token minted for one vendor cannot claim another', async () => {
    signInAs(OTHER);
    const res = await instant.POST(post('/api/claims/instant', { listing_id: L(V.far), token: nearToken() }, '10.2.0.2'));
    assert.equal(res.status, 403);
    assert.equal((await res.json()).fallback, true);
    const vendor = (await must(db.from('vendors').select('user_id').eq('id', V.far.id).single())) as any;
    assert.equal(vendor.user_id, null);
  });

  await test('vendor claims through the emailed link and is approved on the spot', async () => {
    clearSent();
    signInAs(CLAIMANT);
    const res = await instant.POST(post('/api/claims/instant', { listing_id: L(V.far), token: farToken() }, '10.2.0.3'));
    const body = await res.json();
    assert.equal(res.status, 200, JSON.stringify(body));
    assert.equal(body.ok, true);
    assert.equal(body.waitingLeads, 1, 'the couple who asked on their profile is waiting');
    assert.equal(body.founding, 'incomplete');

    const profile = (await must(db.from('profiles').select('id, role').eq('clerk_user_id', CLAIMANT.id).single())) as any;
    assert.equal(profile.role, 'vendor');
    const vendor = (await must(db.from('vendors').select('user_id, claimed_at').eq('id', V.far.id).single())) as any;
    assert.equal(vendor.user_id, profile.id);
    assert.ok(vendor.claimed_at);
    const claim = (await must(db.from('claim_requests').select('status, details').eq('user_id', profile.id))) as any[];
    assert.equal(claim.length, 1);
    assert.equal(claim[0].status, 'approved');
    assert.match(claim[0].details, /Approved automatically/);

    const approval = mailTo(CLAIMANT.email).find((m) => /claim is approved/.test(m.subject));
    assert.ok(approval, 'claimant is told');
    assert.match(approval!.html, /You have 1 quote request waiting/);
    assert.equal(approval!.replyTo, 'owner@e2e.test', '"just reply to this email" has somewhere to go');
    assert.match(approval!.html, /add your starting price and a cover photo/);
    const fyi = mailTo('owner@e2e.test').find((m) => /Profile claimed instantly: Far & Away Media/.test(m.subject));
    assert.ok(fyi, 'owner gets an FYI');
    assert.match(fyi!.html, /Address on file for this business:<\/strong> team@faraway\.test \(the same address the claimant signed up with\)/);
  });

  await test('the new owner can now read the couple who was waiting (RLS, their own identity)', async () => {
    const asVendor = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      accessToken: async () => jwt({ sub: CLAIMANT.id, role: 'authenticated' }),
      auth: { persistSession: false },
    });
    const { data } = await asVendor.from('leads').select('name, email, phone').contains('matched_vendor_ids', [V.far.id]);
    assert.deepEqual(data, [{ name: 'Couple 2', email: 'couple2@e2e.test', phone: '555-000-0000' }]);
  });

  await test('the same link cannot be used twice, or by anyone else', async () => {
    signInAs(OTHER);
    const res = await instant.POST(post('/api/claims/instant', { listing_id: L(V.far), token: farToken() }, '10.2.0.4'));
    assert.equal(res.status, 409);
    const vendor = (await must(db.from('vendors').select('user_id').eq('id', V.far.id).single())) as any;
    const claimant = (await must(db.from('profiles').select('id').eq('clerk_user_id', CLAIMANT.id).single())) as any;
    assert.equal(vendor.user_id, claimant.id, 'ownership did not move');
  });

  await test('an account that already manages a business cannot claim a second one, by link or by form', async () => {
    signInAs(CLAIMANT);
    const res = await instant.POST(post('/api/claims/instant', { listing_id: L(V.near), token: nearToken() }, '10.2.0.5'));
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.fallback, undefined, 'the manual form is not offered: that path is closed too');
    assert.match(body.error, /already manages Far & Away Media/);

    const manual = await claims.POST(post('/api/claims', { listing_id: L(V.near), business_email: 'x@y.test', proof: 'mine too' }, '10.2.0.6'));
    assert.equal(manual.status, 409);
    assert.match((await manual.json()).error, /already manages Far & Away Media/);
    assert.equal(((await must(db.from('claim_requests').select('id').eq('listing_id', L(V.near)))) as any[]).length, 0, 'nothing was queued');

    const vendor = (await must(db.from('vendors').select('user_id').eq('id', V.near.id).single())) as any;
    assert.equal(vendor.user_id, null);
  });

  await test('a claim queued earlier by such an account cannot be approved into a two-business account', async () => {
    const claimant = (await must(db.from('profiles').select('id').eq('clerk_user_id', CLAIMANT.id).single())) as any;
    const queued = (await must(
      db.from('claim_requests').insert({ listing_id: L(V.near), user_id: claimant.id, details: 'filed before the rule', status: 'pending' }).select('id').single()
    )) as any;
    signInAs(ADMIN);
    const res = await adminClaims.PATCH(
      new Request('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }),
      { params: Promise.resolve({ id: queued.id }) }
    );
    assert.equal(res.status, 409);
    assert.match((await res.json()).error, /already manages Far & Away Media/);
    assert.equal(((await must(db.from('vendors').select('user_id').eq('id', V.near.id).single())) as any).user_id, null);
    await must(db.from('claim_requests').delete().eq('id', queued.id));
  });

  await test('tapping the claim button twice is a success the second time, not an error', async () => {
    signInAs(CLAIMANT);
    const res = await instant.POST(post('/api/claims/instant', { listing_id: L(V.far), token: farToken() }, '10.2.0.7'));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.already, true);
    assert.equal(body.waitingLeads, 1);
  });

  await test('an account left with an empty vendor row by an interrupted sign-up can still claim its real profile', async () => {
    const { signClaimToken } = await import('../../src/lib/claim-link');
    const { ensureProfile } = await import('../../src/lib/auth');
    // A profile nobody owns yet, standing in for this vendor's real business.
    await must(db.from('vendors').insert({ id: 'aaaaaaaa-0000-4000-8000-0000000000f1', user_id: null, business_name: 'Spare Films', slug: 'spare-films', source: 'seeded' }));
    await must(db.from('listings').insert({
      id: 'bbbbbbbb-0000-4000-8000-0000000000f1', vendor_id: 'aaaaaaaa-0000-4000-8000-0000000000f1', title: 'Spare Films', slug: 'spare-films',
      description: 'Seeded profile.', city: 'Miami', state: 'Florida', lat: 25.76, lng: -80.19, status: 'approved', tier: 'basic', service_radius_miles: 60,
    }));
    const token = signClaimToken('aaaaaaaa-0000-4000-8000-0000000000f1')!;

    // The account: its submit-listing attempt wrote the vendor row and then failed.
    signInAs({ id: 'user_empty', email: 'empty@vendor.test' });
    const profile = (await ensureProfile())!;
    await must(db.from('vendors').insert({ user_id: profile.id, business_name: 'Spare Films', slug: 'spare-films-2' }));

    const res = await instant.POST(post('/api/claims/instant', { listing_id: 'bbbbbbbb-0000-4000-8000-0000000000f1', token }, '10.2.2.1'));
    const body = await res.json();
    assert.equal(res.status, 200, JSON.stringify(body));
    const owned = (await must(db.from('vendors').select('slug').eq('user_id', profile.id))) as any[];
    assert.deepEqual(owned.map((v) => v.slug), ['spare-films'], 'owns the real profile, and the empty leftover row is gone');

    // The link has now been used. If the owner undoes the claim (wrong person),
    // the same link must not hand the profile straight back to anyone.
    await must(db.from('vendors').update({ user_id: null, claimed_at: null }).eq('id', 'aaaaaaaa-0000-4000-8000-0000000000f1'));
    signInAs({ id: 'user_second', email: 'second@vendor.test' });
    const again = await instant.POST(post('/api/claims/instant', { listing_id: 'bbbbbbbb-0000-4000-8000-0000000000f1', token }, '10.2.2.2'));
    assert.equal(again.status, 403);
    const againBody = await again.json();
    assert.equal(againBody.fallback, true, 'sent to the manual form, where a person decides');
    assert.match(againBody.error, /claimed before/);
    assert.equal(((await must(db.from('vendors').select('user_id').eq('id', 'aaaaaaaa-0000-4000-8000-0000000000f1').single())) as any).user_id, null);

    // The cleanup helper deletes a vendor row only when it is certain nothing
    // is under it (deleting a vendor deletes its listings), whatever it is handed.
    const { deleteEmptyVendorRows } = await import('../../src/lib/data/my-vendor');
    const second = (await must(db.from('profiles').select('id').eq('clerk_user_id', 'user_second').single())) as any;
    const leftover = (await must(db.from('vendors').insert({ user_id: second.id, business_name: 'Leftover', slug: 'leftover-row' }).select('id').single())) as any;
    await must(db.from('vendors').update({ user_id: second.id }).eq('id', 'aaaaaaaa-0000-4000-8000-0000000000f1'));
    const rowsOf = async (ids: string[]) => ((await must(db.from('vendors').select('id').in('id', ids))) as any[]).length;
    await deleteEmptyVendorRows(second.id, [leftover.id, 'aaaaaaaa-0000-4000-8000-0000000000f1']);
    assert.equal(await rowsOf([leftover.id, 'aaaaaaaa-0000-4000-8000-0000000000f1']), 2, 'a list that includes a vendor with a listing deletes nothing');
    assert.equal(((await must(db.from('listings').select('id').eq('id', 'bbbbbbbb-0000-4000-8000-0000000000f1'))) as any[]).length, 1, 'and its listing is still there');
    await deleteEmptyVendorRows(profile.id, [leftover.id]);
    assert.equal(await rowsOf([leftover.id]), 1, 'never another account’s row');
    // A row with no listing can still have a subscription record or a message
    // under it. Deleting the row would delete those too, so it stays.
    await must(db.from('subscriptions').insert({ vendor_id: leftover.id, processor: 'stripe', external_id: 'sub_leftover', plan: 'monthly', status: 'active' }));
    await deleteEmptyVendorRows(second.id, [leftover.id]);
    assert.equal(await rowsOf([leftover.id]), 1, 'a row with a subscription on record is kept, or Stripe would go on charging unseen');
    await must(db.from('subscriptions').delete().eq('vendor_id', leftover.id));
    await must(db.from('messages').insert({ from_user_id: profile.id, to_vendor_id: leftover.id, sender_email: 'someone@couple.test', sender_name: 'Someone', body: 'Are you free in June?' }));
    await deleteEmptyVendorRows(second.id, [leftover.id]);
    assert.equal(await rowsOf([leftover.id]), 1, 'and so is a row a couple has written to');
    await must(db.from('messages').delete().eq('to_vendor_id', leftover.id));
    await deleteEmptyVendorRows(second.id, [leftover.id]);
    assert.equal(await rowsOf([leftover.id]), 0, 'an empty row on the right account is removed');

    // Keep the directory as the page tests expect it.
    await must(db.from('vendors').delete().eq('id', 'aaaaaaaa-0000-4000-8000-0000000000f1'));
    signInAs(null);
  });

  // ---------------------------------------------------------- founding offer
  await test('founding offer: nothing until the listing has a price and a photo', async () => {
    signInAs(CLAIMANT);
    const res = await founding.POST();
    const body = await res.json();
    assert.equal(body.granted, false);
    assert.equal(body.state, 'incomplete');
    assert.deepEqual(body.missing.sort(), ['photo', 'price']);
  });

  await test('a vendor cannot make themselves Featured from the browser', async () => {
    const asVendor = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      accessToken: async () => jwt({ sub: CLAIMANT.id, role: 'authenticated' }),
      auth: { persistSession: false },
    });
    // What the edit form sends, plus the columns a vendor has no business setting.
    const { error } = await asVendor
      .from('listings')
      .update({ starting_price_cents: 95000, hero_image_url: 'https://cdn.test/hero.jpg', tier: 'featured', featured_until: null, status: 'approved', view_count: 4000 })
      .eq('id', L(V.far));
    assert.equal(error, null);
    const row = (await must(db.from('listings').select('tier, featured_until, view_count, starting_price_cents, hero_image_url').eq('id', L(V.far)).single())) as any;
    assert.equal(row.tier, 'basic', 'tier ignored');
    assert.equal(row.view_count, 0, 'counter ignored');
    assert.equal(row.starting_price_cents, 95000, 'real edits saved');
    assert.equal(row.hero_image_url, 'https://cdn.test/hero.jpg');
  });

  let foundingUntil = '';
  await test('founding offer: granted once the listing is complete, for six months', async () => {
    signInAs(CLAIMANT);
    const body = await (await founding.POST()).json();
    assert.equal(body.granted, true);
    assert.equal(body.state, 'active');
    foundingUntil = body.until;
    const months = (new Date(body.until).getTime() - Date.now()) / (30.44 * 86_400_000);
    assert.ok(months > 5.8 && months < 6.2, `runs ~6 months, got ${months.toFixed(2)}`);
    const row = (await must(db.from('listings').select('tier, featured_until').eq('id', L(V.far)).single())) as any;
    assert.equal(row.tier, 'featured');
  });

  await test('founding offer: asking again never extends it', async () => {
    signInAs(CLAIMANT);
    const body = await (await founding.POST()).json();
    assert.equal(body.granted, false);
    assert.equal(body.state, 'active');
    // Same instant; the database returns it as +00:00 rather than Z.
    assert.equal(new Date(body.until).getTime(), new Date(foundingUntil).getTime());
  });

  await test('the founding record is out of the vendor’s reach', async () => {
    const asVendor = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      accessToken: async () => jwt({ sub: CLAIMANT.id, role: 'authenticated' }),
      auth: { persistSession: false },
    });
    const before = (await must(db.from('profiles').select('id, founding_granted_at').eq('clerk_user_id', CLAIMANT.id).single())) as any;
    assert.ok(before.founding_granted_at, 'the grant is recorded on the account');

    const { error: updErr } = await asVendor.from('profiles').update({ founding_granted_at: null }).eq('id', before.id);
    assert.ok(updErr, 'a signed-in user has no permission to write that column');
    const { error: rpcErr } = await asVendor.rpc('grant_founding_vendor', { p_vendor_id: V.far.id, p_months: 24 });
    assert.ok(rpcErr, 'and no permission to call the grant function');

    const after = (await must(db.from('profiles').select('founding_granted_at').eq('id', before.id).single())) as any;
    assert.equal(after.founding_granted_at, before.founding_granted_at);
  });

  await test('a founding vendor cannot be charged during the free period', async () => {
    const checkout = await import('../../src/app/api/checkout/stripe/route');
    signInAs(CLAIMANT);
    const res = await checkout.POST(post('/api/checkout/stripe', { plan: 'monthly' }, '10.2.1.1'));
    assert.equal(res.status, 409);
    assert.match((await res.json()).error, /already Featured free until \w+ \d+, 20\d\d\. You can subscribe once that free period has ended/);
  });

  await test('the free period is never granted twice, even after a cleanup job resets the listing', async () => {
    // What downgrade_expired_featured() (migration 0002) leaves behind: a row
    // that looks exactly like one that never had Featured.
    await must(db.from('listings').update({ tier: 'basic', featured_until: null }).eq('id', L(V.far)));
    signInAs(CLAIMANT);
    const body = await (await founding.POST()).json();
    assert.equal(body.granted, false);
    assert.equal(body.state, 'ended');
    const row = (await must(db.from('listings').select('tier, featured_until').eq('id', L(V.far)).single())) as any;
    assert.equal(row.tier, 'basic');
    assert.equal(row.featured_until, null);

    // A second listing on the same account does not earn it again either.
    const second = (await must(
      db.from('listings').insert({
        vendor_id: V.far.id, title: 'Far & Away Media Two', slug: 'far-away-media-two', description: 'Second listing.',
        city: 'Tampa', state: 'Florida', lat: 28.2, lng: -82.457, status: 'approved', tier: 'basic',
        starting_price_cents: 80000, hero_image_url: 'https://cdn.test/two.jpg', service_radius_miles: 60,
      }).select('id').single()
    )) as any;
    assert.equal((await (await founding.POST()).json()).granted, false);
    assert.equal(((await must(db.from('listings').select('tier').eq('id', second.id).single())) as any).tier, 'basic');
    await must(db.from('listings').delete().eq('id', second.id));

    // Back to the running grant for the tests that follow.
    await must(db.from('listings').update({ tier: 'featured', featured_until: foundingUntil }).eq('id', L(V.far)));
  });

  await test('a Featured, claimed vendor is matched first and gets the full lead', async () => {
    clearSent();
    signInAs(null);
    const res = await leads.POST(post('/api/leads', couple(5), '10.1.0.5'));
    assert.equal(res.status, 200);
    const row = (await must(db.from('leads').select('*').eq('email', 'couple5@e2e.test').single())) as any;
    assert.equal(row.matched_vendor_ids[0], V.far.id, 'Featured outranks nearer Basic vendors in range');

    const full = mailTo(CLAIMANT.email);
    assert.equal(full.length, 1);
    assert.match(full[0].html, /couple5@e2e\.test/);
    assert.equal(full[0].replyTo, 'couple5@e2e.test');
    assert.match(mailTo('owner@e2e.test')[0].html, /Far &amp; Away Media<\/strong>: claimed\. Full lead sent/);
  });

  await test('one claimed vendor is emailed at most five requests an hour; the rest wait in their dashboard', async () => {
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const already = ((await must(
      db.from('email_send_log').select('id').eq('kind', 'lead_vendor').eq('subject_key', V.far.id).gte('created_at', hourAgo)
    )) as any[]).length;
    clearSent();
    signInAs(null);
    const N = 7;
    for (let i = 0; i < N; i++) {
      const res = await leads.POST(post('/api/leads', { ...couple(20 + i), source_listing_id: L(V.far) }, `10.9.1.${i + 1}`));
      assert.equal(res.status, 200);
    }
    const expected = Math.max(0, Math.min(N, 5 - already));
    assert.ok(expected > 0 && expected < N, `the test crosses the limit (${already} sent earlier this hour)`);
    assert.equal(mailTo(CLAIMANT.email).length, expected, `${already} earlier this hour, so ${expected} more emails`);
    const lastAlert = mailTo('owner@e2e.test').at(-1)!;
    assert.match(lastAlert.html, /Not emailed, because they were already sent 5 requests in the last hour\. It is in their dashboard/);
    const stored = (await must(db.from('leads').select('id').in('email', Array.from({ length: N }, (_, i) => `couple${20 + i}@e2e.test`)))) as any[];
    assert.equal(stored.length, N, 'every request is saved');
    // Leave the vendor with the two requests the page tests expect to see.
    await must(db.from('leads').delete().in('email', Array.from({ length: N }, (_, i) => `couple${20 + i}@e2e.test`)));
  });

  // ------------------------------------------------------- new listing flow
  let newListingId = '';
  await test('a new vendor submission alerts the owner, and only its owner can trigger that', async () => {
    clearSent();
    signInAs(NEWVENDOR);
    // The form's own sequence, under the vendor's identity: vendor row, then listing.
    const { ensureProfile } = await import('../../src/lib/auth');
    const profile = (await ensureProfile())!;
    const asVendor = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      accessToken: async () => jwt({ sub: NEWVENDOR.id, role: 'authenticated' }),
      auth: { persistSession: false },
    });
    const vendor = (await must(asVendor.from('vendors').insert({ user_id: profile.id, business_name: 'Brand New Streams', slug: 'brand-new-streams' }).select('id').single())) as any;
    const listing = (await must(asVendor.from('listings').insert({
      vendor_id: vendor.id, title: 'Brand New Streams', slug: 'brand-new-streams', description: 'We stream weddings.',
      city: 'Orlando', state: 'Florida', lat: 28.54, lng: -81.38, status: 'pending', tier: 'basic',
      starting_price_cents: 120000, hero_image_url: 'https://cdn.test/new.jpg',
    }).select('id').single())) as any;
    newListingId = listing.id;

    signInAs(OTHER);
    assert.equal((await submitted.POST(post('/api/listings/submitted', { listing_id: newListingId }, '10.3.0.1'))).status, 404);
    assert.equal(mailTo('owner@e2e.test').length, 0);

    signInAs(NEWVENDOR);
    assert.equal((await submitted.POST(post('/api/listings/submitted', { listing_id: newListingId }, '10.3.0.2'))).status, 200);
    const alert = mailTo('owner@e2e.test');
    assert.equal(alert.length, 1);
    assert.match(alert[0].subject, /New listing awaiting review: Brand New Streams \(Orlando, Florida\)/);
  });

  await test('admin approval puts it live, emails the vendor, and applies the founding offer', async () => {
    clearSent();
    signInAs(OTHER);
    const denied = await adminListings.PATCH(
      new Request('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }),
      { params: Promise.resolve({ id: newListingId }) }
    );
    assert.equal(denied.status, 403, 'non-admins cannot approve');

    signInAs(ADMIN);
    const res = await adminListings.PATCH(
      new Request('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }),
      { params: Promise.resolve({ id: newListingId }) }
    );
    assert.equal(res.status, 200);
    const row = (await must(db.from('listings').select('status, tier, featured_until').eq('id', newListingId).single())) as any;
    assert.equal(row.status, 'approved');
    assert.equal(row.tier, 'featured', 'complete listing became a founding vendor on approval');

    const live = mailTo(NEWVENDOR.email).find((m) => /Your listing is live/.test(m.subject));
    assert.ok(live);
    assert.match(live!.html, /You&rsquo;re a founding vendor/);
    assert.match(live!.html, /one of up to three vendors the request is sent to/);
    assert.doesNotMatch(live!.html, /will be matched to you/, 'no promise the matcher does not keep');
    assert.equal(live!.replyTo, 'owner@e2e.test');
  });

  // ----------------------------------------------------------------- billing
  // Real signature checking, real handler, real database. The events are the
  // shapes Stripe sends; only the signing secret is a test value.
  const webhook = await import('../../src/app/api/webhooks/stripe/route');
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const deliver = async (event: Record<string, unknown>, signed = true) => {
    const payload = JSON.stringify(event);
    const header = signed
      ? stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! })
      : 't=1,v1=bad';
    return webhook.POST(new Request('http://localhost/api/webhooks/stripe', { method: 'POST', headers: { 'stripe-signature': header }, body: payload }));
  };
  const DAY = 86_400_000;
  const daysFromNow = (iso: string) => (new Date(iso).getTime() - Date.now()) / DAY;
  const purchaseEvent = (id: string, subId: string, vendorId: string) => ({
    id, object: 'event', type: 'checkout.session.completed',
    data: { object: { id: `cs_${id}`, object: 'checkout.session', customer: 'cus_1', subscription: subId, metadata: { vendor_id: vendorId, plan: 'monthly' } } },
  });
  const subObject = (subId: string, vendorId: string, status: string, periodEndMs: number | null) => ({
    id: subId, object: 'subscription', status, customer: 'cus_1', metadata: { vendor_id: vendorId, plan: 'monthly' },
    items: { data: periodEndMs === null ? [] : [{ current_period_end: Math.floor(periodEndMs / 1000) }] },
  });
  const subEvent = (id: string, type: string, subId: string, vendorId: string, status: string, periodEndMs: number | null) => ({
    id, object: 'event', type, data: { object: subObject(subId, vendorId, status, periodEndMs) },
  });

  // "What Stripe says right now": the handler looks the subscription up at
  // Stripe on every event instead of trusting the event's own picture of it.
  // That one call is the only thing replaced here. A subscription that is not
  // in the map is one Stripe will not show us; `stripeDown` is an outage.
  const stripeLib = await import('../../src/lib/stripe');
  const stripeNow = new Map<string, Record<string, unknown>>();
  let stripeDown = false;
  let lookups = 0;
  (stripeLib.getStripe().subscriptions as any).retrieve = async (id: string) => {
    lookups += 1;
    const fail = (type: string, message: string) => Object.assign(new Error(message), { type });
    if (stripeDown) throw fail('StripeConnectionError', 'An error occurred with our connection to Stripe.');
    const sub = stripeNow.get(id);
    if (!sub) throw fail('StripeInvalidRequestError', `No such subscription: '${id}'`);
    return sub;
  };
  const stripeSays = (subId: string, vendorId: string, status: string, periodEndMs: number | null) => {
    stripeNow.set(subId, subObject(subId, vendorId, status, periodEndMs));
  };
  const optoutListing = async () => (await must(db.from('listings').select('tier, featured_until').eq('id', L(V.optout)).single())) as any;
  const subRows = async (subId: string) => (await must(db.from('subscriptions').select('status, current_period_end, vendor_id').eq('external_id', subId))) as any[];
  const forgetBilling = async (vendorId: string) => {
    await must(db.from('subscriptions').delete().eq('vendor_id', vendorId));
    await must(db.from('listings').update({ tier: 'basic', featured_until: null }).eq('vendor_id', vendorId));
  };

  await test('Stripe: purchase, renewal, failed payment and cancellation each leave the listing in the right state', async () => {
    const SUB = 'sub_e2e_1';
    const purchase = purchaseEvent('evt_purchase', SUB, V.optout.id);
    // Stripe changes the subscription, then sends the event that says so.
    const change = (id: string, status: string, endMs: number | null, type = 'customer.subscription.updated') => {
      stripeSays(SUB, V.optout.id, status, endMs);
      return subEvent(id, type, SUB, V.optout.id, status, endMs);
    };
    // An event written earlier, delivered now: Stripe's own state is not touched.
    const old = (id: string, status: string, endMs: number | null) =>
      subEvent(id, 'customer.subscription.updated', SUB, V.optout.id, status, endMs);
    const firstEnd = Date.now() + 30 * DAY;
    const nextEnd = Date.now() + 61 * DAY;

    // A request that is not from Stripe changes nothing.
    assert.equal((await deliver(purchase, false)).status, 400);
    assert.equal((await subRows(SUB)).length, 0);

    // First purchase.
    stripeSays(SUB, V.optout.id, 'active', firstEnd);
    lookups = 0;
    clearSent();
    assert.equal((await deliver(purchase)).status, 200);
    assert.equal(lookups, 1, 'the handler asked Stripe for the subscription as it is now');
    const news = mailTo('owner@e2e.test').filter((m) => /^New Featured subscriber: Opted Out Video$/.test(m.subject));
    assert.equal(news.length, 1, 'the owner is told about a new subscriber');
    assert.match(news[0].html, /\/listing\/opted-out-video/);
    assert.match(news[0].html, /sub_e2e_1/);
    assert.deepEqual((await subRows(SUB)).map((r) => r.status), ['active']);
    assert.ok(Math.abs(new Date((await subRows(SUB))[0].current_period_end).getTime() - firstEnd) < 2000, 'the paid period is on record from the start');
    let l = await optoutListing();
    assert.equal(l.tier, 'featured');
    assert.ok(daysFromNow(l.featured_until) > 32.9 && daysFromNow(l.featured_until) < 33.1, 'the paid month plus three days of grace');

    // Stripe delivers the same event twice: still one subscription, still fine, and no second announcement.
    assert.equal((await deliver(purchase)).status, 200);
    assert.equal((await subRows(SUB)).length, 1);
    assert.equal(mailTo('owner@e2e.test').filter((m) => /New Featured subscriber/.test(m.subject)).length, 1);

    // Renewal: the period moves on a month and Featured follows it.
    assert.equal((await deliver(change('evt_renew', 'active', nextEnd))).status, 200);
    l = await optoutListing();
    assert.ok(daysFromNow(l.featured_until) > 63.5 && daysFromNow(l.featured_until) < 64.5, `renewal extends Featured, got ${daysFromNow(l.featured_until).toFixed(1)} days`);
    assert.ok(Math.abs(new Date((await subRows(SUB))[0].current_period_end).getTime() - nextEnd) < 2000);

    // An older "active" event arriving late must not shorten what the newer one set, on the listing or the record.
    assert.equal((await deliver(old('evt_stale', 'active', firstEnd))).status, 200);
    assert.ok(daysFromNow((await optoutListing()).featured_until) > 63.5, 'never shortened by a stale event');
    assert.ok(Math.abs(new Date((await subRows(SUB))[0].current_period_end).getTime() - nextEnd) < 2000, 'period end only moves forward');

    // The renewal payment fails. Stripe had already moved the period a month ahead;
    // without this the vendor kept that whole unpaid month. They keep a week.
    assert.equal((await deliver(change('evt_pastdue', 'past_due', nextEnd))).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'past_due');
    l = await optoutListing();
    assert.equal(l.tier, 'featured', 'still Featured while Stripe retries the card');
    assert.ok(daysFromNow(l.featured_until) > 6.9 && daysFromNow(l.featured_until) < 7.1, `one week of grace, got ${daysFromNow(l.featured_until).toFixed(1)}`);

    // The "period moved on" event from before the failure turns up late. It says
    // "active", but Stripe says past due: the unpaid month is not handed back.
    assert.equal((await deliver(old('evt_rollover_late', 'active', nextEnd))).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'past_due', 'a late "active" picture does not undo a failed payment');
    assert.ok(daysFromNow((await optoutListing()).featured_until) < 7.1, 'and does not restore the unpaid period');

    // Two days on, Stripe retries the card and it fails again. The week is not restarted.
    await must(db.from('listings').update({ featured_until: new Date(Date.now() + 5 * DAY).toISOString() }).eq('id', L(V.optout)));
    assert.equal((await deliver(change('evt_pastdue_again', 'past_due', nextEnd))).status, 200);
    l = await optoutListing();
    assert.ok(daysFromNow(l.featured_until) > 4.9 && daysFromNow(l.featured_until) < 5.1, `the grace week is counted from the first failure, got ${daysFromNow(l.featured_until).toFixed(1)}`);

    // The card goes through on a retry: the full period comes back.
    assert.equal((await deliver(change('evt_recovered', 'active', nextEnd))).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'active');
    assert.ok(daysFromNow((await optoutListing()).featured_until) > 63.5, 'paid again, full period restored');

    // The old "payment failed" event is delivered again after that (Stripe retrying
    // it, or "Resend" in its dashboard). The vendor has paid: nothing is taken away.
    assert.equal((await deliver(old('evt_pastdue', 'past_due', nextEnd))).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'active', 'a replayed failure does not mark a paid-up vendor past due');
    assert.ok(daysFromNow((await optoutListing()).featured_until) > 63.5, 'or cut their Featured to a week');

    // "unpaid" is not a status our table knows; it used to make the whole update fail.
    assert.equal((await deliver(change('evt_unpaid', 'unpaid', nextEnd))).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'past_due');

    // Cancelled.
    assert.equal((await deliver(change('evt_deleted', 'canceled', nextEnd, 'customer.subscription.deleted'))).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'canceled');
    l = await optoutListing();
    assert.equal(l.tier, 'basic');
    assert.equal(l.featured_until, null);

    // Stripe does not promise order. A late "active" update, or a replay of the purchase, must not undo the cancellation.
    assert.equal((await deliver(old('evt_late', 'active', nextEnd))).status, 200);
    assert.equal((await deliver(purchase)).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'canceled');
    assert.equal((await optoutListing()).tier, 'basic');

    await forgetBilling(V.optout.id);
  });

  await test('Stripe: money for a vendor that does not exist is not retried for three days, and the owner is told', async () => {
    clearSent();
    stripeSays('sub_e2e_orphan', '99999999-0000-4000-8000-000000000000', 'active', Date.now() + 30 * DAY);
    // If the alert itself cannot be sent, the event is not swallowed: Stripe is asked to send it again.
    g.__E2E_FAIL_TO__ = new Set(['owner@e2e.test']);
    try {
      assert.equal((await deliver(purchaseEvent('evt_orphan', 'sub_e2e_orphan', '99999999-0000-4000-8000-000000000000'))).status, 500);
    } finally {
      g.__E2E_FAIL_TO__ = undefined;
    }
    assert.equal(sent().length, 0);
    assert.equal((await deliver(purchaseEvent('evt_orphan', 'sub_e2e_orphan', '99999999-0000-4000-8000-000000000000'))).status, 200);
    assert.equal((await subRows('sub_e2e_orphan')).length, 0);
    const alert = mailTo('owner@e2e.test').find((m) => /could not be matched to a vendor/.test(m.subject));
    assert.ok(alert, 'a payment nobody can see in the site is not left in a log');
    assert.match(alert!.html, /sub_e2e_orphan/);
    assert.match(alert!.html, /99999999-0000-4000-8000-000000000000/);

    // The same for a renewal of a subscription that was never recorded.
    clearSent();
    assert.equal((await deliver(subEvent('evt_orphan_renew', 'customer.subscription.updated', 'sub_e2e_orphan', '99999999-0000-4000-8000-000000000000', 'active', Date.now() + 30 * DAY))).status, 200);
    assert.equal(mailTo('owner@e2e.test').filter((m) => /could not be matched to a vendor/.test(m.subject)).length, 1);
  });

  await test('Stripe: when Stripe cannot be reached the event is refused, so it is sent again later and nothing is guessed', async () => {
    const SUB = 'sub_e2e_outage';
    stripeSays(SUB, V.optout.id, 'active', Date.now() + 30 * DAY);
    stripeDown = true;
    try {
      assert.equal((await deliver(purchaseEvent('evt_down_buy', SUB, V.optout.id))).status, 500);
      assert.equal((await deliver(subEvent('evt_down_upd', 'customer.subscription.updated', SUB, V.optout.id, 'active', Date.now() + 30 * DAY))).status, 500);
      assert.equal((await subRows(SUB)).length, 0);
      assert.equal((await optoutListing()).tier, 'basic');
    } finally {
      stripeDown = false;
    }
    // Stripe sends it again once it can be reached.
    assert.equal((await deliver(purchaseEvent('evt_down_buy', SUB, V.optout.id))).status, 200);
    assert.deepEqual((await subRows(SUB)).map((r) => r.status), ['active']);
    assert.equal((await optoutListing()).tier, 'featured');
    await forgetBilling(V.optout.id);
  });

  await test('Stripe: a database failure answers 500, so the event is sent again and no payment is lost', async () => {
    const SUB = 'sub_e2e_dbfail';
    stripeSays(SUB, V.optout.id, 'active', Date.now() + 30 * DAY);
    psql(`
      create or replace function public.e2e_fail_subscription() returns trigger language plpgsql as $f$
      begin raise exception 'e2e: simulated database failure'; end $f$;
      create trigger e2e_fail_subscription before insert on public.subscriptions
        for each row execute function public.e2e_fail_subscription();`);
    try {
      assert.equal((await deliver(purchaseEvent('evt_dbfail', SUB, V.optout.id))).status, 500);
      assert.equal((await subRows(SUB)).length, 0);
      assert.equal((await optoutListing()).tier, 'basic', 'nothing half-done');
    } finally {
      psql(`drop trigger e2e_fail_subscription on public.subscriptions; drop function public.e2e_fail_subscription();`);
    }
    assert.equal((await deliver(purchaseEvent('evt_dbfail', SUB, V.optout.id))).status, 200);
    assert.deepEqual((await subRows(SUB)).map((r) => r.status), ['active']);
    assert.equal((await optoutListing()).tier, 'featured');
    await forgetBilling(V.optout.id);
  });

  await test('Stripe: if Stripe will not show the subscription, the event is applied as it was sent', async () => {
    // Not in the map: the key in use cannot read subscriptions, say. The handler
    // then works from each event's own picture, as it did before the lookup existed.
    const SUB = 'sub_e2e_hidden';
    const ev = (id: string, status: string, endMs: number | null, type = 'customer.subscription.updated') =>
      subEvent(id, type, SUB, V.optout.id, status, endMs);
    const end = Date.now() + 30 * DAY;

    assert.equal((await deliver(purchaseEvent('evt_hidden_buy', SUB, V.optout.id))).status, 200);
    assert.deepEqual((await subRows(SUB)).map((r) => r.status), ['active']);
    let l = await optoutListing();
    assert.ok(daysFromNow(l.featured_until) > 32.9 && daysFromNow(l.featured_until) < 33.1, 'a month plus grace, counted from now');

    assert.equal((await deliver(ev('evt_hidden_renew', 'active', end + 30 * DAY))).status, 200);
    assert.ok(daysFromNow((await optoutListing()).featured_until) > 62.5);
    assert.equal((await deliver(ev('evt_hidden_pastdue', 'past_due', end + 30 * DAY))).status, 200);
    assert.ok(daysFromNow((await optoutListing()).featured_until) < 7.1);
    assert.equal((await deliver(ev('evt_hidden_deleted', 'canceled', end + 30 * DAY, 'customer.subscription.deleted'))).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'canceled');
    assert.equal((await optoutListing()).tier, 'basic');
    // Even working from events alone, a cancelled subscription is never revived by a late one.
    assert.equal((await deliver(ev('evt_hidden_late', 'active', end + 30 * DAY))).status, 200);
    assert.equal((await subRows(SUB))[0].status, 'canceled');
    assert.equal((await optoutListing()).tier, 'basic');
    await forgetBilling(V.optout.id);
  });

  await test('Stripe: events that arrive before, or instead of, the purchase event are still accounted for', async () => {
    const end = Date.now() + 30 * DAY;

    // 1. The first "active" update overtakes the purchase event. The subscription
    //    is recorded there and then, so its later failure or end still counts.
    const A = 'sub_e2e_early';
    stripeSays(A, V.optout.id, 'active', end);
    clearSent();
    assert.equal((await deliver(subEvent('evt_early_upd', 'customer.subscription.updated', A, V.optout.id, 'active', end))).status, 200);
    assert.deepEqual((await subRows(A)).map((r) => `${r.status}|${r.vendor_id}`), [`active|${V.optout.id}`]);
    assert.ok(daysFromNow((await optoutListing()).featured_until) > 32.9);
    assert.equal((await deliver(purchaseEvent('evt_early_buy', A, V.optout.id))).status, 200);
    assert.equal((await subRows(A)).length, 1, 'the purchase event that follows does not add a second row');
    assert.equal(mailTo('owner@e2e.test').filter((m) => /New Featured subscriber/.test(m.subject)).length, 1, 'and the owner is told once, by whichever event recorded it');
    stripeSays(A, V.optout.id, 'canceled', end);
    assert.equal((await deliver(subEvent('evt_early_del', 'customer.subscription.deleted', A, V.optout.id, 'canceled', end))).status, 200);
    assert.equal((await subRows(A))[0].status, 'canceled');
    assert.equal((await optoutListing()).tier, 'basic', 'so the free ride ends when the subscription does');
    await forgetBilling(V.optout.id);

    // 2. The purchase event only gets through after the subscription has already
    //    been cancelled at Stripe (its cancellation arrived first and found
    //    nothing on record). It is kept as history and features nothing; an
    //    "active" row here would never be cancelled by anything.
    const B = 'sub_e2e_ended';
    stripeSays(B, V.optout.id, 'canceled', end);
    assert.equal((await deliver(subEvent('evt_ended_del', 'customer.subscription.deleted', B, V.optout.id, 'canceled', end))).status, 200);
    assert.equal((await subRows(B)).length, 0);
    assert.equal((await deliver(purchaseEvent('evt_ended_buy', B, V.optout.id))).status, 200);
    assert.deepEqual((await subRows(B)).map((r) => r.status), ['canceled']);
    assert.equal((await optoutListing()).tier, 'basic');
    await forgetBilling(V.optout.id);

    // 3. First heard of while already past due: recorded, and nothing is pulled
    //    back from a listing it never made Featured.
    const C = 'sub_e2e_latepd';
    const comp = new Date(Date.now() + 90 * DAY).toISOString();
    await must(db.from('listings').update({ tier: 'featured', featured_until: comp }).eq('id', L(V.optout)));
    stripeSays(C, V.optout.id, 'past_due', end);
    assert.equal((await deliver(subEvent('evt_latepd', 'customer.subscription.updated', C, V.optout.id, 'past_due', end))).status, 200);
    assert.deepEqual((await subRows(C)).map((r) => r.status), ['past_due']);
    assert.ok(daysFromNow((await optoutListing()).featured_until) > 89, 'putting it on record changes no listing');
    await forgetBilling(V.optout.id);
  });

  await test('Stripe: with two live subscriptions, one failing or ending leaves Featured in place until the other does', async () => {
    const endA = Date.now() + 30 * DAY;
    const endB = Date.now() + 45 * DAY;
    for (const [id, end] of [['sub_e2e_a', endA], ['sub_e2e_b', endB]] as const) {
      stripeSays(id, V.optout.id, 'active', end);
      assert.equal((await deliver(purchaseEvent(`evt_buy_${id}`, id, V.optout.id))).status, 200);
    }
    assert.ok(daysFromNow((await optoutListing()).featured_until) > 47.9, 'Featured to the later of the two');

    stripeSays('sub_e2e_a', V.optout.id, 'past_due', endA);
    assert.equal((await deliver(subEvent('evt_a_pd', 'customer.subscription.updated', 'sub_e2e_a', V.optout.id, 'past_due', endA))).status, 200);
    assert.ok(daysFromNow((await optoutListing()).featured_until) > 47.9, 'the other subscription is paid up: nothing is pulled back');

    stripeSays('sub_e2e_a', V.optout.id, 'canceled', endA);
    assert.equal((await deliver(subEvent('evt_a_del', 'customer.subscription.deleted', 'sub_e2e_a', V.optout.id, 'canceled', endA))).status, 200);
    assert.equal((await optoutListing()).tier, 'featured', 'still Featured: the second subscription is live');

    stripeSays('sub_e2e_b', V.optout.id, 'canceled', endB);
    assert.equal((await deliver(subEvent('evt_b_del', 'customer.subscription.deleted', 'sub_e2e_b', V.optout.id, 'canceled', endB))).status, 200);
    assert.equal((await optoutListing()).tier, 'basic', 'the last one ending ends Featured');
    await forgetBilling(V.optout.id);
  });

  await test('Stripe: an abandoned checkout expiring a day later does not wipe a founding grant', async () => {
    // Far & Away Media is a founding vendor. Suppose its owner had opened
    // Checkout before that and walked away: Stripe keeps an "incomplete"
    // subscription with our metadata on it, and expires it about a day later.
    // We never recorded that subscription, so its end must change nothing.
    const before = (await must(db.from('listings').select('tier, featured_until').eq('id', L(V.far)).single())) as any;
    assert.equal(before.tier, 'featured');
    stripeSays('sub_never_recorded', V.far.id, 'incomplete_expired', null);
    for (const [id, type, status] of [
      ['evt_abandoned_1', 'customer.subscription.updated', 'incomplete'],
      ['evt_abandoned_2', 'customer.subscription.updated', 'incomplete_expired'],
      ['evt_abandoned_3', 'customer.subscription.deleted', 'canceled'],
    ] as const) {
      assert.equal((await deliver(subEvent(id, type, 'sub_never_recorded', V.far.id, status, Date.now() + 30 * DAY))).status, 200);
    }
    // And the same when Stripe will not show it and the events are all there is.
    for (const [id, type, status] of [
      ['evt_abandoned_4', 'customer.subscription.updated', 'incomplete_expired'],
      ['evt_abandoned_5', 'customer.subscription.deleted', 'canceled'],
    ] as const) {
      assert.equal((await deliver(subEvent(id, type, 'sub_never_recorded_2', V.far.id, status, Date.now() + 30 * DAY))).status, 200);
    }
    const after = (await must(db.from('listings').select('tier, featured_until').eq('id', L(V.far)).single())) as any;
    assert.deepEqual(after, before, 'the founding grant is untouched');
    assert.equal(((await must(db.from('subscriptions').select('id').eq('vendor_id', V.far.id))) as any[]).length, 0, 'and no subscription is put on record for a checkout nobody paid');
    const marker = (await must(db.from('profiles').select('founding_granted_at').eq('clerk_user_id', CLAIMANT.id).single())) as any;
    assert.ok(marker.founding_granted_at);
  });

  await test('Stripe: a listing Featured by hand with no end date is not turned into one that ends', async () => {
    await must(db.from('listings').update({ tier: 'featured', featured_until: null }).eq('id', L(V.form)));
    const row = async () => (await must(db.from('listings').select('tier, featured_until').eq('id', L(V.form)).single())) as any;
    const end = Date.now() + 30 * DAY;

    stripeSays('sub_e2e_comp', V.form.id, 'active', end);
    assert.equal((await deliver(purchaseEvent('evt_comp_buy', 'sub_e2e_comp', V.form.id))).status, 200);
    assert.deepEqual(await row(), { tier: 'featured', featured_until: null }, 'buying does not put a date on it');
    stripeSays('sub_e2e_comp', V.form.id, 'past_due', end);
    assert.equal((await deliver(subEvent('evt_comp_pd', 'customer.subscription.updated', 'sub_e2e_comp', V.form.id, 'past_due', end))).status, 200);
    assert.deepEqual(await row(), { tier: 'featured', featured_until: null }, 'a failed payment does not put a date on it either');
    stripeSays('sub_e2e_comp', V.form.id, 'canceled', end);
    assert.equal((await deliver(subEvent('evt_comp_cancel', 'customer.subscription.deleted', 'sub_e2e_comp', V.form.id, 'canceled', end))).status, 200);
    assert.deepEqual(await row(), { tier: 'featured', featured_until: null }, 'and cancelling does not take it away');

    // Back to an ordinary unclaimed Basic listing for the tests that follow.
    await forgetBilling(V.form.id);
  });

  await test('a vendor who is paying or has paid is not offered the free period', async () => {
    // Brand New Streams became a founding vendor on approval. A different, new
    // account with a subscription on record must not get it.
    const { ensureProfile } = await import('../../src/lib/auth');
    signInAs({ id: 'user_paid', email: 'paid@vendor.test' });
    const profile = (await ensureProfile())!;
    const vendor = (await must(db.from('vendors').insert({ user_id: profile.id, business_name: 'Paid Before Films', slug: 'paid-before-films' }).select('id').single())) as any;
    const paidListing = (await must(db.from('listings').insert({
      vendor_id: vendor.id, title: 'Paid Before Films', slug: 'paid-before-films', description: 'Was a subscriber.',
      city: 'Orlando', state: 'Florida', lat: 28.54, lng: -81.38, status: 'approved', tier: 'basic',
      starting_price_cents: 100000, hero_image_url: 'https://cdn.test/paid.jpg', service_radius_miles: 60,
    }).select('id').single())) as any;
    await must(db.from('subscriptions').insert({ vendor_id: vendor.id, processor: 'stripe', external_id: 'sub_old', plan: 'monthly', status: 'canceled' }));

    const body = await (await founding.POST()).json();
    assert.equal(body.granted, false);
    assert.equal(body.state, 'none');
    assert.equal(((await must(db.from('listings').select('tier').eq('id', paidListing.id).single())) as any).tier, 'basic');

    // Keep the directory as the page tests expect it.
    await must(db.from('subscriptions').delete().eq('vendor_id', vendor.id));
    await must(db.from('vendors').delete().eq('id', vendor.id));
    signInAs(null);
  });

  // ------------------------------------------------------ manual claim path
  await test('a claim without an emailed link still goes to manual review and can be approved', async () => {
    clearSent();
    signInAs(OTHER);
    // This account's own sign-up stopped after the vendor row was written. That
    // leftover is not "a business it already manages".
    const { ensureProfile: profileOf } = await import('../../src/lib/auth');
    const otherProfile = (await profileOf())!;
    await must(db.from('vendors').insert({ user_id: otherProfile.id, business_name: 'Near Films', slug: 'near-films-leftover' }));
    const res = await claims.POST(post('/api/claims', { listing_id: L(V.near), business_email: 'someone@else.test', proof: 'I own it.' }, '10.4.0.1'));
    assert.equal(res.status, 200);
    assert.equal(mailTo('owner@e2e.test').filter((m) => /claim awaiting review/.test(m.subject)).length, 1);

    const other = (await must(db.from('profiles').select('id').eq('clerk_user_id', OTHER.id).single())) as any;
    const pending = (await must(db.from('claim_requests').select('id, status').eq('user_id', other.id).single())) as any;
    assert.equal(pending.status, 'pending');
    assert.equal(((await must(db.from('vendors').select('user_id').eq('id', V.near.id).single())) as any).user_id, null);

    clearSent();
    signInAs(ADMIN);
    const approve = await adminClaims.PATCH(
      new Request('http://localhost/x', { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) }),
      { params: Promise.resolve({ id: pending.id }) }
    );
    assert.equal(approve.status, 200, JSON.stringify(await approve.clone().json()));
    assert.equal(((await must(db.from('vendors').select('user_id').eq('id', V.near.id).single())) as any).user_id, other.id);
    const ownedNow = (await must(db.from('vendors').select('slug').eq('user_id', other.id))) as any[];
    assert.deepEqual(ownedNow.map((v) => v.slug), ['near-films'], 'approval also clears the empty leftover row');
    const mail = mailTo(OTHER.email).find((m) => /claim is approved/.test(m.subject));
    assert.ok(mail);
    assert.match(mail!.html, /quote requests? waiting/);
    assert.match(mail!.html, /Founding vendor offer/);
  });

  await test('checkout is only offered when there is something to buy: one subscription, one listing, no free period', async () => {
    const checkout = await import('../../src/app/api/checkout/stripe/route');
    const { ensureProfile } = await import('../../src/lib/auth');
    signInAs(OTHER); // owns Near Films: a Basic listing, no free period
    const attempt = () => checkout.POST(post('/api/checkout/stripe', { plan: 'monthly' }, '10.2.1.2'));
    const setStatus = async (status: string | null) => {
      await must(db.from('subscriptions').delete().eq('vendor_id', V.near.id));
      if (status) {
        await must(db.from('subscriptions').insert({ vendor_id: V.near.id, processor: 'stripe', external_id: 'sub_near', plan: 'monthly', status }));
      }
    };
    const setListing = (tier: string, until: string | null) =>
      must(db.from('listings').update({ tier, featured_until: until }).eq('id', L(V.near)));
    const DAY = 86_400_000;
    // No price is configured in this stack, so a request that gets through
    // every guard stops at "Stripe not configured", before anything is charged.
    const open = async (why: string) => {
      const res = await attempt();
      assert.equal(res.status, 500, why);
      assert.equal((await res.json()).error, 'Stripe not configured', why);
    };
    const closed = async (status: number, message: RegExp, why: string) => {
      const res = await attempt();
      assert.equal(res.status, status, why);
      assert.match((await res.json()).error, message, why);
    };
    try {
      // A live subscription: a second checkout would start a second one.
      for (const status of ['active', 'past_due']) {
        await setStatus(status);
        await closed(409, /already have a Featured subscription/, status);
      }
      // Cancelled, or never subscribed: open.
      await setStatus('canceled');
      await open('a cancelled subscriber can come back');
      await setStatus(null);
      await open('never subscribed');

      // Featured by hand with no end date: paying would change nothing.
      await setListing('featured', null);
      await closed(409, /already Featured at no charge/, 'comped listing');
      // Featured until a date still ahead: closed until it has passed, whatever the history.
      await setListing('featured', new Date(Date.now() + 10 * DAY).toISOString());
      await closed(409, /already Featured free until \w+ \d+, 20\d\d/, 'free period, no history');
      await setStatus('canceled');
      await closed(409, /already Featured free until/, 'free period, former subscriber');
      await setListing('featured', new Date(Date.now() - DAY).toISOString());
      await open('the free period has ended');
      await setListing('basic', null);
      await setStatus(null);

      // A listing still waiting for review, or not approved: Featured would be shown to nobody.
      await must(db.from('listings').update({ status: 'pending' }).eq('id', L(V.near)));
      await closed(400, /not live yet\. You can upgrade it as soon as it has been approved/, 'pending listing');
      await must(db.from('listings').update({ status: 'rejected' }).eq('id', L(V.near)));
      await closed(400, /not live, so there is nothing to upgrade/, 'rejected listing');
      await must(db.from('listings').update({ status: 'approved' }).eq('id', L(V.near)));
      await open('live again');

      // An account whose sign-up stopped after the vendor row: nothing to upgrade.
      signInAs({ id: 'user_nolisting', email: 'nolisting@vendor.test' });
      const profile = (await ensureProfile())!;
      await must(db.from('vendors').insert({ user_id: profile.id, business_name: 'Half Way Films', slug: 'half-way-films' }));
      await closed(400, /Finish your listing first/, 'vendor row with no listing');
      await must(db.from('vendors').delete().eq('user_id', profile.id));
    } finally {
      await must(db.from('listings').update({ status: 'approved' }).eq('id', L(V.near)));
      await setListing('basic', null);
      await setStatus(null);
      signInAs(null);
    }
  });

  // ------------------------------------------------------- dashboard numbers
  await test('dashboard traffic counts real opens and AI assistants, not scrapers or training crawlers', async () => {
    // Every date here hangs off RELEASE_DATE, so setting that to the real
    // deploy date (as src/lib/release.ts asks) does not break this test.
    const { RELEASE_DATE } = await import('../../src/lib/release');
    const { VIEWS_COUNTED_FROM } = await import('../../src/lib/data/vendor-stats');
    const releaseMs = Date.parse(`${RELEASE_DATE}T00:00:00Z`);
    const day = (offset: number) => new Date(releaseMs + offset * 86_400_000).toISOString().slice(0, 10);
    const noon = (offset: number) => new Date(releaseMs + offset * 86_400_000 + 12 * 3_600_000);
    assert.equal(VIEWS_COUNTED_FROM, day(1), 'counting starts the day after the release');

    const row = (path: string, onDay: string, extra: Record<string, unknown>) => ({
      path, day: onDay, visitor_hash: null, source: 'direct', country: 'US', is_bot: false, ai_crawler: null, ...extra,
    });
    await must(db.from('page_views').insert([
      row('/listing/far-away-media', day(39), { visitor_hash: 'a', source: 'organic' }),
      row('/listing/far-away-media', day(39), { visitor_hash: 'b', source: 'internal' }),
      row('/listing/far-away-media', day(39), { visitor_hash: 'c', country: 'SG' }),
      row('/listing/far-away-media', day(39), { is_bot: true, ai_crawler: 'ChatGPT-User' }),
      row('/listing/far-away-media', day(39), { is_bot: true, ai_crawler: 'OAI-SearchBot' }),
      row('/listing/far-away-media', day(39), { is_bot: true, ai_crawler: 'ClaudeBot' }),
      row('/listing/far-away-media', day(39), { is_bot: true, ai_crawler: 'GPTBot' }),
      row('/listing/far-away-media', day(39), { is_bot: true, ai_crawler: 'meta-externalagent' }),
      row('/listing/far-away-media', day(39), { is_bot: true }),
      // Before the counter was fixed, and the release day itself (its hours
      // before the deploy are inflated too): never shown to a vendor.
      row('/listing/near-films', day(-1), { visitor_hash: 'd' }),
      row('/listing/near-films', day(0), { visitor_hash: 'e' }),
      row('/listing/near-films', day(3), { visitor_hash: 'f' }),
    ]));

    // US browsers only; assistants only (the two training crawlers and Meta's are not counted).
    assert.deepEqual(await getListingTraffic('far-away-media', noon(49)), {
      views: 2, aiVisits: 2, since: day(19), partialWindow: false,
    });
    // Eighteen days after the fix: the window starts the day after it, not thirty days back.
    assert.deepEqual(await getListingTraffic('near-films', noon(18)), {
      views: 1, aiVisits: 0, since: day(1), partialWindow: true,
    });
    const none = await getListingTraffic('no-such-listing', noon(49));
    assert.equal(none!.views, 0);
    assert.equal(none!.aiVisits, 0);
  });

  // --------------------------------------------------------------- newsletter
  await test('newsletter form: three sign-ups per address, then silently ignored', async () => {
    clearSent();
    for (let i = 0; i < 5; i++) {
      const res = await subscribe.POST(post('/api/subscribe', { email: `sub${i}@e2e.test`, source: 'footer' }, '10.5.0.1'));
      assert.equal(res.status, 200);
    }
    const rows = (await must(db.from('subscribers').select('email'))) as any[];
    assert.equal(rows.length, 3);
    assert.equal(sent().length, 3, 'only three welcome emails went out');
  });

  // ------------------------------------------------------------ return path
  await test('newsletter: past the hourly welcome cap the address is still saved, but no welcome email goes out', async () => {
    await must(db.from('email_send_log').insert(Array.from({ length: 20 }, () => ({ kind: 'subscriber_welcome', subject_key: null }))));
    clearSent();
    try {
      const res = await subscribe.POST(post('/api/subscribe', { email: 'capped@e2e.test', source: 'footer' }, '10.5.1.1'));
      assert.equal(res.status, 200);
      assert.equal(((await must(db.from('subscribers').select('email').eq('email', 'capped@e2e.test'))) as any[]).length, 1, 'saved');
      assert.equal(sent().length, 0, 'nothing sent');
    } finally {
      await must(db.from('email_send_log').delete().eq('kind', 'subscriber_welcome'));
      await must(db.from('subscribers').delete().eq('email', 'capped@e2e.test'));
    }
  });

  await test('the sign-in callback only ever redirects back into this site', async () => {
    const callback = await import('../../src/app/auth/callback/route');
    const go = async (next: string | null) => {
      const url = `https://www.weddinglivestreaming.com/auth/callback${next === null ? '' : `?next=${encodeURIComponent(next)}`}`;
      const res = await callback.GET(new Request(url) as any);
      assert.ok(res.status >= 300 && res.status < 400, `redirect status, got ${res.status}`);
      return res.headers.get('location');
    };
    assert.equal(await go(null), 'https://www.weddinglivestreaming.com/dashboard');
    assert.equal(await go('/dashboard/leads?claimed=1'), 'https://www.weddinglivestreaming.com/dashboard/leads?claimed=1');
    for (const hostile of ['//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', '/\r\\evil.com', '/.//evil.com', '/%2e//evil.com', 'https://evil.com/x']) {
      assert.equal(await go(hostile), 'https://www.weddinglivestreaming.com/dashboard', JSON.stringify(hostile));
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
