import React from 'react';
import { ArrowLeft, Shield, Lock, FileText, UserCheck, AlertCircle, ExternalLink, Database, Mail, Building2, Scale, Trash2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  const lastUpdated = "November 9, 2026";
  const effectiveDate = "November 9, 2026";

  const quickLinks = [
    { id: "statutory-framework", label: "1. DPDP Act 2023 Framework" },
    { id: "roles-and-definitions", label: "2. Data Fiduciary & Processor Roles" },
    { id: "data-we-collect", label: "3. Categories of Data Collected" },
    { id: "purpose-and-lawful-basis", label: "4. Specified Purpose of Processing" },
    { id: "meta-platform-data", label: "5. Meta (Facebook/Instagram) Lead Ads" },
    { id: "third-party-integrations", label: "6. WhatsApp & Real Estate Portals" },
    { id: "data-principal-rights", label: "7. Your Rights under DPDP Act" },
    { id: "data-deletion", label: "8. User Data Deletion Instructions" },
    { id: "security-measures", label: "9. Technical Security & Breach Protocol" },
    { id: "retention-and-storage", label: "10. Storage & Localization" },
    { id: "minors-policy", label: "11. Policy on Children (Minors)" },
    { id: "grievance-officer", label: "12. Grievance Redressal & Contact" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      {/* Top Header Banner */}
      <div className="bg-[#0A1C37] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
          <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6 transition-colors font-medium text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Shield className="w-3.5 h-3.5" /> India DPDP Act, 2023 Compliant
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Lock className="w-3.5 h-3.5" /> Meta Platform Terms Certified
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Privacy Policy &amp; Data Protection Charter
              </h1>
              <p className="mt-3 text-slate-300 text-base sm:text-lg max-w-3xl">
                RealSalePro's comprehensive privacy commitment for Real Estate Enterprises, Channel Partners, and Leads under India's Digital Personal Data Protection Act, 2023.
              </p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 text-xs text-slate-300 space-y-1">
              <div><strong>Effective Date:</strong> {effectiveDate}</div>
              <div><strong>Last Updated:</strong> {lastUpdated}</div>
              <div><strong>Version:</strong> 2.4 (DPDP Aligned)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sticky Table of Contents (Desktop) */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-8 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Quick Navigation
              </h3>
              <nav className="space-y-1 text-sm">
                {quickLinks.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block px-3 py-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors font-medium text-xs leading-relaxed"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <hr className="my-6 border-slate-200" />

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-emerald-600" />
                  Statutory Commitment
                </div>
                <p>
                  This charter adheres strictly to Section 5, 6, 8, and 11-14 of the Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023, Parliament of India).
                </p>
                <a
                  href="#grievance-officer"
                  className="inline-block text-blue-600 font-medium hover:underline pt-1"
                >
                  Contact Grievance Officer &rarr;
                </a>
              </div>
            </div>
          </aside>

          {/* Legal Prose Content */}
          <main className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 sm:p-12 space-y-10">
            
            {/* Preamble */}
            <section className="border-b border-slate-100 pb-8">
              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Welcome to <strong>RealSalePro</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or the &quot;Platform&quot;), operated by <strong>RealSalePro Technologies Private Limited</strong>. We build and provide enterprise-grade, cloud-hosted Customer Relationship Management (CRM) and sales acceleration software tailored specifically for real estate developers, builders, channel partners, and brokers in India.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Protecting the privacy, integrity, and confidentiality of your personal and business data is our fundamental priority. This Privacy Policy informs you about how we handle digital personal data when you access our website (<a href="https://realsalepro.com" className="text-blue-600 underline">realsalepro.com</a>), subscribe to our CRM SaaS services, connect third-party ad platforms (such as Meta Lead Ads), or when your prospective buyers submit their contact information via real estate lead campaigns.
              </p>
            </section>

            {/* 1. Statutory Framework */}
            <section id="statutory-framework" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  1. Statutory Framework &amp; DPDP Act, 2023 Compliance
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  This Privacy Policy is framed in strict compliance with the following prevailing laws and regulations of the Republic of India:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>The Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;)</strong> (Act No. 22 of 2023).</li>
                  <li><strong>The Information Technology Act, 2000</strong> (21 of 2000) and its subsequent amendments.</li>
                  <li><strong>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (&quot;SPDI Rules&quot;)</strong>.</li>
                  <li><strong>The Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</strong>.</li>
                  <li><strong>Real Estate (Regulation and Development) Act, 2016 (&quot;RERA&quot;)</strong> record-keeping guidelines as applicable to project marketing disclosures.</li>
                </ul>
              </div>
            </section>

            {/* 2. Roles and Definitions */}
            <section id="roles-and-definitions" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  2. Roles under DPDP Act: Data Fiduciary vs. Data Processor
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  The DPDP Act, 2023 recognizes two distinct capacities under which personal data is processed:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-blue-100 text-blue-700 mb-2">
                      RealSalePro as Data Fiduciary
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      For our direct subscribers, website visitors, and account admins. We determine the purpose and means of collecting your registration info, billing records, authentication credentials, and platform usage metrics.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-700 mb-2">
                      RealSalePro as Data Processor
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      When our subscribers (Builders, Developers, Brokers) import, synchronize, or collect leads of prospective property buyers via Meta Lead Ads, portals, or phone calls. The subscriber acts as the <strong>Data Fiduciary</strong>, and RealSalePro acts strictly as a <strong>Data Processor</strong> on their written instructions.
                    </p>
                  </div>
                </div>

                <p>
                  <strong>Data Principal:</strong> Means the individual to whom the personal data relates (including real estate buyers, website visitors, and subscriber agents).
                </p>
              </div>
            </section>

            {/* 3. Categories of Data Collected */}
            <section id="data-we-collect" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  3. Categories of Digital Personal Data Collected
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>We collect and process only the minimum necessary digital personal data required to deliver our CRM solutions:</p>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4 py-1">
                    <h4 className="font-semibold text-slate-900">A. Subscriber Profile &amp; KYC Data</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Full name, official work email, mobile phone number, company/firm name, RERA registration numbers, GSTIN, business address, and designated team member roles.
                    </p>
                  </div>

                  <div className="border-l-4 border-emerald-500 pl-4 py-1">
                    <h4 className="font-semibold text-slate-900">B. Real Estate Prospect &amp; Lead Data (Processed on Tenant Behalf)</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Prospective home-buyer name, phone number, email address, preferred project location, budget range, BHK preference, call log summaries, site visit schedules, and notes entered by sales executives.
                    </p>
                  </div>

                  <div className="border-l-4 border-amber-500 pl-4 py-1">
                    <h4 className="font-semibold text-slate-900">C. Third-Party Ad &amp; Platform Tokens</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Meta OAuth Page Access Tokens, Facebook Leadgen IDs, WhatsApp Cloud API phone numbers, and webhook verification secrets required to automate lead delivery.
                    </p>
                  </div>

                  <div className="border-l-4 border-slate-500 pl-4 py-1">
                    <h4 className="font-semibold text-slate-900">D. Technical &amp; Diagnostic Telemetry</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      IP address, device hardware model, browser user agent, login timestamps, audit logs, and diagnostic error traces.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Purpose and Lawful Basis */}
            <section id="purpose-and-lawful-basis" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  4. Specified Purpose &amp; Lawful Grounds of Processing
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  In compliance with <strong>Section 4 and 6 of the DPDP Act, 2023</strong>, personal data is processed solely for specified, clear, and legitimate purposes based on lawful consent or legitimate uses:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Fulfillment of SaaS Agreement:</strong> Account provisioning, real-time lead routing to sales teams, automatic round-robin assignment, and pipeline visualization.</li>
                  <li><strong>Transactional Communication:</strong> Automated dispatch of property brochures, price sheets, site-visit confirmations, and follow-ups via WhatsApp or email upon lead form submission.</li>
                  <li><strong>Security &amp; Abuse Prevention:</strong> Verifying user access, multi-tenant workspace isolation, intrusion prevention, and auditing actions.</li>
                  <li><strong>Statutory Invoicing:</strong> Generating GST tax invoices, processing subscription renewals via RBI-compliant payment aggregators.</li>
                </ul>
              </div>
            </section>

            {/* 5. Meta Lead Ads Integration */}
            <section id="meta-platform-data" className="scroll-mt-8 bg-blue-50/50 rounded-2xl p-6 border border-blue-200/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  5. Meta (Facebook &amp; Instagram) Lead Ads &amp; Platform Data Policy
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  RealSalePro integrates with the <strong>Meta Graph API</strong> and <strong>Facebook Login for Business</strong> (App ID: <code>1574456310724339</code>) to enable real estate subscribers to automatically receive leads generated through Facebook and Instagram Instant Lead Ads.
                </p>

                <div className="bg-white rounded-xl p-4 border border-blue-200 text-xs space-y-2 text-slate-700">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Our Strict Commitments Regarding Meta Platform Data:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                    <li><strong>No Sale of Data:</strong> We NEVER sell, license, rent, trade, or commercialize Meta Platform Data or Facebook lead information to any third party, broker, or ad exchange.</li>
                    <li><strong>No Cross-Tenant Data Mixing:</strong> Every subscriber&apos;s Facebook Page token and ingested lead information is cryptographically isolated within their private tenant workspace. Tenant A can never view or access Tenant B&apos;s leads.</li>
                    <li><strong>Permitted Scopes Only:</strong> We only request permissions necessary for CRM lead ingestion (<code>leads_retrieval</code>, <code>pages_manage_metadata</code>, <code>pages_show_list</code>, <code>public_profile</code>).</li>
                    <li><strong>No Profiling or Cross-Targeting:</strong> We do not use Meta Platform Data for independent behavioral profiling, surveillance, or to build advertising audiences outside the subscriber&apos;s explicit campaign mandate.</li>
                    <li><strong>Token Security:</strong> All Meta Page Access Tokens are stored with industry-standard AES-256 encryption at rest and transmitted solely over TLS 1.3 encrypted connections.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 6. WhatsApp & Real Estate Portals */}
            <section id="third-party-integrations" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  6. WhatsApp Cloud API &amp; Real Estate Portals
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  RealSalePro allows subscribers to ingest leads and communicate through sanctioned ecosystem integrations:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Meta WhatsApp Cloud API / Official BSPs:</strong> Subscribers can configure authorized WhatsApp Business Accounts (WABA) to dispatch automated welcome greetings and brochure PDFs. Messages are dispatched strictly in accordance with WhatsApp Business Messaging Policies and recipient opt-in rules.</li>
                  <li><strong>Indian Property Portals (99acres, Magicbricks, Housing.com):</strong> Webhook leads received from real estate portals are processed strictly to populate the subscriber&apos;s pipeline. Credentials and API keys provided by the subscriber remain their exclusive property.</li>
                </ul>
              </div>
            </section>

            {/* 7. Rights of Data Principals under DPDP Act */}
            <section id="data-principal-rights" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  7. Your Rights under the DPDP Act, 2023
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  In accordance with <strong>Chapter III (Sections 11 through 14) of the DPDP Act, 2023</strong>, every Data Principal whose digital personal data is processed by RealSalePro possesses the following statutory rights:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                      <FileText className="w-4 h-4 text-blue-600" />
                      1. Right to Access Information (Sec. 11)
                    </h4>
                    <p className="text-xs text-slate-600">
                      You have the right to obtain a summary of your personal data being processed, the underlying processing activities, and identities of any data processors involved.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      2. Right to Correction &amp; Erasure (Sec. 12)
                    </h4>
                    <p className="text-xs text-slate-600">
                      You have the right to correct inaccurate or misleading personal data, complete incomplete information, and request permanent erasure of your personal data when no longer needed.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                      <AlertCircle className="w-4 h-4 text-emerald-600" />
                      3. Right of Grievance Redressal (Sec. 13)
                    </h4>
                    <p className="text-xs text-slate-600">
                      You have the right to register complaints regarding data protection with our designated Grievance Officer, who is bound to acknowledge within 48 hours and resolve within statutory timelines.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      4. Right to Nominate (Sec. 14)
                    </h4>
                    <p className="text-xs text-slate-600">
                      You have the right to designate any other individual who shall, in the event of your death or incapacity, exercise your data protection rights on your behalf.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. User Data Deletion Instructions (Meta & DPDP Erasure) */}
            <section id="data-deletion" className="scroll-mt-8 bg-slate-900 text-white rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  8. User Data Deletion Instructions (Meta &amp; DPDP Compliance)
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                <p>
                  In accordance with <strong>Meta Platform Terms</strong> and the <strong>DPDP Act Right to Erasure</strong>, you have full authority to request the immediate deletion of your personal data and revoke third-party app permissions at any time:
                </p>

                <div className="space-y-4 mt-4">
                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700">
                    <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                      How to Revoke RealSalePro from your Facebook Account
                    </h4>
                    <ol className="list-decimal pl-6 space-y-1 text-xs text-slate-300">
                      <li>Log in to your Facebook profile and navigate to <strong>Settings &amp; Privacy &rarr; Settings</strong>.</li>
                      <li>In the left sidebar, click on <strong>Apps and Websites</strong>.</li>
                      <li>Find <strong>RealSalePro-Ads</strong> (App ID: <code>1574456310724339</code>) in the list.</li>
                      <li>Click <strong>Remove</strong>. This immediately revokes RealSalePro&apos;s access to your pages and campaigns.</li>
                    </ol>
                  </div>

                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700">
                    <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                      How to Request Permanent Erasure of Your CRM Records
                    </h4>
                    <p className="text-xs text-slate-300 mb-2">
                      If you are a prospective buyer or subscriber and wish to have all your personal information, phone number, and conversation logs permanently deleted from RealSalePro&apos;s databases:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-xs text-slate-300">
                      <li>Send an email to: <a href="mailto:privacy@realsalepro.com" className="text-blue-400 underline font-semibold">privacy@realsalepro.com</a> or <a href="mailto:support@realsalepro.com" className="text-blue-400 underline font-semibold">support@realsalepro.com</a></li>
                      <li>Subject line: <strong>&quot;Data Deletion Request - [Your Name / Mobile Number]&quot;</strong></li>
                      <li>Our data protection team will verify your identity, purge your records from active databases within <strong>7 business days</strong>, and issue a written Confirmation of Erasure.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* 9. Technical Security & Breach Protocol */}
            <section id="security-measures" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  9. Technical Security Measures &amp; Data Breach Protocol
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  As mandated under <strong>Section 8(5) of the DPDP Act, 2023</strong>, RealSalePro implements comprehensive technical and operational safeguards:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Cryptographic Standards:</strong> End-to-end data encryption in transit using TLS 1.3 and storage at rest using AES-256 encryption.</li>
                  <li><strong>Multi-Tenant Isolation:</strong> Logical separation enforced at database query and row-level security layers to ensure zero cross-tenant data leakage.</li>
                  <li><strong>Role-Based Access Control (RBAC):</strong> Strict privilege separation ensuring only authorized sales team members access prospect data within their assigned branch.</li>
                  <li><strong>Data Breach Notification:</strong> In the unlikely event of a security incident impacting personal data, RealSalePro maintains an incident response protocol to notify the <strong>Data Protection Board of India (DPBI)</strong> and affected Data Principals without undue delay.</li>
                </ul>
              </div>
            </section>

            {/* 10. Retention and Storage */}
            <section id="retention-and-storage" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  10. Data Retention &amp; Sovereign Localization
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  <strong>Storage Localization:</strong> All core databases, backup archives, and application servers are hosted in secure enterprise cloud data centers located within the territorial borders of <strong>India</strong> (including MeitY-empaneled cloud regions).
                </p>
                <p>
                  <strong>Retention Period:</strong> Personal data is retained solely for the duration necessary to satisfy the purpose for which it was obtained, or as mandated by applicable statutory obligations (such as Indian RERA property dispute limitation periods and Income Tax records). Upon contract expiration or request for erasure, data is sanitized in accordance with NIST SP 800-88 guidelines.
                </p>
              </div>
            </section>

            {/* 11. Minors Policy */}
            <section id="minors-policy" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  11. Protection of Children &amp; Persons with Disabilities
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  In compliance with <strong>Section 9 of the DPDP Act, 2023</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>RealSalePro is exclusively an enterprise B2B real estate CRM intended solely for individuals aged <strong>18 years or older</strong>.</li>
                  <li>We do not knowingly solicit, process, or track the personal data of children (minors below 18 years of age) or undertake any behavioral tracking targeted towards children.</li>
                  <li>If we become aware that personal data of a minor has been inadvertently ingested, we will take immediate steps to permanently delete such information from our records.</li>
                </ul>
              </div>
            </section>

            {/* 12. Grievance Officer & Contact */}
            <section id="grievance-officer" className="scroll-mt-8 border-t border-slate-200 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0A1C37]">
                  12. Grievance Redressal Mechanism &amp; Statutory Officer
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-700">
                <p>
                  As mandated under <strong>Section 13 of the Digital Personal Data Protection Act, 2023</strong> and the <strong>Information Technology Act, 2000</strong>, RealSalePro has appointed a dedicated <strong>Data Protection &amp; Grievance Redressal Officer</strong>:
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="block text-slate-500 font-medium">Designation:</span>
                      <strong className="text-slate-900 text-sm">Data Protection &amp; Grievance Officer</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-medium">Entity Name:</span>
                      <strong className="text-slate-900 text-sm">RealSalePro Technologies Private Limited</strong>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-medium">Direct Grievance Email:</span>
                      <a href="mailto:grievance@realsalepro.com" className="text-blue-600 font-semibold hover:underline">
                        grievance@realsalepro.com
                      </a>
                    </div>
                    <div>
                      <span className="block text-slate-500 font-medium">Support &amp; Privacy Desk:</span>
                      <a href="mailto:support@realsalepro.com" className="text-blue-600 font-semibold hover:underline">
                        support@realsalepro.com
                      </a>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="block text-slate-500 font-medium">Official Postal Address:</span>
                      <span className="text-slate-800">
                        Corporate Compliance Cell, RealSalePro Technologies Pvt. Ltd., India.
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600">
                    <strong>Statutory Redressal Timelines:</strong>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Acknowledgment of complaint: <strong>Within 24 to 48 working hours</strong>.</li>
                      <li>Formal investigation and resolution: <strong>Within 30 calendar days</strong>.</li>
                      <li>If unsatisfied with our internal redressal, you retain the statutory right to escalate the grievance to the <strong>Data Protection Board of India (DPBI)</strong> in accordance with Section 13(3) of the DPDP Act.</li>
                    </ul>
                  </div>
                </div>

                <div className="text-center pt-6">
                  <p className="text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} RealSalePro Technologies Private Limited. All rights reserved. Registered under the laws of the Republic of India.
                  </p>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
