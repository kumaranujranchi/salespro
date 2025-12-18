import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-4">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: December 19, 2025</p>

          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-6">
              At <strong>RealSalePro</strong> ("we," "our," or "us"), we value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you use our real estate CRM platform, website, and related services (collectively, the "Platform").
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">1. Information We Collect</h2>
            <p>We collect information to provide better services to our users. This includes:</p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Personal Identification Information:</strong> Name, email address, phone number, company name, and job title when you register for an account.</li>
              <li><strong>Business Data:</strong> Information related to your real estate projects, inventory, leads, sales data, and team performance metrics entered into the Platform.</li>
              <li><strong>Usage Data:</strong> Information on how you interact with the Platform, such as features used, time spent on pages, and click patterns.</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the collected data for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Service Delivery:</strong> To provide, operate, and maintain the RealSalePro CRM platform.</li>
              <li><strong>Personalization:</strong> To tailor the user experience and provide relevant insights and analytics.</li>
              <li><strong>Communication:</strong> To send you transactional emails, updates, security alerts, and support messages.</li>
              <li><strong>Analytics:</strong> To monitor and analyze usage trends to improve our Platform's performance and functionality.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable legal obligations and protect our legal rights.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">3. Data Protection and Security</h2>
            <p className="mb-4">
              We implement robust security measures to protect your data from unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Encryption:</strong> Data is encrypted in transit and at rest using industry-standard protocols.</li>
              <li><strong>Access Controls:</strong> Strict role-based access controls ensuring only authorized personnel can access sensitive data.</li>
              <li><strong>Regular Audits:</strong> Periodic security assessments and vulnerability scans.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">4. Sharing of Information</h2>
            <p className="mb-4">We do not sell your personal data. We may share information only in the following circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist us in operating our Platform (e.g., cloud hosting, email delivery).</li>
              <li><strong>Legal Requirements:</strong> If required by law or in response to valid requests by public authorities.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, sale of company assets, or acquisition.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">5. Your Data Rights</h2>
            <p>You have the right to access, correct, update, or delete your personal information. You can manage your account settings directly within the Platform or contact our support team for assistance.</p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="mb-6">
              We use cookies to enhance your experience, analyze site traffic, and understand where our audience is coming from. You can control cookie preferences through your browser settings.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: <br />
              <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
