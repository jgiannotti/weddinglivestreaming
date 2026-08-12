// Sends the vendor claim-your-listing outreach via Resend.
//
//   node scripts/send-outreach.mjs                      # DRY RUN (default)
//   node scripts/send-outreach.mjs --limit 20           # dry run, first 20
//   node scripts/send-outreach.mjs --limit 20 --send    # actually send 20
//   node scripts/send-outreach.mjs --send --resume      # continue after a batch
//
// SAFETY MODEL — read before changing anything here:
//   * Dry run is the default. Nothing sends without an explicit --send.
//   * Every successful send is appended to seed/outreach-sent.json, and those
//     addresses are skipped forever after. Re-running cannot double-send.
//   * seed/outreach-suppression.txt (one address per line, # for comments) is
//     always excluded — put anyone who asks to be removed in there immediately.
//   * Sends are throttled and batched. Do not raise the batch size to "just get
//     it done": a burst of cold email is what triggers spam filtering.
//
// Requires RESEND_API_KEY in the environment. It is NOT in .env.local — it
// lives in the Vercel project settings (or the Resend dashboard).

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { Resend } from 'resend';

const CSV = 'outreach.csv';
const SENT_LOG = 'seed/outreach-sent.json';
const SUPPRESSION = 'seed/outreach-suppression.txt';

const FROM = process.env.OUTREACH_FROM || 'Joe <joe@weddinglivestreaming.com>';
const REPLY_TO = process.env.OUTREACH_REPLY_TO || 'joe@weddinglivestreaming.com';

// CAN-SPAM requires a valid physical postal address in commercial email.
const POSTAL_ADDRESS = '4724 Travertine Dr, Tampa, FL 33615';

const argv = process.argv.slice(2);
const SEND = argv.includes('--send');
const limitIdx = argv.indexOf('--limit');
const LIMIT = limitIdx > -1 ? Number(argv[limitIdx + 1]) : Infinity;
const THROTTLE_MS = Number(process.env.OUTREACH_THROTTLE_MS ?? 2500);

// --- input ----------------------------------------------------------------

if (!existsSync(CSV)) {
  console.error(`Missing ${CSV}. Build it first:\n  node scripts/outreach-list.mjs > ${CSV}`);
  process.exit(1);
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const lines = readFileSync(CSV, 'utf8').trim().split('\n');
const headers = parseCsvLine(lines[0]);
const rows = lines.slice(1).map((l) => {
  const cells = parseCsvLine(l);
  return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
});

const sent = existsSync(SENT_LOG) ? JSON.parse(readFileSync(SENT_LOG, 'utf8')) : {};
const suppressed = new Set(
  existsSync(SUPPRESSION)
    ? readFileSync(SUPPRESSION, 'utf8')
        .split('\n')
        .map((l) => l.trim().toLowerCase())
        .filter((l) => l && !l.startsWith('#'))
    : []
);

const escapeHtml = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// --- message --------------------------------------------------------------

function buildEmail(row) {
  const greeting = row.first_name ? `Hi ${escapeHtml(row.first_name)},` : 'Hi there,';
  const business = escapeHtml(row.business);
  const city = escapeHtml(row.city);
  const profile = encodeURI(row.profile);
  const hasProfile = row.has_profile === 'yes';

  // Vendors with no live listing must not be told "here is your listing" —
  // they get pointed at the claim search instead.
  const listingLine = hasProfile
    ? `It&rsquo;s live here: <a href="${profile}">${escapeHtml(row.profile)}</a>`
    : `You can find and claim it here: <a href="${profile}">${escapeHtml(row.profile)}</a>`;

  const wherePhrase = city ? ` in ${city}` : '';

  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#251318;max-width:520px">
  <p>${greeting}</p>
  <p>I run WeddingLiveStreaming.com, a directory for couples looking for someone to
     livestream their ceremony. I built ${business} a listing because you&rsquo;re one of
     the vendors actually doing this work${wherePhrase}.</p>
  <p>${listingLine}</p>
  <p>The listing is free and yours to claim — claiming it lets you edit the details, add
     photos, and reply directly to couples who message you. There&rsquo;s no commission and
     no booking fee, ever. If you&rsquo;d rather not be listed at all, just reply and
     I&rsquo;ll remove it same day.</p>
  <p><a href="https://www.weddinglivestreaming.com/claim">Claim your listing</a></p>
  <p>— Joe<br>WeddingLiveStreaming.com</p>
  <hr style="border:none;border-top:1px solid #e6ded2;margin:24px 0 12px">
  <p style="font-size:12px;color:#8a7d6d;margin:0">
    You received this because ${business} publishes livestreaming services publicly.
    Reply &ldquo;remove&rdquo; and you&rsquo;ll be taken off this list and out of the directory.<br>
    ${POSTAL_ADDRESS}
  </p>
</div>`;

  return { subject: `Your free listing on WeddingLiveStreaming.com`, html };
}

// --- run ------------------------------------------------------------------

const queue = rows
  .filter((r) => r.email)
  .filter((r) => !sent[r.email.toLowerCase()])
  .filter((r) => !suppressed.has(r.email.toLowerCase()))
  .slice(0, LIMIT);

console.error(
  `${rows.length} in list | ${Object.keys(sent).length} already sent | ` +
    `${suppressed.size} suppressed | ${queue.length} queued this run`
);

if (!SEND) {
  console.error('\n*** DRY RUN — nothing will be sent. Add --send to send for real. ***\n');
  const sample = queue.slice(0, 2);
  for (const row of sample) {
    const { subject, html } = buildEmail(row);
    console.error(`--- to: ${row.email}  (${row.business})`);
    console.error(`    subject: ${subject}`);
    // Render a faithful plain-text preview: keep line breaks, decode the
    // entities we emit, and surface link targets. A misleading preview is
    // worse than none — this is what gets reviewed before a real send.
    const preview = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<hr[^>]*>/gi, '\n---\n')
      .replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, (_, href, text) =>
        text.trim() && !text.includes(href) ? `${text} <${href}>` : href
      )
      .replace(/<[^>]+>/g, '')
      .replace(/&rsquo;/g, '’')
      .replace(/&ldquo;/g, '“')
      .replace(/&rdquo;/g, '”')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    console.error(
      preview
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => '    ' + l)
        .join('\n')
    );
    console.error('');
  }
  console.error(`(showing ${sample.length} of ${queue.length} queued)`);
  process.exit(0);
}

if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set — refusing to send.');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);
let ok = 0;
let failed = 0;

for (const [i, row] of queue.entries()) {
  const { subject, html } = buildEmail(row);
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: row.email,
      replyTo: REPLY_TO,
      subject,
      html,
      headers: {
        // Lets mail clients offer a one-click unsubscribe, which measurably
        // improves deliverability and reduces spam complaints.
        'List-Unsubscribe': `<mailto:${REPLY_TO}?subject=remove>`,
      },
    });
    if (error) {
      failed++;
      console.error(`  [${i + 1}/${queue.length}] FAILED ${row.email}: ${error.message ?? error}`);
    } else {
      ok++;
      sent[row.email.toLowerCase()] = { business: row.business, at: new Date().toISOString() };
      writeFileSync(SENT_LOG, JSON.stringify(sent, null, 2) + '\n');
      console.error(`  [${i + 1}/${queue.length}] sent ${row.email}`);
    }
  } catch (err) {
    failed++;
    console.error(`  [${i + 1}/${queue.length}] THREW ${row.email}: ${err.message}`);
  }
  if (i < queue.length - 1) await new Promise((r) => setTimeout(r, THROTTLE_MS));
}

console.error(`\nDone. ${ok} sent, ${failed} failed. Log: ${SENT_LOG}`);
if (failed > 0) console.error('Investigate failures before sending the next batch.');
