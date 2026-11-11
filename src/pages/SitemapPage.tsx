import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { initLandingInteractions } from './landingInteractions';
import '../styles/landing.css';

interface SitemapSection {
  title: string;
  badge: string;
  description: string;
  links: {
    title: string;
    path: string;
    description: string;
    isExternal?: boolean;
  }[];
}

const sitemapData: SitemapSection[] = [
  {
    title: 'Core Platform & Pricing',
    badge: 'Main',
    description: 'Essential landing pages and transparent pricing plans.',
    links: [
      {
        title: 'RealSalePro Homepage',
        path: '/',
        description: 'Main product overview, omnichannel capture, visual pipeline, and mobile access.'
      },
      {
        title: 'Pricing Plans & Subscriptions',
        path: '/pricing',
        description: 'Free forever plan, Pro plan with 6-month and annual discounts, and Enterprise terms.'
      },
      {
        title: 'Register Company & Start Free',
        path: '/register',
        description: '1-minute onboarding with no credit card required to manage up to 1,000 leads.'
      },
      {
        title: 'Login to RealSalePro',
        path: '/login',
        description: 'Secure sign-in for administrators, sales managers, and telecallers.'
      }
    ]
  },
  {
    title: 'Specialized Real Estate CRM Solutions',
    badge: 'High Intent',
    description: 'Targeted solutions for brokers, channel partners, and Indian developers.',
    links: [
      {
        title: 'Free Real Estate CRM Software',
        path: '/free-real-estate-crm',
        description: '100% free CRM forever for up to 1,000 leads and 5 team member accounts.'
      },
      {
        title: 'CRM for Real Estate Brokers & Agents',
        path: '/crm-for-real-estate-brokers',
        description: 'Staff phone number masking, site visit coordination, and brokerage commission tracking.'
      },
      {
        title: 'India Real Estate CRM Edition',
        path: '/real-estate-crm-india',
        description: 'Native webhooks for 99acres, Magicbricks & Housing.com, with ₹ Lakhs/Crores math.'
      },
      {
        title: 'Real Estate Lead Management Software',
        path: '/features/lead-management',
        description: 'Sub-30-second lead capture, deduplication, round-robin routing, and follow-up cadences.'
      },
      {
        title: 'Free Real Estate CRM Excel Template',
        path: '/templates/real-estate-crm-excel-template',
        description: 'Downloadable spreadsheet lead tracker with property stages and 1-click cloud migration.'
      },
      {
        title: 'Enterprise BYOD Database Integration',
        path: '/integration',
        description: 'Host CRM data on your own AWS RDS or PostgreSQL instance for complete sovereignty.'
      }
    ]
  },
  {
    title: 'Partner Programs & Growth',
    badge: 'Partners',
    description: 'Programs to earn rewards and collaborate with RealSalePro.',
    links: [
      {
        title: 'Customer Referral Program',
        path: '/referral-program',
        description: 'Refer fellow developers and property brokers to earn recurring rewards and discounts.'
      },
      {
        title: 'Affiliate Partner Registration',
        path: '/affiliate/register',
        description: 'Join the RealSalePro affiliate network and earn commissions on paid subscriptions.'
      },
      {
        title: 'Affiliate Program Terms',
        path: '/affiliate/terms',
        description: 'Guidelines, payout schedules, and commission structures for affiliate partners.'
      }
    ]
  },
  {
    title: 'Company & Contact',
    badge: 'Support',
    description: 'Get in touch with our team and technical resources.',
    links: [
      {
        title: 'Contact Us & Book a Demo',
        path: '/contact',
        description: 'Speak with our sales and technical support team via email, phone, or live WhatsApp.'
      },
      {
        title: 'Official Google XML Sitemap',
        path: '/sitemap.xml',
        description: 'Machine-readable XML sitemap for search engine bots (Googlebot, Bingbot).',
        isExternal: true
      }
    ]
  },
  {
    title: 'Legal, Privacy & Compliance',
    badge: 'Compliance',
    description: 'Data security standards and consumer protection terms.',
    links: [
      {
        title: 'Privacy Policy',
        path: '/privacy',
        description: 'Our commitment to data privacy, AES-256 encryption, and zero third-party data selling.'
      },
      {
        title: 'Terms of Service',
        path: '/terms',
        description: 'Account terms, usage guidelines, and service level agreements.'
      },
      {
        title: 'Refund & Cancellation Policy',
        path: '/refund-policy',
        description: 'Transparent subscription cancellation terms and billing dispute resolution.'
      },
      {
        title: 'Shipping & Delivery Policy',
        path: '/shipping-policy',
        description: 'Digital delivery terms and software access activation.'
      }
    ]
  }
];

export function SitemapPage() {
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
        title="RealSalePro Sitemap | Complete Index of Real Estate CRM Pages"
        description="Explore the complete sitemap of RealSalePro. Direct links to our Free Real Estate CRM, Broker CRM, Lead Management Software, Pricing, and Excel Template."
        canonicalUrl="https://realsalepro.com/sitemap"
      />

      {/* SVG SPRITE */}
      <svg xmlns="http://www.w3.org/2000/svg" className="sprite" aria-hidden="true">
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
        <symbol id="i-whatsapp" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.71 0 1.01.74 1.99.84 2.13.1.14 1.44 2.21 3.5 3.1 1.71.74 2.06.59 2.43.56.37-.04 1.19-.49 1.36-.96.17-.47.17-.87.12-.96-.05-.09-.19-.14-.4-.25-.21-.1-1.2-.59-1.39-.66-.19-.07-.33-.1-.47.1-.14.21-.55.69-.67.83-.12.14-.24.16-.45.05-.21-.1-.89-.33-1.69-1.05-.62-.56-1.04-1.25-1.16-1.46-.12-.21-.01-.32.09-.43.09-.1.21-.26.31-.38.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.37-.05-.1-.47-1.14-.65-1.56-.17-.41-.35-.35-.48-.36-.12-.01-.26-.01-.4-.01z"/></symbol>
        <symbol id="i-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M14 13.5h2.5l1-4H14v-2c0-1.03.77-1.5 1.5-1.5h2v-3.5h-3.5C10.5 2.5 9 4 9 7.5v2H6v4h3v10h5v-10z"/></symbol>
        <symbol id="i-linkedin" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></symbol>
      </svg>

      <div className="noise" aria-hidden="true"></div>

      {/* FLOATING NAVIGATION */}
      <header className="nav" id="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__brand" aria-label="RealSalePro home">
            <img src="/assets/img/logo-light.png" alt="RealSalePro" width="176" height="34" />
          </Link>

          <nav className="nav__links" aria-label="Primary">
            <Link to="/free-real-estate-crm">Free Plan</Link>
            <Link to="/crm-for-real-estate-brokers">For Brokers</Link>
            <Link to="/real-estate-crm-india">India Edition</Link>
            <Link to="/features/lead-management">Lead Management</Link>
            <Link to="/pricing">Pricing</Link>
          </nav>

          <div className="nav__actions">
            <Link className="nav__login" to="/login">Log in</Link>
            <Link className="btn btn--primary btn--sm" to="/register">
              <span>Start free</span><svg className="icon"><use href="#i-arrow"/></svg>
            </Link>
            <button className="nav__toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
              <svg className="icon"><use href="#i-menu"/></svg>
            </button>
          </div>
        </div>

        <div className="nav__mobile" id="mobileMenu" hidden>
          <Link to="/free-real-estate-crm">Free CRM (1,000 Leads)</Link>
          <Link to="/crm-for-real-estate-brokers">For Brokers</Link>
          <Link to="/real-estate-crm-india">India Edition</Link>
          <Link to="/features/lead-management">Lead Management</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/login">Log in</Link>
          <Link className="btn btn--primary" to="/register">Start free <svg className="icon"><use href="#i-arrow"/></svg></Link>
        </div>
      </header>

      <main id="top">
        {/* ============ HERO SECTION ============ */}
        <section className="hero" style={{ paddingBottom: '30px' }}>
          <div className="hero__bg" aria-hidden="true">
            <div className="hero__grid"></div>
            <div className="hero__glow hero__glow--a"></div>
            <div className="hero__glow hero__glow--b"></div>
            <div className="hero__ring"></div>
          </div>

          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <p className="eyebrow" data-reveal style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto 16px' }}>
              <span className="eyebrow__dot"></span> Complete Index &amp; Structure
            </p>

            <h1 className="hero__title" data-reveal data-reveal-delay="80" style={{ maxWidth: '820px', margin: '0 auto 20px' }}>
              RealSalePro Website <em>Sitemap</em>.
            </h1>

            <p className="hero__lede" data-reveal data-reveal-delay="140" style={{ maxWidth: '640px', margin: '0 auto 36px' }}>
              Browse all product modules, specialized real estate editions, free templates, and legal policies on RealSalePro.
            </p>
          </div>
        </section>

        {/* ============ SITEMAP TREE ============ */}
        <section className="section" style={{ paddingTop: 0, paddingBottom: '90px' }}>
          <div className="container">
            <div style={{ display: 'grid', gap: '36px' }}>
              {sitemapData.map((section, sIdx) => (
                <div
                  key={section.title}
                  data-reveal
                  data-reveal-delay={sIdx * 40}
                  style={{
                    padding: '32px 30px',
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'var(--shadow-dark)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', padding: '3px 9px', borderRadius: '6px', background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}>
                      {section.badge}
                    </span>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                      {section.title}
                    </h2>
                  </div>
                  <p style={{ fontSize: '13.5px', color: 'var(--muted-dark)', margin: '0 0 24px', lineHeight: 1.5 }}>
                    {section.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {section.links.map((link) => (
                      link.isExternal ? (
                        <a
                          key={link.path}
                          href={link.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '18px 20px',
                            borderRadius: '16px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                              {link.title}
                            </h3>
                            <p style={{ fontSize: '12.5px', color: 'var(--muted-dark)', margin: 0, lineHeight: 1.5 }}>
                              {link.description}
                            </p>
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--mint-bright)', marginTop: '14px' }}>
                            View XML &rarr;
                          </span>
                        </a>
                      ) : (
                        <Link
                          key={link.path}
                          to={link.path}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '18px 20px',
                            borderRadius: '16px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.07)',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
                              {link.title}
                            </h3>
                            <p style={{ fontSize: '12.5px', color: 'var(--muted-dark)', margin: 0, lineHeight: 1.5 }}>
                              {link.description}
                            </p>
                          </div>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--mint-bright)', marginTop: '14px' }}>
                            Explore Page &rarr;
                          </span>
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <div className="footer__brand">
              <img src="/assets/img/logo-light.png" alt="RealSalePro" width="190" height="40" style={{ height: '40px', width: 'auto', display: 'block' }} />
              <p>Empowering real-estate teams with intelligent tools and real-time insight. Built for the future of sales.</p>
              <div className="footer__social">
                <a href="https://www.facebook.com/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg className="icon icon--fill"><use href="#i-facebook"/></svg></a>
                <a href="https://www.linkedin.com/company/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg className="icon icon--fill"><use href="#i-linkedin"/></svg></a>
                <a href="https://wa.me/917079737773" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><svg className="icon icon--fill"><use href="#i-whatsapp"/></svg></a>
              </div>
            </div>

            <div className="footer__col">
              <h3>Platform</h3>
              <Link to="/sitemap" style={{ color: 'var(--mint)', fontWeight: 600 }}>Sitemap Hub</Link>
              <Link to="/free-real-estate-crm">Free Real Estate CRM</Link>
              <Link to="/crm-for-real-estate-brokers">CRM for Brokers</Link>
              <Link to="/real-estate-crm-india">India Real Estate CRM</Link>
              <Link to="/features/lead-management">Lead Management</Link>
              <Link to="/templates/real-estate-crm-excel-template">Free Excel Template</Link>
            </div>

            <div className="footer__col">
              <h3>Integrations</h3>
              <a href="/#integrations">Meta Lead Ads</a>
              <a href="/#integrations">Google Ads</a>
              <a href="/#integrations">WhatsApp Business</a>
              <a href="/#integrations">Magicbricks</a>
              <a href="/#integrations">99acres</a>
            </div>

            <div className="footer__col">
              <h3>Company</h3>
              <a href="/#stories">About us</a>
              <Link to="/referral-program">Refer &amp; earn</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/pricing">Pricing</Link>
            </div>

            <div className="footer__col footer__col--contact">
              <h3>Talk to a human</h3>
              <a href="mailto:support@realsalepro.com">support@realsalepro.com</a>
              <a href="tel:+917079737773">+91 70797 37773</a>
              <a className="footer__wa" href="https://wa.me/917079737773" target="_blank" rel="noopener noreferrer">
                <svg className="icon"><use href="#i-whatsapp"/></svg> Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="footer__wordmark" aria-hidden="true">RealSalePro</div>

          <div className="footer__bottom">
            <p>© {new Date().getFullYear()} RealSalePro. All rights reserved.</p>
            <div className="footer__legal">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/refund-policy">Refund Policy</Link>
              <Link to="/shipping-policy">Shipping Policy</Link>
              <Link to="/sitemap">HTML Sitemap</Link>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">XML Sitemap</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp FAB */}
      <a className="wa-float" href="https://wa.me/917079737773" target="_blank" rel="noopener noreferrer" aria-label="Chat with RealSalePro on WhatsApp">
        <svg className="icon"><use href="#i-whatsapp"/></svg>
        <span className="wa-float__tip">Chat with us</span>
      </a>
    </>
  );
}

