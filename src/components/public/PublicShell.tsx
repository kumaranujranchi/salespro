import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WebsiteWhatsAppWidget } from '../whatsapp/WebsiteWhatsAppWidget';
import { initLandingInteractions } from '../../pages/landingInteractions';
import '../../styles/landing.css';
import '../../styles/public-pages.css';

/**
 * Shared chrome (nav, footer, WhatsApp widget, icon sprite) for every public
 * marketing / legal page, so they all match the landing page theme.
 */

const WHATSAPP_PATH =
  'M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.71 0 1.01.74 1.99.84 2.13.1.14 1.44 2.21 3.5 3.1 1.71.74 2.06.59 2.43.56.37-.04 1.19-.49 1.36-.96.17-.47.17-.87.12-.96-.05-.09-.19-.14-.4-.25-.21-.1-1.2-.59-1.39-.66-.19-.07-.33-.1-.47.1-.14.21-.55.69-.67.83-.12.14-.24.16-.45.05-.21-.1-.89-.33-1.69-1.05-.62-.56-1.04-1.25-1.16-1.46-.12-.21-.01-.32.09-.43.09-.1.21-.26.31-.38.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.37-.05-.1-.47-1.14-.65-1.56-.17-.41-.35-.35-.48-.36-.12-.01-.26-.01-.4-.01z';

function Sprite() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="sprite" aria-hidden="true">
      <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" /></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></symbol>
      <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></symbol>
      <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></symbol>
      <symbol id="i-whatsapp" viewBox="0 0 24 24"><path fill="currentColor" d={WHATSAPP_PATH} /></symbol>
      <symbol id="i-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M14 13.5h2.5l1-4H14v-2c0-1.03.77-1.5 1.5-1.5h2v-3.5h-3.5C10.5 2.5 9 4 9 7.5v2H6v4h3v10h5v-10z" /></symbol>
      <symbol id="i-linkedin" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></symbol>
    </svg>
  );
}

export function PublicNav() {
  return (
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
            <span>Start free</span><svg className="icon"><use href="#i-arrow" /></svg>
          </Link>
          <button className="nav__toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
            <svg className="icon"><use href="#i-menu" /></svg>
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
        <Link className="btn btn--primary" to="/register">Start free <svg className="icon"><use href="#i-arrow" /></svg></Link>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <img src="/assets/img/logo-light.png" alt="RealSalePro" width="190" height="40" style={{ height: '40px', width: 'auto', display: 'block' }} />
            <p>Empowering real-estate teams with intelligent tools and real-time insight. Built for the future of sales.</p>
            <div className="footer__social">
              <a href="https://www.facebook.com/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg className="icon icon--fill"><use href="#i-facebook" /></svg></a>
              <a href="https://www.linkedin.com/company/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg className="icon icon--fill"><use href="#i-linkedin" /></svg></a>
              <a href="https://wa.me/917079737773" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><svg className="icon icon--fill"><use href="#i-whatsapp" /></svg></a>
            </div>
          </div>

          <div className="footer__col">
            <h3>Platform</h3>
            <Link to="/sitemap">Sitemap Hub</Link>
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
            <Link to="/affiliate/register">Become an affiliate</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/pricing">Pricing</Link>
          </div>

          <div className="footer__col footer__col--contact">
            <h3>Talk to a human</h3>
            <a href="mailto:support@realsalepro.com">support@realsalepro.com</a>
            <a href="tel:+917079737773">+91 70797 37773</a>
            <a className="footer__wa" href="https://wa.me/917079737773" target="_blank" rel="noopener noreferrer">
              <svg className="icon"><use href="#i-whatsapp" /></svg> Chat on WhatsApp
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
  );
}

interface PublicShellProps {
  children: ReactNode;
  /** Hide the marketing footer (e.g. for minimal status pages). */
  hideFooter?: boolean;
  /** Hide the floating WhatsApp assistant. */
  hideWhatsApp?: boolean;
}

export function PublicShell({ children, hideFooter = false, hideWhatsApp = false }: PublicShellProps) {
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
      <Sprite />
      <div className="noise" aria-hidden="true"></div>
      <PublicNav />
      <main id="top" className="pp">{children}</main>
      {!hideFooter && <PublicFooter />}
      {!hideWhatsApp && <WebsiteWhatsAppWidget />}
    </>
  );
}

interface PublicHeroProps {
  eyebrow: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  /** Smaller hero for legal / utility pages. */
  compact?: boolean;
}

/** Centered hero band matching the landing page (grid, glows, ring). */
export function PublicHero({ eyebrow, title, lede, children, compact = false }: PublicHeroProps) {
  return (
    <section className={`hero pp-hero${compact ? ' pp-hero--compact' : ''}`}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__grid"></div>
        <div className="hero__glow hero__glow--a"></div>
        <div className="hero__glow hero__glow--b"></div>
        {!compact && <div className="hero__ring"></div>}
      </div>
      <div className="container pp-hero__inner">
        <p className="eyebrow hero__eyebrow" data-reveal>
          <span className="eyebrow__dot"></span> {eyebrow}
        </p>
        <h1 className="hero__title pp-hero__title" data-reveal data-reveal-delay="80">{title}</h1>
        {lede && <p className="hero__lede pp-hero__lede" data-reveal data-reveal-delay="140">{lede}</p>}
        {children && <div className="pp-hero__extra" data-reveal data-reveal-delay="200">{children}</div>}
      </div>
    </section>
  );
}
