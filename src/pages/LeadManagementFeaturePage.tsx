import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { RelatedSolutionsCluster } from '../components/seo/RelatedSolutionsCluster';
import { WebsiteWhatsAppWidget } from '../components/whatsapp/WebsiteWhatsAppWidget';
import { initLandingInteractions } from './landingInteractions';
import '../styles/landing.css';

export function LeadManagementFeaturePage() {
  useEffect(() => {
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('js');
    const cleanup = initLandingInteractions();
    return () => {
      document.body.classList.remove('landing-page-active');
      cleanup();
    };
  }, []);

  const featureSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RealSalePro Lead Management Software",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web & Mobile PWA",
    "description": "Real estate lead management software with instant webhook capture, automatic lead distribution, pipeline visualization, and follow-up tracking.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  return (
    <>
      <SEOHead
        title="Real Estate Lead Management Software & Sales CRM | RealSalePro"
        description="Supercharge lead capture and follow-ups with RealSalePro's real estate lead management software. Auto-sync Meta, Google & portal leads, track pipeline stages and close faster."
        canonicalUrl="https://realsalepro.com/features/lead-management"
        keywords="real estate lead management software, real estate sales crm, real estate client management software, real estate crm features, lead management for real estate"
        jsonLd={featureSchema}
      />

      {/* SVG SPRITE */}
      <svg xmlns="http://www.w3.org/2000/svg" className="sprite" aria-hidden="true">
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
        <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></symbol>
        <symbol id="i-kanban" viewBox="0 0 24 24"><rect x="3.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="10" rx="1.5"/><rect x="15.5" y="4" width="5" height="13" rx="1.5"/></symbol>
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
            <Link to="/features/lead-management" className="is-active" style={{ color: 'var(--mint-bright)' }}>Lead Management</Link>
            <Link to="/crm-for-real-estate-brokers">For Brokers</Link>
            <Link to="/real-estate-crm-india">India Edition</Link>
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
          <Link to="/features/lead-management" style={{ color: 'var(--mint-bright)' }}>Lead Management</Link>
          <Link to="/crm-for-real-estate-brokers">For Brokers</Link>
          <Link to="/real-estate-crm-india">India Edition</Link>
          <Link to="/free-real-estate-crm">Free CRM (1,000 Leads)</Link>
          <Link to="/templates/real-estate-crm-excel-template">Free Excel Template</Link>
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
                Lead Capture &amp; Conversion Engine
                <span className="eyebrow__new">30s Auto-Sync</span>
              </p>

              <h1 className="hero__title" data-reveal data-reveal-delay="80">
                Capture, qualify and<br />convert leads <em>faster</em>.
              </h1>

              <p className="hero__lede" data-reveal data-reveal-delay="160">
                Never let an eager property buyer slip through the cracks. RealSalePro automatically captures leads from Meta, Google, Magicbricks and WhatsApp, 
                assigns them to active executives, and schedules instant follow-ups. Free up to <strong>1,000 leads</strong>.
              </p>

              <div className="hero__cta" data-reveal data-reveal-delay="240" style={{ marginTop: '34px', marginBottom: '24px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Try lead management free</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <a className="btn btn--ghost btn--lg" href="#pipeline-stages">
                  <span>See 5-stage lifecycle</span>
                </a>
              </div>

              <ul className="hero__facts" data-reveal data-reveal-delay="320" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.14)' }}>
                <li><b>30s</b><span>Lead sync speed</span></li>
                <li><b>391%</b><span>Higher conversions</span></li>
                <li><b>Zero</b><span>Duplicate calls</span></li>
              </ul>
            </div>

            {/* Visual Pipeline */}
            <div className="hero__visual" data-reveal data-reveal-delay="200">
              <div className="stage">
                <div className="stage__label"><span></span> Automated Lead Kanban</div>

                <div className="app">
                  <div className="app__bar">
                    <span className="app__dots"><i></i><i></i><i></i></span>
                    <span className="app__url">app.realsalepro.com / lead-pipeline</span>
                    <span className="app__live"><i></i> Realtime Pipeline</span>
                  </div>
                  <div className="app__body">
                    <div className="app__main" style={{ padding: '24px' }}>
                      <div className="app__funnel">
                        <div className="funnel__row">
                          <span className="funnel__name">1. Raw Leads (Meta &amp; Portals)</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '95%' }}></span></div>
                          <span className="funnel__val">240</span>
                        </div>
                        <div className="funnel__row">
                          <span className="funnel__name">2. Contacted &amp; Qualified</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '70%' }}></span></div>
                          <span className="funnel__val">168</span>
                        </div>
                        <div className="funnel__row">
                          <span className="funnel__name">3. Site Visit Scheduled</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '42%' }}></span></div>
                          <span className="funnel__val">102</span>
                        </div>
                        <div className="funnel__row">
                          <span className="funnel__name">4. Negotiation &amp; Token</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '22%' }}></span></div>
                          <span className="funnel__val">52</span>
                        </div>
                        <div className="funnel__row">
                          <span className="funnel__name">5. Booking Closed (Sale)</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '12%' }}></span></div>
                          <span className="funnel__val">28</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ LEAD LIFECYCLE (DARK BENTO) ============ */}
        <section className="section section--dark" id="pipeline-stages">
          <div className="container">
            <header className="sec-head">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">01</span> The 5-Stage Engine</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                How RealSalePro turns ad clicks into <em>token cheques</em>.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                A structured funnel built specifically to eliminate lead drop-offs between inquiry, site visit and token booking.
              </p>
            </header>

            <div className="feature-grid-symmetric" data-reveal data-reveal-delay="180">
              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Step 1 · Instant Capture</span>
                <h3 className="feature-card-clean__h">Sub-30-second webhook ingestion</h3>
                <p className="feature-card-clean__p">
                  Connect Facebook Lead Ads, Google Ads, Magicbricks, and WhatsApp. 
                  The moment a user fills a form, their details populate your CRM with source tags, campaign names, and UTM parameters.
                  Built natively for <Link to="/real-estate-crm-india" style={{ color: 'var(--mint-bright)', textDecoration: 'underline' }}>Indian real estate portals</Link>.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Step 2 · Deduplication</span>
                <h3 className="feature-card-clean__h">Intelligent phone matching</h3>
                <p className="feature-card-clean__p">
                  Standardizes 10-digit Indian numbers. If a customer inquires via both Facebook and Magicbricks, 
                  their history merges into one single card to prevent embarrassing duplicate calls.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Step 3 · Smart Routing</span>
                <h3 className="feature-card-clean__h">Round-robin assignment</h3>
                <p className="feature-card-clean__p">
                  Distribute incoming inquiries fairly among your sales executives and telecallers based on project specialty, budget, or active status.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Step 4 · Follow-up Cadence</span>
                <h3 className="feature-card-clean__h">Automated daily alerts</h3>
                <p className="feature-card-clean__p">
                  Never forget a promised callback. RealSalePro notifies executives each morning with their scheduled site visits and pending follow-ups.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Step 5 · Site Visit Dispatch</span>
                <h3 className="feature-card-clean__h">GPS Route Pins &amp; Cab Driver Sync</h3>
                <p className="feature-card-clean__p">
                  Schedule client walkthroughs, send Google Maps location pins directly on WhatsApp, and capture real-time visitor feedback on mobile.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Step 6 · Token Conversion</span>
                <h3 className="feature-card-clean__h">1-Click sale &amp; invoice creation</h3>
                <p className="feature-card-clean__p">
                  When a token deposit is logged, the lead automatically converts into an active sale record with commission, unit locking, and invoice calculation.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ============ LEAD SCORING & ANTI-LEAKAGE (PAPER SECTION) ============ */}
        <section className="section section--paper">
          <div className="container">
            <header className="sec-head sec-head--center">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">02</span> Pipeline Intelligence</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                Focus on the 20% of buyers who <em>actually buy</em>.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Intelligent lead temperature scoring and phone number protection keep your sales team hyper-productive and your database secure.
              </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginTop: '48px' }}>
              <div style={{ padding: '36px', borderRadius: '24px', background: '#fff', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 20px 50px rgba(10,32,24,0.06)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lead Temperature</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, margin: '12px 0 16px', color: '#0a2018' }}>Hot, Warm &amp; Cold Prioritization</h3>
                <p style={{ color: 'var(--muted-light)', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '16px' }}>
                  Filter your database in 1 click to show only prospects who completed a site visit or asked for payment schedules. Stop wasting time on unqualified window shoppers.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>Hot: Visit Completed</span>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>Warm: Brochure Sent</span>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(100,116,139,0.1)', color: '#475569' }}>Cold: Follow up in 30d</span>
                </div>
              </div>

              <div style={{ padding: '36px', borderRadius: '24px', background: '#fff', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 20px 50px rgba(10,32,24,0.06)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data Security</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, margin: '12px 0 16px', color: '#0a2018' }}>Role-Based Phone Number Masking</h3>
                <p style={{ color: 'var(--muted-light)', fontSize: '14.5px', lineHeight: 1.6, marginBottom: '16px' }}>
                  Only administrators see full customer phone numbers. Telecallers and field executives can call directly through the web dialer, preventing contact book theft — a critical shield for <Link to="/crm-for-real-estate-brokers" style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline' }}>brokers &amp; channel partners</Link>.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#059669' }}>Staff View: +91 98765 •••••</span>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#059669' }}>Admin View: Full Number</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ RELATED SOLUTIONS SEO CLUSTER ============ */}
        <RelatedSolutionsCluster currentPath="/features/lead-management" />

        {/* ============ FINAL CTA ============ */}
        <section className="cta" id="demo">
          <div className="cta__bg" aria-hidden="true"></div>
          <div className="container">
            <div className="cta__card" data-reveal style={{ textAlign: 'center' }}>
              <p className="eyebrow eyebrow--mint" style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto' }}>
                <span className="eyebrow__dot"></span> Free forever plan
              </p>
              <h2 style={{ textAlign: 'center', marginTop: '22px' }}>
                Take control of your<br /><em>lead pipeline today</em>.
              </h2>
              <p className="cta__lede" style={{ textAlign: 'center', margin: '22px auto 0', maxWidth: '580px' }}>
                Join 50+ real-estate developers who trust RealSalePro. Start free up to 1,000 leads — no card, no catch.
              </p>
              <div className="cta__actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '32px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Start free — no card needed</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <Link className="btn btn--ghost btn--lg" to="/templates/real-estate-crm-excel-template">
                  <span>Download Excel template</span>
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
              <Link to="/features/lead-management">Lead Management</Link>
              <Link to="/crm-for-real-estate-brokers">CRM for Brokers</Link>
              <Link to="/real-estate-crm-india">India Real Estate CRM</Link>
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

      {/* RealSalePro Official In-House WhatsApp Assistant */}
      <WebsiteWhatsAppWidget />
    </>
  );
}

