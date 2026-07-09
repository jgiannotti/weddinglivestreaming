import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FaqJsonLd, ArticleJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Questions to Ask Your Wedding Live Streamer Before You Book',
  description:
    'A vetting checklist of the questions every couple should ask a wedding live streaming vendor before booking — backups, cameras, audio, pricing, and more.',
  alternates: { canonical: '/guides/questions-to-ask-your-wedding-livestreamer' },
};

const QUESTIONS = [
  {
    q: 'What’s your backup plan if the internet connection drops?',
    why:
      'Even great venues have unreliable Wi-Fi. A vendor worth hiring should have a secondary connection — a cellular hotspot or a second carrier — ready to switch to automatically or manually if the primary connection fails.',
  },
  {
    q: 'What happens if a camera or piece of equipment fails?',
    why:
      'Ask whether they travel with backup gear (a spare camera body, extra batteries, a second audio recorder). A vendor with no backup equipment is one bad battery away from losing your ceremony entirely.',
  },
  {
    q: 'How many cameras are included, and is switching between them live?',
    why:
      'This determines whether guests get one static angle or a produced feel with multiple angles. Confirm the number in writing — "multi-camera" sometimes just means a second camera recording locally, not actually switched into the live feed.',
  },
  {
    q: 'How will you capture audio during the vows?',
    why:
      'This is the single biggest quality factor in any wedding stream. Ask specifically whether they use a dedicated microphone near the officiant or couple, or if they’re relying on a camera-mounted mic from across the room — the difference in clarity is dramatic.',
  },
  {
    q: 'Who is physically operating the stream during the ceremony?',
    why:
      'Make sure a real person — not just a fixed unmanned camera — is watching the feed throughout, ready to react if something goes wrong. Ask their name and role, and whether they’ll be on-site the whole time or checking in remotely.',
  },
  {
    q: 'How long will guests have access to the recording afterward?',
    why:
      'Some vendors set a link to expire in 30, 60, or 90 days; others leave it up indefinitely. If you want family to be able to rewatch it a year from now, confirm this detail and ask what it costs to extend access if needed.',
  },
  {
    q: 'What exactly is included in the price, and what’s not?',
    why:
      'Get an itemized breakdown: number of hours, number of cameras, whether editing or a highlight reel is included, and what travel radius is covered before fees kick in. A low quoted price with a long list of add-ons can end up costing more than a higher all-in quote.',
  },
  {
    q: 'Have you streamed at this venue, or a similar one, before?',
    why:
      'Experience with your specific venue (or venue type — outdoor, low-light, historic building with thick walls) means fewer surprises about Wi-Fi dead zones, power outlet locations, or where a camera can and can’t be placed.',
  },
  {
    q: 'How soon after the wedding will we get the recorded footage?',
    why:
      'Turnaround varies widely — some vendors hand over a raw file within 24 hours, others take weeks if editing is involved. If you have out-of-town family eager to rewatch the ceremony, ask for a specific timeline in writing.',
  },
  {
    q: 'Can you provide references or examples from a real wedding you’ve streamed?',
    why:
      'A portfolio reel is useful, but ask specifically for an example from a real live wedding (not a staged demo) so you can judge actual audio clarity, framing, and how smoothly they handled the live event.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'When should I start asking these questions?',
    answer:
      'As early as possible — ideally when you’re still comparing two or three vendors, not after you’ve already put down a deposit. Most of these questions are also reasonable to ask over email before a call, so you can compare answers side by side.',
  },
  {
    question: 'What’s a red flag answer to watch for?',
    answer:
      'Vague answers about backup plans ("we’ve never had an issue") or audio setup ("the camera mic is usually fine") are worth pushing on. A vendor who streams professionally and often will have specific, confident answers to every question on this list.',
  },
  {
    question: 'Should I get the answers in writing?',
    answer:
      'Yes — ask for a written quote or contract that spells out camera count, hours covered, backup equipment, and what happens if there’s a technical failure on the day. A verbal assurance is much harder to act on if something goes wrong.',
  },
  {
    question: 'Is it rude to ask a vendor this many questions?',
    answer:
      'No — a professional vendor expects and welcomes it. These are the exact questions that separate an experienced live-streaming specialist from someone treating it as a side hustle, and a good vendor will be glad you asked.',
  },
];

export default function QuestionsToAskPage() {
  return (
    <div>
      <ArticleJsonLd
        headline="Questions to Ask Your Wedding Live Streamer Before You Book"
        description="A vetting checklist of the questions every couple should ask a wedding live streaming vendor before booking."
      />
      <FaqJsonLd items={FAQ_ITEMS} />

      <section className="bg-accent/30 border-b">
        <div className="container py-16 md:py-20">
          <p className="eyebrow mb-2">Vendor Guide</p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-medium max-w-3xl">
            Questions to Ask Your Wedding Live Streamer Before You Book
          </h1>
          <p className="mt-6 text-lg max-w-3xl font-medium">
            <strong>
              Before booking a wedding livestream vendor, ask about their backup plan for
              connectivity and equipment, how many cameras are included, how they capture audio
              during the vows, and exactly what&rsquo;s included in the price. The ten questions
              below cover everything you need to vet a vendor with confidence.
            </strong>
          </p>
        </div>
      </section>

      <section className="container py-16 max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-medium mb-6">The vetting checklist</h2>
        <ol className="space-y-8">
          {QUESTIONS.map((item, i) => (
            <li key={item.q} className="flex gap-4">
              <span className="flex-none inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold mt-0.5">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold mb-1">{item.q}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Why this matters: </span>
                  {item.why}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="container py-16">
        <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-accent/30 to-background border p-10 md:p-14 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-medium mb-3">Ready to start asking?</h2>
          <p className="text-muted-foreground mb-8">
            Browse vendors in your area and message them directly with this checklist.
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
