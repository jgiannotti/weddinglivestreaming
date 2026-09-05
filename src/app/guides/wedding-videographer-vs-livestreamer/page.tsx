import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Wedding Videographer vs. Livestreamer: Do You Need Both?',
  description:
    'A videographer makes a film you watch later; a livestreamer gets the people who can’t attend into the room in real time. What each does, what each costs, when one vendor can do both, and how to choose.',
  alternates: { canonical: '/guides/wedding-videographer-vs-livestreamer' },
};

const COMPARE = [
  ['Who it’s for', 'You, years from now', 'Guests who can’t be there, on the day'],
  ['What you get', 'An edited film (3–20 min highlight, often a longer edit)', 'A live broadcast plus, usually, a raw recording'],
  ['When you see it', 'Weeks to months after the wedding', 'As it happens, then a replay link'],
  ['Cameras', 'Roaming, hand-held, cinematic', 'Fixed or lightly operated, framed for a screen'],
  ['Audio', 'Recorded to be mixed later', 'Mixed live — it has to be right the first time'],
  ['Internet', 'Not needed', 'The whole job depends on it (plus a backup)'],
  ['Typical price', '$1,500–$5,000+', '$400–$1,500 (single camera); more for multi-cam'],
];

const FAQ_ITEMS = [
  {
    question: 'What is the difference between a wedding videographer and a livestreamer?',
    answer:
      'A videographer films your wedding to produce an edited keepsake film you receive later. A livestreamer broadcasts the ceremony (and sometimes the reception) in real time so guests who cannot attend can watch live, and usually provides a recording afterward. They use overlapping gear but solve different problems: one is about memory, the other about presence.',
  },
  {
    question: 'Can my wedding videographer also livestream?',
    answer:
      'Some can, and many videography studios in our directory offer both. Ask specifically whether they bring a dedicated streaming encoder, a separate audio feed for the stream, a backup internet connection, and a second person to monitor the stream. A videographer who “also hits go live on a phone” is not the same as a livestream service, and the failure mode is a frozen picture during your vows.',
  },
  {
    question: 'Do I need both a videographer and a livestreamer?',
    answer:
      'You need a livestream if specific people you love cannot attend. You want a videographer if a polished film matters to you. Plenty of couples book only one; if budget forces a choice, book the livestream when the absent guests are close family and the film when everyone can be in the room.',
  },
  {
    question: 'Is a livestream recording good enough instead of a wedding video?',
    answer:
      'As an archive of the ceremony, yes — it is a complete, real-time record with clean audio. As a wedding film, no. A livestream recording is a fixed, mostly static view with no editing, music or storytelling. Some vendors offer a light edit of the recording as an inexpensive middle ground.',
  },
  {
    question: 'Which costs more, videography or livestreaming?',
    answer:
      'Videography. Across vendors with published pricing in our directory, single-camera livestream packages start at a median of about $950, while wedding films commonly start at $1,500 to $3,000 and rise with hours, cameras and editing. Bundling both with one vendor often saves 10–20%.',
  },
];

export default function VideographerVsLivestreamerPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Wedding Videographer vs. Livestreamer: Do You Need Both?"
        description="What a videographer and a livestreamer each deliver, what each costs, when one vendor can do both, and how to decide."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Videographer vs. Livestreamer', path: '/guides/wedding-videographer-vs-livestreamer' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Comparison</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Wedding Videographer vs. Livestreamer: Do You Need Both?
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              A wedding videographer makes a film you watch later. A livestreamer puts the people
              who can&rsquo;t attend in the room while it happens. They use similar cameras and
              solve different problems, which is why the answer to &ldquo;do I need both?&rdquo; is
              simply: who can&rsquo;t be there, and how much does a keepsake film matter to you?
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">Side by side</h2>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="text-left font-semibold p-4"></th>
                <th className="text-left font-semibold p-4">Videographer</th>
                <th className="text-left font-semibold p-4">Livestreamer</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {COMPARE.map(([k, a, b]) => (
                <tr key={k}>
                  <td className="p-4 font-medium align-top whitespace-nowrap">{k}</td>
                  <td className="p-4 align-top text-muted-foreground">{a}</td>
                  <td className="p-4 align-top text-muted-foreground">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Livestream prices are from vendors with published pricing in our directory; see the{' '}
          <Link href="/guides/wedding-live-streaming-cost-by-state" className="underline underline-offset-4 hover:text-primary">
            cost-by-state data
          </Link>
          . Videography ranges are typical published package prices and vary widely by market.
        </p>
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
            Why they aren&rsquo;t interchangeable
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            The difference isn&rsquo;t the camera; it&rsquo;s what happens to the signal. A
            videographer records to a memory card and fixes everything later: audio is synced and
            cleaned in the edit, a shaky moment is cut, an underexposed shot is graded. A
            livestreamer has no &ldquo;later.&rdquo; The audio mix, the shot, and the internet
            connection all have to be right at the moment your partner says &ldquo;I do,&rdquo;
            with a few hundred people watching from their kitchens. That is a live-broadcast skill,
            and the gear reflects it: an encoder, a bonded cellular or wired backup, a dedicated
            microphone feed from the officiant, and someone watching a monitor for the whole
            ceremony.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            It cuts the other way too. A livestream camera is placed to stay out of the aisle and
            hold a steady, watchable frame. A videographer is moving, close, and hunting for the
            shot that will carry the film. Ask one person to do both jobs at once and one of them
            suffers, which is why studios that offer both send two people or lock the stream camera
            on a tripod.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Many vendors in our directory are videography studios that added livestreaming and do it
            well. The tell is in how they answer three questions: what is your backup internet, how
            does the officiant&rsquo;s audio reach the stream, and who is watching the stream while
            you shoot? Our{' '}
            <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="underline underline-offset-4 hover:text-primary">
              vetting checklist
            </Link>{' '}
            covers the rest.
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">How to decide</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Book the livestream first</strong> if a grandparent,
            a deployed sibling, or a parent in care can&rsquo;t travel. Presence on the day is the
            thing no other purchase replaces, and it is the cheaper of the two. Our{' '}
            <Link href="/guides/is-a-wedding-livestream-worth-it" className="underline underline-offset-4 hover:text-primary">
              honest look at whether it&rsquo;s worth it
            </Link>{' '}
            is a five-minute read.
          </p>
          <p>
            <strong className="text-foreground">Book the videographer first</strong> if everyone you
            love can be in the room and you know you&rsquo;ll rewatch a film. In that case a
            livestream is a nice-to-have, and a{' '}
            <Link href="/guides/diy-vs-professional-wedding-livestream" className="underline underline-offset-4 hover:text-primary">
              DIY stream
            </Link>{' '}
            for the handful of far-flung friends is often enough.
          </p>
          <p>
            <strong className="text-foreground">Book both from one vendor</strong> when you want
            both and the vendor genuinely staffs both. Bundles typically save 10–20% and eliminate
            two crews negotiating for the same spot at the end of the aisle. Use the{' '}
            <Link href="/directory" className="underline underline-offset-4 hover:text-primary">
              directory
            </Link>{' '}
            filters for multi-camera crews if you want a single team that does it all.
          </p>
        </div>
      </section>

      <section className="container pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Find a vendor who does the job you actually need
          </h2>
          <p className="text-muted-foreground mb-8">
            Browse livestream specialists and videography studios that stream, by state and city.
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
