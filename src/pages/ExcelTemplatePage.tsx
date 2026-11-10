import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { SEOHead } from '../components/seo/SEOHead';
import { initLandingInteractions } from './landingInteractions';
import '../styles/landing.css';

export function ExcelTemplatePage() {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  const sampleLeads = [
    {
      date: '2026-11-10',
      name: 'Rahul Sharma',
      mobile: '+91 98765 43210',
      source: 'Meta Ads',
      project: 'Godrej Palm Retreat',
      budget: '₹1.2 Cr - ₹1.5 Cr',
      config: '3 BHK',
      stage: 'Site Visit Scheduled',
      priority: 'Hot',
      remarks: 'Park-facing unit, 8th floor. Family walkthrough confirmed.'
    },
    {
      date: '2026-11-09',
      name: 'Pooja Verma',
      mobile: '+91 98234 56789',
      source: 'Magicbricks',
      project: 'Sobha Dream Acres',
      budget: '₹75L - ₹90L',
      config: '2 BHK',
      stage: 'Contacted',
      priority: 'Warm',
      remarks: 'Sent brochure on WhatsApp. Will confirm visit date.'
    },
    {
      date: '2026-11-08',
      name: 'Vikram Malhotra',
      mobile: '+91 97112 23344',
      source: 'Google Ads',
      project: 'DLF Cyber Residences',
      budget: '₹2.5 Cr - ₹3.0 Cr',
      config: '4 BHK Luxury',
      stage: 'Negotiation',
      priority: 'Hot',
      remarks: 'Visit done. Discussing payment milestone & parking.'
    },
    {
      date: '2026-11-07',
      name: 'Suresh Gupta',
      mobile: '+91 99887 76655',
      source: 'Walk-in',
      project: 'Godrej Palm Retreat',
      budget: '₹1.5 Cr',
      config: '3 BHK',
      stage: 'Token Booked',
      priority: 'Hot',
      remarks: 'Token advance paid ₹1,00,000. Unit 1204 locked.'
    }
  ];

  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Leads Tracker
      const leadsSheetData = [
        {
          "Lead Date": "2026-11-10",
          "Customer Name": "Rahul Sharma",
          "Mobile Number": "9876543210",
          "Email ID": "rahul.sharma@example.com",
          "Lead Source": "Meta Ads",
          "Project": "Godrej Palm Retreat",
          "Budget Range": "₹1.2 Cr - ₹1.5 Cr",
          "Configuration": "3 BHK",
          "Purpose": "Self-use",
          "Lead Status": "Site Visit Scheduled",
          "Priority": "Hot",
          "Assigned To": "Amit Kumar",
          "Latest Remarks": "Looking for park-facing unit on 8th floor or above. Family visit confirmed.",
          "Next Follow-up": "2026-11-12",
          "Site Visit Date": "2026-11-15"
        },
        {
          "Lead Date": "2026-11-09",
          "Customer Name": "Pooja Verma",
          "Mobile Number": "9823456789",
          "Email ID": "pooja.v@example.com",
          "Lead Source": "Magicbricks",
          "Project": "Sobha Dream Acres",
          "Budget Range": "₹75L - ₹90L",
          "Configuration": "2 BHK",
          "Purpose": "Investment",
          "Lead Status": "Contacted",
          "Priority": "Warm",
          "Assigned To": "Neha Singh",
          "Latest Remarks": "Sent brochure on WhatsApp. Will check with husband and confirm visit date.",
          "Next Follow-up": "2026-11-11",
          "Site Visit Date": ""
        },
        {
          "Lead Date": "2026-11-08",
          "Customer Name": "Vikram Malhotra",
          "Mobile Number": "9711223344",
          "Email ID": "v.malhotra@corporate.in",
          "Lead Source": "Google Ads",
          "Project": "DLF Cyber Residences",
          "Budget Range": "₹2.5 Cr - ₹3.0 Cr",
          "Configuration": "4 BHK Luxury",
          "Purpose": "Self-use",
          "Lead Status": "Negotiation",
          "Priority": "Hot",
          "Assigned To": "Rohan Mehra",
          "Latest Remarks": "Site visit completed. Discussing payment milestone plan and parking slot allocation.",
          "Next Follow-up": "2026-11-11",
          "Site Visit Date": "2026-11-09"
        },
        {
          "Lead Date": "2026-11-07",
          "Customer Name": "Suresh Gupta",
          "Mobile Number": "9988776655",
          "Email ID": "suresh.gupta@biz.com",
          "Lead Source": "Walk-in",
          "Project": "Godrej Palm Retreat",
          "Budget Range": "₹1.5 Cr",
          "Configuration": "3 BHK",
          "Purpose": "Self-use",
          "Lead Status": "Token Booked",
          "Priority": "Hot",
          "Assigned To": "Rohan Mehra",
          "Latest Remarks": "Token advance paid ₹1,00,000. Unit 1204 blocked. Agreement drafting in progress.",
          "Next Follow-up": "2026-11-14",
          "Site Visit Date": "2026-11-07"
        }
      ];

      const ws1 = XLSX.utils.json_to_sheet(leadsSheetData);
      XLSX.utils.book_append_sheet(wb, ws1, "Leads Tracker");

      // Sheet 2: Pipeline Stages
      const stagesData = [
        { "Stage": "New Lead", "Definition": "Raw inquiry from Meta/Google/Portals", "Target SLA": "Call within 5 minutes" },
        { "Stage": "Contacted", "Definition": "Phone conversation / WhatsApp brochure shared", "Target SLA": "Within 2 hours" },
        { "Stage": "Site Visit Scheduled", "Definition": "Prospect confirmed date & time for site visit", "Target SLA": "Confirm 2 hours prior" },
        { "Stage": "Site Visit Done", "Definition": "Customer completed model flat walkthrough", "Target SLA": "Feedback call within 4 hours" },
        { "Stage": "Negotiation", "Definition": "Discussing cost sheet, floor rise & discounts", "Target SLA": "Close within 7 days" },
        { "Stage": "Token Booked", "Definition": "Booking advance cheque/online transfer received", "Target SLA": "Sale agreement in 15 days" },
        { "Stage": "Converted", "Definition": "Agreement registered and developer commission logged", "Target SLA": "Completed" },
        { "Stage": "Lost / Disqualified", "Definition": "Budget mismatch or bought elsewhere", "Target SLA": "Move to revival sequence" }
      ];
      const ws2 = XLSX.utils.json_to_sheet(stagesData);
      XLSX.utils.book_append_sheet(wb, ws2, "Pipeline Stages Guide");

      // Sheet 3: RealSalePro Upgrade Note
      const upgradeData = [
        { "Advantage": "Automate Facebook & WhatsApp Leads", "Excel": "Manual copy-pasting (misses leads)", "RealSalePro Free CRM": "Instant 30-sec webhook auto-sync" },
        { "Advantage": "Prevent Lead Theft by Staff", "Excel": "Staff can copy/export full sheet", "RealSalePro Free CRM": "Phone number masking (hides last 5 digits)" },
        { "Advantage": "Follow-up Reminders", "Excel": "Forgotten in spreadsheet rows", "RealSalePro Free CRM": "Automated WhatsApp & dashboard notifications" },
        { "Advantage": "Site Visit Coordination", "Excel": "Manual phone calls", "RealSalePro Free CRM": "Driver dispatch & client route location link" },
        { "Advantage": "Cost", "Excel": "Free (heavy manual labor)", "RealSalePro Free CRM": "100% Free Forever up to 1,000 Leads (No Card Required)" },
        { "Advantage": "Free Signup Link", "Excel": "N/A", "RealSalePro Free CRM": "https://realsalepro.com/register" }
      ];
      const ws3 = XLSX.utils.json_to_sheet(upgradeData);
      XLSX.utils.book_append_sheet(wb, ws3, "Upgrade to Free Cloud CRM");

      XLSX.writeFile(wb, "RealSalePro-Real-Estate-CRM-Template-2026.xlsx");
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 8000);
    } catch (e) {
      window.location.href = '/downloads/real-estate-crm-template.xlsx';
      setDownloadSuccess(true);
    }
  };

  const templateSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Real Estate CRM Excel Template 2026",
    "operatingSystem": "All (Excel, Google Sheets, Numbers)",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "Free downloadable Real Estate CRM Excel Template & Google Sheets tracker with pre-built pipeline stages, site visit logs, and lead follow-up tracker."
  };

  return (
    <>
      <SEOHead
        title="Free Real Estate CRM Excel Template & Google Sheets Tracker (2026 Download) | RealSalePro"
        description="Download our free 2026 Real Estate CRM Excel template & Google Sheets lead tracker. Pre-configured with pipeline stages, property inventory & site visit logs. 100% free download."
        canonicalUrl="https://realsalepro.com/templates/real-estate-crm-excel-template"
        keywords="real estate crm template, real estate crm excel template, free real estate crm template, real estate lead tracker sheet, property crm excel sheet download"
        jsonLd={templateSchema}
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
        <symbol id="i-doc" viewBox="0 0 24 24"><path d="M6 3.5h8l4 4V20.5H6V3.5Z"/><path d="M14 3.5v4h4M9 12h6M9 16h6"/></symbol>
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
            <Link to="/templates/real-estate-crm-excel-template" className="is-active" style={{ color: 'var(--mint-bright)' }}>Excel Template</Link>
            <Link to="/free-real-estate-crm">Free CRM Software</Link>
            <a href="#preview">Sheet Preview</a>
            <a href="#why-switch">Excel vs Cloud CRM</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav__actions">
            <Link className="nav__login" to="/login">Log in</Link>
            <button
              onClick={handleDownloadExcel}
              className="btn btn--primary btn--sm"
              style={{ cursor: 'pointer' }}
            >
              <span>Download .XLSX</span><svg className="icon"><use href="#i-arrow"/></svg>
            </button>
            <button className="nav__toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
              <svg className="icon"><use href="#i-menu"/></svg>
            </button>
          </div>
        </div>

        <div className="nav__mobile" id="mobileMenu" hidden>
          <Link to="/templates/real-estate-crm-excel-template" style={{ color: 'var(--mint-bright)' }}>Excel Template</Link>
          <Link to="/free-real-estate-crm">Free CRM Software</Link>
          <a href="#preview">Sheet Preview</a>
          <a href="#why-switch">Excel vs Cloud CRM</a>
          <a href="#faq">FAQ</a>
          <Link to="/login">Log in</Link>
          <button onClick={handleDownloadExcel} className="btn btn--primary" style={{ width: '100%', marginTop: '8px' }}>
            Download .XLSX <svg className="icon"><use href="#i-arrow"/></svg>
          </button>
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

          <div className="container hero__inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div className="hero__copy" style={{ maxWidth: '820px' }}>
              <p className="eyebrow hero__eyebrow" data-reveal style={{ margin: '0 auto 18px' }}>
                <span className="eyebrow__dot"></span>
                Free Downloadable Resource
                <span className="eyebrow__new">2026 Edition</span>
              </p>

              <h1 className="hero__title" data-reveal data-reveal-delay="80">
                The real-estate CRM<br />template that actually <em>works</em>.
              </h1>

              <p className="hero__lede" data-reveal data-reveal-delay="160" style={{ margin: '20px auto 0', maxWidth: '680px' }}>
                A battle-tested spreadsheet template designed specifically for Indian property dealers, brokers, and builders. 
                Track customer inquiries, property preferences, site visits, and booking tokens in one clean layout.
              </p>

              <div className="hero__cta" data-reveal data-reveal-delay="240" style={{ marginTop: '34px', marginBottom: '24px', display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownloadExcel}
                  className="btn btn--primary btn--lg"
                  style={{ cursor: 'pointer' }}
                >
                  <span>Download Excel File (.xlsx)</span><svg className="icon"><use href="#i-arrow"/></svg>
                </button>
                <a
                  className="btn btn--ghost btn--lg"
                  href="/downloads/real-estate-crm-template.xlsx"
                  download
                >
                  <span>Direct browser link</span>
                </a>
              </div>

              {downloadSuccess && (
                <div style={{ padding: '14px 20px', borderRadius: '14px', background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.4)', color: '#5ef2b0', fontSize: '14px', margin: '16px auto', maxWidth: '480px' }}>
                  ✓ <strong>Download Complete!</strong> Check your Downloads folder for the spreadsheet.
                </div>
              )}

              <ul className="hero__facts" data-reveal data-reveal-delay="320" style={{ marginTop: '36px', paddingTop: '28px', borderTop: '1px solid rgba(255, 255, 255, 0.14)', display: 'flex', justifyContent: 'center', gap: '48px' }}>
                <li><b>100%</b><span>Free download</span></li>
                <li><b>3</b><span>Pre-built sheets</span></li>
                <li><b>Excel + Sheets</b><span>Compatible</span></li>
              </ul>
            </div>

            {/* Interactive Sheet Preview */}
            <div id="preview" style={{ width: '100%', maxWidth: '1080px', marginTop: '64px', borderRadius: '24px', background: 'rgba(5,18,12,0.85)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981' }}></span>
                  <span style={{ marginLeft: '12px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--muted-dark)' }}>Sheet 1: Leads Tracker.xlsx</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--mint-bright)', letterSpacing: '0.04em' }}>
                  ★ Ready to use or import
                </span>
              </div>

              <div style={{ overflowX: 'auto', textAlign: 'left' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                  <thead>
                    <tr style={{ background: 'rgba(10,39,27,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--mint-bright)' }}>
                      <th style={{ padding: '12px 18px' }}>Date</th>
                      <th style={{ padding: '12px 18px' }}>Customer Name</th>
                      <th style={{ padding: '12px 18px' }}>Mobile</th>
                      <th style={{ padding: '12px 18px' }}>Source</th>
                      <th style={{ padding: '12px 18px' }}>Project</th>
                      <th style={{ padding: '12px 18px' }}>Budget</th>
                      <th style={{ padding: '12px 18px' }}>Config</th>
                      <th style={{ padding: '12px 18px' }}>Pipeline Status</th>
                      <th style={{ padding: '12px 18px' }}>Priority</th>
                      <th style={{ padding: '12px 18px' }}>Latest Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleLeads.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'rgba(240,250,244,0.85)' }}>
                        <td style={{ padding: '12px 18px', color: 'var(--muted-dark)' }}>{row.date}</td>
                        <td style={{ padding: '12px 18px', fontWeight: 700, color: '#fff' }}>{row.name}</td>
                        <td style={{ padding: '12px 18px' }}>{row.mobile}</td>
                        <td style={{ padding: '12px 18px' }}>{row.source}</td>
                        <td style={{ padding: '12px 18px', color: 'var(--mint)' }}>{row.project}</td>
                        <td style={{ padding: '12px 18px' }}>{row.budget}</td>
                        <td style={{ padding: '12px 18px' }}>{row.config}</td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            padding: '3px 9px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-body)',
                            background: row.stage === 'Token Booked' ? 'rgba(0,229,118,0.2)' :
                              row.stage === 'Site Visit Scheduled' ? 'rgba(56,189,248,0.2)' : 'rgba(245,158,11,0.2)',
                            color: row.stage === 'Token Booked' ? 'var(--mint-bright)' :
                              row.stage === 'Site Visit Scheduled' ? '#38bdf8' : '#fbbf24'
                          }}>
                            {row.stage}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 800, background: row.priority === 'Hot' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: row.priority === 'Hot' ? '#f87171' : '#fbbf24' }}>
                            {row.priority}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', color: 'var(--muted-dark)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ============ WHY SPREADSHEETS FAIL (PAPER SECTION) ============ */}
        <section className="section section--paper" id="why-switch">
          <div className="container">
            <header className="sec-head sec-head--center">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">01</span> The Spreadsheet Trap</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">
                When to move from Excel to <em>RealSalePro Free</em>.
              </h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Spreadsheets work fine when you have 10 leads. But when you run Facebook ads and employ telecallers, manual sheets leak high-value buyers.
              </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '56px' }}>
              {/* Excel Downside */}
              <div style={{ padding: '36px', borderRadius: '24px', background: '#fff', border: '1px solid rgba(220,38,38,0.18)', boxShadow: '0 20px 50px rgba(10,32,24,0.06)' }}>
                <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#dc2626', marginBottom: '14px' }}>
                  ✕ Where Excel Breaks Down
                </p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: '#0a2018', marginBottom: '20px' }}>
                  Manual sheets leak client deals
                </h3>
                <ul style={{ display: 'grid', gap: '16px', color: 'var(--muted-light)', fontSize: '14.5px', lineHeight: 1.6 }}>
                  <li><strong>• Leads entered at 10 PM:</strong> Facebook inquiries received at 2 PM sit waiting for manual copying. By the time someone calls, the buyer has already scheduled a visit elsewhere.</li>
                  <li><strong>• Staff Database Theft:</strong> Any employee can save your entire sheet to a personal flash drive and walk out the door.</li>
                  <li><strong>• Zero Follow-up Alerts:</strong> Follow-up dates get buried in rows without WhatsApp or daily task notifications.</li>
                </ul>
              </div>

              {/* RealSalePro Free Solution */}
              <div style={{ padding: '36px', borderRadius: '24px', background: '#fff', border: '2px solid rgba(16,185,129,0.4)', boxShadow: '0 20px 60px rgba(16,185,129,0.12)' }}>
                <p style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#059669', marginBottom: '14px' }}>
                  ✓ The RealSalePro Advantage
                </p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: '#0a2018', marginBottom: '20px' }}>
                  Calm automation &amp; zero lead theft
                </h3>
                <ul style={{ display: 'grid', gap: '16px', color: '#0a2018', fontSize: '14.5px', lineHeight: 1.6 }}>
                  <li><strong>• 30-Second Webhook Sync:</strong> Every Meta, Google, and portal lead pings your team immediately. First-minute calls convert 391% better.</li>
                  <li><strong>• Staff Number Masking:</strong> Telecallers dial clients without seeing the last 5 digits. Zero database leakage.</li>
                  <li><strong>• 100% Free Forever:</strong> Up to 1,000 active leads and 5 users with zero subscription fee.</li>
                </ul>
              </div>
            </div>

            {/* Direct Import Soft Upgrade Box */}
            <div style={{ maxWidth: '780px', margin: '0 auto', padding: '44px 36px', background: 'linear-gradient(135deg, #071d14 0%, #04120c 100%)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', color: '#fff', boxShadow: 'var(--shadow-dark)' }}>
              <p className="eyebrow eyebrow--mint" style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto 12px' }}>
                <span className="eyebrow__dot"></span> Seamless 1-Click Migration
              </p>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, margin: '14px 0 16px' }}>
                Import this exact Excel sheet into <em>RealSalePro Free</em>
              </h3>
              <p style={{ color: 'var(--muted-dark)', fontSize: '15.5px', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 28px' }}>
                Already have leads stored in this format? Upload the spreadsheet into RealSalePro in 30 seconds. 
                Our deduplication engine ensures zero duplicate contacts.
              </p>
              <Link className="btn btn--primary btn--lg" to="/register">
                <span>Start free CRM (1,000 leads included)</span><svg className="icon"><use href="#i-arrow"/></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* ============ FAQ SECTION ============ */}
        <section className="section section--paper section--alt" id="faq">
          <div className="container faq-wrap">
            <header className="sec-head faq-head">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">02</span> Template FAQ</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">Frequently Asked<br /><em>Questions</em>.</h2>
            </header>

            <div className="faq" data-faq>
              <div className="faq__item" data-reveal>
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-1">
                  <span>Can I use this template in Google Sheets?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-1" aria-hidden="true">
                  <p>Yes! Simply download the .xlsx file, open Google Drive, click 'New' &rarr; 'File upload', and select the file. It opens cleanly in Google Sheets with all columns and formatting intact.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="40">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-2">
                  <span>Is there any cost or email required to download?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-2" aria-hidden="true">
                  <p>None. You can download the full Excel workbook instantly with a single click. No email gate, no credit card, and no subscription.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="80">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-3">
                  <span>How do I import this sheet into RealSalePro?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-3" aria-hidden="true">
                  <p>Once you create your free RealSalePro account, go to Leads &rarr; Bulk Import. Upload this .xlsx file and your leads will be automatically mapped to projects and team members in 30 seconds.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="120">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-4">
                  <span>Can I customize the columns or add my own projects?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-4" aria-hidden="true">
                  <p>Absolutely. The sheet is 100% unlocked. You can add custom columns, project names, and commission percentage rates as you see fit.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                <Link className="btn btn--ghost btn--lg" to="/free-real-estate-crm">
                  <span>Explore free CRM features</span>
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
              <img src="/assets/img/logo-light.png" alt="RealSalePro — Real Estate Sales & CRM Platform" width="190" height="40" style={{ height: '40px', width: 'auto', display: 'block' }} />
              <p>Empowering real-estate teams with intelligent tools and real-time insight. Built for the future of sales.</p>
              <div className="footer__social">
                <a href="https://www.facebook.com/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="RealSalePro on Facebook"><svg className="icon icon--fill"><use href="#i-facebook"/></svg></a>
                <a href="https://www.linkedin.com/company/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="RealSalePro on LinkedIn"><svg className="icon icon--fill"><use href="#i-linkedin"/></svg></a>
                <a href="https://wa.me/919525230232" target="_blank" rel="noopener noreferrer" aria-label="Chat with RealSalePro on WhatsApp"><svg className="icon icon--fill"><use href="#i-whatsapp"/></svg></a>
              </div>
            </div>

            <div className="footer__col">
              <h3>Platform</h3>
              <Link to="/templates/real-estate-crm-excel-template">Free Excel Template</Link>
              <Link to="/free-real-estate-crm">Free Real Estate CRM</Link>
              <Link to="/crm-for-real-estate-brokers">CRM for Brokers</Link>
              <Link to="/real-estate-crm-india">India Real Estate CRM</Link>
              <Link to="/features/lead-management">Lead Management</Link>
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

      {/* Floating WhatsApp FAB */}
      <a className="wa-float" href="https://wa.me/919525230232" target="_blank" rel="noopener noreferrer" aria-label="Chat with RealSalePro on WhatsApp">
        <svg className="icon"><use href="#i-whatsapp"/></svg>
        <span className="wa-float__tip">Chat with us</span>
      </a>
    </>
  );
}
