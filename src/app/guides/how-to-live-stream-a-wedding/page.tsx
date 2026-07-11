import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, HowToJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'How to Live Stream a Wedding Yourself: Step-by-Step Guide',
  description:
    'A practical, honest walkthrough for streaming a wedding ceremony yourself — connection testing, platform choice, camera setup, audio, rehearsal, and a backup plan.',
  alternates: { canonical: '/guides/how-to-live-stream-a-wedding' },
};

const STEPS = [
  {
    name: 'Test the venue’s internet connection — before the wedding day',
    text:
      'Visit the ceremony space (or ask the venue coordinator to run a speed test) at least a week ahead. You need a stable upload speed of at least 3–5 Mbps for a single stream; run the test at the same time of day the ceremony will happen, since Wi-Fi congestion changes with usage. If the venue’s Wi-Fi is weak, plan on a mobile hotspot on a strong cellular carrier as your primary connection instead.',
  },
  {
    name: 'Choose your streaming platform',
    text:
      'Zoom and Facebook Live are the two most common free options — Zoom is better for a controlled, invite-only guest list, while Facebook Live is easier for a broad group of friends and family to join without an account. Whichever you choose, create the meeting or event several days early and send the link to guests well ahead of time, not the morning of.',
  },
  {
    name: 'Set up the camera and tripod',
    text:
      'Position the camera at the back or side of the ceremony space with a clear, unobstructed view of where the couple will stand — not from behind the guests where heads will block the shot. A tripod is non-negotiable; a handheld phone will visibly shake over a 20-30 minute ceremony. Frame wide enough that movement (walking down the aisle, turning to face guests) stays in frame without needing to pan.',
  },
  {
    name: 'Get the audio right — this is the #1 failure point',
    text:
      'A phone or camera’s built-in microphone, placed 20-30 feet from the altar, will pick up room noise and barely register the vows. If at all possible, use a separate lavalier or shotgun microphone near the officiant, or ask the officiant to hold a small recorder, and feed that audio into your stream. If you truly have no separate mic, position the camera as close as the venue layout allows and warn remote viewers that audio may be faint.',
  },
  {
    name: 'Do a full rehearsal, not just a camera test',
    text:
      'The day before or morning of, run an actual test stream from the exact spot, at the exact settings, you’ll use for the ceremony. Have someone watch from a different network (their own phone, not the venue Wi-Fi) to confirm the stream is visible and audible from the outside. A test that only checks "does the camera turn on" misses connection and platform issues that only show up under a real stream.',
  },
  {
    name: 'Have a backup plan for connectivity',
    text:
      'Decide in advance what happens if the stream drops mid-ceremony: who notices, who restarts it, and on what device. Keep a second phone charged and ready as a backup camera, and if possible have it on a different network (e.g., a different carrier’s hotspot) than your primary setup, so a single network hiccup doesn’t take down the whole stream.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Can I really live stream a wedding with just my phone?',
    answer:
      'Yes, for a small or casual ceremony. A phone on a tripod with a stable connection and a decent streaming app will get family watching from home. The main limitations are audio quality and having no one to fix problems if something goes wrong mid-stream.',
  },
  {
    question: 'What if the venue has bad Wi-Fi?',
    answer:
      'Don’t rely on venue Wi-Fi for anything you can’t afford to lose. A mobile hotspot on a strong cellular carrier is usually more reliable than shared guest Wi-Fi at a venue, especially with a room full of guests also on their phones.',
  },
  {
    question: 'Do I need a separate microphone?',
    answer:
      'For anything beyond a backyard ceremony with a handful of guests, yes. Built-in camera and phone mics are simply too far from the officiant and couple to pick up vows clearly. A basic lavalier mic is inexpensive and makes the single biggest quality difference of anything on this list.',
  },
  {
    question: 'How far in advance should I send the stream link to guests?',
    answer:
      'At least 3-5 days before the wedding, with a reminder the morning of. Some guests will need help finding or using the link, and you don’t want to be troubleshooting that as you’re getting ready.',
  },
  {
    question: 'What’s the most common thing that goes wrong?',
    answer:
      'Audio, by a wide margin — either it’s too quiet to hear the vows or it cuts out entirely. The second most common issue is the stream operator (often a well-meaning relative) getting distracted during the ceremony and missing that the connection dropped.',
  },
];

export default function HowToLiveStreamAWeddingPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="How to Live Stream a Wedding Yourself: Step-by-Step Guide"
        description="A practical, honest walkthrough for streaming a wedding ceremony yourself — connection testing, platform choice, camera setup, audio, rehearsal, and a backup plan."
      />
      <HowToJsonLd
        name="How to Live Stream a Wedding"
        description="A step-by-step walkthrough for streaming a wedding ceremony yourself."
        steps={STEPS.map((s) => ({ name: s.name, text: s.text }))}
      />
      <FaqJsonLd items={FAQ_ITEMS} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'How to Live Stream a Wedding', path: '/guides/how-to-live-stream-a-wedding' },
        ]}
      />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">How-To Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            How to Live Stream a Wedding Yourself
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              You can DIY a wedding livestream with a phone, a tripod, a free platform like Zoom or
              Facebook Live, and a stable internet connection. The steps below cover exactly what to
              set up and test — and where DIY starts to break down for larger or higher-stakes
              weddings.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">Step-by-step walkthrough</h2>
        <ol className="space-y-8">
          {STEPS.map((step, i) => (
            <li key={step.name} className="flex gap-4">
              <span className="flex-none inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">{step.name}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
            When to hire a professional instead
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            DIY works well for a single ceremony space, a modest guest list, and a family member who
            can dedicate their full attention to running the stream. It starts to break down once the
            day gets more complex. If your ceremony and reception are in different rooms or different
            venues entirely, a DIY setup means physically moving and re-rigging equipment mid-event —
            hard to do without dropping coverage.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            A large guest list watching remotely also raises the stakes: more people relying on a
            connection that no one is actively monitoring. And if you or your family have videography-
            quality expectations — multiple angles, smooth switching, a polished feel rather than a
            static wide shot — that&rsquo;s a production skill set, not a phone-and-tripod job.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            Perhaps most importantly: someone has to run the tech during the ceremony, which usually
            means pulling a family member or friend away from actually being present at your wedding.
            A professional operator solves that by design — it&rsquo;s their only job that day.
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
      </section>
    </div>
  );
}
