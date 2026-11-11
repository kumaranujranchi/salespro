import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { RelatedSolutionsCluster } from '../components/seo/RelatedSolutionsCluster';
import { initLandingInteractions } from './landingInteractions';
import '../styles/landing.css';

export function IndiaCRMPage() {
  useEffect(() => {
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('js');
    const cleanup = initLandingInteractions();
    return () => {
      document.body.classList.remove('landing-page-active');
      cleanup();
    };
  }, []);

  const indiaSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RealSalePro India Real Estate CRM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All (Cloud & Mobile PWA)",
    "description": "Real estate CRM software tailored for the Indian real estate market. Connects with Magicbricks, 99acres, Housing.com, Meta Ads and WhatsApp API with INR ₹ pricing.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  return (
    <>
      <SEOHead
        title="Real Estate CRM Software in India | Builders, Brokers & Developers | RealSalePro"
        description="India's #1 Real Estate CRM software. Built for Indian builders, developers & brokers with Magicbricks, 99acres, WhatsApp API & Meta lead sync. Free up to 1,000 leads."
        canonicalUrl="https://realsalepro.com/real-estate-crm-india"
        keywords="real estate crm software in india, property crm, housing crm, real estate software india, builder crm software india, magicbricks 99acres crm integration"
        jsonLd={indiaSchema}
      />

      {/* SVG SPRITE */}
      <svg xmlns="http://www.w3.org/2000/svg" className="sprite" aria-hidden="true">
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
        <symbol id="i-building" viewBox="0 0 24 24"><path d="M4 21V7l8-4v18M12 21h8V10l-8-3"/><path d="M7.5 9.5h1M7.5 13h1M7.5 16.5h1M15.5 12.5h1M15.5 16h1M2.5 21h19"/></symbol>
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
            <Link to="/real-estate-crm-india" className="is-active" style={{ color: 'var(--mint-bright)' }}>India Edition</Link>
            <Link to="/crm-for-real-estate-brokers">For Brokers</Link>
            <Link to="/features/lead-management">Lead Management</Link>
            <Link to="/free-real-estate-crm">Free Plan</Link>
            <Link to="/templates/real-estate-crm-excel-template">Excel Template</Link>
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
          <Link to="/real-estate-crm-india" style={{ color: 'var(--mint-bright)' }}>India Edition</Link>
          <Link to="/crm-for-real-estate-brokers">For Brokers</Link>
          <Link to="/features/lead-management">Lead Management</Link>
          <Link to="/free-real-estate-crm">Free CRM (1,000 Leads)</Link>
          <Link to="/templates/real-estate-crm-excel-template">Excel Template</Link>
          <Link to="/login">Log in</Link>
          <Link className="btn btn--primary" to="/register">Start free <svg className="icon"><use href="#i-arrow"/></svg></Link>
        </div>
      </header>

      <main id="top">
        {/* ============ HERO SECTION ============ */}
        <section className="hero">
          <div className="hero__bg" aria-hidden="true">
            <div className="hero__grid"></div>
            <div className="hero__glow hero__glow--a"></div>
            <div className="hero__glow hero__glow--b"></div>
            <div className="hero__ring"></div>
          </div>

          <div className="container hero__inner">
            <div className="hero__copy">
              <p className="eyebrow hero__eyebrow" data-reveal>
                <span className="eyebrow__dot"></span>
                Made for India's Real Estate Market
                <span className="eyebrow__new">₹ INR &amp; RERA Ready</span>
              </p>

              <h1 className="hero__title" data-reveal data-reveal-delay="80">
                India's #1 real estate<br />CRM for <em>builders &amp; brokers</em>.
              </h1>

              <p className="hero__lede" data-reveal data-reveal-delay="160">
                Pre-integrated with Magicbricks, 99acres, Housing.com, Meta CAPI, and WhatsApp Cloud API. 
                Designed around Indian property workflows — Lakhs &amp; Crores budget filters, RERA unit inventories, 
                and on-site driver coordination. Free up to <strong>1,000 leads</strong>.
              </p>

              <div className="hero__cta" data-reveal data-reveal-delay="240" style={{ marginTop: '34px', marginBottom: '24px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Start free — Made for India</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <a className="btn btn--ghost btn--lg" href="#portals">
                  <span>Explore Indian portals</span>
                </a>
              </div>

              <ul className="hero__facts" data-reveal data-reveal-delay="320" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.14)' }}>
                <li><b>50+</b><span>Builders onboard</span></li>
                <li><b>10,000+</b><span>Indian users</span></li>
                <li><b>₹0</b><span>Free forever plan</span></li>
              </ul>
            </div>

            {/* Visual */}
            <div className="hero__visual" data-reveal data-reveal-delay="200">
              <div className="stage">
                <div className="stage__label"><span></span> Indian Portal &amp; Ad Sync</div>

                <div className="app">
                  <div className="app__bar">
                    <span className="app__dots"><i></i><i></i><i></i></span>
                    <span className="app__url">app.realsalepro.com / india-crm</span>
                    <span className="app__live"><i></i> Portal Live</span>
                  </div>
                  <div className="app__body">
                    <div className="app__main" style={{ padding: '24px' }}>
                      <p className="app__crumb">Indian Real Estate Portals · Real-time Sync</p>
                      <p className="app__title">Incoming Lead Stream</p>

                      <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0 }}>Magicbricks Premium Inquiry</p>
                            <p style={{ fontSize: '11px', color: 'var(--muted-dark)', margin: 0 }}>Godrej Palm, Sector 150 · 3 BHK · Budget ₹1.4 Cr</p>
                          </div>
                          <span className="chip chip--ghost" style={{ color: 'var(--mint-bright)', borderColor: 'rgba(0,229,118,0.3)' }}>Synced 22s ago</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0 }}>99acres Verified Buyer</p>
                            <p style={{ fontSize: '11px', color: 'var(--muted-dark)', margin: 0 }}>Sobha Dream Acres, Panathur · 2 BHK · Budget ₹85 Lakhs</p>
                          </div>
                          <span className="chip chip--ghost" style={{ color: 'var(--mint-bright)', borderColor: 'rgba(0,229,118,0.3)' }}>Synced 45s ago</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0 }}>Meta WhatsApp Campaign</p>
                            <p style={{ fontSize: '11px', color: 'var(--muted-dark)', margin: 0 }}>DLF Cyber City · 4 BHK Luxury · Budget ₹3.2 Cr</p>
                          </div>
                          <span className="chip chip--solid" style={{ background: 'rgba(0,229,118,0.2)', color: 'var(--mint-bright)' }}>Auto-Assigned</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ INDIAN PORTAL INTEGRATIONS (DARK BENTO) ============ */}
        <section className="section section--dark" id="portals">
          <div className="container">
            <header className="sec-head">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">01</span> Ecosystem</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                Seamlessly connected to the <em>Indian property market</em>.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Unlike foreign CRMs that require expensive Zapier connectors and US-centric tools, RealSalePro speaks the language of Indian real estate.
              </p>
            </header>

            <div className="feature-grid-symmetric" data-reveal data-reveal-delay="180">
              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Portal Webhooks</span>
                <h3 className="feature-card-clean__h">Magicbricks, 99acres &amp; Housing.com</h3>
                <p className="feature-card-clean__p">
                  Inquiries from major property portals sync straight into your RealSalePro New Leads column in under 30 seconds. 
                  Powered by our <Link to="/features/lead-management" style={{ color: 'var(--mint-bright)', textDecoration: 'underline' }}>real estate lead management engine</Link> for automatic deduplication and routing.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">WhatsApp Cloud</span>
                <h3 className="feature-card-clean__h">WhatsApp Business API</h3>
                <p className="feature-card-clean__p">
                  Send automated project brochures, payment schedules, and site visit confirmations directly on WhatsApp in English or Hindi.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Currency Math</span>
                <h3 className="feature-card-clean__h">Lakhs &amp; Crores native math</h3>
                <p className="feature-card-clean__p">
                  Calculate pipeline revenue, token deposits, and broker commissions natively in ₹ Lakhs &amp; ₹ Crores with zero currency conversion errors.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Phone Masking</span>
                <h3 className="feature-card-clean__h">10-Digit Indian phone masking</h3>
                <p className="feature-card-clean__p">
                  Standardized to Indian +91 numbers with intelligent masking that conceals the last 5 digits from telecallers to eliminate database theft.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">RERA &amp; Units</span>
                <h3 className="feature-card-clean__h">Carpet area &amp; tower inventory</h3>
                <p className="feature-card-clean__p">
                  Track project phase approvals, RERA compliance certificates, carpet area rates, and floor inventory in real-time.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Local Support</span>
                <h3 className="feature-card-clean__h">Indian business hours support</h3>
                <p className="feature-card-clean__p">
                  Dedicated WhatsApp and phone support based in India during standard operational hours (9 AM – 7 PM IST).
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ============ BUILDERS VS BROKERS (PAPER SECTION) ============ */}
        <section className="section section--paper">
          <div className="container">
            <header className="sec-head sec-head--center">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">02</span> Tailored Workflows</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                Built for Indian <em>builders and brokers</em> alike.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Whether you develop multi-tower townships or broker independent villas, RealSalePro adapts to your scale.
              </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginTop: '48px' }}>
              <div style={{ padding: '36px', borderRadius: '24px', background: '#fff', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 20px 50px rgba(10,32,24,0.06)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>For Real Estate Builders</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, margin: '12px 0 16px', color: '#0a2018' }}>Tower &amp; Unit Inventory Management</h3>
                <ul style={{ display: 'grid', gap: '14px', color: 'var(--muted-light)', fontSize: '14.5px', lineHeight: 1.6 }}>
                  <li>• Live unit availability matrix (Available, Blocked, Booked, Sold).</li>
                  <li>• Sales executive target tracking and incentive calculators.</li>
                  <li>• Direct Meta CAPI integration for maximum ad optimization.</li>
                  <li>• Multi-project dashboard for group developers across cities.</li>
                </ul>
              </div>

              <div style={{ padding: '36px', borderRadius: '24px', background: '#fff', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 20px 50px rgba(10,32,24,0.06)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>For Property Brokers &amp; CPs</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, margin: '12px 0 16px', color: '#0a2018' }}>Site Visit &amp; Brokerage Settlement</h3>
                <ul style={{ display: 'grid', gap: '14px', color: 'var(--muted-light)', fontSize: '14.5px', lineHeight: 1.6 }}>
                  <li>• Field-ready mobile phone access for on-site visit updates.</li>
                  <li>• Automatic customer phone number masking to prevent lead theft.</li>
                  <li>• 1-Click WhatsApp follow-ups with brochures and video tours.</li>
                  <li>• Tailored for <Link to="/crm-for-real-estate-brokers" style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline' }}>Brokers &amp; Channel Partners</Link> across major Indian metros.</li>
                  <li>• 100% Free Forever up to 1,000 client leads on our <Link to="/free-real-estate-crm" style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline' }}>Free Real Estate CRM</Link>.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============ RELATED SOLUTIONS SEO CLUSTER ============ */}
        <RelatedSolutionsCluster currentPath="/real-estate-crm-india" />

        {/* ============ FINAL CTA ============ */}
        <section className="cta" id="demo">
          <div className="cta__bg" aria-hidden="true"></div>
          <div className="container">
            <div className="cta__card" data-reveal style={{ textAlign: 'center' }}>
              <p className="eyebrow eyebrow--mint" style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto' }}>
                <span className="eyebrow__dot"></span> Free forever plan
              </p>
              <h2 style={{ textAlign: 'center', marginTop: '22px' }}>
                Join India's fastest growing<br /><em>real estate platform</em>.
              </h2>
              <p className="cta__lede" style={{ textAlign: 'center', margin: '22px auto 0', maxWidth: '580px' }}>
                Start free with up to 1,000 leads. Experience why developers across NCR, Mumbai, Bangalore and Pune choose RealSalePro.
              </p>
              <div className="cta__actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '32px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Start free — no card needed</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <Link className="btn btn--ghost btn--lg" to="/free-real-estate-crm">
                  <span>View free plan features</span>
                </Link>
              </div>
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
              <Link to="/real-estate-crm-india">India Real Estate CRM</Link>
              <Link to="/crm-for-real-estate-brokers">CRM for Brokers</Link>
              <Link to="/features/lead-management">Lead Management</Link>
              <Link to="/free-real-estate-crm">Free CRM (1,000 Leads)</Link>
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
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

