import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Livestreaming a Religious Wedding Ceremony: Catholic, Jewish, Hindu, Muslim & Orthodox',
  description:
    'How to livestream a religious wedding respectfully: who to ask for permission, where cameras can go, timing and length by tradition, audio in sacred spaces, and the moments many communities ask you not to broadcast.',
  alternates: { canonical: '/guides/livestreaming-a-religious-wedding-ceremony' },
};

const TRADITIONS = [
  {
    name: 'Catholic Mass',
    ask: 'The parish office and the presiding priest. Many parishes already stream their own liturgies and have a fixed camera position they prefer you use.',
    where: 'Typically outside the sanctuary (the altar area), often from a side aisle or the choir loft. Flash and movement during the consecration are commonly restricted.',
    length: 'A full nuptial Mass runs 60–75 minutes; a ceremony without Mass about 30. Plan coverage accordingly.',
    note: 'Ask whether the parish’s sound system has a feed you can take — church acoustics make a room microphone nearly useless for vows.',
  },
  {
    name: 'Jewish (Reform, Conservative, Orthodox)',
    ask: 'The rabbi and, for a synagogue wedding, the congregation. Practices differ widely between movements.',
    where: 'Under the chuppah is intimate and small; a raised camera a few rows back sees the couple, the rabbi, and the glass. For Orthodox weddings, ask about mixed seating and whether cameras may face each section.',
    length: 'The ceremony itself is 20–40 minutes; the bedeken and ketubah signing beforehand are often worth streaming if the officiant agrees.',
    note: 'Weddings are not held on Shabbat or major holidays, and many observant families avoid electronics on those days — a Saturday-night wedding after sundown is common and may start late.',
  },
  {
    name: 'Hindu',
    ask: 'The pandit (priest) and the family elders hosting the event; the venue often has its own rules for open flame near equipment.',
    where: 'The mandap is the focal point, and the couple frequently sits low, so a camera at seated eye level from the front corners works far better than a tall tripod at the back.',
    length: 'Ceremonies commonly run 90 minutes to three hours, with distinct rituals (baraat, jai mala, saptapadi). Streaming vendors usually price this as extended coverage; agree the moments that must be live.',
    note: 'Many families abroad watch from India and the Gulf at odd hours; a replay and a lower-bitrate option for viewers on slower connections are worth asking for.',
  },
  {
    name: 'Muslim (Nikah and Walima)',
    ask: 'The imam or officiant and the families; practices vary by community and mosque.',
    where: 'The nikah is often brief and may take place in a mosque, home, or hall. Where seating is separated by gender, ask which sections may be filmed and whether a second camera per section is preferred over one wide shot.',
    length: 'The nikah itself can take 15–30 minutes; the walima reception is a separate event, sometimes on another day.',
    note: 'Some families prefer the stream to be private and unrecorded, or recorded but never posted. Confirm and honor that in writing.',
  },
  {
    name: 'Eastern Orthodox',
    ask: 'The parish priest. Orthodox weddings are sacraments with fixed liturgical structure; the priest will know where cameras have stood before.',
    where: 'Outside the iconostasis and sanctuary. The couple is crowned and led around the table three times, so a camera with room to follow that movement from a side position is ideal.',
    length: 'Betrothal and crowning together run 45–60 minutes.',
    note: 'Chanting and responses are continuous; a microphone feed from the chanters’ stand or the priest’s lapel makes the stream intelligible.',
  },
  {
    name: 'Protestant and non-denominational churches',
    ask: 'The pastor and the church office. Most churches with a Sunday livestream will let your vendor use their setup or plug into it.',
    where: 'Usually flexible: the platform edge, a side aisle, or the balcony. Ask about aisle restrictions during the processional.',
    length: '30–45 minutes.',
    note: 'Many churches have a licensed streaming setup for their own services; if you use it, confirm the recording is yours and how long the church keeps it.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Can you livestream a Catholic wedding Mass?',
    answer:
      'Usually yes, with the parish’s permission. Many parishes stream their own liturgies and will tell your vendor where the camera may stand — typically outside the sanctuary, often from a side aisle or choir loft — and which moments, such as the consecration, should not be filmed up close. Ask the parish office and the priest before booking a vendor.',
  },
  {
    question: 'Is it disrespectful to livestream a religious ceremony?',
    answer:
      'Not when it is done with permission and discretion. Most clergy welcome it because it lets elderly and distant members of the community attend. What causes offense is movement, noise, and cameras in sacred spaces, so the rule is one fixed camera, a silent operator, and whatever boundaries the officiant sets.',
  },
  {
    question: 'How do you get good audio in a church or temple?',
    answer:
      'Take a feed from the building’s sound system if there is one, or put a small lapel microphone on the officiant. A microphone on the camera at the back of an echoing space records reverb, not words. This is the single biggest quality difference between amateur and professional religious ceremony streams.',
  },
  {
    question: 'Which religious weddings take the longest to stream?',
    answer:
      'Hindu ceremonies are the longest in our vendors’ experience, commonly 90 minutes to three hours with several distinct rituals, followed by full Catholic nuptial Masses and Orthodox ceremonies at roughly an hour. Vendors usually price multi-hour ceremonies as extended coverage, so agree in advance which moments must be live.',
  },
  {
    question: 'Are there religious weddings you cannot stream at all?',
    answer:
      'Some communities restrict photography and electronics during sacred moments or on holy days, and some families simply prefer privacy. When a tradition or family says no, the answer is no; a recording made afterward from a permitted position, or a stream of the reception only, is often an acceptable alternative.',
  },
];

export default function ReligiousCeremonyGuidePage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Livestreaming a Religious Wedding Ceremony"
        description="How to livestream Catholic, Jewish, Hindu, Muslim, Orthodox and Protestant wedding ceremonies respectfully: permission, camera placement, timing, audio, and the moments not to broadcast."
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Religious Ceremonies', path: '/guides/livestreaming-a-religious-wedding-ceremony' },
        ]}
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Ceremony Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Livestreaming a Religious Wedding Ceremony
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              Almost every religious wedding can be livestreamed, and most clergy welcome it. The
              rules are the same everywhere: ask the officiant first, keep the camera fixed and out
              of sacred space, get audio from a microphone rather than the back of the room, and
              honor the moments a community asks you not to broadcast. What differs by tradition is
              where the camera goes, how long you&rsquo;re streaming, and what to ask.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-4xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">By tradition</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          These are starting points, not rules. Practice varies between congregations and families
          within every tradition, and the officiant&rsquo;s answer always wins.
        </p>
        <div className="space-y-5">
          {TRADITIONS.map((t) => (
            <div key={t.name} className="rounded-2xl border bg-card p-6 md:p-7">
              <h3 className="font-display text-xl md:text-2xl font-medium mb-4">{t.name}</h3>
              <dl className="grid gap-3 text-sm md:grid-cols-[140px_1fr]">
                <dt className="font-semibold">Who to ask</dt>
                <dd className="text-muted-foreground">{t.ask}</dd>
                <dt className="font-semibold">Camera</dt>
                <dd className="text-muted-foreground">{t.where}</dd>
                <dt className="font-semibold">Length</dt>
                <dd className="text-muted-foreground">{t.length}</dd>
                <dt className="font-semibold">Worth knowing</dt>
                <dd className="text-muted-foreground">{t.note}</dd>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/30 py-16">
        <div className="container max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">
            The three questions to ask every officiant
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Where may the camera stand, and may it move?</strong>{' '}
              Get a specific spot. &ldquo;Somewhere discreet&rdquo; becomes a disagreement on the
              day; &ldquo;the second pillar on the left, on a tripod&rdquo; does not.
            </p>
            <p>
              <strong className="text-foreground">Is there a sound feed we can use?</strong> Most
              houses of worship have a mixer with a spare output. A cable from it is the difference
              between vows your grandmother can hear and vows she can&rsquo;t. Our{' '}
              <Link href="/guides/how-to-livestream-a-church-wedding" className="underline underline-offset-4 hover:text-primary">
                church livestream guide
              </Link>{' '}
              covers the audio setup in detail.
            </p>
            <p>
              <strong className="text-foreground">Is there anything we should not show?</strong>{' '}
              Ask it exactly that way. The answer might be a moment, a section of the room, or
              nothing at all — but asking is what makes clergy comfortable saying yes to the rest.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-4">Choosing a vendor for a religious ceremony</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Ask whether they have streamed in that tradition before, and in that building if
          possible. Vendors who have done a three-hour Hindu ceremony know to bring power and
          extra storage; vendors who have worked a Catholic Mass know where the sanctuary line
          is without being told. Ask how they handle audio in a large reverberant room, and
          whether they will visit the venue beforehand. Our{' '}
          <Link href="/guides/questions-to-ask-your-wedding-livestreamer" className="underline underline-offset-4 hover:text-primary">
            vetting checklist
          </Link>{' '}
          has the rest, and the{' '}
          <Link href="/guides/wedding-live-streaming-cost-by-state" className="underline underline-offset-4 hover:text-primary">
            cost data
          </Link>{' '}
          shows what extended coverage typically adds.
        </p>
      </section>

      <section className="container pb-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">
            Find a vendor who has done this before
          </h2>
          <p className="text-muted-foreground mb-8">
            Browse livestream vendors by state and city, and ask about your tradition before you book.
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
