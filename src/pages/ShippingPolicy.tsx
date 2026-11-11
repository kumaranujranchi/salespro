import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

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
      <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-slate-200/80">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-4">Electronic Service &amp; Digital Delivery Policy</h1>
            <p className="text-gray-500 mb-8 text-sm">Last Updated: November 11, 2026</p>

            <div className="prose prose-blue max-w-none text-gray-600 space-y-6 text-sm sm:text-base leading-relaxed">
              <p>
                <strong>RealSalePro</strong>, operated by <strong>Synergy Brand Architect</strong>, provides cloud-hosted Software as a Service (SaaS) applications for real estate builders, developers, and brokers. Because our software and services are exclusively delivered over the internet, <strong>no physical goods or physical parcels are shipped</strong>, and zero physical shipping or handling charges apply.
              </p>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">1. Instant Digital Delivery &amp; Workspace Provisioning</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Immediate Provisioning:</strong> Upon completing registration for our Free Forever plan or upon confirmation of payment for a paid subscription, your multi-tenant CRM workspace is automatically provisioned and activated in real time (&lt; 60 seconds).</li>
                <li><strong>Electronic Confirmation &amp; Credentials:</strong> You will immediately receive an automated confirmation email and WhatsApp alert containing your direct workspace login URL (<a href="https://realsalepro.com/login" className="text-blue-600 hover:underline">realsalepro.com/login</a>), tenant ID, and initial administrator credentials.</li>
                <li><strong>Browser &amp; Mobile Access:</strong> The platform is fully accessible instantly via any standard modern web browser (Chrome, Edge, Safari, Firefox) on desktop, tablet, and mobile devices without requiring software downloads or hardware installations.</li>
              </ul>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">2. Service Delivery Timeframes</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Standard SaaS Accounts:</strong> Instant digital activation upon successful signup.</li>
                <li><strong>Meta Lead Ads &amp; Portal Webhooks:</strong> Webhook credentials and automated lead routing links are generated in your dashboard immediately upon account creation.</li>
                <li><strong>Enterprise Self-Hosted Database (BYOD):</strong> For enterprise clients opting for a private PostgreSQL or AWS RDS database integration behind their corporate VPC, configuration and custom domain deployment typically complete within <strong>5 to 10 business days</strong> in coordination with your IT security team.</li>
              </ul>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">3. Delivery Verification &amp; Access Troubleshooting</h2>
              <p>
                If you do not receive your digital workspace activation details within 15 minutes of registration or subscription payment, please follow these steps:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check your email inbox, promotions, and spam/junk folders for messages from <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">support@realsalepro.com</span>.</li>
                <li>Visit the direct login page at <a href="https://realsalepro.com/login" className="text-blue-600 hover:underline">realsalepro.com/login</a> and use the &quot;Forgot Password&quot; feature with your registered email address.</li>
                <li>Contact our live support team on WhatsApp at <a href="https://wa.me/917079737773" className="text-blue-600 hover:underline">+91 70797 37773</a> for immediate manual credential delivery.</li>
              </ul>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">4. Shipping Charges &amp; Customs Duties</h2>
              <p>
                Since all services are delivered electronically across India and globally, there are <strong>zero shipping fees</strong>, zero handling charges, and zero customs fees associated with any RealSalePro plan or add-on.
              </p>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">5. Delivery Inquiries &amp; Customer Support</h2>
              <p>
                For questions regarding your account provisioning or access credentials, please contact us:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 text-sm">
                <p><strong>Email:</strong> <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a></p>
                <p><strong>Phone / WhatsApp:</strong> <a href="tel:+917079737773" className="text-blue-600 hover:underline">+91 70797 37773</a></p>
                <p><strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
