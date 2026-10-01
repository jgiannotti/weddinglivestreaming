// Sentences about the vendor offer that appear on more than one page.
//
// They live here so the same fact is stated the same way everywhere, and so a
// change to the offer is made once. Each one describes what the code does
// today; if the behaviour changes, change the sentence in the same commit.

import { FOUNDING_MONTHS } from '@/lib/founding-shared';

export const CONTACT_EMAIL = 'hello@weddinglivestreaming.com';

/** FAQ answer, used on /for-vendors and /pricing (and in both FAQ schemas). */
export const FOUNDING_FAQ_ANSWER = `Vendors who claim or add a listing, then add a starting price and a cover photo, get Featured placement free for ${FOUNDING_MONTHS} months. No card is required and nothing is charged automatically. When the ${FOUNDING_MONTHS} months end, the listing returns to a free Basic listing unless the vendor chooses to subscribe at $29 a month or $199 a year. The offer applies once per business.`;

/** What Featured adds, as a phrase that completes "Featured means ...". */
export const FEATURED_BENEFITS =
  'top placement in search results in your area, the gold Featured badge, a turn in the homepage spotlight, and priority when couples’ quote requests are matched';

/** There is no cancel button in the dashboard, so nothing may say there is. */
export const CANCEL_SENTENCE = `To cancel, email ${CONTACT_EMAIL} at any time.`;

/** Who a quote request goes to. Matches matchVendorsForLead() in src/lib/data/leads.ts. */
export const MATCHING_SENTENCE =
  'Each request goes to up to three vendors, starting with those whose service area covers the venue, Featured vendors first. A request made on your own profile always comes to you.';
