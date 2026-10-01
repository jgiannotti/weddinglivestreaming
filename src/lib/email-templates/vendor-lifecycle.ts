// Emails that follow a vendor through claiming and listing approval.
// Callers must pass pre-escaped values (same contract as the lead templates).
//
// Copy rules for this file: plain statements only. No traffic or booking
// promises, and no claim the product does not actually deliver.
//
// Both templates return a replyTo. The footer invites the vendor to "just
// reply", and the From address is a noreply mailbox, so without it that
// invitation went nowhere. Spread the result into sendEmail() and the reply
// address travels with the message.

import { ADMIN_EMAIL } from '@/lib/email';
import { emailSiteUrl } from '@/lib/site-url';
import { FOUNDING_MONTHS, formatFoundingDate, type FoundingView } from '@/lib/founding-shared';

export { formatFoundingDate };

const P = 'font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#251318;margin:0 0 16px';
const BUTTON =
  'font-family:Helvetica,Arial,sans-serif;background:#761E34;color:#FBF8F4;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;font-size:15px;display:inline-block';

export interface LifecycleEmail {
  subject: string;
  html: string;
  replyTo: string;
}

function shell(heading: string, inner: string): string {
  return `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#251318">
      <h2 style="font-weight:600;margin:0 0 16px">${heading}</h2>
      ${inner}
      <hr style="border:none;border-top:1px solid #e8dfe2;margin:28px 0 12px"/>
      <p style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6b5b60;line-height:1.6;margin:0">
        WeddingLiveStreaming.com. Questions? Just reply to this email.
      </p>
    </div>`;
}

/** One paragraph about the founding offer, or '' when it does not apply. */
export function foundingParagraph(view: FoundingView | null | undefined): string {
  if (!view) return '';
  const site = emailSiteUrl();
  if (view.state === 'active') {
    return `<p style="${P}"><strong>You&rsquo;re a founding vendor.</strong> Your listing is Featured free until ${formatFoundingDate(view.until)}: top placement in search, the gold Featured badge, a turn in the homepage spotlight, and priority when a couple requests quotes in your area. There is nothing to pay and no card on file. After that date it returns to a free Basic listing, and nothing is charged unless you choose to subscribe then.</p>`;
  }
  if (view.state === 'incomplete') {
    const need =
      view.missing.length === 2
        ? 'your starting price and a cover photo'
        : view.missing[0] === 'price'
          ? 'your starting price'
          : 'a cover photo';
    return `<p style="${P}"><strong>Founding vendor offer:</strong> add ${need} to your listing and it becomes Featured free for ${FOUNDING_MONTHS} months. No card needed. <a href="${site}/dashboard" style="color:#761E34">Finish your listing</a>.</p>`;
  }
  if (view.state === 'ready') {
    return `<p style="${P}"><strong>Founding vendor offer:</strong> your listing qualifies for Featured free for ${FOUNDING_MONTHS} months. <a href="${site}/dashboard" style="color:#761E34">Turn it on from your dashboard</a>.</p>`;
  }
  return '';
}

interface ClaimApprovedParams {
  listingTitle?: string | null;
  listingSlug?: string | null;
  waitingLeads: number;
  founding?: FoundingView | null;
}

/** Sent when a claim is approved, whether instantly or by manual review. */
export function claimApprovedEmail(params: ClaimApprovedParams): LifecycleEmail {
  const { listingTitle, listingSlug, waitingLeads, founding } = params;
  const site = emailSiteUrl();

  const leadsLine =
    waitingLeads > 0
      ? `<p style="${P}"><strong>You have ${waitingLeads} quote request${waitingLeads === 1 ? '' : 's'} waiting.</strong> ${waitingLeads === 1 ? 'This is a couple who' : 'These are couples who'} asked for wedding livestream quotes and ${waitingLeads === 1 ? 'was' : 'were'} matched to your listing. Names and contact details are in your dashboard now.</p>
         <p style="margin:0 0 20px"><a href="${site}/dashboard/leads" style="${BUTTON}">See your quote requests</a></p>`
      : `<p style="margin:0 0 20px"><a href="${site}/dashboard" style="${BUTTON}">Open your dashboard</a></p>`;

  const html = shell(
    'Your profile is yours',
    `<p style="${P}">Your claim${listingTitle ? ` for <strong>${listingTitle}</strong>` : ''} is approved. You can now edit the listing and add a cover photo, and couples&rsquo; quote requests come straight to you.</p>
     ${leadsLine}
     ${foundingParagraph(founding)}
     ${
       listingSlug
         ? `<p style="${P}"><a href="${site}/listing/${listingSlug}" style="color:#761E34">View your public listing</a></p>`
         : ''
     }`
  );

  return { subject: 'Your vendor profile claim is approved', html, replyTo: ADMIN_EMAIL };
}

interface ListingLiveParams {
  listingTitle: string;
  listingSlug: string;
  founding?: FoundingView | null;
}

/** Sent to the vendor when an admin approves a listing they submitted. */
export function listingLiveEmail(params: ListingLiveParams): LifecycleEmail {
  const { listingTitle, listingSlug, founding } = params;
  const site = emailSiteUrl();

  const html = shell(
    'Your listing is live',
    `<p style="${P}"><strong>${listingTitle}</strong> is now public in the directory. When a couple requests quotes for a venue in your service area, you can be one of up to three vendors the request is sent to. A request made on your own profile always comes to you.</p>
     <p style="margin:0 0 20px"><a href="${site}/listing/${listingSlug}" style="${BUTTON}">View your listing</a></p>
     ${foundingParagraph(founding)}
     <p style="${P}">You can update your details any time from <a href="${site}/dashboard" style="color:#761E34">your dashboard</a>.</p>`
  );

  return { subject: 'Your listing is live on WeddingLiveStreaming.com', html, replyTo: ADMIN_EMAIL };
}
