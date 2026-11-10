import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { RelatedSolutionsCluster } from '../components/seo/RelatedSolutionsCluster';
import { initLandingInteractions } from './landingInteractions';
import '../styles/landing.css';

export function BrokersCRMPage() {
  useEffect(() => {
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('js');
    const cleanup = initLandingInteractions();
    return () => {
      document.body.classList.remove('landing-page-active');
      cleanup();
    };
  }, []);

  const brokerSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RealSalePro for Real Estate Brokers & Agents",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Mobile (PWA)",
    "description": "Real estate CRM software designed for property dealers, independent brokers, and channel partners in India. Track client inquiries, site visits, and commissions.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    }
  };

  return (
    <>
      <SEOHead
        title="Real Estate Broker CRM Software for Agents & Channel Partners | RealSalePro"
        description="The #1 CRM built for real estate brokers, channel partners & property agents in India. Track site visits, WhatsApp follow-ups, and commissions. Free up to 1,000 leads."
        canonicalUrl="https://realsalepro.com/crm-for-real-estate-brokers"
        keywords="real estate broker crm, crm for real estate agents, real estate agent management software, best crm for real estate brokers, best crm for real estate agents, channel partner crm real estate"
        jsonLd={brokerSchema}
      />

      {/* SVG SPRITE */}
      <svg xmlns="http://www.w3.org/2000/svg" className="sprite" aria-hidden="true">
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></symbol>
        <symbol id="i-arrow-ur" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
        <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.7c2 .7 3 2.7 3 5.3"/></symbol>
        <symbol id="i-phone" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></symbol>
        <symbol id="i-building" viewBox="0 0 24 24"><path d="M4 21V7l8-4v18M12 21h8V10l-8-3"/><path d="M7.5 9.5h1M7.5 13h1M7.5 16.5h1M15.5 12.5h1M15.5 16h1M2.5 21h19"/></symbol>
        <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></symbol>
        <symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12.5 16V8M17 16v-8.5"/></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3 5 6v6c0 4.2 3 7.5 7 9 4-1.5 7-4.8 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></symbol>
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
            <Link to="/crm-for-real-estate-brokers" className="is-active" style={{ color: 'var(--mint-bright)' }}>For Brokers</Link>
            <Link to="/real-estate-crm-india">India Edition</Link>
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
          <Link to="/crm-for-real-estate-brokers" style={{ color: 'var(--mint-bright)' }}>For Brokers</Link>
          <Link to="/real-estate-crm-india">India Edition</Link>
          <Link to="/features/lead-management">Lead Management</Link>
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
                Built for Channel Partners &amp; Brokers
                <span className="eyebrow__new">Zero Data Leakage</span>
              </p>

              <h1 className="hero__title" data-reveal data-reveal-delay="80">
                The real estate CRM<br />built for <em>brokers &amp; agents</em>.
              </h1>

              <p className="hero__lede" data-reveal data-reveal-delay="160">
                Stop juggling 500 WhatsApp chats, lost call sheets, and commission arguments. 
                RealSalePro helps property brokers and channel partners organize buyer inquiries, book verified site visits, 
                and protect client numbers — <strong>100% free up to 1,000 leads</strong>.
              </p>

              <div className="hero__cta" data-reveal data-reveal-delay="240" style={{ marginTop: '34px', marginBottom: '24px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Start free for your agency</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <a className="btn btn--ghost btn--lg" href="#broker-tools">
                  <span>See broker tools</span>
                </a>
              </div>

              <ul className="hero__facts" data-reveal data-reveal-delay="320" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.14)' }}>
                <li><b>₹0</b><span>Free to start</span></li>
                <li><b>1,000</b><span>Client capacity</span></li>
                <li><b>100%</b><span>Number masking</span></li>
              </ul>
            </div>

            {/* Broker App Visual */}
            <div className="hero__visual" data-reveal data-reveal-delay="200">
              <div className="stage">
                <div className="stage__label"><span></span> Channel Partner Desk</div>

                <div className="app">
                  <div className="app__bar">
                    <span className="app__dots"><i></i><i></i><i></i></span>
                    <span className="app__url">app.realsalepro.com / broker-desk</span>
                    <span className="app__live"><i></i> Live CP Desk</span>
                  </div>
                  <div className="app__body">
                    <div className="app__main" style={{ padding: '24px' }}>
                      <div className="app__head" style={{ marginBottom: '20px' }}>
                        <div>
                          <p className="app__crumb">Brokerage Pipeline · Apex Realty Partners</p>
                          <p className="app__title">Client Pipeline &amp; Site Visits</p>
                        </div>
                        <div className="app__head-actions">
                          <span className="chip chip--solid"><svg className="icon"><use href="#i-plus"/></svg>Quick Client</span>
                        </div>
                      </div>

                      <div className="app__kpis" style={{ marginBottom: '22px' }}>
                        <div className="kpi">
                          <span>Pending Visits</span>
                          <b>18 Visits</b>
                          <em className="up">This Weekend</em>
                        </div>
                        <div className="kpi">
                          <span>Pipeline Value</span>
                          <b>₹14.2 Cr</b>
                          <em className="up">32 Hot Buyers</em>
                        </div>
                        <div className="kpi">
                          <span>Expected Brok.</span>
                          <b>₹28.4 L</b>
                          <em className="up">2% Avg</em>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0 }}>Vikram Singhania (3 BHK Luxury)</p>
                            <p style={{ fontSize: '11px', color: 'var(--muted-dark)', margin: 0 }}>Godrej Palm · Sat 11:30 AM · Cab Dispatched</p>
                          </div>
                          <span className="chip chip--ghost" style={{ color: 'var(--mint-bright)', borderColor: 'rgba(0,229,118,0.3)' }}>Visit Confirmed</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0 }}>Ananya Sen (2 BHK Investment)</p>
                            <p style={{ fontSize: '11px', color: 'var(--muted-dark)', margin: 0 }}>Prestige City · Token Advance ₹50,000</p>
                          </div>
                          <span className="chip chip--solid" style={{ background: 'rgba(0,229,118,0.2)', color: 'var(--mint-bright)' }}>Token Booked</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ BROKER PAIN POINTS SOLVED (DARK BENTO) ============ */}
        <section className="section section--dark" id="broker-tools">
          <div className="container">
            <header className="sec-head">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">01</span> Broker Operating System</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                Built to solve the 5 biggest headaches of <em>real estate brokers</em>.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Traditional CRMs are designed for corporate software companies, not for agents standing in dusty parking lots at project sites.
              </p>
            </header>

            <div className="bento" data-reveal data-reveal-delay="180">
              <article className="bento__card bento__card--wide">
                <div className="bento__copy">
                  <span className="bento__tag">Lead Protection</span>
                  <h3 className="bento__h">Stop staff from stealing your client book</h3>
                  <p className="bento__p">
                    When an employee leaves, your database walks out with them in spreadsheets. 
                    RealSalePro's built-in phone number masking hides the last 5 digits so telecallers can dial out without ever copying customer numbers.
                    Still using manual sheets? <Link to="/templates/real-estate-crm-excel-template" style={{ color: 'var(--mint-bright)', textDecoration: 'underline' }}>See why Excel leaks buyer data</Link>.
                  </p>
                </div>
              </article>

              <article className="bento__card">
                <div className="bento__copy">
                  <span className="bento__tag">WhatsApp Fast Dial</span>
                  <h3 className="bento__h">1-Click WhatsApp follow-ups</h3>
                  <p className="bento__p">
                    Send floor plans, payment schedules, and site location pins directly to client WhatsApp numbers with pre-made broker scripts.
                  </p>
                </div>
              </article>

              <article className="bento__card">
                <div className="bento__copy">
                  <span className="bento__tag">Site Visits</span>
                  <h3 className="bento__h">Coordinated site walkthroughs</h3>
                  <p className="bento__p">
                    Log driver pickups, model apartment visits, and buyer reactions in real time so you always know which buyers are ready to close.
                  </p>
                </div>
              </article>

              <article className="bento__card">
                <div className="bento__copy">
                  <span className="bento__tag">Developer Sync</span>
                  <h3 className="bento__h">Proof of client registration</h3>
                  <p className="bento__p">
                    Timestamped logs provide instant proof when registering your client with developer sales galleries, protecting your brokerage fees.
                  </p>
                </div>
              </article>

              <article className="bento__card">
                <div className="bento__copy">
                  <span className="bento__tag">Free Forever</span>
                  <h3 className="bento__h">Zero upfront cost for your agency</h3>
                  <p className="bento__p">
                    Start with up to 1,000 client contacts and 5 agent accounts for ₹0. Explore our <Link to="/free-real-estate-crm" style={{ color: 'var(--mint-bright)', textDecoration: 'underline' }}>100% Free CRM Plan</Link> with zero time limits.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============ BROKER WORKFLOW (PAPER SECTION) ============ */}
        <section className="section section--paper">
          <div className="container">
            <header className="sec-head sec-head--center">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">02</span> The Deal Pipeline</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                From inquiry to <em>brokerage commission</em>.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                A simple 5-step workflow customized for property agents and channel partners in India.
              </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '48px' }}>
              <div style={{ padding: '28px 24px', background: '#fff', borderRadius: '20px', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 12px 30px rgba(10,32,24,0.04)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Step 01</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, margin: '8px 0', color: '#0a2018' }}>Capture &amp; Tag</h4>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: 1.6 }}>
                  Lead auto-syncs from Meta or portal and is tagged with budget, location &amp; configuration. Explore our <Link to="/features/lead-management" style={{ color: '#059669', textDecoration: 'underline' }}>lead management workflow</Link> &amp; <Link to="/real-estate-crm-india" style={{ color: '#059669', textDecoration: 'underline' }}>India portal integrations</Link>.
                </p>
              </div>

              <div style={{ padding: '28px 24px', background: '#fff', borderRadius: '20px', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 12px 30px rgba(10,32,24,0.04)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Step 02</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, margin: '8px 0', color: '#0a2018' }}>Instant Outreach</h4>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: 1.6 }}>Send WhatsApp brochure and project video walkthrough in 1 click. Call within 5 minutes.</p>
              </div>

              <div style={{ padding: '28px 24px', background: '#fff', borderRadius: '20px', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 12px 30px rgba(10,32,24,0.04)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Step 03</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, margin: '8px 0', color: '#0a2018' }}>Site Visit Pin</h4>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: 1.6 }}>Dispatch visit with Google route map and sample flat walkthrough confirmation.</p>
              </div>

              <div style={{ padding: '28px 24px', background: '#fff', borderRadius: '20px', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 12px 30px rgba(10,32,24,0.04)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Step 04</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, margin: '8px 0', color: '#0a2018' }}>Token Lock</h4>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: 1.6 }}>Record earnest deposit cheque/NEFT and lock unit inventory directly on site.</p>
              </div>

              <div style={{ padding: '28px 24px', background: '#fff', borderRadius: '20px', border: '2px solid rgba(16,185,129,0.3)', boxShadow: '0 16px 40px rgba(16,185,129,0.08)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Step 05</span>
                <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, margin: '8px 0', color: '#0a2018' }}>Commission Paid</h4>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: 1.6 }}>Track agreement registration and developer payout invoices without disputes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ RELATED SOLUTIONS SEO CLUSTER ============ */}
        <RelatedSolutionsCluster currentPath="/crm-for-real-estate-brokers" />

        {/* ============ FINAL CTA ============ */}
        <section className="cta" id="demo">
          <div className="cta__bg" aria-hidden="true"></div>
          <div className="container">
            <div className="cta__card" data-reveal style={{ textAlign: 'center' }}>
              <p className="eyebrow eyebrow--mint" style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto' }}>
                <span className="eyebrow__dot"></span> Free forever plan
              </p>
              <h2 style={{ textAlign: 'center', marginTop: '22px' }}>
                Ready to scale your<br /><em>brokerage agency?</em>
              </h2>
              <p className="cta__lede" style={{ textAlign: 'center', margin: '22px auto 0', maxWidth: '580px' }}>
                Join thousands of Indian real estate brokers and channel partners who close deals faster with RealSalePro.
              </p>
              <div className="cta__actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '32px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Start free for your agency</span><svg className="icon"><use href="#i-arrow"/></svg>
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
                <a href="https://wa.me/919525230232" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><svg className="icon icon--fill"><use href="#i-whatsapp"/></svg></a>
              </div>
            </div>

            <div className="footer__col">
              <h3>Platform</h3>
              <Link to="/crm-for-real-estate-brokers">CRM for Brokers</Link>
              <Link to="/real-estate-crm-india">India Real Estate CRM</Link>
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
              <a href="tel:+919525230232">+91 95252 30232</a>
              <a className="footer__wa" href="https://wa.me/919525230232" target="_blank" rel="noopener noreferrer">
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

