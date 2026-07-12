import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Star, Quote, Zap, CheckCircle, ArrowRight, MessageSquare, Database, Code, Globe, Sparkles } from 'lucide-react';

// FAQ Data
const faqs = [
    {
        question: "Can I customize the app for my agency?",
        answer: "Absolutely! RealSalePro offers extensive customization options including custom fields, workflows, branding (logo, colors), role-based permissions, and custom reports. Our Business Customization package (starting at ₹19,999) allows you to tailor the platform to your specific real estate business needs. We also provide API access for advanced integrations."
    },
    {
        question: "What payment methods are supported?",
        answer: "We support multiple payment gateways including UPI, Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, and Bank Transfers (NEFT/RTGS/IMPS). For enterprise clients, we also offer invoice-based billing with NET-30 payment terms. All transactions are secured with PCI-DSS compliant encryption."
    },
    {
        question: "Do you offer support / onboarding assistance?",
        answer: "Yes! Every subscription includes comprehensive onboarding support. Our team provides: 1) Live video training sessions for your team, 2) Dedicated onboarding manager for the first 30 days, 3) Complete data migration assistance from Excel/other CRMs, 4) 24/7 email & chat support, and 5) Priority phone support for enterprise plans. We ensure your team is fully trained before going live."
    },
    {
        question: "Is there a free trial?",
        answer: "Yes! We offer a 14-day free trial with full access to all features (no credit card required). During the trial, you can add unlimited users, import your data, and test all modules including CRM, inventory management, and incentive calculations. Our team is available to assist you throughout the trial period."
    },
    {
        question: "How secure is my client data?",
        answer: "Security is our top priority. We use AES-256 encryption for data at rest, TLS 1.3 for data in transit, role-based access control (RBAC), and strict tenant isolation. We perform weekly automated backups, maintain 24/7 security monitoring, and offer on-premise deployment options for enterprises requiring maximum control."
    },
    {
        question: "Can I integrate RealSalePro with other tools?",
        answer: "Yes! RealSalePro integrates with popular tools including WhatsApp Business API, Google Workspace, Zapier, payment gateways (Razorpay, PayU), and accounting software. We also provide REST APIs for custom integrations. Our enterprise plans include dedicated integration support."
    }
];

// Testimonials Data
const testimonials = [
    {
        name: "Rajesh Sharma",
        designation: "Director, Sharma Realty Group",
        image: "https://ui-avatars.com/api/?name=Rajesh+Sharma&background=1673FF&color=fff&size=128",
        quote: "RealSalePro transformed our sales process completely. We went from managing 50+ Excel sheets to one unified platform. Our team productivity increased by 40% in just 3 months!",
        rating: 5
    },
    {
        name: "Priya Mehta",
        designation: "Sales Head, Metro Properties",
        image: "https://ui-avatars.com/api/?name=Priya+Mehta&background=10B981&color=fff&size=128",
        quote: "The automated incentive calculations alone saved us 20 hours per month. The visual pipeline helps us track every deal stage. Best investment we made for our sales team!",
        rating: 5
    },
    {
        name: "Amit Patel",
        designation: "CEO, Skyline Developers",
        image: "https://ui-avatars.com/api/?name=Amit+Patel&background=F59E0B&color=fff&size=128",
        quote: "We manage 12 projects across 3 cities. RealSalePro's inventory management prevents double-booking and gives real-time visibility to all our agents. Game changer!",
        rating: 5
    }
];

// Value Propositions
const valueProps = [
    {
        icon: Zap,
        title: "Scalable Solution",
        description: "From small agencies to enterprise real estate businesses",
        color: "text-yellow-500"
    },
    {
        icon: CheckCircle,
        title: "Comprehensive CRM",
        description: "Manage customers, leads & incentives in one platform",
        color: "text-green-500"
    },
    {
        icon: Star,
        title: "Performance Analytics",
        description: "Track team metrics via leaderboards & targets",
        color: "text-emerald-500"
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Frequently Asked Questions
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-[#0E1A15] mb-4">
                        Got Questions? We've Got Answers
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Everything you need to know about RealSalePro. Can't find what you're looking for?
                        <a href="mailto:support@realsalepro.com" className="text-[#10B981] hover:underline ml-1">Contact our team</a>.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#10B981] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-[#0E1A15] text-lg pr-4">
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-5 pt-2 bg-gray-50 border-t border-gray-100">
                                    <p className="text-gray-700 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0E1A15] to-[#10B981]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold text-emerald-200 uppercase tracking-widest mb-4">
                        Customer Success Stories
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Trusted by Leading Real Estate Professionals
                    </h3>
                    <p className="text-emerald-100 max-w-2xl mx-auto">
                        Join hundreds of agencies who have transformed their sales operations with RealSalePro
                    </p>
                </div>

                {/* Testimonial Carousel */}
                <div className="relative">
                    <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
                        <Quote className="w-12 h-12 text-[#10B981] mb-6" />
                        <p className="text-xl md:text-2xl text-gray-800 font-light leading-relaxed mb-8">
                            "{testimonials[activeIndex].quote}"
                        </p>
                        <div className="flex items-center gap-4">
                            <img
                                src={testimonials[activeIndex].image}
                                alt={testimonials[activeIndex].name}
                                className="w-16 h-16 rounded-full border-4 border-[#10B981]"
                            />
                            <div>
                                <h4 className="font-bold text-[#0E1A15] text-lg">
                                    {testimonials[activeIndex].name}
                                </h4>
                                <p className="text-gray-600 text-sm">
                                    {testimonials[activeIndex].designation}
                                </p>
                                <div className="flex gap-1 mt-1">
                                    {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Dots */}
                    <div className="flex justify-center gap-3 mt-8">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveIndex(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${activeIndex === index
                                    ? 'bg-white w-8'
                                    : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                aria-label={`View testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Featured In / Client Logos */}
                <div className="mt-16 text-center">
                    <p className="text-emerald-100 text-sm uppercase tracking-wider mb-8">
                        Trusted by 50+ Real Estate Agencies
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-8">
                        <div className="w-48 h-28 bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center p-4 overflow-hidden border border-gray-100">
                            <img src="/images/omav-logo-transparent.png" alt="Omav Op Constructions" className="w-full h-full object-contain" />
                        </div>
                        <div className="w-48 h-28 bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center p-4 overflow-hidden border border-gray-100">
                            <img src="/images/mithila-realinfra-logo.png" alt="Mithila RealInfra" className="w-full h-full object-contain" />
                        </div>
                        <div className="w-48 h-28 bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center p-4 overflow-hidden border border-gray-100">
                            <img src="/images/dutta-realty-logo.png" alt="Dutta Realty" className="w-full h-full object-contain" />
                        </div>
                        <div className="w-48 h-28 bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center p-4 overflow-hidden border border-gray-100">
                            <img src="/images/wishluv-logo.png" alt="Wishluv Buildcon" className="w-full h-full object-contain" />
                        </div>
                        <div className="w-48 h-28 bg-white rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),0_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center p-4 overflow-hidden border border-gray-100">
                            <img src="/images/dehliz-new-logo.png" alt="Dehliz Infratech" className="w-full h-full object-contain" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function ValuePropositionSection() {
    return (
        <section id="why-realsalepro" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Why Choose Us
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-[#0E1A15] mb-4">
                        Why RealSalePro Stands Out
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Built specifically for real estate sales teams with features that actually matter
                    </p>
                </div>

                {/* Value Props Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {valueProps.map((prop, index) => {
                        const Icon = prop.icon;
                        return (
                            <div
                                key={index}
                                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#10B981] group hover:-translate-y-2"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-7 h-7 ${prop.color}`} />
                                </div>
                                <h4 className="text-xl font-bold text-[#0E1A15] mb-3">
                                    {prop.title}
                                </h4>
                                <p className="text-gray-600 leading-relaxed">
                                    {prop.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Additional Benefits */}
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100">
                    <h4 className="text-2xl font-bold text-[#0E1A15] mb-8 text-center">
                        Complete Real Estate Sales Solution
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h5 className="font-semibold text-[#0E1A15] mb-1">
                                    Efficient Workflow
                                </h5>
                                <p className="text-gray-600 text-sm">
                                    One-touch assignment to leaders/agents with automated notifications
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h5 className="font-semibold text-[#0E1A15] mb-1">
                                    Financial Tools
                                </h5>
                                <p className="text-gray-600 text-sm">
                                    EMI/payment tracking for properties with automated reminders
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h5 className="font-semibold text-[#0E1A15] mb-1">
                                    Business Customization
                                </h5>
                                <p className="text-gray-600 text-sm">
                                    Tailor the platform to your needs (Starting at ₹19,999)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h5 className="font-semibold text-[#0E1A15] mb-1">
                                    Mobile-First Design
                                </h5>
                                <p className="text-gray-600 text-sm">
                                    Access from anywhere - perfect for on-field sales teams
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-10 text-center">
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 bg-[#10B981] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0E1A15] transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Start Your Free Trial
                            <ChevronDown className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

const MetaLogo = () => (
<svg className="w-8 h-8 text-[#0064E0]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.04 2C6.51 2 2.01 6.5 2.01 12.03c0 1.95.56 3.77 1.54 5.31l1.43-1.12c-.74-1.2-1.17-2.61-1.17-4.19 0-4.52 3.67-8.19 8.23-8.19 4.56 0 8.23 3.67 8.23 8.19 0 2.2-.87 4.19-2.28 5.67-.14.15-.3.29-.46.43-1.28 1.13-2.92 1.77-4.63 1.77-1.18 0-2.31-.3-3.32-.87L6.8 20.35c1.55.93 3.35 1.48 5.24 1.48 2.51 0 4.9-.94 6.78-2.65.23-.21.45-.43.66-.67C21.08 16.66 22.07 14.43 22.07 12.03 22.07 6.5 17.57 2 12.04 2zm-1.63 12.3c-.63-.38-1.2-.88-1.67-1.46L6.5 14.61c.88 1.1 2.01 1.97 3.3 2.52l.61-2.83zm5.72-.51c.32-.42.58-.88.77-1.39l-2.73-.83c-.09.28-.24.53-.41.76l2.37 1.46z" />
    <path d="M12.87 9.87c.21 0 .42.02.62.06l.57-2.84c-.39-.08-.79-.12-1.19-.12-3.17 0-5.74 2.57-5.74 5.74 0 .91.22 1.77.6 2.53l2.5-1.54c-.16-.3-.25-.64-.25-.99 0-1.6 1.29-2.84 2.89-2.84z" />
</svg>
);

const GoogleAdsLogo = () => (
<svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
    <path d="M16.5 3L6 21h10.5L27 3H16.5z" fill="#FBBC05" />
    <path d="M6 21l10.5-18H6L-4.5 21H6z" fill="#4285F4" />
    <path d="M6 21l5.25-9L6 3 .75 12 6 21z" fill="#34A853" />
</svg>
);

const MagicbricksLogo = () => (
<div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
    mb
</div>
);

const NinetyNineAcresLogo = () => (
<div className="w-8 h-8 bg-[#002C6C] rounded-lg flex items-center justify-center text-white font-bold text-[10px] tracking-tight">
    99ac
</div>
);

const HousingLogo = () => (
<div className="w-8 h-8 bg-[#DF147A] rounded-lg flex items-center justify-center text-white font-black text-sm">
    H
</div>
);

const WhatsAppLogo = () => (
<svg className="w-8 h-8 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
</svg>
);

const GoogleSheetsLogo = () => (
<svg className="w-8 h-8 text-[#0F9D58]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
</svg>
);

const GoogleFormsLogo = () => (
<svg className="w-8 h-8 text-[#7248B9]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12H7v-2h10v2zm0-4H7V9h10v2z" />
</svg>
);

const WebhooksLogo = () => (
<div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-[#10B981]">
    <Code className="w-5 h-5" />
</div>
);

const integrationData = [
{
    id: "meta",
    name: "Meta Ads (Facebook & Instagram)",
    category: "ads",
    description: "Capture real estate inquiries directly from Facebook & Instagram lead generation form campaigns in real-time.",
    logo: MetaLogo,
    status: "Auto-Sync Enabled",
    color: "from-blue-500/10 to-indigo-500/5 hover:border-blue-500/30"
},
{
    id: "google-ads",
    name: "Google Ads",
    category: "ads",
    description: "Sync leads submitted through Google Search campaigns, Map listings, and Local Display lead forms instantly.",
    logo: GoogleAdsLogo,
    status: "Real-time Webhook",
    color: "from-amber-500/10 to-red-500/5 hover:border-amber-500/30"
},
{
    id: "magicbricks",
    name: "Magicbricks",
    category: "portals",
    description: "Sync buyers looking at your listings on India's leading property search portal directly into your CRM funnel.",
    logo: MagicbricksLogo,
    status: "API Connected",
    color: "from-red-500/10 to-orange-500/5 hover:border-red-500/30"
},
{
    id: "99acres",
    name: "99acres",
    category: "portals",
    description: "Import listings responses and direct buyer inquiries from 99acres without using manual CSV exports.",
    logo: NinetyNineAcresLogo,
    status: "Instant Delivery",
    color: "from-blue-900/20 to-blue-700/5 hover:border-[#002C6C]/40"
},
{
    id: "housing",
    name: "Housing.com",
    category: "portals",
    description: "Sync leads from property page views and premium advertisements on Housing.com in less than 30 seconds.",
    logo: HousingLogo,
    status: "Real-time Sync",
    color: "from-pink-500/10 to-rose-500/5 hover:border-pink-500/30"
},
{
    id: "whatsapp",
    name: "WhatsApp Business API",
    category: "chat",
    description: "Collect leads directly via WhatsApp chat bots, verify numbers instantly, and initiate automated welcome flows.",
    logo: WhatsAppLogo,
    status: "Instant Auto-Reply",
    color: "from-emerald-500/10 to-green-500/5 hover:border-emerald-500/30"
},
{
    id: "sheets",
    name: "Google Sheets",
    category: "productivity",
    description: "Sync offline broker databases, walk-in events, or legacy client data from any shared Google spreadsheet.",
    logo: GoogleSheetsLogo,
    status: "2-Way Sync",
    color: "from-green-600/10 to-emerald-600/5 hover:border-green-600/30"
},
{
    id: "forms",
    name: "Google Forms",
    category: "productivity",
    description: "Directly channel inputs from contact pages, property survey forms, and booking forms into your database.",
    logo: GoogleFormsLogo,
    status: "Instant Add",
    color: "from-purple-500/10 to-violet-500/5 hover:border-purple-500/30"
},
{
    id: "webhooks",
    name: "Developer Webhooks & API",
    category: "chat",
    description: "Connect custom landing pages, mobile apps, or third-party dialers using our robust, secure REST APIs.",
    logo: WebhooksLogo,
    status: "Developer Friendly",
    color: "from-[#10B981]/10 to-slate-500/5 hover:border-[#10B981]/30"
}
];

export function LeadIntegrationsSection() {
const [activeTab, setActiveTab] = useState<'all' | 'ads' | 'portals' | 'productivity' | 'chat'>('all');

const filteredIntegrations = activeTab === 'all' 
    ? integrationData 
    : integrationData.filter(item => item.category === activeTab);

return (
    <section id="integrations" className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        {/* Subtle Gradient Backdrops */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
            {/* Header */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-4">
                    <Sparkles size={16} className="text-[#10B981]" />
                    <span className="text-[#059669] text-xs font-bold uppercase tracking-widest">Lead Sync Automation</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-[#0E1A15] mb-6 tracking-tight">
                    Zero Lead Leakage. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#0E1A15]">Instant Integrations.</span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                    Stop copying leads from Excel sheets. Connect all your lead sources directly and assign them to your sales team in real-time, instantly.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12">
                {(
                    [
                        { id: 'all', label: 'All Sources' },
                        { id: 'ads', label: 'Advertising Platforms' },
                        { id: 'portals', label: 'Property Portals' },
                        { id: 'productivity', label: 'Productivity' },
                        { id: 'chat', label: 'Chat & APIs' }
                    ] as { id: 'all' | 'ads' | 'portals' | 'productivity' | 'chat'; label: string }[]
                ).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 border ${
                            activeTab === tab.id 
                                ? 'bg-[#10B981] border-[#10B981] text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid Layout */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
                {filteredIntegrations.map((integration) => {
                    const LogoComponent = integration.logo;
                    return (
                        <div
                            key={integration.id}
                            className={`group relative bg-gradient-to-br ${integration.color} p-8 rounded-2xl border border-gray-100 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 transform hover:-translate-y-2 flex flex-col justify-between`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border border-gray-50 group-hover:scale-110 transition-transform duration-500">
                                        <LogoComponent />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                                        {integration.status}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-[#0E1A15] mb-3 group-hover:text-[#10B981] transition-colors duration-300">
                                    {integration.name}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                    {integration.description}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-gray-100/50 flex items-center justify-between">
                                <span className="text-xs text-gray-400 font-medium">Automatic Routing Supported</span>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#10B981] group-hover:translate-x-2 transition-all duration-300" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Interactive Lead Flow Pipeline Animation Widget */}
            <div className="bg-[#0E1A15] text-white p-8 md:p-12 rounded-3xl relative overflow-hidden border border-emerald-950">
                {/* Glowing effect inside */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#10B981] rounded-full blur-[160px] opacity-10 pointer-events-none"></div>
                
                <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5 space-y-6">
                        <span className="text-[#10B981] text-xs font-bold tracking-widest uppercase block">Lead Flow Automation</span>
                        <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                            Watch Your Leads Route Automatically
                        </h3>
                        <p className="text-gray-400 text-base leading-relaxed">
                            As soon as a user clicks submit on Facebook Ads or Magicbricks, our router parses details, logs them in the CRM database, assigns a sales representative, and sends a WhatsApp welcome alert in under 5 seconds.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm">
                                <CheckCircle size={16} className="text-[#10B981]" />
                                <span>Round-Robin Routing</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm">
                                <CheckCircle size={16} className="text-[#10B981]" />
                                <span>Instant WhatsApp Welcome</span>
                            </div>
                        </div>
                    </div>

                    {/* Pipeline Simulation Diagram */}
                    <div className="lg:col-span-7 flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl relative">
                        {/* Source Stack */}
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <div className="text-center md:text-left text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                Lead Sources
                            </div>
                            {[
                                { name: "Meta Ads", icon: MetaLogo },
                                { name: "Magicbricks", icon: MagicbricksLogo },
                                { name: "WhatsApp", icon: WhatsAppLogo }
                            ].map((source, index) => {
                                const Icon = source.icon;
                                return (
                                    <div key={index} className="flex items-center justify-between md:justify-start gap-3 bg-[#0E1A15] border border-white/10 p-3 rounded-xl hover:border-emerald-500/50 transition-all duration-300">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                            <Icon />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-200">{source.name}</span>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse md:ml-auto"></div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Center Flowing Arrow & Hub */}
                        <div className="flex flex-row md:flex-col items-center justify-center gap-2 py-4 md:py-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-[#10B981] flex items-center justify-center animate-pulse text-[#10B981]">
                                <Zap size={16} className="animate-bounce" />
                            </div>
                            <div className="hidden md:block h-16 w-0.5 border-l border-dashed border-emerald-500/30"></div>
                            <div className="md:hidden w-16 h-0.5 border-t border-dashed border-emerald-500/30"></div>
                        </div>

                        {/* Hub Core */}
                        <div className="flex flex-col items-center text-center p-6 bg-gradient-to-b from-emerald-950/50 to-emerald-900/30 border border-emerald-500/30 rounded-2xl shadow-xl w-full md:w-44 max-w-[176px]">
                            <div className="w-14 h-14 bg-white/10 rounded-full border-2 border-[#10B981] flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                                <img src="/images/RealSalePro_LighLogo.png" alt="SalesPro Core" className="w-10 h-10 object-contain" />
                            </div>
                            <span className="text-xs font-bold tracking-wider text-emerald-400">Router Hub</span>
                            <span className="text-[10px] text-gray-400 mt-1">Real-time Parsing</span>
                        </div>

                        {/* Center Flowing Arrow & Hub 2 */}
                        <div className="flex flex-row md:flex-col items-center justify-center gap-2 py-4 md:py-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-[#10B981] flex items-center justify-center animate-pulse text-[#10B981]">
                                <ArrowRight size={16} className="rotate-90 md:rotate-0" />
                            </div>
                            <div className="hidden md:block h-16 w-0.5 border-l border-dashed border-emerald-500/30"></div>
                            <div className="md:hidden w-16 h-0.5 border-t border-dashed border-emerald-500/30"></div>
                        </div>

                        {/* Destination stack */}
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <div className="text-center md:text-left text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                Automation
                            </div>
                            {[
                                { name: "Team Assigned", icon: Globe, detail: "Round Robin" },
                                { name: "WhatsApp Welcome", icon: MessageSquare, detail: "Auto Template" },
                                { name: "CRM Pipeline Logged", icon: Database, detail: "Secure DB Save" }
                            ].map((dest, index) => {
                                const Icon = dest.icon;
                                return (
                                    <div key={index} className="flex items-center justify-between md:justify-start gap-3 bg-[#0E1A15] border border-white/10 p-3 rounded-xl">
                                        <div className="w-8 h-8 bg-emerald-500/20 text-[#10B981] rounded-lg flex items-center justify-center">
                                            <Icon size={16} />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-xs font-bold text-gray-100">{dest.name}</div>
                                            <div className="text-[10px] text-gray-400">{dest.detail}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);
}
