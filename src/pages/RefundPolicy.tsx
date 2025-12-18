import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RefundPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-4">Cancellation & Refund Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: December 19, 2025</p>

          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-6">
              At <strong>RealSalePro</strong>, we strive to ensure our customers are satisfied with our services. This Cancellation & Refund Policy outlines the terms under which you may cancel your subscription and request a refund.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">1. Cancellation Policy</h2>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>User-Initiated Cancellation:</strong> You may cancel your subscription at any time directly through your account dashboard or by contacting our support team at <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a>.</li>
              <li><strong>Effect of Cancellation:</strong> Upon cancellation, your subscription will remain active until the end of the current paid billing period. After this period, your account will revert to a free or inactive state, and you will not be charged again.</li>
              <li><strong>Data Retention:</strong> We may retain your data for a limited period after cancellation as per our Privacy Policy, to allow for easy reactivation.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">2. Refund Policy</h2>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Free Trial:</strong> We offer a 30-day free trial for new users to evaluate the platform. No charges are applied during this period.</li>
              <li><strong>No Refunds on Subscription Fees:</strong> Since our service is a digital software product with a free trial available, <strong>we generally do not offer refunds</strong> for payments already made for the current billing cycle (monthly or annual).</li>
              <li><strong>Exceptions:</strong> Refunds may be considered on a case-by-case basis under the following circumstances:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>If you were charged due to a technical error.</li>
                  <li>If you canceled within 24 hours of a renewal charge and have not used the service during the new period.</li>
                </ul>
              </li>
              <li><strong>Processing Time:</strong> Approved refunds will be processed within <strong>5-7 business days</strong> and credit will automatically be applied to your original method of payment.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">3. Contact Us</h2>
            <p>
              If you have any questions about our Cancellation and Refund Policy, please contact us at: <br />
              <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
