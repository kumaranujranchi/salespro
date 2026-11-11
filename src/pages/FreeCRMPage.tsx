import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { RelatedSolutionsCluster } from '../components/seo/RelatedSolutionsCluster';
import { WebsiteWhatsAppWidget } from '../components/whatsapp/WebsiteWhatsAppWidget';
import { initLandingInteractions } from './landingInteractions';
import '../styles/landing.css';

export function FreeCRMPage() {
  const [teamSize, setTeamSize] = useState<number>(3);
  const annualSavings = teamSize * 36000;

  useEffect(() => {
    // 1. Activate landing page scoped CSS and reveal animations
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('js');

    // 2. Initialize interactive UI components
    const cleanupInteractions = initLandingInteractions();

    return () => {
      document.body.classList.remove('landing-page-active');
      cleanupInteractions();
    };
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is RealSalePro really a 100% free CRM for real estate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! RealSalePro offers a genuine Free-Forever plan for small real estate teams, independent brokers, and realtors. You get full access to manage up to 1,000 active leads, up to 5 user accounts, automated Meta & WhatsApp lead sync, pipeline management, and site visit logs with zero credit card required."
        }
      },
      {
        "@type": "Question",
        "name": "What is the catch? Why is RealSalePro free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "There is no catch or hidden fee. We believe independent brokers and small teams shouldn't be charged ₹15,000+ per month before closing deals. RealSalePro only charges when your business scales beyond 1,000 leads, where our Pro Plan is just ₹1,000/month for up to 2,00,000 leads."
        }
      },
      {
        "@type": "Question",
        "name": "What happens when I reach 1,000 leads?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can either archive or delete older leads to stay on the 100% Free Forever plan, or easily upgrade to the Pro Plan for ₹1,000/month which gives you 2,00,000 leads capacity and unlimited users."
        }
      },
      {
        "@type": "Question",
        "name": "Can I export my leads anytime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, absolutely. You have 100% ownership of your database. You can export your entire contact list and follow-up notes to CSV/Excel in one click at any time."
        }
      },
      {
        "@type": "Question",
        "name": "Can my sales executives copy or steal my client database?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. RealSalePro includes tenant-level phone number masking where the last 5 digits of customer numbers are hidden for non-admin executives, preventing database theft by staff."
        }
      }
    ]
  };

  const pageSchema = {
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
            "name": "Free Real Estate CRM",
            "item": "https://realsalepro.com/free-real-estate-crm"
          }
        ]
      },
      faqSchema
    ]
  };

  return (
    <>
      <SEOHead
        title="Free Real Estate CRM Software for Brokers | RealSalePro"
        description="100% Free real estate CRM for Indian brokers and developers. Auto-sync Meta and WhatsApp leads, manage property pipeline and site visits with zero card."
        canonicalUrl="https://realsalepro.com/free-real-estate-crm"
        keywords="free crm for real estate, free crm for realtors, best free crm for real estate, free real estate crm software, crm for real estate agents free, cheap crm for real estate, real estate crm software free download, best crm for real estate free"
        jsonLd={pageSchema}
      />

      {/* SVG SPRITE */}
      <svg xmlns="http://www.w3.org/2000/svg" className="sprite" aria-hidden="true">
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></symbol>
        <symbol id="i-arrow-ur" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
        <symbol id="i-play" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
        <symbol id="i-home" viewBox="0 0 24 24"><path d="m4 10.5 8-7 8 7V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5Z"/><path d="M9.5 21v-6h5v6"/></symbol>
        <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.7c2 .7 3 2.7 3 5.3"/></symbol>
        <symbol id="i-kanban" viewBox="0 0 24 24"><rect x="3.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="10" rx="1.5"/><rect x="15.5" y="4" width="5" height="13" rx="1.5"/></symbol>
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
            <Link to="/free-real-estate-crm" className="is-active" style={{ color: 'var(--mint-bright)' }}>Free CRM</Link>
            <Link to="/templates/real-estate-crm-excel-template">Excel Template</Link>
            <a href="#features">Free Features</a>
            <a href="#why-free">Why Free?</a>
            <a href="#comparison">Compare vs Paid</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav__actions">
            <Link className="nav__login" to="/login">Log in</Link>
            <Link className="btn btn--primary btn--sm" to="/register">
              <span>Claim free account</span><svg className="icon"><use href="#i-arrow"/></svg>
            </Link>
            <button className="nav__toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
              <svg className="icon"><use href="#i-menu"/></svg>
            </button>
          </div>
        </div>

        <div className="nav__mobile" id="mobileMenu" hidden>
          <Link to="/free-real-estate-crm" style={{ color: 'var(--mint-bright)' }}>Free CRM</Link>
          <Link to="/templates/real-estate-crm-excel-template">Free Excel Template</Link>
          <a href="#features">Free Features</a>
          <a href="#why-free">Why Free?</a>
          <a href="#comparison">Compare vs Paid</a>
          <a href="#faq">FAQ</a>
          <Link to="/login">Log in</Link>
          <Link className="btn btn--primary" to="/register">Claim free account <svg className="icon"><use href="#i-arrow"/></svg></Link>
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
                100% free real estate CRM
                <span className="eyebrow__new">No card, ever</span>
              </p>

              <h1 className="hero__title" data-reveal data-reveal-delay="80">
                The free real-estate<br />CRM built to <em>close</em>.
              </h1>

              <p className="hero__lede" data-reveal data-reveal-delay="160">
                Stop paying ₹15,000+ every month for bloated corporate software. RealSalePro gives you automatic Meta & WhatsApp lead sync, 
                a calm visual pipeline, site visit dispatching, and phone number masking — 
                <strong> 100% free forever up to 1,000 leads</strong>.
              </p>

              <div className="hero__cta" data-reveal data-reveal-delay="240" style={{ marginTop: '34px', marginBottom: '24px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Start free — no card</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <a className="btn btn--ghost btn--lg" href="#comparison">
                  <span>Compare vs paid CRMs</span>
                </a>
              </div>

              <ul className="hero__facts" data-reveal data-reveal-delay="320" style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255, 255, 255, 0.14)' }}>
                <li><b>₹0</b><span>Free forever plan</span></li>
                <li><b>1,000</b><span>Lead capacity</span></li>
                <li><b>4.8<span className="star">★</span></b><span>1,056 reviews</span></li>
              </ul>

              <div className="hero__proof" data-reveal data-reveal-delay="380">
                <span className="avatars" aria-hidden="true">
                  <i style={{ background: 'linear-gradient(135deg,#34d399,#059669)' }}>RS</i>
                  <i style={{ background: 'linear-gradient(135deg,#f0c987,#c98b3c)' }}>AK</i>
                  <i style={{ background: 'linear-gradient(135deg,#8fb7ff,#3f6fd8)' }}>NP</i>
                  <i style={{ background: 'linear-gradient(135deg,#c0f08a,#79b131)' }}>VJ</i>
                </span>
                <p>Trusted by <strong>10,000+ users</strong> and 50+ developer teams across India.</p>
              </div>
            </div>

            {/* App Mockup Visual */}
            <div className="hero__visual" data-reveal data-reveal-delay="200">
              <div className="stage">
                <div className="stage__label"><span></span> 100% Free Forever Tier</div>

                <div className="app" id="heroApp">
                  <div className="app__bar">
                    <span className="app__dots"><i></i><i></i><i></i></span>
                    <span className="app__url">app.realsalepro.com / free-plan</span>
                    <span className="app__live"><i></i> Free Active</span>
                  </div>
                  <div className="app__body">
                    <aside className="app__rail" aria-hidden="true">
                      <span className="rail__logo">R</span>
                      <span className="rail__ic is-on"><svg className="icon"><use href="#i-home"/></svg></span>
                      <span className="rail__ic"><svg className="icon"><use href="#i-users"/></svg></span>
                      <span className="rail__ic"><svg className="icon"><use href="#i-kanban"/></svg></span>
                      <span className="rail__ic"><svg className="icon"><use href="#i-building"/></svg></span>
                      <span className="rail__ic"><svg className="icon"><use href="#i-target"/></svg></span>
                      <span className="rail__ic"><svg className="icon"><use href="#i-chart"/></svg></span>
                      <span className="rail__spacer"></span>
                      <span className="rail__avatar">FP</span>
                    </aside>

                    <div className="app__main">
                      <div className="app__head">
                        <div>
                          <p className="app__crumb">Workspace · Free Forever Account</p>
                          <p className="app__title">Lead pipeline</p>
                        </div>
                        <div className="app__head-actions">
                          <span className="chip chip--ghost">Up to 1,000 leads</span>
                          <span className="chip chip--solid"><svg className="icon"><use href="#i-plus"/></svg>Add lead</span>
                        </div>
                      </div>

                      <div className="app__kpis">
                        <div className="kpi">
                          <span>Monthly Fee</span>
                          <b>₹0</b>
                          <em className="up"><svg className="icon"><use href="#i-check"/></svg>Active</em>
                        </div>
                        <div className="kpi">
                          <span>Team Accounts</span>
                          <b>5 Users</b>
                          <em className="up">Included</em>
                        </div>
                        <div className="kpi">
                          <span>Meta & WhatsApp</span>
                          <b>Real-time</b>
                          <em className="up">30s Sync</em>
                        </div>
                      </div>

                      <div className="app__funnel">
                        <div className="funnel__row">
                          <span className="funnel__name">New inquiry</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '92%' }}></span></div>
                          <span className="funnel__val">128</span>
                        </div>
                        <div className="funnel__row">
                          <span className="funnel__name">Contacted</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '68%' }}></span></div>
                          <span className="funnel__val">74</span>
                        </div>
                        <div className="funnel__row">
                          <span className="funnel__name">Site visit</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '45%' }}></span></div>
                          <span className="funnel__val">39</span>
                        </div>
                        <div className="funnel__row">
                          <span className="funnel__name">Token booked</span>
                          <div className="funnel__track"><span className="funnel__bar" style={{ width: '22%' }}></span></div>
                          <span className="funnel__val">12</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ WHAT'S INCLUDED (DARK BENTO SECTION) ============ */}
        <section className="section section--dark" id="features">
          <div className="container">
            <header className="sec-head">
              <p className="eyebrow" data-reveal><span class="eyebrow__no">01</span> Free Toolkit</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                Everything you need to <em>run the floor</em>. 100% free.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Not a 7-day teaser or stripped-down demo. You get the whole real-estate sales machine with zero countdown clock.
              </p>
            </header>

            <div className="feature-grid-symmetric" data-reveal data-reveal-delay="180">
              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Core Capacity</span>
                <h3 className="feature-card-clean__h">Up to 1,000 active leads with zero expiry</h3>
                <p className="feature-card-clean__p">
                  Store complete contact cards, property requirements, budget brackets, and interaction histories. 
                  Full cloud storage with zero time cutoff.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Automation</span>
                <h3 className="feature-card-clean__h">Meta &amp; WhatsApp webhooks</h3>
                <p className="feature-card-clean__p">
                  Inquiries from Facebook Ads, Instagram, and web portals arrive in your pipeline within 30 seconds. Powered by our <Link to="/features/lead-management" style={{ color: 'var(--mint-bright)', textDecoration: 'underline' }}>real estate lead management engine</Link>.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Visual Pipeline</span>
                <h3 className="feature-card-clean__h">Drag-and-drop Kanban deal tracking</h3>
                <p className="feature-card-clean__p">
                  Move buyer inquiries seamlessly from New Lead to Site Visit to Token Advance. Monitor conversion drop-offs and sales team velocity at a glance.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Team Seats</span>
                <h3 className="feature-card-clean__h">Up to 5 team member logins</h3>
                <p className="feature-card-clean__p">
                  Add telecallers, sales executives, and site staff with separate roles, permission controls, and individual daily target tracking.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Field Operations</span>
                <h3 className="feature-card-clean__h">Site visit dispatching &amp; route pins</h3>
                <p className="feature-card-clean__p">
                  Send Google route pins to clients via WhatsApp, track driver status, and record on-site walkthrough feedback in real time.
                </p>
              </article>

              <article className="feature-card-clean">
                <span className="feature-card-clean__tag">Data Security</span>
                <h3 className="feature-card-clean__h">Staff phone number masking</h3>
                <p className="feature-card-clean__p">
                  Prevent telecallers from stealing your client database by hiding the last 5 digits — essential protection for <Link to="/crm-for-real-estate-brokers" style={{ color: 'var(--mint-bright)', textDecoration: 'underline' }}>brokers &amp; channel partners</Link>.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ============ WHY IS IT FREE (PAPER PRICING SECTION) ============ */}
        <section className="section section--paper" id="why-free">
          <div className="container">
            <header className="sec-head sec-head--center">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">02</span> Honest Philosophy</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                Free forever. Pro when you <em>scale</em>.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Why is RealSalePro free? Because small agencies shouldn't pay ₹15,000/month before closing their first deal.
              </p>
            </header>

            <div className="price-grid">
              <article className="price" data-reveal style={{ padding: '32px 30px 38px' }}>
                <div className="price__top">
                  <span className="price__name">Free Forever</span>
                  <span className="price__badge">No card</span>
                </div>
                <div className="price__amount"><b>₹0</b><em>forever</em></div>
                <p className="price__desc">For small teams getting organised — the whole product, not a teaser.</p>
                <Link className="btn btn--outline btn--block" to="/register" style={{ marginTop: '22px', marginBottom: '26px' }}>
                  Get started free <svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <ul className="price__list" style={{ display: 'grid', gap: '13px', margin: 0, padding: 0 }}>
                  <li><svg className="icon"><use href="#i-check"/></svg> All pro features included</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Up to 1,000 leads</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Up to 5 users</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Real-time analytics</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Standard email support</li>
                </ul>
              </article>

              <article className="price price--pro" data-reveal data-reveal-delay="80" style={{ padding: '32px 30px 38px' }}>
                <div className="price__top">
                  <span className="price__name">Pro</span>
                  <span className="price__badge price__badge--solid">Most popular</span>
                </div>
                <div className="price__amount">
                  <b>₹1,000</b><em>/month</em>
                </div>
                <p className="price__desc">Billed ₹12,000 annually — upgrade only when volume grows.</p>
                <Link className="btn btn--primary btn--block" to="/pricing" style={{ marginTop: '22px', marginBottom: '26px' }}>
                  Upgrade to Pro <svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <ul className="price__list" style={{ display: 'grid', gap: '13px', margin: 0, padding: 0 }}>
                  <li><svg className="icon"><use href="#i-check"/></svg> Everything in Free</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Up to 2,00,000 leads</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Unlimited users</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> All lead integrations</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Priority email support</li>
                </ul>
              </article>

              <article className="price" data-reveal data-reveal-delay="160" style={{ padding: '32px 30px 38px' }}>
                <div className="price__top">
                  <span className="price__name">Custom</span>
                  <span className="price__badge">Enterprise</span>
                </div>
                <div className="price__amount price__amount--text"><b>Custom</b></div>
                <p className="price__desc">Bespoke limits, integrations and terms for large developer groups.</p>
                <a className="btn btn--outline btn--block" href="mailto:support@realsalepro.com?subject=Custom%20plan%20enquiry%20—%20RealSalePro" style={{ marginTop: '22px', marginBottom: '26px' }}>
                  Contact sales <svg className="icon"><use href="#i-arrow"/></svg>
                </a>
                <ul className="price__list" style={{ display: 'grid', gap: '13px', margin: 0, padding: 0 }}>
                  <li><svg className="icon"><use href="#i-check"/></svg> Custom lead limits</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Custom integrations</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Dedicated support manager</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Custom SLA guarantee</li>
                  <li><svg className="icon"><use href="#i-check"/></svg> Flexible billing options</li>
                </ul>
              </article>
            </div>

            <p className="price-fine" data-reveal style={{ marginTop: '48px', marginBottom: '16px', fontSize: '13px', textAlign: 'center' }}>
              No credit card required for the Free plan. 1-click CSV database export anytime.
            </p>
          </div>
        </section>

        {/* ============ COMPARISON MATRIX SECTION ============ */}
        <section className="section section--paper section--alt" id="comparison">
          <div className="container">
            <header className="sec-head sec-head--center">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">03</span> Comparison</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                RealSalePro Free vs <em>Legacy CRMs</em>
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                See how our ₹0 plan stacks up against tools that charge tens of thousands every month.
              </p>
            </header>

            <div style={{ overflowX: 'auto', borderRadius: '18px', background: '#fff', boxShadow: '0 20px 50px rgba(10,32,24,0.08)', border: '1px solid rgba(10,32,24,0.08)', marginBottom: '56px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14.5px' }}>
                <thead>
                  <tr style={{ background: '#f5f3ec', borderBottom: '1px solid rgba(10,32,24,0.1)', color: '#0a2018', textTransform: 'uppercase', fontSize: '11.5px', letterSpacing: '0.08em' }}>
                    <th style={{ padding: '18px 24px' }}>Feature</th>
                    <th style={{ padding: '18px 24px', color: '#059669', background: 'rgba(16,185,129,0.08)', fontWeight: 800 }}>RealSalePro Free</th>
                    <th style={{ padding: '18px 24px' }}>Sell.Do / LeadSquared</th>
                    <th style={{ padding: '18px 24px' }}>Excel / Spreadsheets</th>
                  </tr>
                </thead>
                <tbody style={{ color: '#0a2018' }}>
                  <tr style={{ borderBottom: '1px solid rgba(10,32,24,0.06)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>Monthly Cost</td>
                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#059669', background: 'rgba(16,185,129,0.04)' }}>₹0 / forever</td>
                    <td style={{ padding: '16px 24px', color: '#dc2626' }}>₹15,000 – ₹50,000/mo</td>
                    <td style={{ padding: '16px 24px' }}>Free (High manual labor)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(10,32,24,0.06)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>Credit Card Required</td>
                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#059669', background: 'rgba(16,185,129,0.04)' }}>No (Never asked)</td>
                    <td style={{ padding: '16px 24px' }}>Yes</td>
                    <td style={{ padding: '16px 24px' }}>No</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(10,32,24,0.06)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>Lead Capacity</td>
                    <td style={{ padding: '16px 24px', fontWeight: 800, background: 'rgba(16,185,129,0.04)' }}>Up to 1,000 Leads</td>
                    <td style={{ padding: '16px 24px' }}>Per-contact charges</td>
                    <td style={{ padding: '16px 24px' }}>Laggy above 1,000 rows</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(10,32,24,0.06)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>Meta &amp; WhatsApp Auto-Sync</td>
                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#059669', background: 'rgba(16,185,129,0.04)' }}>Included Free</td>
                    <td style={{ padding: '16px 24px' }}>Paid add-on</td>
                    <td style={{ padding: '16px 24px', color: '#dc2626' }}>None (Manual copy-paste)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(10,32,24,0.06)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>Site Visit &amp; Driver Logs</td>
                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#059669', background: 'rgba(16,185,129,0.04)' }}>Included Free</td>
                    <td style={{ padding: '16px 24px' }}>Extra module fees</td>
                    <td style={{ padding: '16px 24px', color: '#dc2626' }}>None</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>Staff Number Masking</td>
                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#059669', background: 'rgba(16,185,129,0.04)' }}>Included Free</td>
                    <td style={{ padding: '16px 24px' }}>Enterprise tier only</td>
                    <td style={{ padding: '16px 24px', color: '#dc2626' }}>Zero theft protection</td>
                  </tr>
                </tbody>
              </table>
              <p style={{ textAlign: 'center', padding: '16px 24px', margin: 0, borderTop: '1px solid rgba(10,32,24,0.06)', fontSize: '14px', color: 'var(--muted-light)', background: '#fbfaf7' }}>
                Still managing property leads manually? <Link to="/templates/real-estate-crm-excel-template" style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline' }}>Download our Free Real Estate CRM Excel Template</Link> or explore our <Link to="/real-estate-crm-india" style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline' }}>India real estate CRM edition</Link>.
              </p>
            </div>

            {/* Savings Calculator Widget */}
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '36px', background: '#fff', borderRadius: '24px', border: '1px solid rgba(10,32,24,0.08)', boxShadow: '0 20px 60px rgba(10,32,24,0.06)', textAlign: 'center' }}>
              <p className="eyebrow" style={{ color: '#059669', marginBottom: '10px' }}><span className="eyebrow__dot"></span> ROI Calculator</p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: '#0a2018', marginBottom: '14px' }}>
                See how much you save with RealSalePro Free
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--muted-light)', marginBottom: '24px' }}>
                Your Team Size: <strong style={{ color: '#059669', fontSize: '18px' }}>{teamSize} Users</strong>
              </p>
              <input
                type="range"
                min="1"
                max="5"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#059669', marginBottom: '24px', cursor: 'pointer' }}
              />
              <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(10,32,24,0.08)' }}>
                <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-light)', fontWeight: 700 }}>
                  Estimated Annual Savings
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 800, color: '#059669', margin: '6px 0' }}>
                  ₹{annualSavings.toLocaleString('en-IN')} <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted-light)' }}>/ year</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FAQ SECTION ============ */}
        <section className="section section--paper section--alt" id="faq">
          <div className="container faq-wrap">
            <header className="sec-head faq-head">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">04</span> FAQ</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">Got questions?<br />Good <em>answers</em>.</h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Can't find what you're looking for? <a href="mailto:support@realsalepro.com">Contact our team</a> — a human replies.
              </p>
            </header>

            <div className="faq" data-faq>
              <div className="faq__item" data-reveal>
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-1">
                  <span>Is RealSalePro really 100% free forever?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-1" aria-hidden="true">
                  <p>Yes! RealSalePro is 100% free forever for small teams. The Free plan supports up to 1,000 leads and up to 5 users, and includes pro features such as automated lead routing, pipeline visualisation and inventory tracking — without requiring any credit card details.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="40">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-2">
                  <span>What happens when I reach 1,000 leads?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-2" aria-hidden="true">
                  <p>You will receive a notification. You can either delete or archive old disqualified leads to maintain space under 1,000 leads for free, or upgrade to our Pro plan (₹1,000/month) for a massive 2,00,000 leads capacity and unlimited users.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="80">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-3">
                  <span>Can I import my existing leads from Excel or Google Sheets?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-3" aria-hidden="true">
                  <p>Yes! RealSalePro provides a simple CSV/Excel bulk import tool. You can upload thousands of leads in under 30 seconds with automatic duplicate phone number detection.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="120">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-4">
                  <span>Can I export my database if I ever want to leave?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-4" aria-hidden="true">
                  <p>100% yes. You own your data completely. You can export your entire database into Excel/CSV with all client notes and dates at any time with a single click.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="160">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-5">
                  <span>Does this free CRM work on mobile phones?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-5" aria-hidden="true">
                  <p>Yes. RealSalePro is built as a responsive mobile web app (PWA). Your executives can update site visit notes, call clients, and check floor inventory directly on their phones while on-site.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ RELATED SOLUTIONS SEO CLUSTER ============ */}
        <RelatedSolutionsCluster currentPath="/free-real-estate-crm" />

        {/* ============ FINAL CTA ============ */}
        <section className="cta" id="demo">
          <div className="cta__bg" aria-hidden="true"></div>
          <div className="container">
            <div className="cta__card" data-reveal style={{ textAlign: 'center' }}>
              <p className="eyebrow eyebrow--mint" style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto' }}>
                <span className="eyebrow__dot"></span> Free forever plan
              </p>
              <h2 style={{ textAlign: 'center', marginTop: '22px' }}>
                Ready to sell out your<br /><em>next project?</em>
              </h2>
              <p className="cta__lede" style={{ textAlign: 'center', margin: '22px auto 0', maxWidth: '580px' }}>
                Join 50+ real-estate developers who trust RealSalePro. Start free up to 1,000 leads — no card, no catch, set up in minutes.
              </p>
              <div className="cta__actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '32px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Start free — no card</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <Link className="btn btn--ghost btn--lg" to="/templates/real-estate-crm-excel-template">
                  <span>Download Excel template</span>
                </Link>
              </div>
              <ul className="cta__meta" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '12px 28px', marginTop: '36px', padding: 0, listStyle: 'none' }}>
                <li style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-dark)' }}>
                  <svg className="icon"><use href="#i-check"/></svg> Free forever plan
                </li>
                <li style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-dark)' }}>
                  <svg className="icon"><use href="#i-check"/></svg> No credit card
                </li>
                <li style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted-dark)' }}>
                  <svg className="icon"><use href="#i-check"/></svg> Import from Excel
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <div className="footer__brand">
              <img src="/assets/img/logo-light.png" alt="RealSalePro — Real Estate Sales & CRM Platform" width="190" height="40" style={{ height: '40px', width: 'auto', display: 'block' }} />
              <p>Empowering real-estate teams with intelligent tools and real-time insight. Built for the future of sales.</p>
              <div className="footer__social">
                <a href="https://www.facebook.com/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="RealSalePro on Facebook"><svg className="icon icon--fill"><use href="#i-facebook"/></svg></a>
                <a href="https://www.linkedin.com/company/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="RealSalePro on LinkedIn"><svg className="icon icon--fill"><use href="#i-linkedin"/></svg></a>
                <a href="https://wa.me/917079737773" target="_blank" rel="noopener noreferrer" aria-label="Chat with RealSalePro on WhatsApp"><svg className="icon icon--fill"><use href="#i-whatsapp"/></svg></a>
              </div>
            </div>

            <div className="footer__col">
              <h3>Platform</h3>
              <Link to="/free-real-estate-crm">Free Real Estate CRM</Link>
              <Link to="/crm-for-real-estate-brokers">CRM for Brokers</Link>
              <Link to="/real-estate-crm-india">India Real Estate CRM</Link>
              <Link to="/features/lead-management">Lead Management</Link>
              <Link to="/templates/real-estate-crm-excel-template">Free Excel Template</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/contact">Support</Link>
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
