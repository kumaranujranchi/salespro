import { SEOHead } from '../components/seo/SEOHead';
import { PublicShell, PublicHero } from '../components/public/PublicShell';

const shippingSchema = {
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
          "name": "Shipping & Delivery Policy",
          "item": "https://realsalepro.com/shipping-policy"
        }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://realsalepro.com/shipping-policy#webpage",
      "url": "https://realsalepro.com/shipping-policy",
      "name": "Digital Delivery Policy | RealSalePro SaaS",
      "description": "RealSalePro is a cloud-hosted SaaS platform. Instant digital activation, workspace provisioning, and email delivery with zero physical shipping.",
      "isPartOf": { "@id": "https://realsalepro.com/#website" }
    }
  ]
};

export function ShippingPolicy() {
  return (
    <>
      <SEOHead
        title="Digital Delivery Policy | RealSalePro SaaS"
        description="RealSalePro is a cloud-hosted SaaS platform. Instant digital activation, workspace provisioning, and email delivery with zero physical shipping."
        canonicalUrl="https://realsalepro.com/shipping-policy"
        jsonLd={shippingSchema}
      />
      <PublicShell>
        <PublicHero compact eyebrow="Legal" title={<>Electronic Service &amp; Digital <em>Delivery</em> Policy</>}>
          <span className="pp-hero__meta">Last updated: November 11, 2026</span>
        </PublicHero>

        <section className="pp-doc-wrap">
          <div className="container">
            <article className="pp-doc">
              <p className="pp-doc__lead">
              <strong>RealSalePro</strong>, operated by <strong>Synergy Brand Architect</strong>, provides cloud-hosted Software as a Service (SaaS) applications for real estate builders, developers, and brokers. Because our software and services are exclusively delivered over the internet, <strong>no physical goods or physical parcels are shipped</strong>, and zero physical shipping or handling charges apply.
              </p>

              <h2>1. Instant Digital Delivery &amp; Workspace Provisioning</h2>
              <ul>
                <li><strong>Immediate Provisioning:</strong> Upon completing registration for our Free Forever plan or upon confirmation of payment for a paid subscription, your multi-tenant CRM workspace is automatically provisioned and activated in real time (&lt; 60 seconds).</li>
                <li><strong>Electronic Confirmation &amp; Credentials:</strong> You will immediately receive an automated confirmation email and WhatsApp alert containing your direct workspace login URL (<a href="https://realsalepro.com/login">realsalepro.com/login</a>), tenant ID, and initial administrator credentials.</li>
                <li><strong>Browser &amp; Mobile Access:</strong> The platform is fully accessible instantly via any standard modern web browser (Chrome, Edge, Safari, Firefox) on desktop, tablet, and mobile devices without requiring software downloads or hardware installations.</li>
              </ul>

              <h2>2. Service Delivery Timeframes</h2>
              <ul>
                <li><strong>Standard SaaS Accounts:</strong> Instant digital activation upon successful signup.</li>
                <li><strong>Meta Lead Ads &amp; Portal Webhooks:</strong> Webhook credentials and automated lead routing links are generated in your dashboard immediately upon account creation.</li>
                <li><strong>Enterprise Self-Hosted Database (BYOD):</strong> For enterprise clients opting for a private PostgreSQL or AWS RDS database integration behind their corporate VPC, configuration and custom domain deployment typically complete within <strong>5 to 10 business days</strong> in coordination with your IT security team.</li>
              </ul>

              <h2>3. Delivery Verification &amp; Access Troubleshooting</h2>
              <p>
              If you do not receive your digital workspace activation details within 15 minutes of registration or subscription payment, please follow these steps:
              </p>
              <ul>
                <li>Check your email inbox, promotions, and spam/junk folders for messages from <code>support@realsalepro.com</code>.</li>
                <li>Visit the direct login page at <a href="https://realsalepro.com/login">realsalepro.com/login</a> and use the &quot;Forgot Password&quot; feature with your registered email address.</li>
                <li>Contact our live support team on WhatsApp at <a href="https://wa.me/917079737773">+91 70797 37773</a> for immediate manual credential delivery.</li>
              </ul>

              <h2>4. Shipping Charges &amp; Customs Duties</h2>
              <p>
              Since all services are delivered electronically across India and globally, there are <strong>zero shipping fees</strong>, zero handling charges, and zero customs fees associated with any RealSalePro plan or add-on.
              </p>

              <h2>5. Delivery Inquiries &amp; Customer Support</h2>
              <p>
              For questions regarding your account provisioning or access credentials, please contact us:
              </p>
              <div className="pp-doc__callout">
                <p><strong>Email:</strong> <a href="mailto:support@realsalepro.com">support@realsalepro.com</a></p>
                <p><strong>Phone / WhatsApp:</strong> <a href="tel:+917079737773">+91 70797 37773</a></p>
                <p><strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</p>
              </div>
            </article>
          </div>
        </section>
      </PublicShell>
    </>
  );
}
