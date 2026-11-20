import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { WebsiteWhatsAppWidget } from '../components/whatsapp/WebsiteWhatsAppWidget';
import { ShieldCheck, AlertTriangle, FileText, Server, CheckCircle2, ArrowLeft, ArrowRight, Lock, UserCheck, Database, Scale } from 'lucide-react';
import { initLandingInteractions } from './landingInteractions';
import '../styles/landing.css';

const blogSchema = {
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
          "name": "Knowledge Hub & Blog",
          "item": "https://realsalepro.com/blog"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "DPDP Act for Real Estate: Data Fiduciary vs Processor",
          "item": "https://realsalepro.com/blog/dpdp-act-real-estate-data-fiduciary-vs-processor"
        }
      ]
    },
    {
      "@type": "Article",
      "@id": "https://realsalepro.com/blog/dpdp-act-real-estate-data-fiduciary-vs-processor#article",
      "isPartOf": { "@id": "https://realsalepro.com/#website" },
      "headline": "DPDP Act (India) for Real Estate: Are You a Data Fiduciary or Processor?",
      "description": "Comprehensive legal and operational guide on India's Digital Personal Data Protection Act, 2023 for builders, brokers, and proptech CRMs. Learn key roles, statutory liabilities, and compliance checklists.",
      "url": "https://realsalepro.com/blog/dpdp-act-real-estate-data-fiduciary-vs-processor",
      "datePublished": "2026-11-21T00:00:00+05:30",
      "dateModified": "2026-11-21T00:00:00+05:30",
      "author": {
        "@type": "Organization",
        "name": "RealSalePro Compliance & Legal Tech Desk",
        "url": "https://realsalepro.com/"
      },
      "publisher": {
        "@type": "Organization",
        "name": "RealSalePro",
        "logo": {
          "@type": "ImageObject",
          "url": "https://realsalepro.com/images/RealSalePro_Favicon.png"
        }
      },
      "image": "https://realsalepro.com/images/realsalepro-og-share.png",
      "mainEntityOfPage": "https://realsalepro.com/blog/dpdp-act-real-estate-data-fiduciary-vs-processor"
    }
  ]
};

export function BlogDPDPPage() {
  useEffect(() => {
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('js');
    const cleanup = initLandingInteractions();
    return () => {
      document.body.classList.remove('landing-page-active');
      cleanup();
    };
  }, []);

  return (
    <>
      <SEOHead
        title="DPDP Act (India) for Real Estate: Data Fiduciary vs Processor Guide | RealSalePro"
        description="Comprehensive guide on India's Digital Personal Data Protection (DPDP) Act, 2023 for builders, brokers, and channel partners. Learn key roles, statutory penalties up to ₹250 Cr, DPA agreements, and cloud residency."
        canonicalUrl="https://realsalepro.com/blog/dpdp-act-real-estate-data-fiduciary-vs-processor"
        keywords="DPDP Act real estate, DPDP Act India builders brokers, data fiduciary vs data processor crm, real estate lead privacy india, dpdp compliance real estate, data processing agreement dpa india"
        jsonLd={blogSchema}
      />

      {/* SVG Icon Definitions */}
      <svg xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></symbol>
        <symbol id="i-whatsapp" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.445 4.43-9.876 9.88-9.876 2.637 0 5.116 1.028 6.98 2.894a9.83 9.83 0 012.89 6.982c0 5.447-4.43 9.879-9.877 9.879" fill="currentColor"/></symbol>
      </svg>

      {/* Nav */}
      <header className="nav" id="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__brand" aria-label="RealSalePro home" style={{ maxWidth: '190px', display: 'flex', alignItems: 'center' }}>
            <img src="/assets/img/logo-light.png" alt="RealSalePro" width="176" height="34" style={{ height: '34px', maxHeight: '34px', width: 'auto', maxWidth: '176px', objectFit: 'contain', display: 'block' }} />
          </Link>
          <nav className="nav__links" aria-label="Primary">
            <Link to="/#features">Features</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/blog" className="text-emerald-400 font-bold">Blog</Link>
            <Link to="/#faq">FAQ</Link>
          </nav>
          <div className="nav__actions">
            <Link className="nav__login" to="/login">Log in</Link>
            <Link className="btn btn--primary btn--sm" to="/register">
              <span>Start free</span><svg className="icon"><use href="#i-arrow"/></svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-slate-50 pt-28 pb-20 text-slate-800 font-sans">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb & Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <span className="text-xs text-slate-500 font-medium">November 2026 • 6 min read</span>
          </div>

          {/* Article Header */}
          <header className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase mb-4">
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              Statutory Legal Guide • DPDP Act, 2023
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0a2018] tracking-tight leading-tight mb-5">
              DPDP Act (India) for Real Estate: Are You a Data Fiduciary or Processor?
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal">
              A comprehensive breakdown of India's <strong>Digital Personal Data Protection Act, 2023</strong> for real estate builders, developers, and brokers. Learn your statutory legal roles, the mandatory Data Processing Agreement (DPA), penalties up to ₹250 Crores, and how to stay 100% compliant.
            </p>

            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-200 text-xs text-slate-500">
              <div>
                Authored by: <strong className="text-slate-700">RealSalePro Legal &amp; Compliance Desk</strong>
              </div>
              <span>•</span>
              <div>
                Statutory Reference: <strong className="text-slate-700">DPDP Act, 2023 (Act No. 22 of 2023)</strong>
              </div>
            </div>
          </header>

          {/* Executive Summary Card */}
          <div className="bg-gradient-to-br from-[#061810] to-[#0d2a1d] text-white rounded-2xl p-6 sm:p-8 mb-12 shadow-xl border border-emerald-500/30">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <h2 className="text-xl font-bold text-white m-0">Executive Summary for Real Estate Leaders</h2>
            </div>
            <p className="text-sm text-emerald-100/90 leading-relaxed mb-4">
              Under India's DPDP Act, the real estate industry is undergoing its biggest regulatory transformation since RERA in 2016. The days of buying unauthorized Excel phone number lists, cold-calling without consent, and storing prospect data in unsecured sheets are legally over.
            </p>
            <ul className="text-xs sm:text-sm text-emerald-200/80 space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>You (Builder / Broker) are the "Data Fiduciary":</strong> You decide why buyer data is collected and are legally accountable for lawful consent.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Your CRM (RealSalePro) is the "Data Processor":</strong> We store and secure data strictly under your instructions and can never sell or share your leads.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Mandatory Contract:</strong> Under Section 8(2), engaging any CRM software requires a signed or click-wrap <strong>Data Processing Agreement (DPA)</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Penalty Warning:</strong> Section 33 mandates statutory penalties up to <strong>₹250 Crores</strong> for data security breaches and lack of consent proof.</span>
              </li>
            </ul>
          </div>

          {/* Content Body */}
          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-8">

            {/* Section: The 3 Core Legal Roles */}
            <section>
              <h2 className="text-2xl font-bold text-[#0a2018] flex items-center gap-2 mb-4">
                <UserCheck className="w-6 h-6 text-emerald-600" />
                1. The Three Statutory Roles in Real Estate
              </h2>
              <p>
                India's DPDP Act, 2023 clearly establishes three distinct legal entities whenever personal data (such as a homebuyer's name, phone number, salary, or property budget) is processed:
              </p>

              {/* Statutory Roles Comparison Table */}
              <div className="overflow-x-auto my-6 border border-slate-200 rounded-xl shadow-sm">
                <table className="min-w-full text-left text-sm divide-y divide-slate-200 bg-white">
                  <thead className="bg-slate-100 text-slate-900 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">Party</th>
                      <th className="py-3.5 px-4">Legal Role under DPDP Act</th>
                      <th className="py-3.5 px-4">Primary Statutory Responsibility</th>
                      <th className="py-3.5 px-4">Real Estate Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">Your Customer<br/><span className="font-normal text-slate-500">(Builder / Developer / Broker)</span></td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs">
                          Data Fiduciary
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Determines the purpose and means of collecting leads; must prove valid notice and consent; must honor opt-out and erasure requests.
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic">
                        Greenfield Developers or an Apex Realty broker collecting site visit inquiries.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">RealSalePro<br/><span className="font-normal text-slate-500">(Synergy Brand Architect)</span></td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-bold text-xs">
                          Data Processor
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Hosts, encrypts, and processes data strictly on behalf of the Data Fiduciary. Prohibited from selling or using leads for its own marketing.
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic">
                        Cloud CRM database hosting buyer records securely on AWS Mumbai (ap-south-1).
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">The Homebuyer / Investor<br/><span className="font-normal text-slate-500">(End User)</span></td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 font-bold text-xs">
                          Data Principal
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        Owns the personal data. Has statutory rights to access, correct, withdraw consent, and demand permanent erasure of their details.
                      </td>
                      <td className="py-3 px-4 text-slate-600 italic">
                        Mr. Sharma inquiring about a 3BHK flat on your website or Meta ad campaign.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section: Why Real Estate is at Risk */}
            <section>
              <h2 className="text-2xl font-bold text-[#0a2018] flex items-center gap-2 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                2. Why Traditional Real Estate Lead Practices Are Now Illegal
              </h2>
              <p>
                In the Indian real estate market, common legacy practices included:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Purchasing leaked CD-ROMs or Excel spreadsheets containing phone numbers of car owners, club members, or HNI investors.</li>
                <li>Conducting cold telemarketing calls without prior consent or TRAI DND scrub.</li>
                <li>Storing unencrypted homebuyer KYC documents (Aadhaar, PAN cards, income proofs) on personal laptops or unprotected Google Sheets.</li>
              </ul>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl my-4 text-sm text-red-900">
                <strong>Statutory Liability:</strong> Under Section 6 and Section 33 of the DPDP Act, processing personal data without verifiable consent carries penalties of up to <strong>₹250 Crores per breach</strong>. When a homebuyer files a grievance with the Data Protection Board of India, the <strong>Data Fiduciary (the Builder/Broker)</strong> must provide cryptographic proof of when and how consent was given.
              </div>
            </section>

            {/* Section: Mandatory Data Processing Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-[#0a2018] flex items-center gap-2 mb-4">
                <FileText className="w-6 h-6 text-emerald-600" />
                3. The Mandatory Contract: Why You Need a DPA under Section 8(2)
              </h2>
              <p>
                Under Section 8(2) of the DPDP Act, 2023:
              </p>
              <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600 my-4">
                "A Data Fiduciary may engage, appoint, use or otherwise involve a Data Processor to process personal data on its behalf... <strong>only under a valid contract</strong>."
              </blockquote>
              <p>
                If a real estate builder or broker uses a CRM without a valid <strong>Data Processing Agreement (DPA)</strong>, both the builder and the CRM software operate in direct violation of the Act.
              </p>
              <p>
                <strong>How RealSalePro Solves This:</strong> RealSalePro includes a pre-executed, legally enforceable <strong>Data Processing Addendum</strong> directly in our Terms of Service (<a href="/terms#dpa" className="text-emerald-700 font-semibold underline">realsalepro.com/terms#dpa</a>). The moment you create your workspace or upgrade to Pro, a binding electronic DPA is established under Section 10A of the IT Act, 2000 and Section 8(2) of the DPDP Act.
              </p>
            </section>

            {/* Section: Data Principal Rights */}
            <section>
              <h2 className="text-2xl font-bold text-[#0a2018] flex items-center gap-2 mb-4">
                <Scale className="w-6 h-6 text-emerald-600" />
                4. Data Principal Rights: Erasure &amp; The "Right to be Forgotten"
              </h2>
              <p>
                Under Section 11 and Section 12 of the DPDP Act, 2023, every homebuyer has four non-negotiable rights:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1">1. Right to Access</h3>
                  <p className="text-xs text-slate-600">Homebuyers can demand a complete summary of all personal data and identities of third parties with whom their data was shared.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1">2. Right to Correction</h3>
                  <p className="text-xs text-slate-600">Right to correct inaccurate details, update phone numbers, or complete incomplete profile information.</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1">3. Right to Erasure</h3>
                  <p className="text-xs text-slate-600">If a lead withdraws consent or asks not to be contacted, the Data Fiduciary must erase their personal data unless retention is required by another law (e.g. RERA deed).</p>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-1">4. Right to Grievance Redressal</h3>
                  <p className="text-xs text-slate-600">Fiduciaries must provide a designated Grievance Officer and resolve data complaints within statutory timelines before escalation to the Data Protection Board.</p>
                </div>
              </div>
            </section>

            {/* Section: Cloud Data Localization */}
            <section>
              <h2 className="text-2xl font-bold text-[#0a2018] flex items-center gap-2 mb-4">
                <Server className="w-6 h-6 text-emerald-600" />
                5. Cloud Residency: Why AWS Mumbai (ap-south-1) Matters
              </h2>
              <p>
                A frequent question from real estate developers is: <em>"Can our CRM data be stored on international cloud servers?"</em>
              </p>
              <p>
                Under Section 16 of the DPDP Act, India operates on a <strong>"Negative List" (Blacklist)</strong> approach. Cross-border transfers to standard territories are permitted unless specifically restricted by the Central Government.
              </p>
              <p>
                However, <strong>in-country data residency</strong> remains the gold standard for enterprise credibility. RealSalePro deploys all core databases, file uploads, and encrypted backups in <strong>AWS Mumbai, India (<code>ap-south-1</code>)</strong>:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>100% In-Country Sovereignty:</strong> Buyer records never leave Indian borders.</li>
                <li><strong>Ultra-Low Latency:</strong> Sub-20ms database response for agents and calling teams across India.</li>
                <li><strong>Statutory WORM Protection:</strong> Write-Once-Read-Many database triggers protect consent audit records from unauthorized deletion for 3 years.</li>
              </ul>
            </section>

            {/* Section: 5-Step Actionable Checklist */}
            <section className="bg-slate-100 rounded-2xl p-6 sm:p-8 border border-slate-300">
              <h2 className="text-2xl font-bold text-[#0a2018] mb-4">
                6. The 5-Step DPDP Compliance Checklist for Builders &amp; Brokers
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Stop Buying Cold Contact Databases</h3>
                    <p className="text-xs text-slate-600">Discontinue purchasing unverified phone lists. Only contact leads who have explicitly opted in via your landing pages, ads, or direct site visits.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Add Clear Consent Disclaimers on Landing Pages</h3>
                    <p className="text-xs text-slate-600">Ensure your inquiry forms state clearly: <em>"By submitting, you consent to receive calls and WhatsApp updates regarding this project in accordance with our Privacy Policy."</em></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Adopt a DPDP-Compliant CRM with an Enforceable DPA</h3>
                    <p className="text-xs text-slate-600">Ensure your software provider executes a binding Data Processing Addendum so your liability as Data Fiduciary is clearly demarcated from the processor.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">4</div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Honor "Do Not Call" &amp; Deletion Requests</h3>
                    <p className="text-xs text-slate-600">When a homebuyer says "Not interested, please do not call", update their stage immediately to "Opt-Out" or delete their record using self-service CRM tools.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">5</div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Verify Data Encryption &amp; In-Country Storage</h3>
                    <p className="text-xs text-slate-600">Verify that your CRM enforces TLS 1.3 transit encryption, AES-256 rest encryption, and stores primary data within India on MeitY-empaneled cloud providers.</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Bottom Conversion CTA */}
          <div className="mt-16 bg-gradient-to-r from-[#04120c] via-[#0a2318] to-[#04120c] rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl border border-emerald-500/30">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase mb-4">
              <Lock className="w-3.5 h-3.5" /> 100% DPDP Act Compliant Real Estate CRM
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4">
              Protect Your Real Estate Business Today
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Join 50+ Indian builders and property brokers who manage leads securely on RealSalePro. Built-in Data Processing Agreement, AWS Mumbai storage, and automated consent tracking.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/register" className="btn btn--primary btn--lg font-bold">
                Start Free Workspace (Up to 1,000 Leads) <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link to="/terms#dpa" className="px-6 py-3.5 rounded-xl border border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-emerald-500/10 transition-colors text-sm font-semibold">
                Review Our Data Processing Agreement &rarr;
              </Link>
            </div>
          </div>

        </article>
      </main>

      {/* WhatsApp Floating Widget */}
      <WebsiteWhatsAppWidget />
    </>
  );
}
