import { SEOHead } from '../components/seo/SEOHead';
import { PublicShell, PublicHero } from '../components/public/PublicShell';

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
          "name": "Terms of Service",
          "item": "https://realsalepro.com/terms"
        }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://realsalepro.com/terms#webpage",
      "url": "https://realsalepro.com/terms",
      "name": "Terms of Service | RealSalePro Real Estate CRM",
      "description": "Review the Terms of Service for using RealSalePro real estate CRM software, lead tracking tools, subscription plans, and API integrations.",
      "isPartOf": { "@id": "https://realsalepro.com/#website" }
    }
  ]
};

export function TermsOfService() {
  return (
    <>
      <SEOHead
        title="Terms of Service | RealSalePro Real Estate CRM"
        description="Review the Terms of Service for using RealSalePro real estate CRM software, lead tracking tools, subscription plans, and API integrations."
        canonicalUrl="https://realsalepro.com/terms"
        jsonLd={termsSchema}
      />
      <PublicShell>
        <PublicHero compact eyebrow="Legal" title={<>Terms of <em>Service</em></>}>
          <span className="pp-hero__meta">Last updated: December 19, 2025</span>
        </PublicHero>

        <section className="pp-doc-wrap">
          <div className="container">
            <article className="pp-doc">
              <p className="pp-doc__lead">
              Welcome to <strong>RealSalePro</strong>. By accessing or using our real estate CRM platform, website, and services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
              </p>

              <h2>1. Acceptance of Terms</h2>
              <p>
              By creating an account or using our Services, you agree to comply with these Terms and all applicable laws and regulations. If you do not agree with any part of these Terms, you may not use our Services.
              </p>

              <h2>2. Account Registration</h2>
              <p>
              To access certain features of the Platform, you must register for an account. You agree to:
              </p>
              <ul>
                <li>Provide accurate, current, and complete information during registration.</li>
                <li>Maintain the security of your password and account credentials.</li>
                <li>Notify us immediately of any unauthorized use of your account.</li>
                <li>Be responsible for all activities that occur under your account.</li>
              </ul>

              <h2>3. Use of Services</h2>
              <p>
              RealSalePro grants you a limited, non-exclusive, non-transferable license to use the Services for your internal business purposes. You agree NOT to:
              </p>
              <ul>
                <li>Use the Services for any illegal or unauthorized purpose.</li>
                <li>Attempt to reverse engineer, decompile, or hack the Platform.</li>
                <li>Harass, abuse, or harm another person or entity.</li>
                <li>Upload or transmit viruses, malware, or harmful code.</li>
                <li>Resell, sublicense, or rent the Services without our express written consent.</li>
              </ul>

              <h2>4. Subscription and Payments</h2>
              <ul>
                <li><strong>Free Trial:</strong> We may offer a free trial period. Upon expiration, you must subscribe to a paid plan to continue using the Services.</li>
                <li><strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis.</li>
                <li><strong>Cancellations:</strong> You may cancel your subscription at any time. Your access will continue until the end of the current billing cycle.</li>
                <li><strong>Refunds:</strong> Payments are non-refundable, except as required by applicable law.</li>
              </ul>

              <h2>5. Intellectual Property</h2>
              <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of RealSalePro and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of RealSalePro.
              </p>

              <h2>6. Limitation of Liability</h2>
              <p>
              In no event shall RealSalePro, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>

              <h2>7. Termination</h2>
              <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
              </p>

              <h2>8. Governing Law</h2>
              <p>
              These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>

              <h2>9. Changes to Terms</h2>
              <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide reasonable notice of any material changes. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>

              <h2>10. Contact Us</h2>
              <p>
              If you have any questions about these Terms, please contact us at: <br />
              <a href="mailto:support@realsalepro.com">support@realsalepro.com</a>
              </p>
            </article>
          </div>
        </section>
      </PublicShell>
    </>
  );
}
