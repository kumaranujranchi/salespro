import { useState } from 'react';
import { Mail, Phone, MapPin, MessageSquare, Clock, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { PublicShell, PublicHero } from '../components/public/PublicShell';

const contactSchema = {
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
          "name": "Contact Us",
          "item": "https://realsalepro.com/contact"
        }
      ]
    },
    {
      "@type": "ContactPage",
      "@id": "https://realsalepro.com/contact#webpage",
      "url": "https://realsalepro.com/contact",
      "name": "Contact RealSalePro — Sales & Support Team",
      "description": "Contact RealSalePro for real estate CRM inquiries, custom onboarding, or live demos. Phone & WhatsApp: +91 70797 37773. Fast response within 15 minutes.",
      "mainEntity": {
        "@type": "Organization",
        "name": "RealSalePro",
        "telephone": "+91-7079737773",
        "email": "support@realsalepro.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Barakhamba Road, Connaught Place",
          "addressLocality": "New Delhi",
          "addressRegion": "Delhi",
          "postalCode": "110001",
          "addressCountry": "IN"
        }
      }
    }
  ]
};

export function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    const text = `Hi RealSalePro Team, my name is ${formData.name} from ${formData.company || 'Real Estate Company'}. Phone: ${formData.phone}. Query: ${formData.message || 'I would like a product demo and onboarding walkthrough.'}`;
    window.open(`https://wa.me/917079737773?text=${encodeURIComponent(text)}`, '_blank');
    setSubmitted(true);
  };

  return (
    <>
      <SEOHead
        title="Contact RealSalePro — Sales & Support Team"
        description="Contact RealSalePro for real estate CRM inquiries, custom onboarding, or live demos. Phone & WhatsApp: +91 70797 37773. Fast response within 15 minutes."
        canonicalUrl="https://realsalepro.com/contact"
        keywords="contact realsalepro, real estate crm support, crm demo india, book real estate crm walkthrough"
        jsonLd={contactSchema}
      />

      <PublicShell>
        <PublicHero
          eyebrow="We're Here to Help"
          title={<>Get in Touch with our <em>Real Estate CRM Specialists</em></>}
          lede="Whether you want a personalized 15-minute screen walkthrough, need assistance migrating data from Excel spreadsheets, or want to integrate Meta Ads and WhatsApp Business API into your company workflow — our team is ready to assist."
        >
          <span className="pp-hero__meta">
            <Clock size={14} aria-hidden="true" /> Average reply: &lt; 15 mins (Business Hours)
          </span>
        </PublicHero>

        <section className="section section--dark pp-section--tight" style={{ paddingTop: 24 }}>
          <div className="container">
            <div className="pp-split">
              {/* Contact Channels */}
              <div className="pp-steps" data-reveal>
                <a
                  href="https://wa.me/917079737773"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pp-channel pp-channel--accent"
                >
                  <span className="pp-icon"><MessageSquare /></span>
                  <div>
                    <h2>WhatsApp Support</h2>
                    <p className="pp-channel__value">+91 70797 37773</p>
                    <p>Instant messaging & live screen sharing</p>
                  </div>
                </a>

                <a href="tel:+917079737773" className="pp-channel">
                  <span className="pp-icon"><Phone /></span>
                  <div>
                    <h2>Direct Phone Support</h2>
                    <p className="pp-channel__value">+91 70797 37773</p>
                    <p>Mon – Sat, 9:00 AM – 7:00 PM IST</p>
                  </div>
                </a>

                <a href="mailto:support@realsalepro.com" className="pp-channel">
                  <span className="pp-icon"><Mail /></span>
                  <div>
                    <h2>Email Desk</h2>
                    <p className="pp-channel__value">support@realsalepro.com</p>
                    <p>Written inquiries, invoices & partnerships</p>
                  </div>
                </a>

                <div className="pp-channel">
                  <span className="pp-icon"><MapPin /></span>
                  <div>
                    <h2>HQ & Operations</h2>
                    <address>
                      RealSalePro (Synergy Brand Architect)<br />
                      Barakhamba Road, Connaught Place<br />
                      New Delhi, Delhi 110001, India
                    </address>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="pp-card" data-reveal data-reveal-delay="80">
                <div className="pp-flow">
                  <h2>Request Live Demo & Walkthrough</h2>
                  <p>
                    Fill in your details below. We'll connect with you on WhatsApp within 15 minutes to schedule your walkthrough.
                  </p>
                </div>

                <div style={{ marginTop: 24 }}>
                  {submitted ? (
                    <div className="pp-done">
                      <CheckCircle2 aria-hidden="true" />
                      <h3>WhatsApp Chat Initialized!</h3>
                      <p style={{ marginTop: 6 }}>
                        Our product specialist has received your request and will follow up shortly.
                      </p>
                      <button type="button" onClick={() => setSubmitted(false)}>
                        Send another query
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="pp-form">
                      <div>
                        <label className="pp-label" htmlFor="contact-name">
                          Your Full Name *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Rahul Sharma"
                          className="pp-input"
                        />
                      </div>

                      <div className="pp-form__row">
                        <div>
                          <label className="pp-label" htmlFor="contact-phone">
                            Mobile / WhatsApp Number *
                          </label>
                          <input
                            id="contact-phone"
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+91 98765 43210"
                            className="pp-input"
                          />
                        </div>
                        <div>
                          <label className="pp-label" htmlFor="contact-company">
                            Company / Builder Name
                          </label>
                          <input
                            id="contact-company"
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="e.g. Apex Realty"
                            className="pp-input"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="pp-label" htmlFor="contact-message">
                          Requirements / Questions
                        </label>
                        <textarea
                          id="contact-message"
                          rows={3}
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="e.g. How does lead masking work? Can we sync our Meta ad forms and WhatsApp number?"
                          className="pp-input"
                        />
                      </div>

                      <button type="submit" className="btn btn--primary btn--block pp-btn-wrap">
                        <Send size={16} aria-hidden="true" /> Connect with Specialist on WhatsApp
                      </button>
                      <p className="pp-hint pp-center" style={{ marginTop: 0 }}>
                        Zero spam. We will only reach out regarding your requested RealSalePro demo.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* SLA & Support Commitment */}
            <div className="pp-grid pp-grid--3" style={{ marginTop: 56 }}>
              <div className="pp-feature" data-reveal>
                <span className="pp-icon"><Clock /></span>
                <div>
                  <h3>Under 15-Minute Response</h3>
                  <p>
                    Our sales engineers monitor WhatsApp and email inquiries continuously during business hours.
                  </p>
                </div>
              </div>

              <div className="pp-feature" data-reveal data-reveal-delay="80">
                <span className="pp-icon"><ShieldCheck /></span>
                <div>
                  <h3>Data Sovereignty & Security</h3>
                  <p>
                    Your real estate client numbers and project files remain 100% encrypted and private to your team.
                  </p>
                </div>
              </div>

              <div className="pp-feature" data-reveal data-reveal-delay="160">
                <span className="pp-icon"><CheckCircle2 /></span>
                <div>
                  <h3>Free Guided Onboarding</h3>
                  <p>
                    We assist in uploading your existing Excel client spreadsheets directly into your workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick FAQ Section */}
        <section className="section section--paper pp-section">
          <div className="container pp-narrow">
            <div className="sec-head sec-head--center" style={{ marginBottom: 40 }} data-reveal>
              <h2 className="sec-head__title">Frequently Asked <em>Contact Questions</em></h2>
            </div>
            <div className="pp-qa">
              <div className="pp-qa__item" data-reveal>
                <h3>Can I book a personalized live Google Meet demo?</h3>
                <p>
                  Yes! Message us on WhatsApp (+91 70797 37773) or submit the form above with your preferred date and time. Our product engineer will send a Google Meet link for a 15-minute screen-sharing session tailored to your company.
                </p>
              </div>
              <div className="pp-qa__item" data-reveal>
                <h3>Is onboarding and data import assistance really free?</h3>
                <p>
                  Yes. Even on the 100% Free Forever tier, our support team will guide you on how to format and import your existing client databases from Microsoft Excel, CSV, or Google Sheets into RealSalePro.
                </p>
              </div>
              <div className="pp-qa__item" data-reveal>
                <h3>How do I connect my Facebook Ads or WhatsApp Business number?</h3>
                <p>
                  RealSalePro features direct Meta webhook integrations and native WhatsApp Cloud API support. During your onboarding walkthrough, we will help you configure your webhook tokens and start receiving leads automatically.
                </p>
              </div>
            </div>
          </div>
        </section>
      </PublicShell>
    </>
  );
}
