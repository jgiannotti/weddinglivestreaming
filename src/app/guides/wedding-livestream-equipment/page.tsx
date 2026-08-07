import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Wedding Livestream Equipment: What You Actually Need',
  description:
    'The equipment for a wedding livestream at three budgets — a $0–$150 phone setup, a $1,500–$2,500 prosumer kit, and a professional multi-camera rig. Audio and internet matter most.',
  alternates: { canonical: '/guides/wedding-livestream-equipment' },
};

const TIERS = [
  {
    name: 'The phone setup',
    price: '$0–$150',
    who: 'A casual, low-stakes stream run by a friend — small backyard weddings where an imperfect stream is acceptable.',
    items: [
      { item: 'A recent smartphone', note: 'Any phone from the last few years streams 1080p. Fully charge it and free up storage beforehand.' },
      { item: 'A sturdy tripod with a phone mount', note: 'The single best $30 upgrade. A propped-up phone falls over; a hand-held stream is unwatchable for an hour.' },
      { item: 'A power bank and cable', note: 'Streaming drains a battery in about an hour — a wedding with pre-roll and recessional will kill an unplugged phone.' },
      { item: 'A wireless lavalier mic for the phone', note: 'Around $100–$150. Clip it to the officiant. This is optional for the picture but transformative for the vows — a phone mic from row five hears mostly the air conditioner.' },
    ],
  },
  {
    name: 'The prosumer kit',
    price: '$1,500–$2,500',
    who: 'A serious DIY setup — or the starter kit for someone launching a livestreaming side business.',
    items: [
      { item: 'A mirrorless camera or camcorder with clean HDMI out', note: 'Any current entry-level mirrorless works. "Clean HDMI" (no on-screen icons in the output) is the spec to check.' },
      { item: 'An HDMI-to-USB capture device or hardware encoder', note: 'Turns the camera into a source your laptop or the encoder can stream. Reliable units start well under $200.' },
      { item: 'A dedicated wireless microphone system', note: 'One transmitter on the officiant (or a mic on the couple), receiver into the camera or mixer. Audio is the tier-defining upgrade — budget here before glass.' },
      { item: 'A laptop with streaming software, or a standalone streaming encoder', note: 'Free software (OBS) is fine; a hardware encoder removes the laptop as a failure point.' },
      { item: 'A cellular hotspot on a different carrier than your phone', note: 'Venue Wi-Fi is the most common failure point of the entire endeavor. A second connection path is not optional at this tier.' },
      { item: 'Tripod, spare batteries, gaff tape, extension cords', note: 'The unglamorous half of every reliable stream.' },
    ],
  },
  {
    name: 'The professional rig',
    price: 'What the pros bring',
    who: 'This is what you’re buying when you hire a vendor — listed so you know what a professional quote includes.',
    items: [
      { item: 'Two to four cameras with an operator switching live', note: 'Processional wide shot, close-up on the vows, reaction angles — cut live, not fixed on one view.' },
      { item: 'A vision mixer / production switcher', note: 'Live switching, titles, and a program feed that looks produced rather than surveilled.' },
      { item: 'Multiple audio sources mixed live', note: 'Officiant mic, couple mic, a feed from the venue PA or musicians — balanced through a mixer so guests hear everything clearly.' },
      { item: 'Bonded-cellular internet', note: 'Combines several carriers into one connection that keeps streaming when any single network chokes. This is the reliability couples are actually paying for.' },
      { item: 'Redundant recording', note: 'Every camera records locally as a backup, so even a total internet failure still yields a full video afterward.' },
    ],
  },
];

const FAQ_ITEMS = [
  {
    question: 'What equipment do I need to livestream a wedding?',
    answer:
      'At minimum: a recent smartphone on a sturdy tripod, a power bank, and ideally a wireless lavalier microphone on the officiant ($0–$150 beyond the phone). A serious setup adds a real camera, a capture device or encoder, a dedicated wireless mic system, and a cellular internet backup ($1,500–$2,500). Professional vendors bring multi-camera rigs with live switching, mixed audio, and bonded-cellular internet.',
  },
  {
    question: 'What is the most important piece of wedding livestream equipment?',
    answer:
      'The microphone, then the internet connection. Remote guests forgive average video, but a stream where you can’t hear the vows fails at its one job — and a stream that drops mid-ceremony fails harder. Camera quality ranks a distant third.',
  },
  {
    question: 'Can I livestream a wedding with just my phone?',
    answer:
      'Yes — put it on a tripod, plug it into a power bank, get it close enough to hear (or add a $100 wireless lavalier mic), and test the venue’s signal beforehand. It’s a real option for casual weddings. The trade-off is reliability: one device, one battery, one network, no backup.',
  },
  {
    question: 'What internet speed does a wedding livestream need?',
    answer:
      'A stable 5 Mbps upload is workable and 10 Mbps is comfortable for 1080p. Stability beats speed — test at the actual ceremony spot (walls and distance matter), and have a second connection on a different carrier ready. Professionals solve this with bonded-cellular encoders that combine multiple networks.',
  },
  {
    question: 'Is it cheaper to buy equipment or hire a wedding livestream vendor?',
    answer:
      'For one wedding, hiring is usually cheaper: a professional package typically starts at $500–$1,500, while assembling reliable gear yourself costs $1,500–$2,500 — and the vendor brings backups, experience, and an operator. Buying only makes sense if you’ll use the gear repeatedly, which is exactly the math that launches livestreaming side businesses.',
  },
];

export default function EquipmentPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Wedding Livestream Equipment: What You Actually Need"
        description="Wedding livestream equipment at three budgets — phone setup, prosumer kit, and professional multi-camera rig."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Livestream Equipment', path: '/guides/wedding-livestream-equipment' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Equipment Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Wedding Livestream Equipment: What You Actually Need
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              A wedding livestream needs four things: a camera (a phone counts), a tripod,
              reliable internet with a backup, and — most importantly — a microphone near the
              vows. That can cost $150 or $15,000. Below are three honest equipment tiers, and
              the two mistakes (bad audio, no backup connection) that sink more streams than any
              camera choice.
            </strong>
          </p>
        </div>
      </section>

      {TIERS.map((tier, idx) => (
        <section key={tier.name} className={`container py-16 max-w-3xl${idx > 0 ? ' border-t' : ''}`}>
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <h2 className="font-display text-2xl md:text-3xl font-medium">{tier.name}</h2>
            <span className="font-display text-xl text-primary font-semibold">{tier.price}</span>
          </div>
          <p className="text-muted-foreground mb-8">{tier.who}</p>
          <ul className="space-y-4">
            {tier.items.map((row) => (
              <li key={row.item} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold mb-1">{row.item}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{row.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="container py-16 max-w-3xl border-t">
        <p className="text-muted-foreground leading-relaxed">
          Weighing the phone setup against hiring out? Read{' '}
          <Link href="/guides/diy-vs-professional-wedding-livestream" className="text-primary font-medium hover:underline">
            DIY vs. professional
          </Link>{' '}
          and the full{' '}
          <Link href="/guides/how-to-live-stream-a-wedding" className="text-primary font-medium hover:underline">
            step-by-step streaming walkthrough
          </Link>
          . Thinking about the prosumer kit as a business investment?{' '}
          <Link href="/guides/how-to-start-a-wedding-livestreaming-business" className="text-primary font-medium hover:underline">
            Here&rsquo;s how vendors turn that gear into bookings
          </Link>
          .
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Skip the shopping list entirely
          </h2>
          <p className="text-muted-foreground mb-8">
            Professional vendors bring all of this — with backups — starting around the cost of
            the DIY kit. Compare published prices near you, free.
          </p>
          <Button asChild size="lg">
            <Link href="/directory">Browse Vendors</Link>
          </Button>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group rounded-xl border bg-card p-5 transition-shadow open:shadow-md">
              <summary className="cursor-pointer font-semibold flex items-center justify-between list-none">
                {item.question}
                <span className="text-muted-foreground transition-transform group-open:rotate-45 text-xl">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
