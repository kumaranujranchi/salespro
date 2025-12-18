import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-4">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last Updated: December 19, 2025</p>

          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-6">
              Welcome to <strong>RealSalePro</strong>. By accessing or using our real estate CRM platform, website, and services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By creating an account or using our Services, you agree to comply with these Terms and all applicable laws and regulations. If you do not agree with any part of these Terms, you may not use our Services.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">2. Account Registration</h2>
            <p className="mb-4">
              To access certain features of the Platform, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the security of your password and account credentials.</li>
              <li>Notify us immediately of any unauthorized use of your account.</li>
              <li>Be responsible for all activities that occur under your account.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">3. Use of Services</h2>
            <p className="mb-4">
              RealSalePro grants you a limited, non-exclusive, non-transferable license to use the Services for your internal business purposes. You agree NOT to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li>Use the Services for any illegal or unauthorized purpose.</li>
              <li>Attempt to reverse engineer, decompile, or hack the Platform.</li>
              <li>Harass, abuse, or harm another person or entity.</li>
              <li>Upload or transmit viruses, malware, or harmful code.</li>
              <li>Resell, sublicense, or rent the Services without our express written consent.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">4. Subscription and Payments</h2>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Free Trial:</strong> We may offer a free trial period. Upon expiration, you must subscribe to a paid plan to continue using the Services.</li>
              <li><strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis.</li>
              <li><strong>Cancellations:</strong> You may cancel your subscription at any time. Your access will continue until the end of the current billing cycle.</li>
              <li><strong>Refunds:</strong> Payments are non-refundable, except as required by applicable law.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">5. Intellectual Property</h2>
            <p className="mb-6">
              The Service and its original content, features, and functionality are and will remain the exclusive property of RealSalePro and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of RealSalePro.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">6. Limitation of Liability</h2>
            <p className="mb-6">
              In no event shall RealSalePro, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">7. Termination</h2>
            <p className="mb-6">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">8. Governing Law</h2>
            <p className="mb-6">
              These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">9. Changes to Terms</h2>
            <p className="mb-6">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide reasonable notice of any material changes. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at: <br />
              <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
