import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Wedding Livestream Invitation Wording: Copy-Paste Templates',
  description:
    'Exactly how to tell guests about your wedding livestream — copy-paste wording for formal invitations, wedding websites, emails, and day-of reminder texts.',
  alternates: { canonical: '/guides/wedding-livestream-invitation-wording' },
};

const TEMPLATES = [
  {
    label: 'Formal invitation insert card',
    context:
      'A small enclosure card mailed with the paper invitation. Keep it to two or three lines — the link details can live on your wedding website.',
    lines: [
      'Unable to join us in person?',
      'Our ceremony will be streamed live so you can celebrate with us from anywhere.',
      'Visit ourweddingsite.com/watch for the link and details.',
    ],
  },
  {
    label: 'Formal insert — virtual-only guests',
    context:
      'For guests invited to watch the livestream but not attend in person. The wording makes the virtual invitation feel intentional, not like a consolation prize.',
    lines: [
      'Though miles will separate us on our wedding day,',
      'we would be honored to have you witness our ceremony live.',
      'Please join us virtually on Saturday, the twelfth of September at four o’clock.',
      'Streaming details at ourweddingsite.com/watch',
    ],
  },
  {
    label: 'Wedding website announcement',
    context:
      'A short section on your wedding website. Include the platform, the start time with time zone, and when the stream actually begins relative to the ceremony.',
    lines: [
      'Can’t make it in person? We’ll be streaming the ceremony live!',
      'The stream begins at 3:45 PM Eastern on Saturday, September 12 — about 15 minutes before the processional.',
      'Just click the link below a few minutes early. No account or app needed — it works on any phone, tablet, or computer.',
      'A recording will be available at the same link afterward if you miss the live moment.',
    ],
  },
  {
    label: 'Email to far-away family and friends',
    context:
      'A warmer, personal note for the guests who most wish they could be there — grandparents, overseas relatives, friends who can’t travel.',
    lines: [
      'Dear [Name],',
      'We wish more than anything you could be with us on our wedding day — and in a way, you can be. Our ceremony will be streamed live, and it would mean the world to see your name among the guests watching.',
      'Here’s everything you need: [link]. The stream starts at 3:45 PM Eastern on September 12. Just open the link on any phone or computer — nothing to install.',
      'If the time doesn’t work where you are, the same link will have the full recording afterward.',
      'With all our love, [Names]',
    ],
  },
  {
    label: 'Day-of reminder text',
    context:
      'Send this the morning of the wedding (or have a designated helper send it). Short, with the link right in the message.',
    lines: [
      'Today’s the day! 💍 We’re streaming the ceremony live at 3:45 PM ET — watch here: [link]. Join a few minutes early. Can’t wait to celebrate with you!',
    ],
  },
  {
    label: 'Social media / group chat announcement',
    context:
      'For a wider circle when you’re comfortable sharing openly. If you want the stream private, skip public posts and share the link by email or text instead.',
    lines: [
      'We’re getting married on September 12 — and everyone is invited to watch! 🎉 The ceremony streams live at 3:45 PM ET. Link in our bio / pinned in this chat. Tune in and celebrate with us from wherever you are.',
    ],
  },
];

const TIPS = [
  {
    title: 'Always name the time zone',
    body: 'The whole point of a livestream is guests who aren’t local. “4:00 PM” means four different things across the U.S. alone — write “4:00 PM Eastern” every time, and consider adding a second zone for a cluster of overseas guests.',
  },
  {
    title: 'Tell guests when the stream starts, not just the ceremony',
    body: 'Most professional streams go live 10–15 minutes before the processional. Telling guests to join early means nobody clicks the link at 4:00 sharp and panics that it isn’t working.',
  },
  {
    title: 'Put the link on your wedding website, not the paper invite',
    body: 'Streaming links are long, ugly, and occasionally change. Print your wedding website on the insert card and keep the actual link there — you can update it any time without reprinting anything.',
  },
  {
    title: 'Say whether a recording will be available',
    body: 'For guests in distant time zones, a 4 PM Eastern ceremony may be the middle of the night. One line — “a recording will be available at the same link” — takes the pressure off.',
  },
  {
    title: 'Mention that no app or account is needed',
    body: 'Older relatives are often the most important virtual guests and the most nervous about technology. If your stream works in a plain web browser (most professional streams do), say so explicitly.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Is it okay to invite some guests to only the livestream?',
    answer:
      'Yes — virtual-only invitations are now a normal and well-understood part of wedding planning, especially for large extended families, overseas relatives, and coworkers. The key is wording that makes the virtual invitation feel intentional and warm rather than like a downgrade. Send it with the same care as a physical invitation.',
  },
  {
    question: 'Should the livestream link go on the paper invitation?',
    answer:
      'Generally no. Streaming links are long and can change if your vendor adjusts the setup. Print your wedding website address on an insert card and host the link there — you can update the website any time without reprinting invitations.',
  },
  {
    question: 'When should I send the livestream details?',
    answer:
      'Put the announcement on your wedding website as soon as the stream is arranged, then send the direct link about one week before the wedding, with a reminder text or email the morning of. Day-of reminders dramatically increase how many invited guests actually tune in.',
  },
  {
    question: 'How do I keep the livestream private?',
    answer:
      'Ask your vendor for an unlisted or password-protected stream, share the link only by email or text (not public social media), and skip posting it on open websites. Most professional wedding streaming vendors offer private, unlisted streams by default — it’s a good question to ask before booking.',
  },
  {
    question: 'Do virtual guests send gifts?',
    answer:
      'Many do, though it’s never required. If you have a registry, include the link wherever the streaming details live (usually your wedding website) so virtual guests who want to send something can find it easily.',
  },
];

export default function InvitationWordingPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Wedding Livestream Invitation Wording: Copy-Paste Templates"
        description="Exactly how to tell guests about your wedding livestream — copy-paste wording for formal invitations, wedding websites, emails, and day-of reminder texts."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Livestream Invitation Wording', path: '/guides/wedding-livestream-invitation-wording' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Etiquette Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Wedding Livestream Invitation Wording
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              To invite guests to a wedding livestream, include four things: the date and start
              time with a time zone, the link (hosted on your wedding website, not the paper
              invite), a note to join a few minutes early, and whether a recording will be
              available afterward. The copy-paste templates below cover every format — formal
              insert cards, wedding websites, emails, and day-of texts.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          Copy-paste wording templates
        </h2>
        <div className="space-y-10">
          {TEMPLATES.map((t) => (
            <div key={t.label}>
              <h3 className="font-display text-lg font-semibold mb-1">{t.label}</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">{t.context}</p>
              <blockquote className="rounded-xl border bg-card p-6 space-y-2">
                {t.lines.map((line) => (
                  <p key={line} className="leading-relaxed italic">
                    {line}
                  </p>
                ))}
              </blockquote>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-16 max-w-3xl border-t">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">
          Five rules for livestream invitations
        </h2>
        <ol className="space-y-8">
          {TIPS.map((tip, i) => (
            <li key={tip.title} className="flex gap-4">
              <span className="flex-none inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">{tip.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{tip.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-muted-foreground leading-relaxed">
          Still arranging the stream itself? Start with{' '}
          <Link href="/guides/how-to-live-stream-a-wedding" className="text-primary font-medium hover:underline">
            how to live stream a wedding
          </Link>{' '}
          for the setup, and{' '}
          <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="text-primary font-medium hover:underline">
            the questions to ask a vendor
          </Link>{' '}
          before you book one.
        </p>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Haven&rsquo;t booked the stream yet?
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
