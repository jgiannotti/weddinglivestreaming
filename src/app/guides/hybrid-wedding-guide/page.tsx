import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'How to Plan a Hybrid Wedding: In-Person and Virtual Guests Together',
  description:
    'A hybrid wedding hosts guests in the room and guests on a screen at the same time. A practical plan: who to invite virtually, the timeline, the tech, etiquette for remote guests, and what it costs.',
  alternates: { canonical: '/guides/hybrid-wedding-guide' },
};

const TIMELINE = [
  {
    when: '3–6 months out',
    what: 'Decide who is virtual and why (distance, health, deployment, visas). Book a livestream vendor or assign a DIY owner. Confirm the venue has internet or a cellular signal; if not, the vendor needs to know now.',
  },
  {
    when: '6–8 weeks out',
    what: 'Send virtual invitations with the date, time zone, and a placeholder link. Ask virtual guests to RSVP so you know the audience is real. Decide whether the reception (toasts, first dance) is streamed too.',
  },
  {
    when: '2 weeks out',
    what: 'Send the actual link and a one-line “how to watch” note (phone, TV, laptop). Name a host for the virtual room — a cousin or friend who welcomes people and relays a message to the couple if something breaks.',
  },
  {
    when: 'Day before',
    what: 'Vendor tests the stream from the actual ceremony spot. Remind virtual guests of the start time in their time zone. Put the link and a QR code in the printed program for anyone who wants to share it.',
  },
  {
    when: 'Ceremony day',
    what: 'Stream goes live 10–15 minutes early with a title card and music. Officiant acknowledges the remote guests once — it matters more than you’d think. The host posts the replay link within the hour.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What is a hybrid wedding?',
    answer:
      'A hybrid wedding is one where some guests attend in person and others attend virtually through a livestream, at the same time. It became common in 2020 and stayed because it solves a permanent problem: the people who matter most are not always able to travel.',
  },
  {
    question: 'How do you include virtual guests without making the ceremony feel like a broadcast?',
    answer:
      'Keep the camera out of the aisle and the operator silent, let the officiant welcome the remote guests once at the start, and give virtual guests a host of their own in the chat. The couple should not be managing a screen; that is what the host and the vendor are for.',
  },
  {
    question: 'Should virtual guests get an invitation?',
    answer:
      'Yes — a proper one, not a forwarded link. It tells them they are wanted, gives them the time in their own time zone, and gets you an RSVP so you know who is watching. Our invitation wording guide has copy-and-paste templates.',
  },
  {
    question: 'Do virtual guests give gifts?',
    answer:
      'Many want to. Include your registry or a gift link on the virtual invitation and the watch page. Do not expect it; a guest who could not travel is already doing the thing you asked, which is showing up.',
  },
  {
    question: 'How much does a hybrid wedding cost compared to a regular one?',
    answer:
      'The only added cost is the livestream: a DIY setup runs $0–$150, and professional packages in our directory start at a median of about $950 for a single-camera ceremony stream. Everything else about the wedding costs what it would have anyway.',
  },
  {
    question: 'Can deployed military family watch a wedding livestream?',
    answer:
      'Usually, yes. Most private stream links work on base networks and over cellular, but bandwidth on deployment can be limited, so a vendor who offers an adaptive-bitrate stream and a replay is worth asking for. Tell the vendor in advance; many will run a lower-bitrate option specifically for one viewer.',
  },
];

export default function HybridWeddingGuidePage() {
  return (
    <div>
      <ArticleJsonLd
        headline="How to Plan a Hybrid Wedding: In-Person and Virtual Guests Together"
        description="A practical plan for a hybrid wedding: who to invite virtually, the timeline, the tech, remote-guest etiquette, and what it costs."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Hybrid Wedding Guide', path: '/guides/hybrid-wedding-guide' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Planning Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            How to Plan a Hybrid Wedding
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              A hybrid wedding hosts guests in the room and guests on a screen at the same time. It
              takes one extra vendor (or one trusted friend with a tripod), one extra invitation, and
              one person whose job is the virtual room. Do those three things and the remote guests
              feel invited rather than tolerated; skip them and you have a phone propped on a chair.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
          Start with the list, not the tech
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Write down who is virtual and why. Grandparents who can&rsquo;t fly. A sibling on
          deployment. Friends abroad waiting on a visa. A parent in care. New parents with a
          two-week-old. That list decides everything else: whether you need a professional
          (grandparents and deployed family are a yes — reliability is the whole point), whether
          the reception should be streamed (if the virtual list is mostly close family, yes; if
          it&rsquo;s college friends, the ceremony is enough), and what time you start (a 6pm
          ceremony in California is 3am in Manila).
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Then count them honestly. A stream for two people can be simple and personal — a tablet
          on a stand, a video call, a cousin holding the phone up during the recessional so
          Grandma gets waved at. A stream for forty needs a real link, a host, and someone who
          knows what to do when the venue Wi-Fi drops. Our{' '}
          <Link href="/guides/diy-vs-professional-wedding-livestream" className="underline underline-offset-4 hover:text-primary">
            DIY vs. professional comparison
          </Link>{' '}
          draws that line in detail.
        </p>
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">The hybrid timeline</h2>
          <div className="space-y-4">
            {TIMELINE.map((t) => (
              <div key={t.when} className="rounded-xl border bg-card p-5">
                <p className="eyebrow mb-1">{t.when}</p>
                <p className="text-muted-foreground leading-relaxed">{t.what}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
          Etiquette that makes virtual guests feel present
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Acknowledge them once, out loud.</strong> A single
            line from the officiant — &ldquo;and to everyone joining us from Manila, Munich, and
            Grandma Rose in Sarasota, welcome&rdquo; — is the moment remote guests talk about
            afterward. More than once and it becomes a broadcast.
          </p>
          <p>
            <strong className="text-foreground">Give the virtual room a host.</strong> Someone who
            greets people as they join, answers &ldquo;is it starting?&rdquo;, and relays a message
            to the vendor if the audio is off. The couple should never be the ones checking a
            screen.
          </p>
          <p>
            <strong className="text-foreground">Send a real invitation.</strong> Not a forwarded
            link. Date, start time with time zone, how to watch, and a request to RSVP. Our{' '}
            <Link href="/guides/wedding-livestream-invitation-wording" className="underline underline-offset-4 hover:text-primary">
              invitation wording templates
            </Link>{' '}
            cover formal, casual, and reception-only versions.
          </p>
          <p>
            <strong className="text-foreground">Tell them how to watch.</strong> A grandparent
            watching on a phone held six inches from her face is a solved problem — send the{' '}
            <Link href="/guides/how-to-watch-a-wedding-livestream" className="underline underline-offset-4 hover:text-primary">
              how-to-watch guide
            </Link>{' '}
            and someone in the family can get it on the TV.
          </p>
          <p>
            <strong className="text-foreground">Post the replay fast.</strong> Someone always
            misses it — a time zone, a shift, a toddler. A replay link within the hour, and an
            edited version later if you have one, turns a missed ceremony into a watched one.
          </p>
        </div>
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
            Tech decisions, in order of how much they matter
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">Audio.</strong> Remote guests forgive a soft
            picture and never forgive not hearing the vows. A microphone on the officiant (or a feed
            from the venue&rsquo;s system) into the stream is the single most important line item.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">Internet, with a backup.</strong> Venue Wi-Fi is
            not a plan. A professional brings bonded cellular or a dedicated hotspot and tests from
            the ceremony spot the day before. If you are streaming an{' '}
            <Link href="/guides/how-to-livestream-an-outdoor-wedding" className="underline underline-offset-4 hover:text-primary">
              outdoor wedding
            </Link>
            , read that guide first; connectivity is the make-or-break.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            <strong className="text-foreground">Camera placement.</strong> One camera at the end of
            the aisle, slightly raised, sees both faces during the vows. A second camera on the
            guests is what makes a stream feel like a wedding rather than a security feed. Three is
            a production.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Platform.</strong> A private link on a dedicated
            wedding streaming service or a professional&rsquo;s own player beats social platforms,
            which can mute your processional for{' '}
            <Link href="/guides/wedding-livestream-music-copyright" className="underline underline-offset-4 hover:text-primary">
              music copyright
            </Link>{' '}
            mid-ceremony. See{' '}
            <Link href="/guides/zoom-vs-youtube-vs-professional-wedding-livestream" className="underline underline-offset-4 hover:text-primary">
              Zoom vs. YouTube vs. professional
            </Link>{' '}
            for the trade-offs.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Find a livestream vendor near your venue
          </h2>
          <p className="text-muted-foreground mb-8">
            Compare vendors by state and city, with published starting prices where vendors share them.
          </p>
          <Button asChild size="lg">
            <Link href="/directory">Browse Vendors</Link>
          </Button>
        </div>
      </section>

      <section className="container pb-16 max-w-3xl">
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
