import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy-policy' } };

export default function PrivacyPolicyPage() {
  return (
    <div className="container py-10 md:py-14">
      <p className="eyebrow mb-2">Legal</p>
      <h1 className="font-display text-3xl md:text-4xl mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: May 2026</p>

      <div className="prose-measure text-foreground/80 space-y-6 leading-relaxed">
        <p>
          WeddingLiveStreaming.com (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a directory of wedding live streaming vendors. This policy explains what we collect, how we use it, and the choices you have.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">What we collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Account info:</strong> email address and name when you register.</li>
          <li><strong>Vendor profile info:</strong> business name, location, photos, website, phone, and description if you list a business.</li>
          <li><strong>Messages:</strong> inquiries you send to vendors are stored so vendors can respond.</li>
          <li><strong>Usage data:</strong> standard server logs and basic analytics (page views, referrers) to keep the site fast and find bugs.</li>
          <li><strong>Payment info:</strong> handled entirely by Stripe. We never see or store your card details.</li>
        </ul>

        <h2 className="font-display text-2xl font-semibold mt-8">How we use it</h2>
        <p>
          To run the site, route messages between couples and vendors, send transactional emails (password resets, inquiry notifications), and improve our service. We do not sell your data, ever.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Your choices</h2>
        <p>
          You can update your profile or delete your account at any time from your dashboard. Email <a href="mailto:hello@weddinglivestreaming.com" className="text-primary hover:underline">hello@weddinglivestreaming.com</a> for any privacy request — we&rsquo;ll respond within 30 days.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Third parties</h2>
        <p>
          We use Supabase (database + auth), Vercel (hosting), Resend (email), Stripe (payments), and OpenStreetMap (maps). Each has its own privacy policy.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Contact</h2>
        <p>
          Questions? <a href="mailto:hello@weddinglivestreaming.com" className="text-primary hover:underline">hello@weddinglivestreaming.com</a>
        </p>
      </div>
    </div>
  );
}
