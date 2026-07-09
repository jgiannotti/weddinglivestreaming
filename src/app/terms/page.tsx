import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service', alternates: { canonical: '/terms' } };

export default function TermsPage() {
  return (
    <div className="container py-10 md:py-14">
      <p className="eyebrow mb-2">Legal</p>
      <h1 className="font-display text-3xl md:text-4xl mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: July 8, 2026</p>

      <div className="prose-measure text-foreground/80 space-y-6 leading-relaxed">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your use of WeddingLiveStreaming.com (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the site, you agree to these Terms.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Acceptance of terms</h2>
        <p>
          By accessing or using WeddingLiveStreaming.com, you agree to be bound by these Terms. If you do not agree, please do not use the site.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Description of service</h2>
        <p>
          WeddingLiveStreaming.com is a free directory connecting couples with wedding live streaming vendors. Vendors may optionally pay for Featured placement, processed securely via Stripe. We do not charge couples to browse or submit inquiries.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">No warranty on vendor services</h2>
        <p>
          We are a directory only, not a booking platform. WeddingLiveStreaming.com is not a party to any transaction, contract, or agreement between couples and vendors. We do not vet, endorse, or guarantee the quality, availability, pricing, or reliability of any vendor listed on the site. Any agreement you enter into with a vendor is solely between you and that vendor.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Listing content and accuracy</h2>
        <p>
          Vendor listings are submitted and maintained by the vendors themselves. While we take reasonable steps to review listings, we cannot guarantee the accuracy, completeness, or currentness of any listing content, including photos, pricing, service areas, and descriptions.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Account termination</h2>
        <p>
          We reserve the right to suspend or terminate any account or listing, at any time and without notice, for violations of these Terms, fraudulent activity, or any conduct we determine to be harmful to the site or its users.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, WeddingLiveStreaming.com and its owners shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of the site or any interaction with a vendor found through the site.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Governing law</h2>
        <p>
          These Terms are governed by the laws of the state in which the company is registered, without regard to conflict-of-law principles.
        </p>

        <h2 className="font-display text-2xl font-semibold mt-8">Contact</h2>
        <p>
          Questions about these Terms? <a href="mailto:hello@weddinglivestreaming.com" className="text-primary hover:underline">hello@weddinglivestreaming.com</a>
        </p>
      </div>
    </div>
  );
}
