import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-4">Shipping & Delivery Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: December 19, 2025</p>

          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-6">
              <strong>RealSalePro</strong> is a SaaS (Software as a Service) platform. As such, we do not ship physical products. Our services are delivered digitally over the internet.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">1. Digital Delivery</h2>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Instant Activation:</strong> Upon successful registration and/or payment, your account and workspace are activated immediately.</li>
              <li><strong>Access:</strong> You will receive a confirmation email with login details to access the RealSalePro dashboard at <a href="https://realsalepro.com" className="text-blue-600 hover:underline">https://realsalepro.com</a>.</li>
              <li><strong>Timeline:</strong> In most cases, service activation is instant. However, in rare cases of technical delays, please allow up to <strong>24 hours</strong> for account activation.</li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">2. Support for Access Issues</h2>
            <p className="mb-6">
              If you do not receive your activation email or cannot access your account after payment, please check your spam folder or contact our support team immediately.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">3. Custom Services & Enterprise Solutions</h2>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><strong>Custom Features:</strong> timelies for custom feature development will be determined based on specific client requirements and project complexity.</li>
              <li><strong>Self-Hosted Database Configuration:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong>Setup Timeline:</strong> The setup and configuration process for self-hosted databases typically takes <strong>10 days</strong>.</li>
                  <li><strong>Setup Cost:</strong> The initial configuration service is provided <strong>free of charge</strong>.</li>
                  <li><strong>Annual Maintenance:</strong> A separate <strong>Annual Service Fee</strong> is applicable for ongoing support, maintenance, and issue resolution by our technical team.</li>
                </ul>
              </li>
            </ul>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">4. Contact Us</h2>
            <p>
              For any issues regarding service delivery, please email us at: <br />
              <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
