import { Mail, ArrowRight, Gift, Percent, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { PublicShell, PublicHero } from '../components/public/PublicShell';

const referralSchema = {
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
          "name": "Referral Program",
          "item": "https://realsalepro.com/referral-program"
        }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://realsalepro.com/referral-program#webpage",
      "url": "https://realsalepro.com/referral-program",
      "name": "RealSalePro Referral Program — Earn 20% Rewards",
      "description": "Join the RealSalePro Referral Program. Refer real estate builders and brokers and earn 20% recurring commission on every subscription referral.",
      "isPartOf": { "@id": "https://realsalepro.com/#website" }
    }
  ]
};

export function ReferralProgramPage() {
  return (
    <>
      <SEOHead
        title="RealSalePro Referral Program — Earn 20% Rewards"
        description="Join the RealSalePro Referral Program. Refer real estate builders and brokers and earn 20% recurring commission on every subscription referral."
        canonicalUrl="https://realsalepro.com/referral-program"
        keywords="real estate crm referral, affiliate program real estate crm, earn recurring commission, saas partner program india"
        jsonLd={referralSchema}
      />
      <PublicShell>
        {/* Hero */}
        <PublicHero
          eyebrow="RealSalePro Partner Network"
          title={<>Refer Indian Real Estate Teams &amp; Earn <em>20% Recurring Commission</em></>}
          lede="Help property developers, channel partners, and real estate brokers modernize their sales pipeline. Earn 20% monthly recurring commission for every active subscription you refer."
        >
          <Link to="/affiliate/register" className="btn btn--primary btn--lg">
            <Mail size={18} aria-hidden="true" />
            Join the Partner Program
          </Link>
          <Link to="/affiliate/terms" className="btn btn--ghost btn--lg">
            Review Partner Agreement
          </Link>
        </PublicHero>

        {/* Key Benefits */}
        <section className="section section--dark pp-section">
          <div className="container">
            <div className="sec-head sec-head--center" style={{ marginBottom: 48 }} data-reveal>
              <h2 className="sec-head__title">Why Partner with <em>RealSalePro?</em></h2>
              <p className="sec-head__lede">
                India's real estate market is rapidly moving away from unorganized Excel sheets and chaotic WhatsApp groups. RealSalePro offers high conversion rates and lasting customer retention.
              </p>
            </div>

            <div className="pp-grid pp-grid--3">
              <div className="pp-card pp-card--hover" data-reveal>
                <span className="pp-icon"><Percent /></span>
                <h3 style={{ marginTop: 20 }}>20% Recurring Payout</h3>
                <p style={{ marginTop: 10 }}>
                  Receive 20% of subscription revenue every month for the lifetime of every customer who signs up through your link or referral code.
                </p>
              </div>

              <div className="pp-card pp-card--hover" data-reveal data-reveal-delay="80">
                <span className="pp-icon"><Gift /></span>
                <h3 style={{ marginTop: 20 }}>10% Discount for Your Network</h3>
                <p style={{ marginTop: 10 }}>
                  Your referred agency contacts receive an exclusive 10% discount on all Pro plans, ensuring higher signup and activation conversion rates.
                </p>
              </div>

              <div className="pp-card pp-card--hover" data-reveal data-reveal-delay="160">
                <span className="pp-icon"><Share2 /></span>
                <h3 style={{ marginTop: 20 }}>Real-Time Portal &amp; Payouts</h3>
                <p style={{ marginTop: 10 }}>
                  Track referral clicks, active paying tenants, and monthly accrued commissions via your dedicated affiliate partner dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section section--dark pp-section" style={{ background: 'var(--ink-850)', borderBlock: '1px solid var(--line-dark)' }}>
          <div className="container pp-narrow">
            <div className="sec-head sec-head--center" style={{ marginBottom: 40 }} data-reveal>
              <h2 className="sec-head__title">Three Simple Steps to <em>Get Started</em></h2>
            </div>

            <div className="pp-steps">
              <div className="pp-card pp-step" data-reveal>
                <span className="pp-step__num">1</span>
                <div className="pp-step__body">
                  <h3>Sign Up as a Partner</h3>
                  <p style={{ marginTop: 6 }}>
                    Complete our quick <Link to="/affiliate/register">Affiliate Registration form</Link> with your contact details and payout information. Approval is typically processed within 24 hours.
                  </p>
                </div>
              </div>

              <div className="pp-card pp-step" data-reveal data-reveal-delay="80">
                <span className="pp-step__num">2</span>
                <div className="pp-step__body">
                  <h3>Receive Your Custom Link &amp; Promo Code</h3>
                  <p style={{ marginTop: 6 }}>
                    You'll get a tracking link and a custom coupon code (e.g. <code className="pp-code">VIP20</code>) that entitles your clients to instant discounts and attaches their workspace to your profile.
                  </p>
                </div>
              </div>

              <div className="pp-card pp-step" data-reveal data-reveal-delay="160">
                <span className="pp-step__num">3</span>
                <div className="pp-step__body">
                  <h3>Collect Monthly Bank Payouts</h3>
                  <p style={{ marginTop: 6 }}>
                    Commission earnings are tallied every month and disbursed directly via NEFT/IMPS bank transfer or UPI once you reach the ₹1,000 threshold.
                  </p>
                </div>
              </div>
            </div>

            <div className="pp-actions" data-reveal>
              <Link to="/affiliate/register" className="btn btn--primary btn--lg">
                Enroll as a Partner Now <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Referral Program FAQ */}
        <section className="section section--paper pp-section">
          <div className="container pp-narrow">
            <div className="sec-head sec-head--center" style={{ marginBottom: 40 }} data-reveal>
              <h2 className="sec-head__title">Referral Program <em>Questions &amp; Answers</em></h2>
            </div>
            <div className="pp-qa">
              <div className="pp-qa__item" data-reveal>
                <h3>Who is eligible to join?</h3>
                <p>
                  Real estate consultants, digital marketing agencies, proptech influencers, trainers, website developers, and active RealSalePro customers can all participate in the program.
                </p>
              </div>
              <div className="pp-qa__item" data-reveal>
                <h3>How long is the tracking cookie valid?</h3>
                <p>
                  Our referral tracking links carry a 60-day cookie window. If a referred visitor signs up within 60 days of clicking your link, the subscription is permanently attributed to you.
                </p>
              </div>
              <div className="pp-qa__item" data-reveal>
                <h3>When and how do I get paid?</h3>
                <p>
                  Payouts are processed by the 10th of every calendar month for the preceding month's earnings via Indian bank transfer (NEFT/IMPS) or UPI.
                </p>
              </div>
            </div>
          </div>
        </section>
      </PublicShell>
    </>
  );
}
