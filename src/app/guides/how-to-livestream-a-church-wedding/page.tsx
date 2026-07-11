import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArticleJsonLd, BreadcrumbJsonLd, FaqJsonLd, HowToJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'How to Live Stream a Church Wedding: Permission, Audio & Setup',
  description:
    'Live streaming a church wedding starts with the church’s permission. Learn the rules most churches have, how to handle echoing audio and weak indoor signal, and where cameras can go.',
  alternates: { canonical: '/guides/how-to-livestream-a-church-wedding' },
};

const STEPS = [
  {
    title: 'Ask the church first — before you book anything',
    body:
      'Every church sets its own filming rules, and they vary widely. Some welcome livestreaming (many stream their own Sunday services), some allow it only from fixed positions like the balcony or back of the nave, and a few prohibit cameras during the sacrament itself. Ask the officiant or parish office early — ideally before you book a vendor — and get the answer in writing. Ask specifically: where cameras may be placed, whether operators can move during the ceremony, and whether the church’s own streaming system is available to use.',
  },
  {
    title: 'Check the internet situation inside the building',
    body:
      'Thick stone or brick walls make older churches notorious for weak cellular signal, and many don’t offer guest Wi-Fi. Visit ahead of time and run a speed test from the exact spot the camera will sit — you need roughly 5 Mbps upload for reliable HD streaming. If the signal is weak, a professional vendor will bring a bonded cellular unit that combines several carriers; a DIY streamer should test more than one carrier and have a backup plan for recording locally if the stream can’t hold.',
  },
  {
    title: 'Solve audio before you think about video',
    body:
      'High ceilings and hard surfaces create echo, and church weddings often have quiet moments — vows, readings, soft music — that a camera microphone across the room simply cannot capture. The fix is a dedicated microphone near the sound source: a lavalier on the officiant, a discreet mic at the lectern, or a direct feed from the church’s own sound system if one exists. Ask the church whether you can plug into their soundboard — it’s often the single best audio source in the building.',
  },
  {
    title: 'Place cameras where the church allows — then work with it',
    body:
      'The most common church rule is “no movement during the ceremony,” which means fixed camera positions chosen well matter more than camera count. A single well-placed camera with a clean center-aisle view beats three awkward angles. The balcony (if there is one) is usually the best allowed position: elevated, unobtrusive, and with a clear line of sight over guests’ heads. Confirm whether tripods are allowed in aisles and whether the photographer has already claimed key positions.',
  },
  {
    title: 'Respect the liturgy in the stream itself',
    body:
      'For religious ceremonies, ask the officiant whether any parts of the service should not be broadcast — some traditions restrict filming communion or other sacraments. Build the stream schedule around the ceremony’s actual structure, brief your operator on when key moments happen (processional, vows, rings, kiss, recessional), and let the officiant know a stream is running so they can mention remote guests if they’d like to.',
  },
  {
    title: 'Test everything at the rehearsal',
    body:
      'The rehearsal is your full dress run: test the stream from the real camera position, with the real connection, at the real time of day. Lighting through stained glass changes dramatically by hour, and a connection that worked on an empty Tuesday can crawl when a full congregation’s phones join the same cell tower on Saturday. Professionals do this scouting as part of their service — if you’re doing it yourself, don’t skip it.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Do churches allow wedding livestreaming?',
    answer:
      'Most do, with conditions — typically fixed camera positions, no movement during the ceremony, and sometimes restrictions on filming specific sacraments. Rules are set by each church, so ask the officiant or parish office directly and get permission in writing before booking a vendor.',
  },
  {
    question: 'What if the church has no Wi-Fi and bad cell signal?',
    answer:
      'Professional vendors handle this with bonded cellular units that combine multiple carriers into one reliable connection. For DIY, test multiple carriers inside the building beforehand; if nothing holds 5 Mbps upload, record the ceremony locally and upload it immediately afterward instead of streaming live.',
  },
  {
    question: 'Can I use the church’s own streaming system?',
    answer:
      'Often yes — many churches installed streaming equipment for their own services and will let couples use it, sometimes for a small fee or donation. The quality varies, but the audio feed from the church soundboard is frequently better than anything an outside camera mic can capture. It never hurts to ask.',
  },
  {
    question: 'How much does it cost to livestream a church wedding?',
    answer:
      'The same as other venues: professional packages generally run $400–$3,000 depending on cameras and coverage, and DIY runs $0–$150. Church-specific factors — balcony access, soundboard feeds, connectivity workarounds — are worth discussing with vendors up front so the quote reflects the actual building.',
  },
  {
    question: 'Where should the camera go in a church wedding?',
    answer:
      'The balcony is usually the best allowed position — elevated, unobtrusive, and with a clear view down the center aisle. If there’s no balcony, a fixed tripod at the back or side of the nave with a clean line of sight to the altar works well. Always confirm placement rules with the church first.',
  },
];

export default function ChurchWeddingLivestreamPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="How to Live Stream a Church Wedding: Permission, Audio & Setup"
        description="Live streaming a church wedding starts with the church's permission. The rules most churches have, how to handle echoing audio and weak indoor signal, and where cameras can go."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'How to Live Stream a Church Wedding', path: '/guides/how-to-livestream-a-church-wedding' },
        ]}
      />
      <HowToJsonLd
        name="How to Live Stream a Church Wedding"
        description="Six steps to live stream a church wedding: permission, connectivity, audio, camera placement, liturgy, and rehearsal testing."
        steps={STEPS.map((s) => ({ name: s.title, text: s.body }))}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Venue Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            How to Live Stream a Church Wedding
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              To live stream a church wedding, get the church&rsquo;s permission first — most allow
              it with rules about camera placement and movement. Then solve the two church-specific
              problems: echoing audio (use a microphone near the officiant or the church&rsquo;s
              soundboard) and weak signal inside thick-walled buildings (test upload speed on site
              before the day).
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          The six steps, in order
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
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Want a pro to handle the church rules?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experienced vendors have streamed from balconies, plugged into church soundboards, and
            worked around no-movement rules many times. Find one near your ceremony.
          </p>
          <Button asChild size="lg">
            <Link href="/directory">Browse Vendors</Link>
          </Button>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">Frequently asked questions</h2>
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
        <p className="mt-10 text-muted-foreground">
          Related reading:{' '}
          <Link href="/guides/wedding-live-streaming-cost" className="text-primary hover:underline">
            what live streaming costs
          </Link>
          {' '}and{' '}
          <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="text-primary hover:underline">
            the questions to ask before booking a vendor
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
