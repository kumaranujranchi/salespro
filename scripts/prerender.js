import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

// 1. Read base dist/index.html
const templatePath = path.join(distDir, 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error('❌ dist/index.html not found! Run vite build first.');
  process.exit(1);
}
const baseHtml = fs.readFileSync(templatePath, 'utf8');

// 2. Extract landingHtml for homepage
let landingPageBody = '';
const landingHtmlPath = path.join(rootDir, 'src/pages/landingHtml.ts');
if (fs.existsSync(landingHtmlPath)) {
  const fileContent = fs.readFileSync(landingHtmlPath, 'utf8');
  const match = fileContent.match(/export const landingHtml = \`([\s\S]*?)\`;/);
  if (match) {
    landingPageBody = `<div class="realsalepro-landing-wrapper">${match[1]}</div>`;
  }
}

// 3. Centralized Route Registry for Pre-rendering
const routes = [
  // --- Homepage ---
  {
    path: '/',
    title: 'Free Real Estate CRM for Builders & Brokers | RealSalePro',
    description: 'Free real estate CRM for Indian builders, developers & brokers. Auto-sync Meta, Google & WhatsApp leads, track site visits and pipeline. 1,000 leads free.',
    canonical: 'https://realsalepro.com/',
    noindex: false,
    content: landingPageBody,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://realsalepro.com/#org",
          "name": "RealSalePro",
          "url": "https://realsalepro.com/",
          "logo": "https://realsalepro.com/images/RealSalePro_Favicon.png",
          "sameAs": [
            "https://www.facebook.com/realsalepro",
            "https://www.linkedin.com/company/realsalepro"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-7079737773",
            "contactType": "sales",
            "areaServed": "IN",
            "availableLanguage": ["en", "hi"]
          }
        },
        {
          "@type": "WebSite",
          "@id": "https://realsalepro.com/#website",
          "url": "https://realsalepro.com/",
          "name": "RealSalePro",
          "publisher": { "@id": "https://realsalepro.com/#org" }
        },
        {
          "@type": "SoftwareApplication",
          "@id": "https://realsalepro.com/#app",
          "name": "RealSalePro",
          "url": "https://realsalepro.com/",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web, Android, iOS",
          "description": "100% Free real estate CRM for Indian builders, developers, and brokers. Manage up to 1,000 leads with zero credit card required.",
          "publisher": { "@id": "https://realsalepro.com/#org" },
          "image": "https://realsalepro.com/images/realsalepro-og-share.png",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR",
            "url": "https://realsalepro.com/pricing"
          }
        },
        {
          "@type": "FAQPage",
          "@id": "https://realsalepro.com/#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is RealSalePro really free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! RealSalePro is 100% free forever for small teams. The Free plan supports up to 1,000 leads and up to 5 users, and includes automated lead routing, pipeline visualisation, inventory tracking, Meta and WhatsApp lead sync — without any credit card required."
              }
            },
            {
              "@type": "Question",
              "name": "Can I customise the app for my agency?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. RealSalePro supports custom pipeline stages, lead sources, custom fields, user roles, branding and reports per agency. API access is available for advanced integrations."
              }
            },
            {
              "@type": "Question",
              "name": "How secure is my client data?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Security is our top priority. We use AES-256 encryption at rest, TLS 1.3 in transit, role-based access control and strict multi-tenant isolation. Enterprise self-hosted deployments are also supported."
              }
            },
            {
              "@type": "Question",
              "name": "Do you offer support and onboarding?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. Every account includes onboarding support: video training, setup assistance, data migration from Excel, 24/7 email & chat support, and live WhatsApp support at +91 70797 37773."
              }
            },
            {
              "@type": "Question",
              "name": "What payment methods are supported?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "UPI, debit/credit cards (Visa, Mastercard, RuPay), Net Banking, and NEFT/RTGS bank transfers. Invoicing with NET-30 terms is available for enterprise plans."
              }
            },
            {
              "@type": "Question",
              "name": "Can I integrate RealSalePro with other tools?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes — WhatsApp Business API, Meta Facebook Lead Ads, Google Ads, Magicbricks, 99acres, Housing.com, Google Sheets, and custom webhooks are supported natively."
              }
            }
          ]
        }
      ]
    }
  },

  // --- Free Real Estate CRM ---
  {
    path: '/free-real-estate-crm',
    title: 'Free Real Estate CRM Software for Brokers | RealSalePro',
    description: '100% Free real estate CRM for Indian brokers and developers. Auto-sync Meta and WhatsApp leads, manage property pipeline and site visits with zero card.',
    canonical: 'https://realsalepro.com/free-real-estate-crm',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">1,000 Leads Free Forever &bull; No Credit Card</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Free Real Estate CRM Software for Indian Agents, Brokers &amp; Developers</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Stop paying ₹15,000+ monthly subscriptions before you close your first property sale. RealSalePro gives you full CRM capability with instant Meta Ads lead sync, WhatsApp auto-responder, site visit tracking, and phone number masking 100% free forever.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="/register" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Start Free — 1,000 Leads Included</a>
          <a href="/pricing" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">Compare Plans</a>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:40px;">
          <h2 style="font-size:24px;margin-bottom:20px;">Why Indian Real Estate Teams Choose RealSalePro Free Tier</h2>
          <ul style="line-height:1.8;color:rgba(255,255,255,0.8);font-size:16px;">
            <li><strong>Auto-sync leads in under 30 seconds:</strong> Instant webhooks for Facebook Ads, Instagram Ads, Magicbricks, 99acres and Google Forms.</li>
            <li><strong>WhatsApp Business Automation:</strong> Auto-reply to buyer inquiries instantly with property brochures and site visit scheduling.</li>
            <li><strong>Phone Number Masking:</strong> Protect your proprietary client numbers from rogue agents and employee data leakage.</li>
            <li><strong>Multi-User Collaboration:</strong> Support up to 5 sales executives with custom permissions on the free tier.</li>
          </ul>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Free Real Estate CRM", "item": "https://realsalepro.com/free-real-estate-crm" }
          ]
        }
      ]
    }
  },

  // --- CRM for Brokers ---
  {
    path: '/crm-for-real-estate-brokers',
    title: 'CRM for Real Estate Brokers & Agents | RealSalePro',
    description: 'Built for Indian real estate brokers and channel partners. Manage buyer leads, site visits, WhatsApp follow-ups and deals. Manage up to 1,000 leads free.',
    canonical: 'https://realsalepro.com/crm-for-real-estate-brokers',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">Broker &amp; Channel Partner Edition</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Real Estate CRM Software for Brokers, Dealers &amp; Channel Partners</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Manage investor inquiries, scheduled property site visits, and builder commissions in one calm dashboard. Tailored for Indian brokerage firms from 1 to 50+ property consultants.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="/register" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Claim Free Broker Account</a>
          <a href="/contact" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">Book Broker Walkthrough</a>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "CRM for Brokers", "item": "https://realsalepro.com/crm-for-real-estate-brokers" }
          ]
        }
      ]
    }
  },

  // --- Real Estate CRM India ---
  {
    path: '/real-estate-crm-india',
    title: 'Real Estate CRM India — Builders & Brokers | RealSalePro',
    description: 'India\'s real estate CRM for developers and brokers. Auto-sync Magicbricks, 99acres, Meta & WhatsApp leads. Localized pipeline with 1,000 leads free.',
    canonical: 'https://realsalepro.com/real-estate-crm-india',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">India Localized Proptech</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Real Estate CRM Software in India for Builders &amp; Developers</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Engineered specifically for Indian property sales dynamics: Lakhs &amp; Crores budget denomination, RERA compliance tracking, Magicbricks &amp; 99acres portal sync, and native WhatsApp integration.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="/register" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Start Free — Indian CRM</a>
          <a href="/features/lead-management" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">Explore Features</a>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Real Estate CRM India", "item": "https://realsalepro.com/real-estate-crm-india" }
          ]
        }
      ]
    }
  },

  // --- Lead Management Feature ---
  {
    path: '/features/lead-management',
    title: 'Real Estate Lead Management System | RealSalePro',
    description: 'Capture and assign property leads in under 30 seconds. Real estate lead management software with instant WhatsApp alerts, round-robin rules and tracking.',
    canonical: 'https://realsalepro.com/features/lead-management',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">Core Engine Feature</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Real Estate Lead Management Software &amp; Automated Pipeline</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Eliminate lead leakage and slow follow-ups. RealSalePro automatically ingests buyer leads across digital campaigns, routes them via smart round-robin distribution, and fires instant WhatsApp welcome messages.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="/register" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Try Lead Management Free</a>
          <a href="/pricing" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">View Pricing</a>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Features", "item": "https://realsalepro.com/features/lead-management" },
            { "@type": "ListItem", "position": 3, "name": "Lead Management", "item": "https://realsalepro.com/features/lead-management" }
          ]
        }
      ]
    }
  },

  // --- Excel Template ---
  {
    path: '/templates/real-estate-crm-excel-template',
    title: 'Real Estate CRM Excel Template (Free Download) | RealSalePro',
    description: 'Download free 2026 real estate CRM Excel template & Google Sheets tracker. Pre-built with Indian property pipeline stages, lead tracking and follow-up alerts.',
    canonical: 'https://realsalepro.com/templates/real-estate-crm-excel-template',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">Free Resource &bull; 2026 Edition</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Real Estate CRM Excel Template &amp; Google Sheets Lead Tracker</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Download our professionally formatted spreadsheet template tailored for Indian real estate consultants, brokers and developers. Pre-configured with pipeline stages, site visit logs, and automated follow-up trackers.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="/downloads/RealSalePro_Real_Estate_CRM_Template_2026.xlsx" download style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Download Free Excel Template (.xlsx)</a>
          <a href="/register" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">Upgrade to Automated CRM</a>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Templates", "item": "https://realsalepro.com/templates/real-estate-crm-excel-template" },
            { "@type": "ListItem", "position": 3, "name": "Excel Template", "item": "https://realsalepro.com/templates/real-estate-crm-excel-template" }
          ]
        }
      ]
    }
  },

  // --- Pricing ---
  {
    path: '/pricing',
    title: 'Real Estate CRM Pricing & Plans | RealSalePro',
    description: 'Transparent real estate CRM pricing for Indian builders and brokers. Free forever tier up to 1,000 leads, Pro plan at ₹999/mo with unlimited team access.',
    canonical: 'https://realsalepro.com/pricing',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">Transparent Pricing</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">RealSalePro Pricing &amp; Plans — Built for Indian Real Estate</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Start with our 100% Free Forever plan (up to 1,000 active leads). When your agency scales, upgrade to our Pro plan at just ₹999/month with unlimited user seats.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="/register" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Start Free — No Card Required</a>
          <a href="/contact" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">Talk to Sales</a>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Pricing", "item": "https://realsalepro.com/pricing" }
          ]
        }
      ]
    }
  },

  // --- Integrations ---
  {
    path: '/integration',
    title: 'Enterprise BYOD Database Integration | RealSalePro',
    description: 'Host your real estate CRM database on your private PostgreSQL or cloud infrastructure with RealSalePro\'s Bring Your Own Database (BYOD) architecture.',
    canonical: 'https://realsalepro.com/integration',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">Enterprise Security</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Enterprise Bring-Your-Own-Database (BYOD) &amp; Webhook Integrations</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Maintain 100% data residency and sovereign compliance. Connect your private AWS RDS or PostgreSQL database with RealSalePro's high-speed application runtime.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="/contact" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Inquire About BYOD Setup</a>
          <a href="/" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">Back to Platform</a>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Integration", "item": "https://realsalepro.com/integration" }
          ]
        }
      ]
    }
  },

  // --- Contact Us ---
  {
    path: '/contact',
    title: 'Contact RealSalePro — Sales & Support Team',
    description: 'Contact RealSalePro for real estate CRM inquiries, custom onboarding, or live demos. Phone & WhatsApp: +91 70797 37773. Fast response within 15 minutes.',
    canonical: 'https://realsalepro.com/contact',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">We're Here to Help</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Contact RealSalePro Support &amp; Product Specialists</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Schedule a 15-minute live screen demo or get assistance migrating your Excel spreadsheets into RealSalePro. Average response time under 15 minutes during business hours.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="https://wa.me/917079737773" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Chat on WhatsApp (+91 70797 37773)</a>
          <a href="mailto:support@realsalepro.com" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">Email: support@realsalepro.com</a>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Contact Us", "item": "https://realsalepro.com/contact" }
          ]
        }
      ]
    }
  },

  // --- Sitemap ---
  {
    path: '/sitemap',
    title: 'RealSalePro Site Map — All Pages & Features',
    description: 'Explore all pages, tools, and resources on RealSalePro: Free Real Estate CRM, Broker CRM, Lead Management, Excel Template, Pricing, and Integrations.',
    canonical: 'https://realsalepro.com/sitemap',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">RealSalePro Site Map &amp; Directory</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Directory of all marketing pages, product deep dives, free tools, and legal agreements.</p>
        <ul style="line-height:2;color:#10b981;font-size:16px;">
          <li><a href="/" style="color:#10b981;">Homepage &bull; Free Real Estate CRM</a></li>
          <li><a href="/free-real-estate-crm" style="color:#10b981;">1,000 Leads Free Forever Tier</a></li>
          <li><a href="/crm-for-real-estate-brokers" style="color:#10b981;">CRM for Real Estate Brokers &amp; Agents</a></li>
          <li><a href="/real-estate-crm-india" style="color:#10b981;">Real Estate CRM India Edition</a></li>
          <li><a href="/features/lead-management" style="color:#10b981;">Lead Management &amp; Routing Engine</a></li>
          <li><a href="/templates/real-estate-crm-excel-template" style="color:#10b981;">Free Excel CRM Spreadsheet Template</a></li>
          <li><a href="/pricing" style="color:#10b981;">Plans &amp; Pricing</a></li>
          <li><a href="/integration" style="color:#10b981;">Enterprise Database Integration (BYOD)</a></li>
          <li><a href="/contact" style="color:#10b981;">Contact &amp; Live Demo Support</a></li>
          <li><a href="/referral-program" style="color:#10b981;">Partner &amp; Referral Program</a></li>
          <li><a href="/affiliate/terms" style="color:#10b981;">Affiliate Partner Agreement</a></li>
          <li><a href="/privacy" style="color:#10b981;">Privacy Policy</a></li>
          <li><a href="/terms" style="color:#10b981;">Terms of Service</a></li>
          <li><a href="/refund-policy" style="color:#10b981;">Cancellation &amp; Refund Policy</a></li>
          <li><a href="/shipping-policy" style="color:#10b981;">Digital Service Delivery Policy</a></li>
        </ul>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Sitemap", "item": "https://realsalepro.com/sitemap" }
          ]
        }
      ]
    }
  },

  // --- Referral Program ---
  {
    path: '/referral-program',
    title: 'RealSalePro Referral Program — Earn 20% Rewards',
    description: 'Join the RealSalePro Referral Program. Refer real estate builders and brokers and earn 20% recurring commission on every subscription referral.',
    canonical: 'https://realsalepro.com/referral-program',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">Partner Network</span>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">RealSalePro Partner &amp; Referral Program</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Earn 20% recurring monthly commissions for every real estate builder, broker, or agency that subscribes to RealSalePro through your link.</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:48px;">
          <a href="/affiliate/register" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Apply as Affiliate Partner</a>
          <a href="/affiliate/terms" style="display:inline-block;border:1px solid rgba(255,255,255,0.2);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">Partner Terms</a>
        </div>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Referral Program", "item": "https://realsalepro.com/referral-program" }
          ]
        }
      ]
    }
  },

  // --- Affiliate Terms ---
  {
    path: '/affiliate/terms',
    title: 'Affiliate Program Terms & Agreement | RealSalePro',
    description: 'Official partner terms and commission agreement for RealSalePro real estate CRM affiliates, agency partners, and tech consultants.',
    canonical: 'https://realsalepro.com/affiliate/terms',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">RealSalePro Affiliate Partner Agreement</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Terms governing partner commissions, cookie windows (60 days), payout schedules, and acceptable marketing practices.</p>
        <a href="/affiliate/register" style="display:inline-block;background:#10b981;color:#000;padding:14px 28px;border-radius:12px;font-weight:700;text-decoration:none;">Join Partner Network</a>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Affiliate Terms", "item": "https://realsalepro.com/affiliate/terms" }
          ]
        }
      ]
    }
  },

  // --- Privacy Policy ---
  {
    path: '/privacy',
    title: 'Privacy Policy | RealSalePro Real Estate CRM',
    description: 'Learn how RealSalePro protects and processes your customer and property lead data. DPDP Act compliant privacy practices and data encryption standards.',
    canonical: 'https://realsalepro.com/privacy',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Privacy Policy &amp; Data Protection</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">RealSalePro is committed to safeguarding customer data in full compliance with the Digital Personal Data Protection (DPDP) Act of India.</p>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://realsalepro.com/privacy" }
          ]
        }
      ]
    }
  },

  // --- Terms of Service ---
  {
    path: '/terms',
    title: 'Terms of Service | RealSalePro Real Estate CRM',
    description: 'Review the Terms of Service for using RealSalePro real estate CRM software, lead tracking tools, subscription plans, and API integrations.',
    canonical: 'https://realsalepro.com/terms',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Terms of Service</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Terms and conditions governing the use of RealSalePro CRM platform and associated API integrations.</p>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Terms of Service", "item": "https://realsalepro.com/terms" }
          ]
        }
      ]
    }
  },

  // --- Refund Policy ---
  {
    path: '/refund-policy',
    title: 'Cancellation & Refund Policy | RealSalePro',
    description: 'Read RealSalePro\'s transparent cancellation and refund policy. Free forever plan with zero charges, and 14-day hassle-free refund on paid subscriptions.',
    canonical: 'https://realsalepro.com/refund-policy',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Cancellation &amp; Refund Policy</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">100% Free Forever Tier with zero charges. 14-day full refund window on all paid subscriptions.</p>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Refund Policy", "item": "https://realsalepro.com/refund-policy" }
          ]
        }
      ]
    }
  },

  // --- Shipping Policy ---
  {
    path: '/shipping-policy',
    title: 'Digital Delivery Policy | RealSalePro SaaS',
    description: 'RealSalePro is a cloud-hosted SaaS platform. Instant digital activation, workspace provisioning, and email delivery with zero physical shipping.',
    canonical: 'https://realsalepro.com/shipping-policy',
    noindex: false,
    content: `
      <div style="max-width:1100px;margin:0 auto;padding:40px 20px;font-family:sans-serif;color:#fff;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#10b981;text-decoration:none;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:38px;line-height:1.2;margin:0 0 16px 0;font-weight:800;">Electronic Service &amp; Digital Delivery Policy</h1>
        <p style="font-size:18px;line-height:1.6;color:rgba(255,255,255,0.8);max-width:800px;margin-bottom:32px;">Instant cloud provisioning (&lt; 60 seconds). Zero physical shipping or handling charges.</p>
      </div>
    `,
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://realsalepro.com/" },
            { "@type": "ListItem", "position": 2, "name": "Shipping Policy", "item": "https://realsalepro.com/shipping-policy" }
          ]
        }
      ]
    }
  },

  // --- Login (Noindex) ---
  {
    path: '/login',
    title: 'Log In | RealSalePro Real Estate CRM',
    description: 'Log in to your RealSalePro CRM workspace to manage real estate leads, customer pipelines, and site visits.',
    canonical: 'https://realsalepro.com/login',
    noindex: true,
    content: `<div style="text-align:center;padding:60px 20px;color:#fff;"><h1 style="font-size:28px;">Log In to RealSalePro</h1><p>Access your CRM workspace.</p></div>`
  },

  // --- Register (Noindex) ---
  {
    path: '/register',
    title: 'Create Your Free CRM Account | RealSalePro',
    description: 'Sign up for RealSalePro. 100% Free Forever for up to 1,000 property leads. No credit card required.',
    canonical: 'https://realsalepro.com/register',
    noindex: true,
    content: `<div style="text-align:center;padding:60px 20px;color:#fff;"><h1 style="font-size:28px;">Create Your Free RealSalePro Account</h1><p>Start managing leads today.</p></div>`
  },

  // --- Affiliate Register (Noindex) ---
  {
    path: '/affiliate/register',
    title: 'Affiliate Partner Registration | RealSalePro',
    description: 'Register as an affiliate partner with RealSalePro and earn recurring revenue by referring real estate agencies.',
    canonical: 'https://realsalepro.com/affiliate/register',
    noindex: true,
    content: `<div style="text-align:center;padding:60px 20px;color:#fff;"><h1 style="font-size:28px;">Partner Program Application</h1><p>Join our partner network.</p></div>`
  },

  // --- 404 (Noindex) ---
  {
    path: '/404',
    title: '404: Page Not Found | RealSalePro',
    description: 'The page you are looking for does not exist or has been moved. Explore RealSalePro\'s free real estate CRM tools, pricing, and features.',
    canonical: 'https://realsalepro.com/404',
    noindex: true,
    is404: true,
    content: `
      <div style="text-align:center;padding:80px 20px;color:#fff;font-family:sans-serif;">
        <h1 style="font-size:48px;font-weight:800;color:#10b981;margin-bottom:12px;">404 &bull; Page Not Found</h1>
        <p style="font-size:18px;color:rgba(255,255,255,0.7);max-width:500px;margin:0 auto 32px auto;">The requested URL could not be found. Please check the web address or explore our resources below.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="/" style="background:#10b981;color:#000;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Return to Home</a>
          <a href="/free-real-estate-crm" style="border:1px solid rgba(255,255,255,0.2);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;">Free Real Estate CRM</a>
          <a href="/pricing" style="border:1px solid rgba(255,255,255,0.2);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;">Pricing Plans</a>
          <a href="/contact" style="border:1px solid rgba(255,255,255,0.2);color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;">Contact Support</a>
        </div>
      </div>
    `
  }
];

// 4. Generator function
function generatePage(route) {
  let html = baseHtml;

  // Title
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${route.title}</title>`);

  // Meta description
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="description" content="${route.description}" />`
  );

  // Canonical
  html = html.replace(
    /<link\s+rel=["']canonical["']\s+href=["'][\s\S]*?["']\s*\/?>/i,
    `<link rel="canonical" href="${route.canonical}" />`
  );

  // Robots meta
  const robotsVal = route.noindex
    ? (route.is404 ? 'noindex, nofollow' : 'noindex, follow')
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  html = html.replace(
    /<meta\s+name=["']robots["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="robots" content="${robotsVal}" />`
  );

  // OpenGraph
  html = html.replace(
    /<meta\s+property=["']og:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta\s+property=["']og:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:description" content="${route.description}" />`
  );
  html = html.replace(
    /<meta\s+property=["']og:url["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta property="og:url" content="${route.canonical}" />`
  );

  // Twitter
  html = html.replace(
    /<meta\s+name=["']twitter:title["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:title" content="${route.title}" />`
  );
  html = html.replace(
    /<meta\s+name=["']twitter:description["']\s+content=["'][\s\S]*?["']\s*\/?>/i,
    `<meta name="twitter:description" content="${route.description}" />`
  );

  // JSON-LD
  if (route.jsonLd) {
    const jsonLdStr = JSON.stringify(route.jsonLd, null, 2);
    html = html.replace(
      /<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">\n${jsonLdStr}\n  </script>`
    );
  }

  // Pre-rendered Body Content inside <div id="root">
  if (route.content) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${route.content}</div>`
    );
  }

  // Write to destination
  if (route.path === '/') {
    fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
    console.log('✅ Generated prerendered / -> dist/index.html');
  } else if (route.is404) {
    fs.writeFileSync(path.join(distDir, '404.html'), html, 'utf8');
    console.log('✅ Generated prerendered 404 -> dist/404.html');
  } else {
    const cleanPath = route.path.replace(/^\//, '');
    const targetDir = path.join(distDir, cleanPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
    console.log(`✅ Generated prerendered ${route.path} -> dist/${cleanPath}/index.html`);
  }
}

// 5. Run generation for all routes
console.log('🚀 Pre-rendering static HTML pages for SEO...');
routes.forEach(generatePage);
console.log(`✨ All ${routes.length} routes pre-rendered successfully in dist/!`);
