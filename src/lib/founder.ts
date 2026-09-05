// The person behind the directory. Used for the E-E-A-T layer: Person entity in
// the Organization schema, the publisher note on every guide, and the About
// page. Every fact here comes from floridasoundman.com — keep it that way (no
// invented credentials, no wedding-count claims we can't back).

export const FOUNDER = {
  name: 'Joe Giannotti',
  jobTitle: 'Production sound mixer & founder, WeddingLiveStreaming.com',
  // Full-time in broadcast production since 2008.
  since: 2008,
  location: 'Tampa, Florida',
  url: 'https://www.floridasoundman.com/',
  sameAs: ['https://www.floridasoundman.com/', 'https://www.soundfortv.com/'],
  credits: ['ESPN', 'Netflix', 'HBO', 'Discovery Channel', 'National Geographic', 'BBC', 'HGTV', 'NFL Network', 'MLB Network'],
} as const;

export const founderYears = () => new Date().getFullYear() - FOUNDER.since;

export const FOUNDER_BIO_SHORT = () =>
  `${FOUNDER.name} is a ${FOUNDER.location}-based production sound mixer who has worked full-time in broadcast and documentary production since ${FOUNDER.since}, with credits for ${FOUNDER.credits.slice(0, 5).join(', ')} and others. He founded WeddingLiveStreaming.com after years of watching couples struggle to find someone who could reliably put a ceremony on screen for the people who couldn't be in the room.`;
