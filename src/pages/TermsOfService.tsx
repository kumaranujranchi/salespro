import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

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

            <div id="dpa" className="mt-12 pt-8 border-t-2 border-emerald-500/30">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase mb-4">
                🇮🇳 Statutory Compliance • Digital Personal Data Protection Act, 2023
              </div>
              <h2 className="text-2xl font-bold text-[#0A1C37] mb-2">10. Data Processing Addendum (DPA)</h2>
              <p className="text-sm text-gray-500 mb-6">
                Pursuant to <strong>Section 8(2) of the Digital Personal Data Protection Act, 2023 (India)</strong>, this Data Processing Addendum governs the processing of personal data uploaded by Customer into RealSalePro CRM.
              </p>

              <h3 className="text-lg font-semibold text-[#0A1C37] mt-6 mb-3">10.1 Statutory Roles & Definitions</h3>
              <p className="mb-4">
                Under the DPDP Act, 2023:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-6">
                <li>
                  <strong>Data Fiduciary:</strong> The Customer (the subscriber, real estate broker, builder, or agency) acts as the Data Fiduciary for all personal data, prospective buyer information, and contact records entered into their RealSalePro CRM workspace.
                </li>
                <li>
                  <strong>Data Processor:</strong> RealSalePro (operated by Synergy Brand Architect) operates strictly as a <em>Data Processor</em> engaged by Customer under Section 8(2) to store, organize, and process Customer Personal Data on their behalf.
                </li>
                <li>
                  <strong>Data Principal:</strong> The individual homebuyer, client, or prospect whose personal data is uploaded into the CRM.
                </li>
              </ul>

              <h3 className="text-lg font-semibold text-[#0A1C37] mt-6 mb-3">10.2 Purpose Limitation & Non-Monetization Guarantee</h3>
              <p className="mb-4">
                RealSalePro shall process Customer Personal Data strictly in accordance with Customer's documented instructions and solely to deliver the CRM platform services.
              </p>
              <div className="bg-emerald-50/70 border-l-4 border-emerald-500 p-4 rounded-r-xl mb-6 text-sm text-emerald-950 font-medium">
                🔒 <strong>Zero Data Selling Guarantee:</strong> RealSalePro shall <u>never</u> sell, rent, commercialize, license, or share Customer's proprietary leads, client phone numbers, or property inventory with third-party brokers, advertisers, or competing real estate developers under any circumstances.
              </div>

              <h3 className="text-lg font-semibold text-[#0A1C37] mt-6 mb-3">10.3 Customer Representations & Legal Warranties (Consent Proof)</h3>
              <p className="mb-4">
                As the statutory Data Fiduciary, the Customer represents, warrants, and covenants that:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-6">
                <li>
                  All personal data (names, phone numbers, email addresses, and budgets of homebuyers) uploaded or imported into RealSalePro has been lawfully obtained with valid consent or legitimate notice as mandated under Chapter II of the DPDP Act, 2023.
                </li>
                <li>
                  Customer shall not use RealSalePro to store unverified telemarketing scrape-lists or send unauthorized spam in violation of TRAI DND or DPDP Act statutory requirements.
                </li>
                <li>
                  Customer shall defend, indemnify, and hold harmless RealSalePro against any regulatory fines, claims, or proceedings initiated by Data Principals or the Data Protection Board of India arising from Customer's failure to obtain lawful consent for their leads.
                </li>
              </ul>

              <h3 className="text-lg font-semibold text-[#0A1C37] mt-6 mb-3">10.4 Technical & Organizational Safeguards (Section 8(5))</h3>
              <p className="mb-4">
                In compliance with Section 8(5) of the DPDP Act, 2023, RealSalePro implements enterprise-grade technical safeguards:
              </p>
              <ul className="list-disc pl-5 space-y-2 mb-6">
                <li><strong>Encryption:</strong> TLS 1.3 encryption for all data in transit; AES-256 encryption at rest for databases and backups.</li>
                <li><strong>Tenant Logical Isolation:</strong> Strict multi-tenant logical partitioning ensuring no tenant can access another workspace's leads.</li>
                <li><strong>Audit Ledger:</strong> Immutable engine-level WORM audit logs tracking administrative actions and consent preferences.</li>
              </ul>

              <h3 className="text-lg font-semibold text-[#0A1C37] mt-6 mb-3">10.5 Authorized Sub-Processors</h3>
              <p className="mb-4">
                Customer hereby grants general authorization to RealSalePro to engage the following sub-processors for cloud hosting and delivery:
              </p>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full text-xs text-left border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-4 border-b">Sub-Processor</th>
                      <th className="py-2.5 px-4 border-b">Purpose</th>
                      <th className="py-2.5 px-4 border-b">Data Center Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">Amazon Web Services (AWS)</td>
                      <td className="py-2.5 px-4">Cloud Compute & S3 Encrypted Backups</td>
                      <td className="py-2.5 px-4">Mumbai, India (ap-south-1)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">PostgreSQL / Convex Database</td>
                      <td className="py-2.5 px-4">Core CRM Data Storage & State</td>
                      <td className="py-2.5 px-4">Encrypted Cloud Infrastructure</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">Razorpay Software Pvt. Ltd.</td>
                      <td className="py-2.5 px-4">PCI-DSS Payment Processing</td>
                      <td className="py-2.5 px-4">India</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-semibold">Meta Platforms / WhatsApp Business API</td>
                      <td className="py-2.5 px-4">Automated Lead Alerts & OTP Verification</td>
                      <td className="py-2.5 px-4">Global / Transport Encrypted</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-[#0A1C37] mt-6 mb-3">10.6 Data Portability, Deletion & Account Erasure (DPDP Section 12)</h3>
              <ul className="list-disc pl-5 space-y-2 mb-6">
                <li><strong>Self-Service Export:</strong> Customer retains full ownership of their lead records and may export their data via CSV, Excel, or API at any time during an active subscription.</li>
                <li><strong>Erasure upon Termination:</strong> Within thirty (30) days of account termination or a verified Section 12 erasure request, RealSalePro shall permanently wipe Customer's personal data from primary databases, retaining only immutable financial audit ledgers required by Indian corporate and tax laws.</li>
              </ul>

              <h3 className="text-lg font-semibold text-[#0A1C37] mt-6 mb-3">10.7 Breach Notification (DPDP Section 8(6))</h3>
              <p className="mb-6">
                In the event of a confirmed personal data security breach affecting Customer workspace data, RealSalePro shall notify Customer without undue delay upon verification, providing relevant incident details to assist Customer in fulfilling their statutory reporting obligations to the Data Protection Board of India.
              </p>
            </div>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-10 mb-4">11. Governing Law & Dispute Resolution</h2>
            <p className="mb-6">
              These Terms and the Data Processing Addendum shall be governed and construed in accordance with the laws of India, including the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in Patna, Bihar, India.
            </p>

            <h2 className="text-xl font-bold text-[#0A1C37] mt-8 mb-4">12. Contact Us</h2>
            <p>
              If you have any questions about these Terms, the Data Processing Addendum, or data privacy, please contact our Data Protection Grievance Officer at: <br />
              <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">support@realsalepro.com</a> | <a href="mailto:billing@realsalepro.com" className="text-blue-600 hover:underline">billing@realsalepro.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
