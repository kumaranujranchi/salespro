import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingHtml } from './landingHtml';
import { initLandingInteractions } from './landingInteractions';
import { WebsiteWhatsAppWidget } from '../components/whatsapp/WebsiteWhatsAppWidget';
import { SEOHead } from '../components/seo/SEOHead';
import '../styles/landing.css';

const homeSchema = {
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
};

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Activate landing page scoped CSS and reveal animations
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('js');

    // 2. Initialize all interactive UI components
    const cleanupInteractions = initLandingInteractions();

    // 3. Intercept internal navigation links for seamless SPA routing
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Smooth scroll for anchor links
      if (href.startsWith('#')) {
        if (href === '#top') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      // Allow external links (WhatsApp, Socials, Mailto, Tel) to work natively
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('https://wa.me') ||
        href.includes('facebook.com') ||
        href.includes('linkedin.com')
      ) {
        return;
      }

      // Route internal links through React Router
      let routePath = '';
      if (href.startsWith('/')) {
        routePath = href;
      } else if (href.startsWith('https://realsalepro.com/')) {
        routePath = href.replace('https://realsalepro.com', '');
      }

      if (
        routePath &&
        !routePath.startsWith('/assets') &&
        !routePath.startsWith('/images')
      ) {
        e.preventDefault();
        navigate(routePath);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleLinkClick);
    }

    return () => {
      cleanupInteractions();
      if (container) {
        container.removeEventListener('click', handleLinkClick);
      }
      document.body.classList.remove('landing-page-active');
      document.documentElement.classList.remove('js');
    };
  }, [navigate]);

  return (
    <>
      <SEOHead
        title="Free Real Estate CRM for Builders & Brokers | RealSalePro"
        description="Free real estate CRM for Indian builders, developers & brokers. Auto-sync Meta, Google & WhatsApp leads, track site visits and pipeline. 1,000 leads free."
        canonicalUrl="https://realsalepro.com/"
        keywords="free real estate crm, real estate crm india, property crm software, real estate lead management, broker crm, real estate lead tracker"
        jsonLd={homeSchema}
      />
      <div
        ref={containerRef}
        className="realsalepro-landing-wrapper"
        dangerouslySetInnerHTML={{ __html: landingHtml }}
      />
      <WebsiteWhatsAppWidget />
    </>
  );
}
