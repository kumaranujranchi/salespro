import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-slate-200/80">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8 text-sm">Last Updated: November 9, 2026</p>

          <div className="prose prose-blue max-w-none text-gray-600 space-y-8 text-sm sm:text-base leading-relaxed">
            
            {/* Introduction */}
            <section>
              <p>
                At <strong>RealSalePro</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operated by <strong>RealSalePro Technologies Private Limited</strong>, we respect your privacy and are committed to safeguarding your personal data. This Privacy Policy explains how we collect, process, store, and protect digital personal data when you use our real estate CRM software platform, website (<a href="https://realsalepro.com" className="text-blue-600 hover:underline">realsalepro.com</a>), and associated integrations (collectively, the &quot;Platform&quot;).
              </p>
            </section>

            {/* 1. Statutory Compliance (DPDP Act, 2023) */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">1. Legal and Regulatory Framework</h2>
              <p className="mb-3">
                This Privacy Policy is framed in accordance with applicable data protection laws of the Republic of India, specifically:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li><strong>The Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;)</strong> (Act No. 22 of 2023);</li>
                <li><strong>The Information Technology Act, 2000</strong> and rules framed thereunder;</li>
                <li><strong>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>; and</li>
                <li>Applicable project disclosure guidelines under the <strong>Real Estate (Regulation and Development) Act, 2016 (&quot;RERA&quot;)</strong>.</li>
              </ul>
            </section>

            {/* 2. Roles: Data Fiduciary vs Data Processor */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">2. Data Fiduciary and Data Processor Capacities</h2>
              <p className="mb-3">
                Under the DPDP Act, 2023, data processing roles are categorized based on control and instructions:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>RealSalePro as Data Fiduciary:</strong> With respect to direct account holders, subscribers, billing information, and registered administrators, RealSalePro determines the purposes and means of processing personal data.
                </li>
                <li>
                  <strong>RealSalePro as Data Processor:</strong> When subscribers (real estate developers, builders, channel partners, and brokers) import, capture, or manage prospective buyer leads (Data Principals) via CRM campaigns, Meta Lead Ads, or third-party webhooks, the subscriber acts as the <strong>Data Fiduciary</strong>, and RealSalePro processes such data strictly on their behalf as a <strong>Data Processor</strong> pursuant to Section 8(2) of the DPDP Act.
                </li>
              </ul>
            </section>

            {/* 3. Information We Collect */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">3. Categories of Information We Collect</h2>
              <p className="mb-3">We collect and process only data necessary to deliver our CRM services:</p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>Subscriber Account Data:</strong> Name, work email address, telephone number, firm/company name, RERA registration numbers, GSTIN, and account login credentials.</li>
                <li><strong>Real Estate Prospect &amp; Lead Data:</strong> Information entered by subscribers or received from lead forms, including prospect name, contact phone number, email address, property preferences (budget, unit type, preferred location), and consultation notes.</li>
                <li><strong>Integration &amp; Authentication Credentials:</strong> OAuth tokens, Facebook Page Access Tokens, WhatsApp Cloud API tokens, and webhook secrets required to synchronize external lead generation channels.</li>
                <li><strong>Usage &amp; Telemetry Data:</strong> IP address, device type, browser user agent, login timestamps, and system audit logs.</li>
              </ul>
            </section>

            {/* 4. Purpose of Processing */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">4. Specified Purpose and Lawful Grounds of Processing</h2>
              <p className="mb-3">
                In compliance with Section 4 and 6 of the DPDP Act, personal data is processed solely for specified, lawful purposes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>To operate, maintain, and provide the features of the RealSalePro CRM platform;</li>
                <li>To route incoming property inquiries and lead submissions in real-time to designated sales representatives;</li>
                <li>To enable automated communication (such as site-visit scheduling, project brochures, and follow-ups) via WhatsApp, SMS, or email;</li>
                <li>To maintain system security, detect fraudulent activities, and preserve audit trails; and</li>
                <li>To issue statutory tax invoices and comply with legal requirements under Indian law.</li>
              </ul>
            </section>

            {/* 5. Meta Lead Ads Integration */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">5. Meta (Facebook and Instagram) Lead Ads Integration</h2>
              <p className="mb-3">
                RealSalePro connects with the <strong>Meta Graph API</strong> and <strong>Facebook Login for Business</strong> (App ID: <code>1574456310724339</code>) to enable subscribers to capture real estate leads submitted through Facebook and Instagram Instant Lead Ads:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <strong>Scope Limitation:</strong> We only request permissions necessary for CRM lead ingestion (such as <code>leads_retrieval</code>, <code>pages_manage_metadata</code>, <code>pages_show_list</code>, and <code>public_profile</code>).
                </li>
                <li>
                  <strong>No Sale or Third-Party Sharing:</strong> We do not sell, rent, license, or trade Meta Platform Data to any third party, advertiser, or data broker.
                </li>
                <li>
                  <strong>Tenant Data Isolation:</strong> Every subscriber&apos;s Meta integration tokens and lead data are cryptographically isolated within their own tenant workspace. No tenant has access to another tenant&apos;s leads or tokens.
                </li>
                <li>
                  <strong>No Algorithmic Profiling:</strong> We do not use Meta Platform Data for unauthorized user profiling, behavioral surveillance, or cross-app tracking.
                </li>
              </ul>
            </section>

            {/* 6. WhatsApp & Portal Integrations */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">6. WhatsApp Business API and Real Estate Portals</h2>
              <p className="mb-3">
                Where configured by the subscriber, RealSalePro communicates with WhatsApp Business Solution Providers (BSPs) or the Meta WhatsApp Cloud API to deliver transactional messages in compliance with WhatsApp Business Messaging Policies. Similarly, webhook data from property portals (e.g., 99acres, Magicbricks, Housing.com) is processed strictly to populate the subscriber&apos;s internal CRM pipeline.
              </p>
            </section>

            {/* 7. Rights of Data Principals under DPDP Act */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">7. Rights of Data Principals</h2>
              <p className="mb-3">
                Under Chapter III (Sections 11–14) of the DPDP Act, 2023, individuals whose digital personal data is processed possess the following rights:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>Right to Access Information (Section 11):</strong> Right to obtain a summary of personal data being processed and the processing activities undertaken.</li>
                <li><strong>Right to Correction and Erasure (Section 12):</strong> Right to request correction of inaccurate data, completion of incomplete records, and erasure of personal data that is no longer necessary for the specified purpose.</li>
                <li><strong>Right of Grievance Redressal (Section 13):</strong> Right to readily available grievance redressal through our designated Grievance Officer.</li>
                <li><strong>Right to Nominate (Section 14):</strong> Right to designate another individual who may exercise rights on the Data Principal&apos;s behalf in the event of death or incapacity.</li>
              </ul>
            </section>

            {/* 8. User Data Deletion Instructions */}
            <section id="data-deletion">
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">8. User Data Deletion Instructions</h2>
              <p className="mb-3">
                In compliance with Meta Platform Terms and the DPDP Act Right to Erasure, users may revoke access and request data deletion at any time:
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-gray-900 mb-1">To revoke Facebook App Access:</h4>
                  <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                    <li>Go to your Facebook profile <strong>Settings &amp; Privacy &rarr; Settings</strong>.</li>
                    <li>Select <strong>Apps and Websites</strong> from the left menu.</li>
                    <li>Locate <strong>RealSalePro-Ads</strong> (App ID: <code>1574456310724339</code>) and click <strong>Remove</strong>.</li>
                  </ol>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-gray-900 mb-1">To request permanent deletion of your CRM records:</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Send an email with the subject <em>&quot;Data Deletion Request&quot;</em> to:
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    <a href="mailto:privacy@realsalepro.com" className="hover:underline">privacy@realsalepro.com</a> or <a href="mailto:support@realsalepro.com" className="hover:underline">support@realsalepro.com</a>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Upon identity verification, your personal records will be purged from our production databases within 7 business days, and a confirmation of erasure will be provided.
                  </p>
                </div>
              </div>
            </section>

            {/* 9. Data Security */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">9. Data Security and Safeguards</h2>
              <p className="mb-3">
                Pursuant to Section 8(5) of the DPDP Act, we implement reasonable technical and organizational security measures to protect personal data against unauthorized access, loss, or alteration. These measures include:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Encryption in transit using TLS 1.3 and encryption at rest using AES-256 protocols;</li>
                <li>Multi-tenant architecture ensuring strict isolation between subscriber workspaces;</li>
                <li>Role-based access controls (RBAC) and least-privilege administrative policies; and</li>
                <li>Protocols to notify the Data Protection Board of India (DPBI) and affected individuals in the event of any personal data breach, as required by Section 8(6) of the DPDP Act.</li>
              </ul>
            </section>

            {/* 10. Data Retention & Storage */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">10. Data Retention and Storage</h2>
              <p>
                All primary databases and backups are hosted in secure enterprise cloud infrastructure within the territorial boundaries of <strong>India</strong>. Personal data is retained only for as long as necessary to fulfill the specified purpose, or as required by applicable statutory requirements (e.g., RERA limitation periods, taxation records). When no longer needed, data is securely sanitized.
              </p>
            </section>

            {/* 11. Protection of Children */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">11. Protection of Children</h2>
              <p>
                In compliance with Section 9 of the DPDP Act, RealSalePro is strictly a commercial B2B real estate CRM intended solely for individuals aged 18 years and older. We do not knowingly collect, track, or process personal data of children, nor do we perform behavioral tracking targeted at children.
              </p>
            </section>

            {/* 12. Grievance Redressal Officer */}
            <section>
              <h2 className="text-xl font-bold text-[#0A1C37] mb-3">12. Grievance Redressal and Contact Details</h2>
              <p className="mb-3">
                In compliance with Section 13 of the DPDP Act, 2023 and the Information Technology Act, 2000, we have designated a <strong>Data Protection &amp; Grievance Officer</strong> to address any inquiries, complaints, or rights requests:
              </p>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-sm space-y-2">
                <p><strong>Officer:</strong> Data Protection &amp; Grievance Officer</p>
                <p><strong>Entity:</strong> RealSalePro Technologies Private Limited</p>
                <p>
                  <strong>Grievance Email:</strong>{' '}
                  <a href="mailto:grievance@realsalepro.com" className="text-blue-600 hover:underline">
                    grievance@realsalepro.com
                  </a>
                </p>
                <p>
                  <strong>Support Desk:</strong>{' '}
                  <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:underline">
                    support@realsalepro.com
                  </a>
                </p>
                <p><strong>Jurisdiction:</strong> India</p>
                <p className="text-xs text-gray-500 pt-2 border-t border-slate-200">
                  Grievances are acknowledged within 24 to 48 working hours and resolved within 30 days as prescribed by law. If unsatisfied with the resolution, Data Principals retain the right to approach the Data Protection Board of India under Section 13(3) of the DPDP Act.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
