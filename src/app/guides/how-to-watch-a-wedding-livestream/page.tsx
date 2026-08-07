import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'How to Watch a Wedding Livestream (Guest Guide)',
  description:
    'A simple guide for wedding guests watching a livestream — how to join on any phone, tablet, computer, or TV, plus fixes for the most common problems.',
  alternates: { canonical: '/guides/how-to-watch-a-wedding-livestream' },
};

const STEPS = [
  {
    title: 'Find the link the couple sent you',
    body: 'The link usually arrives by email, text message, or on the couple’s wedding website. Search your inbox for the couple’s names or “wedding” if you can’t find it. If the wedding is soon and you have no link, ask the couple or a family member — don’t wait until ceremony time.',
  },
  {
    title: 'Open the link a few minutes early',
    body: 'Tap or click the link 10–15 minutes before the ceremony start time. Most streams go live early with a title screen or venue view, so seeing something — even a still image — means you’re in the right place. Nothing to install: nearly all wedding streams play right in your web browser.',
  },
  {
    title: 'Check your sound',
    body: 'Make sure your device volume is up and the player isn’t muted — most video players start muted, with a small speaker icon in the corner of the video you can tap to unmute. On iPhones, also check the physical silent switch on the side of the phone.',
  },
  {
    title: 'Turn your phone sideways (or use a bigger screen)',
    body: 'Rotating your phone to landscape makes the video fill the screen. Better yet, watch on a tablet, laptop, or TV. Tap the square “full screen” icon in the video player corner for the biggest picture.',
  },
  {
    title: 'Settle in — and say hello if there’s a chat',
    body: 'Many streams have a live chat or guestbook where remote guests leave messages the couple reads afterward. A quick “Watching from Ohio — you look beautiful! Love, Aunt Carol” genuinely makes the couple’s day.',
  },
];

const TROUBLESHOOTING = [
  {
    problem: 'The link opens but nothing is playing',
    fix: 'You’re probably early — most streams start 10–15 minutes before the ceremony. Leave the page open and it will start on its own, or refresh the page at start time. If it’s past start time, refresh once; ceremonies often start a little late.',
  },
  {
    problem: 'The video keeps freezing or buffering',
    fix: 'This is almost always your internet connection, not the stream. Move closer to your Wi-Fi router, or switch from Wi-Fi to cellular data (or the reverse). Closing other apps and browser tabs helps too. If it still stutters, pause for 10 seconds and press play — you’ll be slightly behind live, but smooth.',
  },
  {
    problem: 'There’s video but no sound',
    fix: 'Tap the video once and look for a crossed-out speaker icon — tap it to unmute. Then check your device volume buttons. On an iPhone, flip the silent switch on the side. If you’re on a computer, check the tab isn’t muted (right-click the browser tab).',
  },
  {
    problem: 'It says the video is private or unavailable',
    fix: 'Double-check you’re using the exact link you were sent (not searching for it). If it still won’t open, the link may have changed — text the couple’s designated helper or another guest for the current link. A recording is almost always available afterward, so you won’t miss it forever.',
  },
  {
    problem: 'I missed the live ceremony',
    fix: 'Don’t panic — nearly all wedding livestreams are recorded, and the recording is usually available at the same link within hours. Check back later or ask the couple where the replay lives.',
  },
];

const TV_OPTIONS = [
  {
    title: 'Smart TV browser',
    body: 'Many smart TVs have a web browser app — open it and type in the stream link. Clunky to type, but it works.',
  },
  {
    title: 'Cast from your phone',
    body: 'If the stream is on YouTube or Vimeo, use the cast icon (a rectangle with Wi-Fi waves) to send it to a Chromecast, Roku, or smart TV on the same Wi-Fi network. AirPlay works the same way for Apple TV.',
  },
  {
    title: 'HDMI cable from a laptop',
    body: 'The most reliable option: plug a laptop into the TV with an HDMI cable, open the link, and press full screen. No apps, no casting quirks.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Do I need an account or app to watch a wedding livestream?',
    answer:
      'Almost never. Most wedding livestreams play directly in a web browser on any phone, tablet, or computer — you just tap the link. A few platforms (like a private Zoom ceremony) may ask you to open an app, but the invitation will say so if that’s the case.',
  },
  {
    question: 'Is it free to watch a wedding livestream?',
    answer:
      'Yes. Guests never pay to watch a wedding livestream — the couple arranges the stream. If a link ever asks you for payment or a credit card, it is not the couple’s real stream; close it and ask the couple for the correct link.',
  },
  {
    question: 'What should I wear or do while watching?',
    answer:
      'Whatever you like — that’s the joy of attending remotely. Some families do dress up, set out cake, or gather several relatives around one TV to make it an occasion. If the stream has two-way video (like Zoom), assume you can be seen and mute your microphone during the ceremony.',
  },
  {
    question: 'Can I watch the wedding again later?',
    answer:
      'Usually yes. Most professional wedding streams are recorded and the replay appears at the same link, often within a few hours. Some couples keep it up indefinitely; others take it down after a month or two — so watch (and re-watch) sooner rather than later.',
  },
  {
    question: 'Should I still send a gift if I’m attending virtually?',
    answer:
      'It’s a thoughtful gesture and many virtual guests do, but it’s not obligatory. The couple’s wedding website usually links their registry. A heartfelt message in the stream’s chat or guestbook is also genuinely treasured.',
  },
  {
    question: 'The couple hasn’t sent a link — how do I ask without being pushy?',
    answer:
      'A short message a week or so before the wedding is perfectly polite: “We’re so excited to watch your ceremony — could you send the streaming link when you have it?” Couples are juggling a lot; reminders are welcome, not rude.',
  },
];

export default function HowToWatchPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="How to Watch a Wedding Livestream (Guest Guide)"
        description="A simple guide for wedding guests watching a livestream — how to join on any device, plus fixes for the most common problems."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'How to Watch a Wedding Livestream', path: '/guides/how-to-watch-a-wedding-livestream' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Guest Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            How to Watch a Wedding Livestream
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              To watch a wedding livestream, open the link the couple sent you (by text, email,
              or their wedding website) in any web browser about 10&ndash;15 minutes before the
              ceremony, unmute the video, and turn your phone sideways for a bigger picture. No
              app, account, or payment is needed. If something isn&rsquo;t working, the fixes
              below solve nearly every problem in under a minute.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          Joining the stream, step by step
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

      <section className="container py-16 max-w-3xl border-t">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Something not working?
        </h2>
        <p className="text-muted-foreground mb-8">
          The five problems remote guests actually hit — and the one-minute fix for each.
        </p>
        <div className="space-y-6">
          {TROUBLESHOOTING.map((item) => (
            <div key={item.problem} className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-lg font-semibold mb-2">{item.problem}</h3>
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">The fix: </span>
                {item.fix}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16 max-w-3xl border-t">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-2">
          Watching on a TV
        </h2>
        <p className="text-muted-foreground mb-8">
          Gathering the family around a big screen? Three ways to get the stream on a TV, easiest
          first.
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {TV_OPTIONS.map((opt) => (
            <div key={opt.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-base font-semibold mb-2">{opt.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{opt.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-muted-foreground leading-relaxed">
          Planning a wedding yourself? See{' '}
          <Link href="/guides/how-to-live-stream-a-wedding" className="text-primary font-medium hover:underline">
            how to live stream a wedding
          </Link>{' '}
          and{' '}
          <Link href="/guides/wedding-livestream-invitation-wording" className="text-primary font-medium hover:underline">
            how to word the invitation for remote guests
          </Link>
          .
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Planning your own wedding livestream?
          </h2>
          <p className="text-muted-foreground mb-8">
            Find a professional wedding live streaming vendor near you — free to search, free to
            contact.
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
