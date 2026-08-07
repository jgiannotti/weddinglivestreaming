import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Wedding Livestream Music & Copyright: Why Streams Get Muted',
  description:
    'Why YouTube and Facebook mute or block wedding livestreams over music, which platforms are safer, and how to keep your ceremony songs without losing the stream.',
  alternates: { canonical: '/guides/wedding-livestream-music-copyright' },
};

const POINTS = [
  {
    title: 'Why wedding streams get muted or taken down',
    body: 'YouTube and Facebook scan live streams and uploaded videos with automated copyright systems (Content ID and Rights Manager). Recorded commercial songs — your processional track, the DJ’s playlist behind the toasts — get flagged automatically. The result ranges from muted audio during that section, to a blocked replay, to (rarely) the live stream itself being interrupted. It’s automated: the system can’t tell a wedding from a concert bootleg.',
  },
  {
    title: 'Live ceremony vs. the replay — two different risks',
    body: 'Enforcement is usually lighter during the live broadcast and stricter on the recorded replay that stays online. Many couples stream the ceremony live without incident, then find the replay muted the next day. If the replay matters to you (and for far-away family it usually matters most), plan for copyright from the start.',
  },
  {
    title: 'The platform choice matters more than anything',
    body: 'Public platforms with ad businesses police music hardest: Facebook and YouTube are the strictest. Dedicated video hosts (Vimeo) and the private, direct-to-viewer platforms most professional wedding streamers use enforce far less aggressively or not at all for a private audience. This is a real, under-appreciated reason professional streams are delivered on private pages instead of a public YouTube link.',
  },
  {
    title: 'Live performers are generally safer than recordings',
    body: 'A string quartet playing a pop song live is far less likely to trigger automated matching than the original recording — content-matching systems key on the exact recorded master. This is not legal advice, but as a practical matter: live musicians rarely cause mutes; Spotify-through-the-PA frequently does.',
  },
  {
    title: 'How to keep your songs and your stream',
    body: 'Practical options, roughly in order: deliver the stream on a private platform rather than public YouTube/Facebook; ask your vendor how they handle music (experienced ones have an answer ready — it’s on the vetting checklist); have key moments performed live; or accept that the public replay may mute a two-minute section and keep a separately recorded file as the archive. Professional vendors typically record clean local copies regardless of what the platform does.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Can I play copyrighted music on my wedding livestream?',
    answer:
      'Legally, streaming recorded commercial music to an online audience implicates public-performance and sync rights that a private wedding doesn’t. Practically, enforcement is automated: on YouTube and Facebook, recorded songs often trigger muting on the replay and occasionally on the live stream. Private streaming platforms — which most professional wedding streamers use — rarely have this problem for an invited audience. This guide is practical information, not legal advice.',
  },
  {
    question: 'Why did YouTube mute part of my wedding video?',
    answer:
      'Content ID matched a section of your audio to a commercial recording — typically the processional song or DJ music — and applied the rights holder’s policy, which is often "mute the matched segment" or "block the video." You can dispute a claim, replace the audio in that section, or re-host the video on a platform without automated matching.',
  },
  {
    question: 'Which platform is safest for wedding livestream music?',
    answer:
      'Private, direct-delivery streaming pages (what most professional wedding vendors provide) are safest, followed by Vimeo. Public YouTube and Facebook streams are the most likely to get music flagged. If you must use YouTube, an unlisted stream is still scanned — unlisted is about visibility, not copyright.',
  },
  {
    question: 'Will a livestream get my DJ or band in trouble?',
    answer:
      'The claims land on the account that hosts the stream, not on the performers — and venues/DJs typically hold performance licenses covering the in-person event, which don’t extend to the online broadcast. In practice the consequence is muted or blocked video, not legal action against anyone. Ask your streaming vendor how they handle it; it’s a routine part of the job.',
  },
  {
    question: 'Does hiring a professional streamer solve the music problem?',
    answer:
      'Largely, yes — experienced wedding streamers deliver on private platforms where automated matching isn’t an issue, keep clean local recordings as a backup archive, and know which moments (grand entrance, first dance) are riskiest on public platforms. It’s a fair question to ask any vendor before booking.',
  },
];

export default function MusicCopyrightPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Wedding Livestream Music & Copyright: Why Streams Get Muted"
        description="Why YouTube and Facebook mute wedding livestreams over music, which platforms are safer, and how to keep your songs without losing the stream."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Music & Copyright', path: '/guides/wedding-livestream-music-copyright' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Music &amp; Copyright</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Wedding Livestream Music &amp; Copyright
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              Recorded commercial music is the #1 reason wedding livestreams get muted or blocked
              — YouTube and Facebook scan streams automatically and can silence your processional
              song on the replay. The fixes: stream on a private platform (what most professional
              vendors do), favor live musicians for key moments, and keep a clean local recording
              as the archive. Here&rsquo;s how it actually works.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          What every couple should know
        </h2>
        <div className="space-y-6">
          {POINTS.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-muted-foreground leading-relaxed">
          Choosing where to stream? See{' '}
          <Link href="/guides/zoom-vs-youtube-vs-professional-wedding-livestream" className="text-primary font-medium hover:underline">
            Zoom vs. YouTube vs. professional platforms
          </Link>
          . Vetting a vendor? Add &ldquo;how do you handle music copyright?&rdquo; to{' '}
          <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="text-primary font-medium hover:underline">
            the questions checklist
          </Link>
          .
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Professional streams don&rsquo;t get muted
          </h2>
          <p className="text-muted-foreground mb-8">
            Private delivery platforms and clean local recordings are standard with professional
            vendors. Find one near you and ask how they handle music — free to message.
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
