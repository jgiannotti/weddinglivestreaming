import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'How to Livestream an Outdoor Wedding: Signal, Sound & Sun',
  description:
    'Outdoor and beach weddings are the hardest livestreams: no venue Wi-Fi, wind ruining audio, harsh sun. How to solve connectivity, sound, light, and power outside.',
  alternates: { canonical: '/guides/how-to-livestream-an-outdoor-wedding' },
};

const STEPS = [
  {
    title: 'Solve internet before anything else — there is no venue Wi-Fi',
    body: 'A garden, beach, or ranch has no router to fall back on, so your stream lives or dies on cellular. Weeks ahead, stand at the exact ceremony spot and run a speed test on more than one carrier — coverage maps lie about beaches and rural land. You need a stable 5 Mbps upload minimum. If one carrier is weak, a hotspot on a second carrier is the cheapest insurance; professionals solve this with bonded-cellular encoders that combine several networks at once.',
  },
  {
    title: 'Treat wind as your main audio enemy',
    body: 'Wind that guests barely notice sounds like a jet engine on a bare microphone. Every mic outdoors needs a foam windscreen at minimum — a furry windjammer ("deadcat") if there’s real breeze. Put a wireless lavalier on the officiant under a jacket lapel or collar edge, sheltered from direct wind. Ocean surf adds a constant roar: mic as close to the voices as possible and let the surf be background, not foreground.',
  },
  {
    title: 'Plan camera position around the sun, not just the view',
    body: 'Golden-hour ceremonies look gorgeous in person and brutal on camera if the couple stands in front of the setting sun — the stream shows silhouettes. Scout at the actual ceremony time on a prior day: keep the sun behind or beside the camera, never behind the couple. If the planner won’t move the arch, a slightly angled camera position beats a backlit straight-on shot.',
  },
  {
    title: 'Bring power for everything — assume there are no outlets',
    body: 'Count every battery: camera, encoder, hotspot, phone, mic transmitters. Streaming drains devices two to three times faster than recording. Bring charged spares for each, plus a large USB power bank (or two). For multi-hour coverage with reception, a small battery generator station is the professional answer.',
  },
  {
    title: 'Have a weather plan for the gear, not just the guests',
    body: 'The rain plan usually covers chairs and guests — ask what happens to the camera position if the ceremony moves under the tent or indoors. Heat matters too: phones and cameras streaming in direct summer sun shut down from overheating. Shade the rig with an umbrella and keep devices out of direct sunlight.',
  },
  {
    title: 'Do a full dress rehearsal on-site',
    body: 'Outdoors, the rehearsal is not optional: test the stream end-to-end from the real spot at (or near) the real time of day — connection, audio with the actual mics, sun position, battery drain. Ten minutes of live test stream to a private link tells you more than any checklist.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'How do you livestream a wedding with no Wi-Fi?',
    answer:
      'Over cellular. Test upload speed on multiple carriers at the exact ceremony spot beforehand; a stable 5 Mbps upload carries a 1080p stream. Bring a hotspot on a second carrier as a backup, and for weak-signal locations professionals use bonded-cellular encoders that combine several carriers into one reliable connection.',
  },
  {
    question: 'How do you deal with wind noise when livestreaming outside?',
    answer:
      'Windscreens on every microphone — foam for light air, a furry windjammer for real breeze — and lavalier mics placed close to the speakers, sheltered by clothing. Distance is the killer: a camera-mounted mic ten meters away in wind is unusable, while a lapel mic inches from the officiant stays clear.',
  },
  {
    question: 'Can you livestream a beach wedding?',
    answer:
      'Yes, and they’re popular — but beaches combine every outdoor challenge: no power, spotty cell coverage, constant wind, surf noise, harsh light, and salt spray. Test connectivity on-site, use windjammers and close mics, keep the sun off the lens axis, and protect gear from sand and spray. This is the venue type where hiring a professional pays for itself most clearly.',
  },
  {
    question: 'What time of day is best for an outdoor wedding livestream?',
    answer:
      'Late afternoon with the sun behind or beside the camera. Straight-into-the-sunset framing silhouettes the couple on camera even though it looks stunning in person. Midday works fine for exposure but is the least flattering light; if the ceremony is at golden hour, position the camera so the low sun lights the couple rather than backlighting them.',
  },
  {
    question: 'How much does it cost to livestream an outdoor wedding?',
    answer:
      'Expect professional quotes at or slightly above typical ceremony rates — most packages start in the $500–$1,500 range, and some vendors add a fee for remote locations that require bonded-cellular equipment or extra travel. Ask specifically whether the quote includes a backup connection; outdoors, that line item is the product.',
  },
];

export default function OutdoorWeddingPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="How to Livestream an Outdoor Wedding: Signal, Sound & Sun"
        description="Solving the four outdoor livestream problems — connectivity without venue Wi-Fi, wind noise, harsh light, and power."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Outdoor Wedding Livestreams', path: '/guides/how-to-livestream-an-outdoor-wedding' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Venue Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            How to Livestream an Outdoor Wedding
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              Outdoor weddings are the hardest livestreams because the four things a stream
              depends on — internet, clean audio, manageable light, and power — are all missing
              or hostile outside. The fixes: cellular internet tested at the exact spot (with a
              second carrier as backup), windscreened mics close to the voices, the sun kept off
              the lens axis, and batteries for everything. Here&rsquo;s each one in order.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          The six steps, hardest first
        </h2>
        <ol className="space-y-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex-none inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-muted-foreground leading-relaxed">
          Streaming indoors instead? See the{' '}
          <Link href="/guides/how-to-livestream-a-church-wedding" className="text-primary font-medium hover:underline">
            church wedding guide
          </Link>{' '}
          — different problems, same principles. Gear shopping list in the{' '}
          <Link href="/guides/wedding-livestream-equipment" className="text-primary font-medium hover:underline">
            equipment guide
          </Link>
          , and the full walkthrough in{' '}
          <Link href="/guides/how-to-live-stream-a-wedding" className="text-primary font-medium hover:underline">
            how to live stream a wedding
          </Link>
          .
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Outdoor venues are where pros earn it
          </h2>
          <p className="text-muted-foreground mb-8">
            Bonded-cellular internet, wind-proofed audio, and backup power are exactly what
            professional vendors carry. Compare vendors near your venue — free.
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
