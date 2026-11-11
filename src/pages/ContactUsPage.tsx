import { useState } from 'react';
import { Mail, Phone, MapPin, ArrowLeft, MessageSquare, Clock, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

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
    agency: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    const text = `Hi RealSalePro Team, my name is ${formData.name} from ${formData.agency || 'Real Estate Agency'}. Phone: ${formData.phone}. Query: ${formData.message || 'I would like a product demo and onboarding walkthrough.'}`;
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
      
      <div className="min-h-screen bg-[#07130D] text-white py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
        <div className="max-w-5xl mx-auto">
          {/* Header Back Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <div className="text-xs text-emerald-300/60 font-mono">
              Average reply: &lt; 15 mins (Business Hours)
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-10 md:p-12 mb-12">
            <div className="max-w-3xl">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                We're Here to Help
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Get in Touch with our Real Estate CRM Specialists
              </h1>
              <p className="text-base sm:text-lg text-emerald-100/70 mb-10 leading-relaxed">
                Whether you want a personalized 15-minute screen walkthrough, need assistance migrating data from Excel spreadsheets, or want to integrate Meta Ads and WhatsApp Business API into your agency workflow — our team is ready to assist.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Contact Channels */}
              <div className="lg:col-span-5 space-y-4">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/917079737773"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-5 bg-emerald-500/10 hover:bg-emerald-500/15 rounded-2xl border border-emerald-500/30 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white mb-1">WhatsApp Support</h2>
                    <p className="text-emerald-400 font-semibold text-sm">+91 70797 37773</p>
                    <p className="text-xs text-emerald-200/60 mt-1">Instant messaging & live screen sharing</p>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href="tel:+917079737773"
                  className="flex items-start gap-4 p-5 bg-white/[0.04] hover:bg-white/[0.07] rounded-2xl border border-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white mb-1">Direct Phone Support</h2>
                    <p className="text-white font-semibold text-sm">+91 70797 37773</p>
                    <p className="text-xs text-emerald-200/60 mt-1">Mon – Sat, 9:00 AM – 7:00 PM IST</p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href="mailto:support@realsalepro.com"
                  className="flex items-start gap-4 p-5 bg-white/[0.04] hover:bg-white/[0.07] rounded-2xl border border-white/10 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white mb-1">Email Desk</h2>
                    <p className="text-emerald-400 font-semibold text-sm">support@realsalepro.com</p>
                    <p className="text-xs text-emerald-200/60 mt-1">Written inquiries, invoices & partnerships</p>
                  </div>
                </a>

                {/* Office */}
                <div className="flex items-start gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white mb-1">HQ & Operations</h2>
                    <p className="text-sm text-gray-300 leading-snug">
                      RealSalePro (Synergy Brand Architect)<br />
                      Barakhamba Road, Connaught Place<br />
                      New Delhi, Delhi 110001, India
                    </p>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="lg:col-span-7 bg-white/[0.04] border border-white/10 rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold text-white mb-2">Request Live Demo & Walkthrough</h2>
                <p className="text-sm text-emerald-100/70 mb-6">
                  Fill in your details below. We'll connect with you on WhatsApp within 15 minutes to schedule your walkthrough.
                </p>

                {submitted ? (
                  <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-white mb-1">WhatsApp Chat Initialized!</h3>
                    <p className="text-sm text-emerald-100/80 mb-4">
                      Our product specialist has received your request and will follow up shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="text-xs text-emerald-400 underline hover:text-emerald-300"
                    >
                      Send another query
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-200/80 uppercase tracking-wider mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 focus:outline-none text-white text-sm placeholder-gray-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-emerald-200/80 uppercase tracking-wider mb-1.5">
                          Mobile / WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 focus:outline-none text-white text-sm placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-emerald-200/80 uppercase tracking-wider mb-1.5">
                          Agency / Builder Name
                        </label>
                        <input
                          type="text"
                          value={formData.agency}
                          onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                          placeholder="e.g. Apex Realty"
                          className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 focus:outline-none text-white text-sm placeholder-gray-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-200/80 uppercase tracking-wider mb-1.5">
                        Requirements / Questions
                      </label>
                      <textarea
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="e.g. How does lead masking work? Can we sync our Meta ad forms and WhatsApp number?"
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-500 focus:outline-none text-white text-sm placeholder-gray-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Connect with Specialist on WhatsApp
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Zero spam. We will only reach out regarding your requested RealSalePro demo.
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* SLA & Support Commitment */}
            <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Under 15-Minute Response</h3>
                  <p className="text-xs text-emerald-100/60 leading-relaxed">
                    Our sales engineers monitor WhatsApp and email inquiries continuously during business hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Data Sovereignty & Security</h3>
                  <p className="text-xs text-emerald-100/60 leading-relaxed">
                    Your real estate client numbers and project files remain 100% encrypted and private to your team.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Free Guided Onboarding</h3>
                  <p className="text-xs text-emerald-100/60 leading-relaxed">
                    We assist in uploading your existing Excel client spreadsheets directly into your workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ Section */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-10">
            <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Contact Questions</h2>
            <div className="space-y-6 text-sm">
              <div>
                <h3 className="font-semibold text-emerald-300 mb-1">Can I book a personalized live Google Meet demo?</h3>
                <p className="text-emerald-100/70 leading-relaxed">
                  Yes! Message us on WhatsApp (+91 70797 37773) or submit the form above with your preferred date and time. Our product engineer will send a Google Meet link for a 15-minute screen-sharing session tailored to your agency.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-300 mb-1">Is onboarding and data import assistance really free?</h3>
                <p className="text-emerald-100/70 leading-relaxed">
                  Yes. Even on the 100% Free Forever tier, our support team will guide you on how to format and import your existing client databases from Microsoft Excel, CSV, or Google Sheets into RealSalePro.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-emerald-300 mb-1">How do I connect my Facebook Ads or WhatsApp Business number?</h3>
                <p className="text-emerald-100/70 leading-relaxed">
                  RealSalePro features direct Meta webhook integrations and native WhatsApp Cloud API support. During your onboarding walkthrough, we will help you configure your webhook tokens and start receiving leads automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
