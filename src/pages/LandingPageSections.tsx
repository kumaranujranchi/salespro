import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, Quote, Zap, CheckCircle } from 'lucide-react';

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
        color: "text-blue-500"
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
                    <h3 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-4">
                        Got Questions? We've Got Answers
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Everything you need to know about RealSalePro. Can't find what you're looking for? 
                        <a href="mailto:support@realsalepro.com" className="text-[#1673FF] hover:underline ml-1">Contact our team</a>.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#1673FF] transition-all duration-300"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-semibold text-[#0A1C37] text-lg pr-4">
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-[#1673FF] flex-shrink-0" />
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
        <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0A1C37] to-[#1673FF]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-4">
                        Customer Success Stories
                    </h2>
                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Trusted by Leading Real Estate Professionals
                    </h3>
                    <p className="text-blue-100 max-w-2xl mx-auto">
                        Join hundreds of agencies who have transformed their sales operations with RealSalePro
                    </p>
                </div>

                {/* Testimonial Carousel */}
                <div className="relative">
                    <div className="bg-white rounded-2xl p-8 md:p-12 shadow-2xl">
                        <Quote className="w-12 h-12 text-[#1673FF] mb-6" />
                        <p className="text-xl md:text-2xl text-gray-800 font-light leading-relaxed mb-8">
                            "{testimonials[activeIndex].quote}"
                        </p>
                        <div className="flex items-center gap-4">
                            <img
                                src={testimonials[activeIndex].image}
                                alt={testimonials[activeIndex].name}
                                className="w-16 h-16 rounded-full border-4 border-[#1673FF]"
                            />
                            <div>
                                <h4 className="font-bold text-[#0A1C37] text-lg">
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
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    activeIndex === index
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
                    <p className="text-blue-100 text-sm uppercase tracking-wider mb-8">
                        Trusted by 500+ Real Estate Agencies
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
                        {/* Placeholder for client logos */}
                        <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-lg">
                            <span className="text-white font-semibold">Client Logo 1</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-lg">
                            <span className="text-white font-semibold">Client Logo 2</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-lg">
                            <span className="text-white font-semibold">Client Logo 3</span>
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
                    <h3 className="text-3xl md:text-4xl font-bold text-[#0A1C37] mb-4">
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
                                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#1673FF] group"
                            >
                                <div className={`w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-7 h-7 ${prop.color}`} />
                                </div>
                                <h4 className="text-xl font-bold text-[#0A1C37] mb-3">
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
                    <h4 className="text-2xl font-bold text-[#0A1C37] mb-8 text-center">
                        Complete Real Estate Sales Solution
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                            <div>
                                <h5 className="font-semibold text-[#0A1C37] mb-1">
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
                                <h5 className="font-semibold text-[#0A1C37] mb-1">
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
                                <h5 className="font-semibold text-[#0A1C37] mb-1">
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
                                <h5 className="font-semibold text-[#0A1C37] mb-1">
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
                        <a
                            href="#pricing"
                            className="inline-flex items-center gap-2 bg-[#1673FF] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0A1C37] transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                            Start Your Free Trial
                            <ChevronDown className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
