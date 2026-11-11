import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

const refundSchema = {
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
          "name": "Refund Policy",
          "item": "https://realsalepro.com/refund-policy"
        }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://realsalepro.com/refund-policy#webpage",
      "url": "https://realsalepro.com/refund-policy",
      "name": "Cancellation & Refund Policy | RealSalePro",
      "description": "Read RealSalePro's transparent cancellation and refund policy. Free forever plan with zero charges, and 14-day hassle-free refund on paid subscriptions.",
      "isPartOf": { "@id": "https://realsalepro.com/#website" }
    }
  ]
};

export function RefundPolicy() {
  return (
    <>
      <SEOHead
        title="Cancellation & Refund Policy | RealSalePro"
        description="Read RealSalePro's transparent cancellation and refund policy. Free forever plan with zero charges, and 14-day hassle-free refund on paid subscriptions."
        canonicalUrl="https://realsalepro.com/refund-policy"
        jsonLd={refundSchema}
      />
      <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-slate-200/80">
            <h1 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-4">Cancellation & Refund Policy</h1>
            <p className="text-gray-500 mb-8 text-sm">Last Updated: November 11, 2026</p>

            <div className="prose prose-blue max-w-none text-gray-600 space-y-6 text-sm sm:text-base leading-relaxed">
              <p>
                At <strong>RealSalePro</strong>, operated by <strong>Synergy Brand Architect</strong>, we are committed to complete transparency, fair pricing, and long-term customer trust. This Cancellation and Refund Policy outlines your rights regarding subscription cancellations, renewals, and refund requests for our real estate CRM software platform.
              </p>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">1. 100% Free Forever Tier (Zero Billing Risk)</h2>
              <p>
                RealSalePro offers a fully functional <strong>Free Forever Tier</strong> supporting up to 1,000 active client leads and up to 5 user accounts. This plan requires no credit card, debit card, or banking details to activate. You may use this tier indefinitely without incurring any charges, fees, or hidden obligations.
              </p>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">2. Paid Subscription Cancellation</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Self-Service Cancellation:</strong> You can cancel your paid Pro or Enterprise subscription at any time directly through your account settings (<span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">Dashboard &gt; Settings &gt; Subscription</span>) or by sending an email to <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a>.</li>
                <li><strong>Access Until Period End:</strong> When you cancel your subscription, your account remains fully active with all premium features until the end of the current billing cycle (monthly or annual).</li>
                <li><strong>No Unexpected Renewals:</strong> Once canceled, automatic recurring charges are immediately disabled, and no further billing will occur.</li>
                <li><strong>Seamless Reversion to Free Tier:</strong> After your paid term expires, your workspace is downgraded to our Free Forever Tier, preserving your client leads, site visit records, and sales history.</li>
              </ul>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">3. Refund Policy for Paid Subscriptions</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>14-Day Money-Back Window:</strong> If you upgrade to a paid plan and decide that RealSalePro does not meet your business requirements, you may request a full refund within <strong>14 calendar days</strong> of your initial payment date.</li>
                <li><strong>Technical Issues & Double Billing:</strong> In the unlikely event of duplicate billing, incorrect charges, or severe technical outages that prevent software access, we will issue an immediate 100% refund upon verification.</li>
                <li><strong>Annual Subscriptions:</strong> For annual plans canceled after the 14-day window, a pro-rated refund may be granted upon request, deducting only the standard monthly rate for the active months used.</li>
                <li><strong>Custom Enterprise Integrations:</strong> One-time professional services, custom database setup fees, or dedicated API integration packages are non-refundable once work has commenced.</li>
              </ul>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">4. Refund Processing Timeline</h2>
              <p>
                Approved refunds are initiated immediately and credited to the original payment method (UPI, credit/debit card, or Net Banking via Razorpay) within <strong>5 to 7 business days</strong>, subject to your bank's processing timelines.
              </p>

              <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-3">5. How to Request a Cancellation or Refund</h2>
              <p>
                To request a refund or cancel your plan, simply reach out to our team with your registered account email and company name:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1 text-sm">
                <p><strong>Email Desk:</strong> <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a></p>
                <p><strong>Direct WhatsApp:</strong> <a href="https://wa.me/917079737773" className="text-blue-600 hover:underline">+91 70797 37773</a></p>
                <p><strong>Support Operating Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
