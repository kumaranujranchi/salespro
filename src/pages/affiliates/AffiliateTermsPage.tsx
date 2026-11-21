import { SEOHead } from '../../components/seo/SEOHead';
import { PublicShell, PublicHero } from '../../components/public/PublicShell';

const termsSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://realsalepro.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Affiliate Terms",
          "item": "https://realsalepro.com/affiliate/terms"
        }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://realsalepro.com/affiliate/terms#webpage",
      "url": "https://realsalepro.com/affiliate/terms",
      "name": "Affiliate Program Terms & Agreement | RealSalePro",
      "description": "Official partner terms and commission agreement for RealSalePro real estate CRM affiliates, agency partners, and tech consultants.",
      "isPartOf": { "@id": "https://realsalepro.com/#website" }
    }
  ]
};

export function AffiliateTermsPage() {
  return (
    <>
      <SEOHead
        title="Affiliate Program Terms & Agreement | RealSalePro"
        description="Official partner terms and commission agreement for RealSalePro real estate CRM affiliates, agency partners, and tech consultants."
        canonicalUrl="https://realsalepro.com/affiliate/terms"
        jsonLd={termsSchema}
      />
      <PublicShell>
        <PublicHero
          compact
          eyebrow="Legal Agreement"
          title={<>Partner Program <em>Terms</em></>}
          lede="Please review our terms and conditions carefully. By joining the RealSalePro Affiliate Program, you agree to abide by these guidelines to ensure a fair and successful partnership."
        >
          <span className="pp-hero__meta">Effective date: December 20, 2025</span>
        </PublicHero>

        <section className="pp-doc-wrap">
          <div className="container">
            <article className="pp-doc">
              <h2>1. Introduction</h2>
              <p>
                This Affiliate Partner Program Agreement ("Agreement") constitutes a legal agreement between RealSalePro ("Company", "we", "us", or "our") and the individual or entity applying to participate in the RealSalePro Affiliate Partner Program ("Affiliate", "you", or "your"). By submitting an application or participating in the Program, you agree to be bound by the terms and conditions set forth in this Agreement.
              </p>

              <h2>2. Enrollment and Status</h2>
              <p>
                Enrollment in the Program is subject to our approval. We may reject or terminate your application or status at any time, for any reason, at our sole discretion. You must provide accurate and complete information during the registration process.
              </p>

              <h2>3. Referral Links and Promotion</h2>
              <ul>
                <li><strong>Unique Link:</strong> You will be issued a unique referral code and link. You are responsible for ensuring these are used correctly to track referrals.</li>
                <li><strong>Allowed Channels:</strong> You may promote RealSalePro via your website, blog, social media channels, email newsletters, and direct networking.</li>
                <li>
                  <strong>Prohibited Activities:</strong> You strictly agree NOT to:
                  <ul>
                    <li>Send unsolicited email (SPAM) or violate any anti-spam laws.</li>
                    <li>Bid on branded keywords (e.g., "RealSalePro", "RealSalePro Login") in Pay-Per-Click (PPC) advertising.</li>
                    <li>Misrepresent the Company, its products, or prices.</li>
                    <li>Offer cash rebates or kickbacks to users without our prior written consent.</li>
                    <li>Use any illegal, offensive, or infringing content in your promotions.</li>
                  </ul>
                </li>
              </ul>

              <h2>4. Commissions and Payouts</h2>
              <ul>
                <li><strong>Commission Rate:</strong> You will earn a recurring commission of 20% on the subscription fees actually paid by customers you refer, for up to 12 months from their signup date, provided they remain active subscribers.</li>
                <li><strong>Payment Schedule:</strong> Commissions are calculated monthly. Payouts are made within 30 days after the end of the month in which the commission exceeded the minimum payout threshold.</li>
                <li><strong>Minimum Payout:</strong> The minimum payout threshold is ₹2,000 (or equivalent in other currencies). Earnings below this amount will roll over to the next month.</li>
                <li><strong>Refunds/Chargebacks:</strong> If a referred customer requests a refund or issues a chargeback, any commission earned on that transaction will be deducted from your future earnings.</li>
              </ul>

              <h2>5. Independent Contractor Relationship</h2>
              <p>
                You are an independent contractor, not an employee, agent, or partner of the Company. You have no authority to bind the Company to any agreement or obligation. You are solely responsible for all taxes, fees, and other costs associated with your participation in the Program.
              </p>

              <h2>6. Intellectual Property</h2>
              <p>
                RealSalePro grants you a non-exclusive, non-transferable, revocable license to use our logos, trade names, and marketing materials solely for the purpose of promoting our services in accordance with this Agreement. You may not modify our intellectual property without prior written consent.
              </p>

              <h2>7. Limitation of Liability</h2>
              <p className="pp-doc__caps">
                TO THE FULLEST EXTENT PERMITTED BY LAW, REALSALEPRO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, OR DATA, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR THE PROGRAM. OUR TOTAL LIABILITY SHALL NOT EXCEED THE TOTAL COMMISSIONS PAID TO YOU UNDER THIS AGREEMENT IN THE SIX (6) MONTHS PRIOR TO THE CLAIM.
              </p>

              <h2>8. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless RealSalePro and its officers, directors, employees, and agents from any claims, damages, liabilities, costs, and expenses (including legal fees) arising from your participation in the Program, your marketing activities, or your breach of this Agreement.
              </p>

              <h2>9. Termination</h2>
              <p>
                Either party may terminate this Agreement at any time, with or without cause, by giving written notice. Upon termination, you must immediately cease all use of our intellectual property and remove all referral links. Any outstanding commissions earned prior to termination will be paid in the next scheduled cycle, provided the amount meets the minimum threshold.
              </p>

              <h2>10. Governing Law</h2>
              <p>
                This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of the courts in Ranchi, Jharkhand.
              </p>

              <h2>11. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify you of any material changes via email or dashboard notification. Your continued participation in the Program after such changes constitutes acceptance of the new terms.
              </p>

              <div className="pp-doc__callout pp-doc__callout--center">
                <p>Have questions about the program?</p>
                <p><a href="mailto:support@realsalepro.com">Contact Partner Support (support@realsalepro.com)</a></p>
              </div>
            </article>
          </div>
        </section>
      </PublicShell>
    </>
  );
}
