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

// Write clean base SPA template to dist/app.html & dist/200.html (for internal SPA routes)
fs.writeFileSync(path.join(distDir, 'app.html'), baseHtml, 'utf8');
fs.writeFileSync(path.join(distDir, '200.html'), baseHtml, 'utf8');
console.log('✅ Generated clean SPA fallback template -> dist/app.html & dist/200.html');

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
              "name": "Can I customise the app for my company?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. RealSalePro supports custom pipeline stages, lead sources, custom fields, user roles, branding and reports per company. API access is available for advanced integrations."
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
    description: 'Transparent real estate CRM pricing for Indian builders and brokers. Free forever tier up to 1,000 leads, Pro plan at ₹1,000/mo (billed ₹12,000 annually) with unlimited team access.',
    canonical: 'https://realsalepro.com/pricing',
    noindex: false,
    content: `
      <div style="max-width:1160px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f4faf6;line-height:1.6;">
        <nav style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
          <a href="/" style="color:#10b981;text-decoration:none;font-weight:700;">&larr; Back to RealSalePro Home</a>
          <div style="display:flex;gap:16px;align-items:center;">
            <a href="/login" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;">Log in</a>
            <a href="/register" style="background:#10b981;color:#000;padding:8px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Start free</a>
          </div>
        </nav>

        <header style="text-align:center;max-width:820px;margin:0 auto 48px auto;">
          <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">Transparent &bull; No Hidden Fees</span>
          <h1 style="font-size:42px;line-height:1.2;margin:0 0 16px 0;font-weight:800;color:#ffffff;">RealSalePro Pricing &amp; Plans — Built for Indian Real Estate</h1>
          <p style="font-size:18px;color:rgba(255,255,255,0.75);margin:0 auto;line-height:1.6;">Start with our 100% Free Forever plan (up to 1,000 active leads). When your company scales, upgrade to our Pro plan at ₹1,000/month (billed ₹12,000 annually) or ₹1,500/month with unlimited user seats.</p>
        </header>

        <!-- Pricing Cards -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(310px, 1fr));gap:24px;margin-bottom:64px;">
          <!-- Card 1: Free -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:36px 30px;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h2 style="font-size:22px;margin:0;font-weight:700;color:#fff;">Free Forever</h2>
                <span style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;">No Card</span>
              </div>
              <div style="font-size:38px;font-weight:800;color:#fff;margin-bottom:8px;">₹0 <span style="font-size:16px;color:rgba(255,255,255,0.5);font-weight:500;">/forever</span></div>
              <p style="color:rgba(255,255,255,0.65);font-size:14px;margin-bottom:24px;">For individual brokers and small real estate teams getting started with a professional pipeline.</p>
              <ul style="list-style:none;padding:0;margin:0 0 28px 0;line-height:2;color:rgba(255,255,255,0.85);font-size:14px;">
                <li>&#10003; Up to <strong>1,000 active leads</strong></li>
                <li>&#10003; Up to <strong>5 sales team users</strong></li>
                <li>&#10003; Real-time deal pipeline &amp; Kanban board</li>
                <li>&#10003; Meta Lead Ads &amp; WhatsApp webhooks</li>
                <li>&#10003; Telecaller phone number masking</li>
                <li>&#10003; Standard email support</li>
              </ul>
            </div>
            <a href="/register" style="display:block;text-align:center;border:1px solid rgba(255,255,255,0.25);color:#fff;padding:12px;border-radius:10px;font-weight:700;text-decoration:none;">Get Started Free</a>
          </div>

          <!-- Card 2: Pro -->
          <div style="background:linear-gradient(160deg,#0a2a1d,#04150e);border:2px solid #10b981;border-radius:20px;padding:36px 30px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 20px 50px rgba(16,185,129,0.2);">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h2 style="font-size:22px;margin:0;font-weight:700;color:#fff;">Pro Plan</h2>
                <span style="background:#10b981;color:#000;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:800;text-transform:uppercase;">Most Popular</span>
              </div>
              <div style="font-size:38px;font-weight:800;color:#fff;margin-bottom:8px;">₹1,000 <span style="font-size:16px;color:rgba(255,255,255,0.5);font-weight:500;">/month</span></div>
              <p style="color:#34d399;font-size:13px;margin-bottom:24px;font-weight:600;">Billed ₹12,000 annually (save 33%) or ₹1,500 monthly.</p>
              <ul style="list-style:none;padding:0;margin:0 0 28px 0;line-height:2;color:rgba(255,255,255,0.9);font-size:14px;">
                <li>&#10003; Everything in Free</li>
                <li>&#10003; Up to <strong>2,00,000 active leads</strong></li>
                <li>&#10003; <strong>Unlimited team members</strong> &amp; roles</li>
                <li>&#10003; Meta CAPI &amp; Portal Webhooks (99acres, Magicbricks)</li>
                <li>&#10003; Advanced telecaller phone masking</li>
                <li>&#10003; In-house WhatsApp template engine</li>
                <li>&#10003; Priority WhatsApp &amp; phone support</li>
              </ul>
            </div>
            <a href="/register?plan=Pro&amount=12000" style="display:block;text-align:center;background:#10b981;color:#000;padding:12px;border-radius:10px;font-weight:800;text-decoration:none;">Upgrade to Pro</a>
          </div>

          <!-- Card 3: Custom -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:36px 30px;display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h2 style="font-size:22px;margin:0;font-weight:700;color:#fff;">Custom</h2>
                <span style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);padding:4px 10px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;">Enterprise</span>
              </div>
              <div style="font-size:38px;font-weight:800;color:#fff;margin-bottom:8px;">Custom</div>
              <p style="color:rgba(255,255,255,0.65);font-size:14px;margin-bottom:24px;">Bespoke limits, integrations and security SLAs for large builders, developers, and corporate brokers.</p>
              <ul style="list-style:none;padding:0;margin:0 0 28px 0;line-height:2;color:rgba(255,255,255,0.85);font-size:14px;">
                <li>&#10003; Custom lead limits &amp; multi-branch tenancy</li>
                <li>&#10003; Bring-Your-Own-Database (BYOD) self-host</li>
                <li>&#10003; Custom ERP &amp; accounting system integration</li>
                <li>&#10003; Dedicated technical account manager</li>
                <li>&#10003; Custom 99.9% uptime SLA guarantee</li>
                <li>&#10003; Flexible NET-30 invoicing</li>
              </ul>
            </div>
            <a href="/contact" style="display:block;text-align:center;border:1px solid rgba(255,255,255,0.25);color:#fff;padding:12px;border-radius:10px;font-weight:700;text-decoration:none;">Contact Enterprise Sales</a>
          </div>
        </div>

        <!-- Detailed Feature Comparison Table -->
        <section style="margin-bottom:64px;">
          <h2 style="font-size:28px;text-align:center;margin-bottom:32px;color:#fff;">Plan Feature Comparison</h2>
          <div style="overflow-x:auto;border-radius:16px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.02);">
            <table style="width:100%;border-collapse:collapse;text-align:left;font-size:14px;">
              <thead>
                <tr style="background:rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.1);color:#fff;">
                  <th style="padding:16px 20px;">Feature</th>
                  <th style="padding:16px 20px;width:22%;">Free Forever</th>
                  <th style="padding:16px 20px;width:22%;color:#34d399;">Pro Plan (₹1,000/mo)</th>
                  <th style="padding:16px 20px;width:22%;">Enterprise</th>
                </tr>
              </thead>
              <tbody style="color:rgba(255,255,255,0.85);">
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">Lead Storage Capacity</td><td style="padding:14px 20px;">Up to 1,000</td><td style="padding:14px 20px;">Up to 2,00,000</td><td style="padding:14px 20px;">Unlimited / Bespoke</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">Team User Seats</td><td style="padding:14px 20px;">Up to 5 Users</td><td style="padding:14px 20px;">Unlimited Users</td><td style="padding:14px 20px;">Unlimited Users</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">Deal Pipeline &amp; Kanban Stages</td><td style="padding:14px 20px;">&#10003; Included</td><td style="padding:14px 20px;">&#10003; Included</td><td style="padding:14px 20px;">&#10003; Included</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">Meta Lead Ads (FB &amp; IG) Sync</td><td style="padding:14px 20px;">&#10003; Webhook</td><td style="padding:14px 20px;">&#10003; CAPI + Webhook</td><td style="padding:14px 20px;">&#10003; Dedicated Ingestion</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">Magicbricks &amp; 99acres Sync</td><td style="padding:14px 20px;">&#10003; Included</td><td style="padding:14px 20px;">&#10003; Included</td><td style="padding:14px 20px;">&#10003; Included</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">Telecaller Phone Number Masking</td><td style="padding:14px 20px;">&#10003; Included</td><td style="padding:14px 20px;">&#10003; Advanced Masking</td><td style="padding:14px 20px;">&#10003; Advanced Masking</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">Site Visit Logs &amp; Scheduling</td><td style="padding:14px 20px;">&#10003; Included</td><td style="padding:14px 20px;">&#10003; Included</td><td style="padding:14px 20px;">&#10003; Included</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">In-House WhatsApp Template Engine</td><td style="padding:14px 20px;">Basic</td><td style="padding:14px 20px;">&#10003; Full Suite</td><td style="padding:14px 20px;">&#10003; Full Suite</td></tr>
                <tr style="border-bottom:1px solid rgba(255,255,255,0.05);"><td style="padding:14px 20px;">Bring Your Own Database (BYOD)</td><td style="padding:14px 20px;">&mdash;</td><td style="padding:14px 20px;">Add-on available</td><td style="padding:14px 20px;">&#10003; Included</td></tr>
                <tr><td style="padding:14px 20px;">Customer Support</td><td style="padding:14px 20px;">Standard Email</td><td style="padding:14px 20px;">Priority WhatsApp &amp; Phone</td><td style="padding:14px 20px;">Dedicated Account Manager</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Contextual Callouts for BYOD and Referral -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px;margin-bottom:64px;">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:28px 24px;">
            <span style="color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Enterprise Data Sovereignty</span>
            <h3 style="font-size:20px;color:#fff;margin:10px 0 12px 0;">Need to host data on your own servers?</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:20px;">RealSalePro's Bring Your Own Database (BYOD) architecture allows you to connect your private AWS RDS or on-premise PostgreSQL instance behind your corporate firewall.</p>
            <a href="/integration" style="color:#10b981;font-weight:700;text-decoration:none;">Explore Database Integration &rarr;</a>
          </div>

          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:28px 24px;">
            <span style="color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Partner &amp; Affiliate Network</span>
            <h3 style="font-size:20px;color:#fff;margin:10px 0 12px 0;">Earn 20% Recurring Commission</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:20px;">Are you a real estate consultant, digital marketing agency, or broker? Refer builders and agencies to RealSalePro and receive 20% recurring monthly commissions.</p>
            <a href="/referral-program" style="color:#10b981;font-weight:700;text-decoration:none;">Join Partner &amp; Referral Program &rarr;</a>
          </div>
        </div>

        <!-- Pricing FAQ -->
        <section style="border-top:1px solid rgba(255,255,255,0.1);padding-top:48px;">
          <h2 style="font-size:28px;text-align:center;margin-bottom:36px;color:#fff;">Frequently Asked Pricing Questions</h2>
          <div style="max-width:860px;margin:0 auto;display:grid;gap:24px;">
            <div style="background:rgba(255,255,255,0.02);padding:20px 24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Is the Free plan really free forever?</h3>
              <p style="color:rgba(255,255,255,0.75);margin:0;font-size:14.5px;">Yes! Our Free Forever plan has no trial countdown and requires no credit card. Small teams can manage up to 1,000 active leads and 5 team member accounts at zero cost forever.</p>
            </div>
            <div style="background:rgba(255,255,255,0.02);padding:20px 24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Can I upgrade or downgrade between plans anytime?</h3>
              <p style="color:rgba(255,255,255,0.75);margin:0;font-size:14.5px;">Absolutely. You can upgrade from Free to Pro seamlessly with 1 click. If you need to switch billing cycles (e.g. from 6 Months to Yearly to save 33%), your account updates immediately.</p>
            </div>
            <div style="background:rgba(255,255,255,0.02);padding:20px 24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">What payment methods are supported?</h3>
              <p style="color:rgba(255,255,255,0.75);margin:0;font-size:14.5px;">We accept UPI (Google Pay, PhonePe, Paytm), RuPay, Visa, Mastercard, and Net Banking through Razorpay's secure payment gateway. Enterprise clients can also opt for NEFT/RTGS bank transfer invoicing.</p>
            </div>
            <div style="background:rgba(255,255,255,0.02);padding:20px 24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">What happens if I reach the 1,000 lead limit on the Free plan?</h3>
              <p style="color:rgba(255,255,255,0.75);margin:0;font-size:14.5px;">We will never delete your data or lock you out. When approaching 1,000 leads, you can archive or export old leads to CSV, or upgrade to Pro to unlock up to 2,00,000 leads and unlimited team users.</p>
            </div>
            <div style="background:rgba(255,255,255,0.02);padding:20px 24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Are there any hidden onboarding or migration fees?</h3>
              <p style="color:rgba(255,255,255,0.75);margin:0;font-size:14.5px;">None. What you see is what you pay. Standard cloud onboarding, CSV migration from Excel, and team training are completely free with your subscription.</p>
            </div>
          </div>
        </section>
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
        },
        {
          "@type": "Product",
          "name": "RealSalePro Real Estate CRM",
          "description": "Real estate sales & CRM platform with lead management, site visits, and WhatsApp integration.",
          "brand": { "@type": "Brand", "name": "RealSalePro" },
          "offers": [
            {
              "@type": "Offer",
              "name": "Free Forever Plan",
              "price": "0",
              "priceCurrency": "INR",
              "description": "Up to 1,000 active client leads, 5 users, pipeline tracking, and WhatsApp support."
            },
            {
              "@type": "Offer",
              "name": "Pro Plan",
              "price": "1000",
              "priceCurrency": "INR",
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": "1000",
                "priceCurrency": "INR",
                "unitCode": "MON"
              },
              "description": "Up to 2,00,000 leads, unlimited users, role-based phone masking, and priority support. ₹1,000/mo billed ₹12,000 annually or ₹1,500/mo billed monthly."
            }
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is the Free plan really free forever?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Our Free Forever plan has no trial countdown and requires no credit card. Small teams can manage up to 1,000 active leads and 5 team member accounts at zero cost forever."
              }
            },
            {
              "@type": "Question",
              "name": "Can I upgrade or downgrade between plans anytime?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Absolutely. You can upgrade from Free to Pro seamlessly with 1 click. If you need to switch billing cycles (e.g. from 6 Months to Yearly to save 33%), your account updates immediately."
              }
            },
            {
              "@type": "Question",
              "name": "What payment methods are supported?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We accept UPI (Google Pay, PhonePe, Paytm), RuPay, Visa, Mastercard, and Net Banking through Razorpay's secure payment gateway. Enterprise clients can also opt for NEFT/RTGS bank transfer invoicing."
              }
            },
            {
              "@type": "Question",
              "name": "What happens if I reach the 1,000 lead limit on the Free plan?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We will never delete your data or lock you out. When approaching 1,000 leads, you can archive or export old leads to CSV, or upgrade to Pro to unlock up to 2,00,000 leads and unlimited team users."
              }
            },
            {
              "@type": "Question",
              "name": "Are there any hidden onboarding or migration fees?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "None. What you see is what you pay. Standard cloud onboarding, CSV migration from Excel, and team training are completely free with your subscription."
              }
            }
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
      <div style="max-width:1160px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f4faf6;line-height:1.6;">
        <nav style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
          <a href="/" style="color:#10b981;text-decoration:none;font-weight:700;">&larr; Back to RealSalePro Home</a>
          <div style="display:flex;gap:16px;align-items:center;">
            <a href="/pricing" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;">Pricing</a>
            <a href="/contact" style="background:#10b981;color:#000;padding:8px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Contact Engineering</a>
          </div>
        </nav>

        <header style="text-align:center;max-width:860px;margin:0 auto 48px auto;">
          <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">Enterprise Architecture &bull; Complete Data Sovereignty</span>
          <h1 style="font-size:42px;line-height:1.2;margin:0 0 16px 0;font-weight:800;color:#ffffff;">Enterprise Bring-Your-Own-Database (BYOD) &amp; Webhook Integrations</h1>
          <p style="font-size:18px;color:rgba(255,255,255,0.75);margin:0 auto;line-height:1.6;">Maintain 100% data residency and sovereign compliance. Connect your private AWS RDS or on-premise PostgreSQL database with RealSalePro's high-speed application runtime without sacrificing cloud software flexibility.</p>
        </header>

        <!-- 4 Pillars -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:20px;margin-bottom:56px;">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;">
            <h3 style="font-size:18px;color:#34d399;margin:0 0 8px 0;">100% Data Ownership</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">You retain full legal and physical ownership of all buyer leads, site visit logs, and transaction details. RealSalePro acts strictly as a stateless client application.</p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;">
            <h3 style="font-size:18px;color:#34d399;margin:0 0 8px 0;">Enhanced Security</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Your database sits behind your corporate VPC and firewalls. Access is strictly granted to our dedicated static cluster IP addresses via TLS 1.3.</p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;">
            <h3 style="font-size:18px;color:#34d399;margin:0 0 8px 0;">DPDP Act Compliance</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Ideal for regulated real estate developers requiring strict data localization within India under the Digital Personal Data Protection Act of 2023.</p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:24px;">
            <h3 style="font-size:18px;color:#34d399;margin:0 0 8px 0;">Incentive Automation</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Unlocks dynamic custom commission calculation engines and automated incentive disbursement workflows across your sales hierarchy.</p>
          </div>
        </div>

        <!-- 3-Step Setup Guide -->
        <section style="background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px 32px;margin-bottom:56px;">
          <h2 style="font-size:26px;color:#fff;margin:0 0 28px 0;text-align:center;">Simple 3-Step Integration Workflow</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:24px;">
            <div style="background:rgba(0,0,0,0.3);padding:24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#10b981;color:#000;font-weight:800;margin-bottom:12px;">1</span>
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Setup Database</h3>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Provision a dedicated PostgreSQL (v12+) instance on your choice of cloud provider (AWS RDS, EC2, or Hostinger VPS).</p>
            </div>
            <div style="background:rgba(0,0,0,0.3);padding:24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#10b981;color:#000;font-weight:800;margin-bottom:12px;">2</span>
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Whitelist Static IP</h3>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Configure your VPC security group or server firewall to accept encrypted connections only from RealSalePro application cluster IPs.</p>
            </div>
            <div style="background:rgba(0,0,0,0.3);padding:24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#10b981;color:#000;font-weight:800;margin-bottom:12px;">3</span>
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Connect &amp; Handshake</h3>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Provide connection credentials in your RealSalePro admin settings. Our runtime initializes schema tables automatically within seconds.</p>
            </div>
          </div>
        </section>

        <!-- Supported Providers -->
        <section style="margin-bottom:56px;">
          <h2 style="font-size:26px;color:#fff;margin:0 0 24px 0;">Recommended Cloud Infrastructure</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:24px;">
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,153,0,0.3);border-radius:18px;padding:28px;">
              <span style="color:#ff9900;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;">Enterprise Cloud</span>
              <h3 style="font-size:22px;color:#fff;margin:8px 0 12px 0;">AWS RDS / EC2 PostgreSQL</h3>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:16px;">Deploy on Amazon Web Services for enterprise VPC isolation, automated point-in-time recovery, multi-AZ high availability, and encrypted read replicas.</p>
              <ul style="list-style:none;padding:0;margin:0;line-height:1.9;color:rgba(255,255,255,0.85);font-size:13.5px;">
                <li>&#10003; Automated Multi-AZ Backups</li>
                <li>&#10003; AWS Key Management Service (KMS) Encryption</li>
                <li>&#10003; Custom Domain Mapping Included</li>
              </ul>
            </div>

            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(103,61,230,0.3);border-radius:18px;padding:28px;">
              <span style="color:#a78bfa;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;">Budget Friendly VPS</span>
              <h3 style="font-size:22px;color:#fff;margin:8px 0 12px 0;">Hostinger VPS / NVMe Storage</h3>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:16px;">Deploy your private PostgreSQL instance on a dedicated Linux VPS for maximum cost-effectiveness, root access, and dedicated static IP routing.</p>
              <ul style="list-style:none;padding:0;margin:0;line-height:1.9;color:rgba(255,255,255,0.85);font-size:13.5px;">
                <li>&#10003; Full Root Access &amp; Dedicated IP</li>
                <li>&#10003; High-Speed NVMe Storage</li>
                <li>&#10003; Cost-efficient predictable hosting</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Technical Specs & Notice -->
        <section style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:16px;padding:24px;margin-bottom:56px;">
          <h3 style="font-size:17px;color:#fbbf24;margin:0 0 10px 0;font-weight:700;">Upfront Pricing &amp; Custom Domain Notice</h3>
          <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0 0 8px 0;"><strong>One-time Database Setup Fee:</strong> A separate setup and deployment charge applies for server hardening, firewall configuration, VPC tunneling, and custom domain SSL setup.</p>
          <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;"><strong>White-Label Domain:</strong> Host your CRM at <code>crm.yourcompany.com</code> with custom branding — available exclusively with BYOD self-hosted deployments.</p>
        </section>

        <!-- Webhook Integrations -->
        <section style="border-top:1px solid rgba(255,255,255,0.1);padding-top:40px;margin-bottom:48px;">
          <h2 style="font-size:24px;color:#fff;margin:0 0 16px 0;">Supported Lead Source &amp; API Webhooks</h2>
          <p style="color:rgba(255,255,255,0.7);font-size:14.5px;margin-bottom:24px;">Ingest leads instantly in under 30 seconds across all major digital marketing platforms and real estate portals:</p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;">
            <span style="background:rgba(255,255,255,0.06);padding:8px 16px;border-radius:8px;font-size:13.5px;">Meta Facebook Lead Ads</span>
            <span style="background:rgba(255,255,255,0.06);padding:8px 16px;border-radius:8px;font-size:13.5px;">Instagram Sponsored Forms</span>
            <span style="background:rgba(255,255,255,0.06);padding:8px 16px;border-radius:8px;font-size:13.5px;">Google Ads Webhooks</span>
            <span style="background:rgba(255,255,255,0.06);padding:8px 16px;border-radius:8px;font-size:13.5px;">Magicbricks Webhooks</span>
            <span style="background:rgba(255,255,255,0.06);padding:8px 16px;border-radius:8px;font-size:13.5px;">99acres Lead Ingestion</span>
            <span style="background:rgba(255,255,255,0.06);padding:8px 16px;border-radius:8px;font-size:13.5px;">Housing.com Portal Sync</span>
            <span style="background:rgba(255,255,255,0.06);padding:8px 16px;border-radius:8px;font-size:13.5px;">WhatsApp Business Cloud API</span>
          </div>
        </section>

        <!-- CTAs -->
        <div style="text-align:center;padding:32px 0;">
          <a href="/contact" style="display:inline-block;background:#10b981;color:#000;padding:14px 32px;border-radius:12px;font-weight:700;text-decoration:none;margin-right:16px;">Inquire About BYOD Setup</a>
          <a href="/pricing" style="display:inline-block;border:1px solid rgba(255,255,255,0.25);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">View Pricing Plans</a>
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
      <div style="max-width:1160px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f4faf6;line-height:1.6;">
        <nav style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
          <a href="/" style="color:#10b981;text-decoration:none;font-weight:700;">&larr; Back to RealSalePro Home</a>
          <div style="display:flex;gap:16px;align-items:center;">
            <a href="/affiliate/terms" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;">Partner Terms</a>
            <a href="/affiliate/register" style="background:#10b981;color:#000;padding:8px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Join Partner Network</a>
          </div>
        </nav>

        <header style="text-align:center;max-width:860px;margin:0 auto 48px auto;">
          <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">RealSalePro Partner Network &bull; High Conversion</span>
          <h1 style="font-size:42px;line-height:1.2;margin:0 0 16px 0;font-weight:800;color:#ffffff;">Refer Indian Real Estate Teams &amp; Earn 20% Recurring Commission</h1>
          <p style="font-size:18px;color:rgba(255,255,255,0.75);margin:0 auto;line-height:1.6;">Help property developers, channel partners, and real estate brokers modernize their sales pipeline. Earn 20% monthly recurring commission for every active paid subscription you refer.</p>
        </header>

        <!-- 3 Core Benefits -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:24px;margin-bottom:56px;">
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:32px 26px;">
            <div style="font-size:32px;margin-bottom:12px;">💸</div>
            <h3 style="font-size:20px;color:#fff;margin:0 0 10px 0;">20% Lifetime Recurring Payout</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Receive 20% of subscription revenue every month for the lifetime of every customer who signs up through your link or promo code.</p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:32px 26px;">
            <div style="font-size:32px;margin-bottom:12px;">🎁</div>
            <h3 style="font-size:20px;color:#fff;margin:0 0 10px 0;">10% Discount for Your Network</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Your referred contacts and client companies receive an exclusive 10% discount on all Pro plans, ensuring higher signup and activation conversion rates.</p>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:32px 26px;">
            <div style="font-size:32px;margin-bottom:12px;">📊</div>
            <h3 style="font-size:20px;color:#fff;margin:0 0 10px 0;">Real-Time Affiliate Dashboard</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Track referral clicks, active paying tenants, and monthly accrued commissions via your dedicated affiliate partner dashboard.</p>
          </div>
        </div>

        <!-- 3 Simple Steps -->
        <section style="background:linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01));border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px 32px;margin-bottom:56px;">
          <h2 style="font-size:26px;color:#fff;margin:0 0 28px 0;text-align:center;">Three Simple Steps to Get Started</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:24px;">
            <div style="background:rgba(0,0,0,0.3);padding:24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#10b981;color:#000;font-weight:800;margin-bottom:12px;">1</span>
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Sign Up as a Partner</h3>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Complete our quick registration form. Approvals are reviewed and activated within 24 business hours.</p>
            </div>
            <div style="background:rgba(0,0,0,0.3);padding:24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#10b981;color:#000;font-weight:800;margin-bottom:12px;">2</span>
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Share Your Link &amp; Code</h3>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Receive your unique referral tracking link and a custom coupon code offering 10% instant discount to your network.</p>
            </div>
            <div style="background:rgba(0,0,0,0.3);padding:24px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);">
              <span style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#10b981;color:#000;font-weight:800;margin-bottom:12px;">3</span>
              <h3 style="font-size:18px;color:#fff;margin:0 0 8px 0;">Collect Monthly Bank Payouts</h3>
              <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0;">Commissions are calculated monthly and transferred directly to your bank account via UPI or NEFT/IMPS once you reach ₹1,000.</p>
            </div>
          </div>
        </section>

        <!-- Terms Summary -->
        <section style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;margin-bottom:48px;">
          <h3 style="font-size:20px;color:#fff;margin:0 0 16px 0;">Partner Program Key Terms</h3>
          <ul style="list-style:none;padding:0;margin:0;line-height:2;color:rgba(255,255,255,0.8);font-size:14px;">
            <li>&bull; <strong>60-Day Cookie Window:</strong> Leads are attributed to you even if they register 60 days after clicking your tracking link.</li>
            <li>&bull; <strong>Payout Minimum:</strong> Low ₹1,000 minimum threshold before disbursement.</li>
            <li>&bull; <strong>Disbursement Date:</strong> Processed on the 10th of every calendar month.</li>
            <li>&bull; <strong>Eligible Partners:</strong> Real estate brokers, digital marketers, proptech trainers, website developers, and active clients.</li>
          </ul>
        </section>

        <!-- CTAs -->
        <div style="text-align:center;padding:24px 0;">
          <a href="/affiliate/register" style="display:inline-block;background:#10b981;color:#000;padding:14px 32px;border-radius:12px;font-weight:700;text-decoration:none;margin-right:16px;">Apply as Affiliate Partner</a>
          <a href="/pricing" style="display:inline-block;border:1px solid rgba(255,255,255,0.25);color:#fff;padding:14px 28px;border-radius:12px;font-weight:600;text-decoration:none;">View Pricing Plans</a>
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
    description: 'Official partner terms and commission agreement for RealSalePro real estate CRM affiliates, channel partners, and tech consultants.',
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
      <div style="max-width:960px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.05);line-height:1.7;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#059669;text-decoration:none;font-weight:600;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:36px;font-weight:800;color:#0a1c37;margin:0 0 8px 0;">Privacy Policy</h1>
        <p style="color:#64748b;font-size:14px;margin-bottom:32px;">Last Updated: November 11, 2026</p>

        <section style="margin-bottom:28px;">
          <p>At <strong>RealSalePro</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operated by <strong>Synergy Brand Architect</strong>, we respect your privacy and are committed to safeguarding your personal data. This Privacy Policy explains how we collect, process, store, and protect digital personal data when you use our real estate CRM software platform, website (<a href="https://realsalepro.com" style="color:#059669;">realsalepro.com</a>), and associated integrations.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">1. Legal and Regulatory Framework</h2>
          <p>This Privacy Policy is framed in accordance with applicable data protection laws of the Republic of India, specifically:</p>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>The Digital Personal Data Protection Act, 2023 (&quot;DPDP Act&quot;)</strong> (Act No. 22 of 2023);</li>
            <li><strong>The Information Technology Act, 2000</strong> and rules framed thereunder;</li>
            <li><strong>The Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>; and</li>
            <li>Applicable project disclosure guidelines under the <strong>Real Estate (Regulation and Development) Act, 2016 (&quot;RERA&quot;)</strong>.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">2. Data Fiduciary and Data Processor Capacities</h2>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>RealSalePro as Data Fiduciary:</strong> With respect to direct account holders, subscribers, billing information, and registered administrators, RealSalePro determines the purposes and means of processing personal data.</li>
            <li><strong>RealSalePro as Data Processor:</strong> When subscribers (real estate developers, builders, channel partners, and brokers) import, capture, or manage prospective buyer leads via CRM campaigns, Meta Lead Ads, or third-party webhooks, the subscriber acts as the <strong>Data Fiduciary</strong>, and RealSalePro processes such data strictly on their behalf as a <strong>Data Processor</strong> pursuant to Section 8(2) of the DPDP Act.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">3. Categories of Information We Collect</h2>
          <p>We collect and process only data strictly necessary to deliver our CRM software services:</p>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>Account &amp; Profile Data:</strong> Full Name, Business Email Address, Mobile Number, Company / Firm Name, RERA Registration Number (where applicable), and Billing Address.</li>
            <li><strong>Prospective Buyer Lead Data:</strong> Customer Contact Numbers (protected by role-based phone masking), Names, Preferred Property Locations, Budgets, and Site Visit Logs uploaded by subscribers.</li>
            <li><strong>System &amp; Usage Logs:</strong> IP addresses, browser types, device fingerprints, and authentication access timestamps for fraud prevention.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">4. Security Standards &amp; Encryption</h2>
          <p>We deploy bank-grade technical and organizational safeguards:</p>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>Encryption:</strong> AES-256 encryption for data at rest and TLS 1.3 transport security for all data in transit.</li>
            <li><strong>Access Controls:</strong> Role-based access control (RBAC), multi-factor authentication, and proprietary telecaller phone number masking to prevent lead theft.</li>
            <li><strong>Multi-Tenant Isolation:</strong> Logical isolation across tenant workspaces with optional private PostgreSQL database hosting (BYOD).</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">5. Grievance Officer &amp; Inquiries</h2>
          <p>In accordance with Section 12 of the DPDP Act, 2023, for any privacy concerns, data subject requests, or grievance redressal, please contact our Grievance Officer:</p>
          <div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;font-size:14px;color:#334155;">
            <p style="margin:0 0 4px 0;"><strong>Grievance Officer:</strong> Legal &amp; Compliance Desk</p>
            <p style="margin:0 0 4px 0;"><strong>Company:</strong> Synergy Brand Architect (RealSalePro)</p>
            <p style="margin:0 0 4px 0;"><strong>Email:</strong> <a href="mailto:support@realsalepro.com" style="color:#059669;">support@realsalepro.com</a></p>
            <p style="margin:0;"><strong>Phone:</strong> +91 70797 37773</p>
          </div>
        </section>
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
      <div style="max-width:960px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.05);line-height:1.7;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#059669;text-decoration:none;font-weight:600;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:36px;font-weight:800;color:#0a1c37;margin:0 0 8px 0;">Terms of Service</h1>
        <p style="color:#64748b;font-size:14px;margin-bottom:32px;">Last Updated: November 11, 2026</p>

        <section style="margin-bottom:28px;">
          <p>Welcome to <strong>RealSalePro</strong>, operated by <strong>Synergy Brand Architect</strong>. By accessing or using our real estate CRM platform, website (<a href="https://realsalepro.com" style="color:#059669;">realsalepro.com</a>), and associated integrations (collectively, the &quot;Services&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). Please read them carefully.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">1. Acceptance of Terms</h2>
          <p>By registering for an account, accessing, or utilizing any portion of our CRM services, you agree to comply with these Terms, all applicable laws of the Republic of India, and RERA advertising guidelines. If you do not agree, you must immediately terminate usage.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">2. Account Registration &amp; Security</h2>
          <ul style="padding-left:24px;color:#334155;">
            <li>You must provide accurate, current, and complete corporate and contact details during workspace registration.</li>
            <li>You are responsible for maintaining confidentiality of all user passwords and API webhook tokens.</li>
            <li>You must notify us immediately at <a href="mailto:support@realsalepro.com" style="color:#059669;">support@realsalepro.com</a> upon detecting unauthorized credential usage.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">3. License &amp; Acceptable Use</h2>
          <p>RealSalePro grants you a limited, non-exclusive, non-transferable license to utilize the CRM for internal real estate business management. You agree NOT to:</p>
          <ul style="padding-left:24px;color:#334155;">
            <li>Use the software for spamming, unsolicited telemarketing in violation of TRAI regulations, or fraudulent property listings.</li>
            <li>Reverse engineer, decompile, or extract the platform source code or underlying architecture.</li>
            <li>Resell or sublicense multi-tenant instances without prior written partnership agreements.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">4. Subscription, Billing &amp; Pricing</h2>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>Free Tier:</strong> Free forever up to 1,000 active leads and 5 user seats with zero card required.</li>
            <li><strong>Pro Plan:</strong> ₹1,000/month (billed ₹12,000 annually) or ₹1,500/month billed monthly, offering up to 2,00,000 active leads and unlimited users.</li>
            <li><strong>Cancellations:</strong> You can cancel paid plans anytime via self-service in Settings. Paid features remain active through your paid period end date.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">5. Governing Law &amp; Jurisdiction</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
        </section>
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
      <div style="max-width:960px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.05);line-height:1.7;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#059669;text-decoration:none;font-weight:600;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:36px;font-weight:800;color:#0a1c37;margin:0 0 8px 0;">Cancellation &amp; Refund Policy</h1>
        <p style="color:#64748b;font-size:14px;margin-bottom:32px;">Last Updated: November 11, 2026</p>

        <section style="margin-bottom:28px;">
          <p>At <strong>RealSalePro</strong>, operated by <strong>Synergy Brand Architect</strong>, we are committed to complete transparency, fair pricing, and long-term customer trust. This Cancellation and Refund Policy outlines your rights regarding subscription cancellations, renewals, and refund requests for our real estate CRM software platform.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">1. 100% Free Forever Tier (Zero Billing Risk)</h2>
          <p>RealSalePro offers a fully functional <strong>Free Forever Tier</strong> supporting up to 1,000 active client leads and up to 5 user accounts. This plan requires no credit card, debit card, or banking details to activate. You may use this tier indefinitely without incurring any charges, fees, or hidden obligations.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">2. Paid Subscription Cancellation</h2>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>Self-Service Cancellation:</strong> You can cancel your paid Pro subscription at any time directly through your account settings (<em>Dashboard &gt; Settings &gt; Subscription</em>) or by sending an email to <a href="mailto:support@realsalepro.com" style="color:#059669;">support@realsalepro.com</a>.</li>
            <li><strong>Access Until Period End:</strong> When you cancel your subscription, your account remains fully active with all premium features until the end of the current billing cycle (monthly or annual).</li>
            <li><strong>No Unexpected Renewals:</strong> Once canceled, automatic recurring charges are immediately disabled, and no further billing will occur.</li>
            <li><strong>Seamless Reversion to Free Tier:</strong> After your paid term expires, your workspace is downgraded to our Free Forever Tier, preserving your client leads, site visit records, and sales history.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">3. Refund Policy for Paid Subscriptions</h2>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>14-Day Money-Back Window:</strong> If you upgrade to a paid plan and decide that RealSalePro does not meet your business requirements, you may request a full refund within <strong>14 calendar days</strong> of your initial payment date.</li>
            <li><strong>Technical Issues &amp; Double Billing:</strong> In the unlikely event of duplicate billing, incorrect charges, or severe technical outages that prevent software access, we will issue an immediate 100% refund upon verification.</li>
            <li><strong>Annual Subscriptions:</strong> For annual plans canceled after the 14-day window, a pro-rated refund may be granted upon request, deducting only the standard monthly rate for the active months used.</li>
            <li><strong>Custom Enterprise Integrations:</strong> One-time professional services, custom database setup fees, or dedicated API integration packages are non-refundable once engineering deployment has commenced.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">4. Refund Processing Timeline</h2>
          <p>Approved refunds are initiated immediately and credited to the original payment method (UPI, credit/debit card, or Net Banking via Razorpay) within <strong>5 to 7 business days</strong>, subject to your issuing bank's settlement processing timelines.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">5. How to Request a Cancellation or Refund</h2>
          <p>To request a refund or cancel your plan, simply reach out to our team with your registered account email and company name:</p>
          <div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;font-size:14px;color:#334155;">
            <p style="margin:0 0 4px 0;"><strong>Email Desk:</strong> <a href="mailto:support@realsalepro.com" style="color:#059669;">support@realsalepro.com</a></p>
            <p style="margin:0 0 4px 0;"><strong>Direct WhatsApp:</strong> <a href="https://wa.me/917079737773" style="color:#059669;">+91 70797 37773</a></p>
            <p style="margin:0;"><strong>Support Operating Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</p>
          </div>
        </section>
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
      <div style="max-width:960px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b;background:#ffffff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.05);line-height:1.7;">
        <nav style="margin-bottom:24px;"><a href="/" style="color:#059669;text-decoration:none;font-weight:600;">&larr; Back to RealSalePro Home</a></nav>
        <h1 style="font-size:36px;font-weight:800;color:#0a1c37;margin:0 0 8px 0;">Electronic Service &amp; Digital Delivery Policy</h1>
        <p style="color:#64748b;font-size:14px;margin-bottom:32px;">Last Updated: November 11, 2026</p>

        <section style="margin-bottom:28px;">
          <p><strong>RealSalePro</strong>, operated by <strong>Synergy Brand Architect</strong>, provides cloud-hosted Software as a Service (SaaS) applications for real estate builders, developers, and brokers. Because our software and services are exclusively delivered over the internet, <strong>no physical goods or physical parcels are shipped</strong>, and zero physical shipping or handling charges apply.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">1. Instant Digital Delivery &amp; Workspace Provisioning</h2>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>Immediate Provisioning:</strong> Upon completing registration for our Free Forever plan or upon confirmation of payment for a paid subscription, your multi-tenant CRM workspace is automatically provisioned and activated in real time (&lt; 60 seconds).</li>
            <li><strong>Electronic Confirmation &amp; Credentials:</strong> You will immediately receive an automated confirmation email and WhatsApp alert containing your direct workspace login URL (<a href="/login" style="color:#059669;">realsalepro.com/login</a>), tenant ID, and initial administrator credentials.</li>
            <li><strong>Browser &amp; Mobile Access:</strong> The platform is fully accessible instantly via any standard modern web browser (Chrome, Edge, Safari, Firefox) on desktop, tablet, and mobile devices without requiring software downloads or hardware installations.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">2. Service Delivery Timeframes</h2>
          <ul style="padding-left:24px;color:#334155;">
            <li><strong>Standard SaaS Accounts:</strong> Instant digital activation upon successful signup.</li>
            <li><strong>Meta Lead Ads &amp; Portal Webhooks:</strong> Webhook credentials and automated lead routing links are generated in your dashboard immediately upon account creation.</li>
            <li><strong>Enterprise Self-Hosted Database (BYOD):</strong> For enterprise clients opting for a private PostgreSQL or AWS RDS database integration behind their corporate VPC, configuration and custom domain deployment typically complete within <strong>5 to 10 business days</strong> in coordination with your IT security team.</li>
          </ul>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">3. Shipping Charges &amp; Customs Duties</h2>
          <p>Since all services are delivered electronically across India and globally, there are <strong>zero shipping fees</strong>, zero handling charges, and zero customs fees associated with any RealSalePro plan or add-on.</p>
        </section>

        <section style="margin-bottom:28px;">
          <h2 style="font-size:20px;font-weight:700;color:#0a1c37;margin:0 0 12px 0;">4. Delivery Inquiries &amp; Customer Support</h2>
          <p>For questions regarding your account provisioning or access credentials, please contact us:</p>
          <div style="background:#f8fafc;padding:16px;border-radius:10px;border:1px solid #e2e8f0;font-size:14px;color:#334155;">
            <p style="margin:0 0 4px 0;"><strong>Email:</strong> <a href="mailto:support@realsalepro.com" style="color:#059669;">support@realsalepro.com</a></p>
            <p style="margin:0 0 4px 0;"><strong>Phone / WhatsApp:</strong> <a href="tel:+917079737773" style="color:#059669;">+91 70797 37773</a></p>
            <p style="margin:0;"><strong>Operating Hours:</strong> Monday – Saturday, 9:00 AM – 7:00 PM IST</p>
          </div>
        </section>
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
    content: `
      <div style="max-width:960px;margin:0 auto;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;">
        <nav style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.1);">
          <a href="/" style="color:#10b981;text-decoration:none;font-weight:700;">&larr; Back to RealSalePro Home</a>
          <a href="/login" style="color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;">Already have an account? Sign In</a>
        </nav>

        <header style="text-align:center;max-width:680px;margin:0 auto 36px auto;">
          <span style="display:inline-block;padding:5px 14px;border-radius:999px;background:rgba(16,185,129,0.15);color:#34d399;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">1,000 Leads Free Forever &bull; No Credit Card</span>
          <h1 style="font-size:36px;line-height:1.2;margin:0 0 12px 0;font-weight:800;color:#ffffff;">Create Your Free RealSalePro Account</h1>
          <p style="font-size:16px;color:rgba(255,255,255,0.75);margin:0;">Start capturing and managing property leads in under 2 minutes. Full deal pipeline, WhatsApp automation, and telecaller masking included.</p>
        </header>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:32px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:36px 30px;">
          <div>
            <h2 style="font-size:20px;color:#34d399;margin:0 0 16px 0;">What's Included in Your Free Plan:</h2>
            <ul style="list-style:none;padding:0;margin:0 0 24px 0;line-height:2.2;color:rgba(255,255,255,0.85);font-size:14.5px;">
              <li>&#10003; <strong>1,000 active leads</strong> stored free forever</li>
              <li>&#10003; <strong>Up to 5 users</strong> with role-based permissions</li>
              <li>&#10003; <strong>Meta Facebook &amp; Instagram</strong> instant lead sync</li>
              <li>&#10003; <strong>WhatsApp Welcome Bot</strong> &amp; template responder</li>
              <li>&#10003; <strong>Phone Number Masking</strong> to prevent lead leakage</li>
              <li>&#10003; <strong>Site Visit Scheduling</strong> &amp; deal tracking Kanban</li>
              <li>&#10003; <strong>1-Click Excel / CSV Data Export</strong> anytime</li>
            </ul>
            <p style="font-size:13px;color:rgba(255,255,255,0.6);">By creating an account, you agree to our <a href="/terms" style="color:#10b981;">Terms of Service</a> and <a href="/privacy" style="color:#10b981;">Privacy Policy</a>.</p>
          </div>

          <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;">
            <h3 style="font-size:18px;color:#fff;margin:0 0 16px 0;text-align:center;">Quick Workspace Setup</h3>
            <div style="display:grid;gap:12px;font-size:13.5px;color:rgba(255,255,255,0.7);">
              <div style="padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">Company Name</div>
              <div style="padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">Your Full Name</div>
              <div style="padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">Work Email Address</div>
              <div style="padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">Phone Number (WhatsApp OTP)</div>
              <div style="padding:10px 14px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226; (Create Password)</div>
            </div>
            <p style="font-size:12px;color:rgba(255,255,255,0.5);margin:16px 0 0 0;text-align:center;">Instant activation via WhatsApp OTP. No credit card required.</p>
          </div>
        </div>
      </div>
    `
  },

  // --- Affiliate Register (Noindex) ---
  {
    path: '/affiliate/register',
    title: 'Affiliate Partner Registration | RealSalePro',
    description: 'Register as an affiliate partner with RealSalePro and earn recurring revenue by referring real estate companies.',
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

    // Also write dist/${cleanPath}.html for nginx direct match without directory slash redirect
    const htmlFilePath = path.join(distDir, `${cleanPath}.html`);
    const htmlFileDir = path.dirname(htmlFilePath);
    if (!fs.existsSync(htmlFileDir)) {
      fs.mkdirSync(htmlFileDir, { recursive: true });
    }
    fs.writeFileSync(htmlFilePath, html, 'utf8');

    console.log(`✅ Generated prerendered ${route.path} -> dist/${cleanPath}.html & dist/${cleanPath}/index.html`);
  }
}

// 5. Run generation for all routes
console.log('🚀 Pre-rendering static HTML pages for SEO...');
routes.forEach(generatePage);
console.log(`✨ All ${routes.length} routes pre-rendered successfully in dist/!`);
