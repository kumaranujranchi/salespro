import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    Users,
    Target,
    BarChart3,
    Shield,
    Zap,
    Globe,
    CheckCircle,
    ArrowRight,
    Menu,
    X,
    ChevronDown,
    Check
} from 'lucide-react';
import { ParticlesBackground } from '../components/ui/ParticlesBackground';

export function LandingPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLoginClick = () => {
        setIsLoading(true);
        setTimeout(() => {
            navigate('/login');
        }, 500);
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    const features = [
        {
            icon: Users,
            title: 'Team Management',
            description: 'Manage your sales team with role-based access control and hierarchical structures.',
            color: 'bg-blue-500'
        },
        {
            icon: Target,
            title: 'Target Tracking',
            description: 'Set and monitor sales targets with real-time progress tracking and analytics.',
            color: 'bg-green-500'
        },
        {
            icon: BarChart3,
            title: 'Advanced Analytics',
            description: 'Gain insights with comprehensive reports and visual dashboards.',
            color: 'bg-purple-500'
        },
        {
            icon: TrendingUp,
            title: 'Sales Pipeline',
            description: 'Track deals from lead to close with our intuitive pipeline management.',
            color: 'bg-orange-500'
        },
        {
            icon: Shield,
            title: 'Secure & Compliant',
            description: 'Enterprise-grade security with role-based permissions and data encryption.',
            color: 'bg-red-500'
        },
        {
            icon: Zap,
            title: 'Real-time Updates',
            description: 'Stay informed with instant notifications and live data synchronization.',
            color: 'bg-yellow-500'
        }
    ];

    const benefits = [
        'Increase sales productivity by up to 40%',
        'Reduce administrative tasks by 60%',
        'Improve team collaboration and communication',
        'Make data-driven decisions with real-time insights',
        'Scale your sales operations effortlessly',
        'Access from anywhere, on any device'
    ];

    const pricingPlans = [
        {
            name: 'Monthly',
            price: '₹1,500',
            period: '/month',
            description: 'Full access, billed monthly',
            features: [
                'All Pro Features Included',
                'Unlimited Users',
                'Real-time Analytics',
                'Priority Email Support',
                '30-Day Free Trial'
            ],
            buttonText: 'Start Monthly Trial',
            popular: false
        },
        {
            name: '6 Months',
            price: '₹1,200',
            period: '/month',
            billing: 'Billed ₹7,200 semi-annually',
            description: 'Save 20% with 6-month commitment',
            features: [
                'All Pro Features Included',
                'Unlimited Users',
                'Real-time Analytics',
                'Priority Email Support',
                '30-Day Free Trial'
            ],
            buttonText: 'Start 6-Month Trial',
            popular: true
        },
        {
            name: 'Yearly',
            price: '₹1,000',
            period: '/month',
            billing: 'Billed ₹12,000 annually',
            description: 'Best Value: Save 33% yearly',
            features: [
                'All Pro Features Included',
                'Unlimited Users',
                'Real-time Analytics',
                'Priority Email Support',
                '30-Day Free Trial'
            ],
            buttonText: 'Start Yearly Trial',
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden font-sans text-gray-900">
            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 20 ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3">
                            <img
                                src={scrollY > 20 ? "/logo.png" : "/logo-light.png"}
                                alt="WishPro Logo"
                                className="h-10 w-auto object-contain transition-all duration-300"
                            />
                            <div>
                                <h1 className={`text-2xl font-bold ${scrollY > 20 ? 'text-[#0A1C37]' : 'text-white'} transition-colors`}>WishPro</h1>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {['Features', 'Benefits', 'Pricing', 'About'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className={`text-sm font-medium hover:text-[#1673FF] transition-colors ${scrollY > 20 ? 'text-gray-700' : 'text-gray-200'}`}
                                >
                                    {item}
                                </a>
                            ))}
                            <button
                                onClick={handleLoginClick}
                                className={`text-sm font-semibold transition-colors ${scrollY > 20 ? 'text-gray-700 hover:text-[#1673FF]' : 'text-white hover:text-gray-200'}`}
                            >
                                Login
                            </button>
                            <button
                                onClick={handleRegisterClick}
                                disabled={isLoading}
                                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${scrollY > 20
                                    ? 'bg-[#1673FF] text-white hover:bg-[#0A1C37]'
                                    : 'bg-white text-[#1673FF] hover:bg-gray-100'
                                    }`}
                            >
                                Start Free Trial
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className={`md:hidden p-2 rounded-lg hover:bg-white/10 ${scrollY > 20 ? 'text-gray-900' : 'text-white'}`}
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-white border-t animate-fadeIn absolute w-full shadow-xl">
                        <div className="px-4 py-4 space-y-3">
                            {['Features', 'Benefits', 'Pricing', 'About'].map((item) => (
                                <a
                                    key={item}
                                    href={`#${item.toLowerCase()}`}
                                    className="block py-2 text-gray-700 hover:text-[#1673FF] font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {item}
                                </a>
                            ))}
                            <button
                                onClick={handleLoginClick}
                                className="block w-full text-left py-2 text-gray-700 hover:text-[#1673FF] font-medium"
                            >
                                Login
                            </button>
                            <button
                                onClick={handleRegisterClick}
                                className="w-full px-6 py-3 bg-[#1673FF] text-white rounded-lg hover:bg-[#0A1C37] transition-all font-semibold"
                            >
                                Start 30-Day Free Trial
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-[#0A1C37] overflow-hidden">
                {/* Dynamic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A1C37] via-[#112D55] to-[#1673FF] opacity-90"></div>

                {/* Particle Effects */}
                <ParticlesBackground />

                {/* Decorative Glowing Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1673FF] rounded-full blur-[128px] opacity-20 animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px] opacity-20 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

                <div className="max-w-7xl mx-auto relative z-10 w-full">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8 animate-slideInLeft text-center lg:text-left">
                            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                                <Globe size={16} className="text-[#1673FF]" />
                                <span className="text-sm text-gray-200">Start your 30-day free trial today</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white tracking-tight">
                                Transform Your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1673FF] via-[#60A5FA] to-white">
                                    Sales Reality
                                </span>
                            </h1>

                            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                The all-in-one platform engineered for modern sales teams.
                                Track targets, streamline pipelines, and accelerate revenue with AI-driven insights.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button
                                    onClick={handleRegisterClick}
                                    className="group px-8 py-4 bg-[#1673FF] text-white rounded-xl font-bold text-lg hover:bg-[#1361D6] hover:shadow-[0_0_20px_rgba(22,115,255,0.5)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                                >
                                    <span>Start Free Trial</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center">
                                    Book Demo
                                </button>
                            </div>

                            <div className="pt-8 border-t border-white/10 flex justify-center lg:justify-start gap-12 text-gray-400">
                                <div className="text-center lg:text-left">
                                    <div className="text-3xl font-bold text-white mb-1">30 Days</div>
                                    <div className="text-sm">Free Access</div>
                                </div>
                                <div className="text-center lg:text-left">
                                    <div className="text-3xl font-bold text-white mb-1">No Card</div>
                                    <div className="text-sm">Required</div>
                                </div>
                                <div className="text-center lg:text-left">
                                    <div className="text-3xl font-bold text-white mb-1">10k+</div>
                                    <div className="text-sm">Active Users</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Parallax Illustration */}
                        <div className="relative animate-slideInRight hidden lg:block" style={{ transform: `translateY(${scrollY * 0.05}px)` }}>
                            <div className="relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-700 ease-out">
                                {/* Glass Card Content - Abstract Dashboard */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="h-2 w-20 bg-white/20 rounded-full"></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-white/10 p-4 rounded-xl">
                                        <div className="h-8 w-8 bg-blue-500 rounded-lg mb-3 flex items-center justify-center">
                                            <TrendingUp size={16} className="text-white" />
                                        </div>
                                        <div className="text-2xl font-bold text-white mb-1">₹8.4M</div>
                                        <div className="text-xs text-blue-200">+12.5% vs last month</div>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-xl">
                                        <div className="h-8 w-8 bg-green-500 rounded-lg mb-3 flex items-center justify-center">
                                            <Users size={16} className="text-white" />
                                        </div>
                                        <div className="text-2xl font-bold text-white mb-1">1,240</div>
                                        <div className="text-xs text-green-200">Active Leads</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="h-24 bg-white/5 rounded-xl border border-white/5 p-3 flex items-end justify-between gap-2">
                                        {/* Fake Chart Bars */}
                                        {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                                            <div key={i} className="w-full bg-blue-500/50 hover:bg-blue-500 transition-colors rounded-t-sm" style={{ height: `${h}%` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -top-10 -right-10 bg-white p-4 rounded-xl shadow-xl animate-bounce-in" style={{ animationDelay: '1s' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-800">Deal Closed!</div>
                                        <div className="text-xs text-gray-500">Just now • ₹450,000</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce text-white/50">
                    <span className="text-xs mb-2 tracking-widest uppercase">Explore</span>
                    <ChevronDown size={24} />
                </div>

                {/* Bottom Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto text-white">
                        <path fill="currentColor" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                    </svg>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 animate-fadeIn">
                        <h2 className="text-sm font-bold text-[#1673FF] tracking-widest uppercase mb-3">Capabilities</h2>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#0A1C37] mb-6">
                            Everything You Need to Succeed
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            A complete suite of tools designed to help your team perform at their absolute best.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:border-[#1673FF]/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-2"
                            >
                                <div className={`w-14 h-14 ${feature.color} bg-opacity-10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon size={28} className={feature.color.replace('bg-', 'text-')} />
                                </div>
                                <h3 className="text-xl font-bold text-[#0A1C37] mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider - Skewed */}
            <div className="h-24 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 80%)' }}></div>


            {/* Benefits Section - Dark Mode Contrast */}
            <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0F172A] text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#1673FF 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Right - Image/Visual (Swapped for variety) */}
                        <div className="order-2 md:order-1 relative animate-slideInLeft">
                            <div className="absolute inset-0 bg-[#1673FF] blur-[100px] opacity-20"></div>
                            <img
                                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800"
                                alt="Team Success"
                                className="rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 border-4 border-white/10 relative z-10"
                            />
                            {/* Floating Stats */}
                            <div className="absolute bottom-10 -left-10 bg-white text-gray-900 p-6 rounded-xl shadow-xl z-20">
                                <div className="text-4xl font-bold text-[#1673FF] mb-1">3.5x</div>
                                <div className="text-sm font-semibold">ROI Average</div>
                            </div>
                        </div>

                        {/* Left - Benefits List */}
                        <div className="order-1 md:order-2 space-y-8 animate-slideInRight">
                            <div>
                                <h2 className="text-sm font-bold text-[#1673FF] tracking-widest uppercase mb-3">Why Us?</h2>
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                                    Built for High-Growth Sales Teams
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {benefits.map((benefit, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start space-x-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-default"
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mt-1">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-lg text-gray-200 font-medium">{benefit}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Divider - Curve */}
            <div className="h-16 bg-[#0F172A]" style={{ clipPath: 'ellipse(70% 100% at 50% 100%)' }}></div>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-bold text-[#1673FF] tracking-widest uppercase mb-3">Pricing Plans</h2>
                        <h2 className="text-4xl md:text-5xl font-bold text-[#0A1C37] mb-6">
                            Transparent Pricing
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Choose the plan that fits your growth. Start with a 30-day free trial on any plan.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <div
                                key={index}
                                className={`relative bg-white rounded-2xl shadow-xl flex flex-col p-8 transition-transform duration-300 hover:-translate-y-2 ${plan.popular ? 'border-2 border-[#1673FF] ring-4 ring-[#1673FF]/10 scale-105 z-10' : 'border border-gray-100'}`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-[#1673FF] text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="text-2xl font-bold text-[#0A1C37] mb-2">{plan.name}</h3>
                                <div className="flex items-baseline mb-2">
                                    <span className="text-4xl font-extrabold text-[#0A1C37]">{plan.price}</span>
                                    <span className="text-gray-500 ml-1">{plan.period}</span>
                                </div>
                                {plan.billing && (
                                    <p className="text-sm text-green-600 font-medium mb-4">{plan.billing}</p>
                                )}
                                <p className="text-gray-500 mb-6">{plan.description}</p>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start">
                                            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                            <span className="text-gray-600 text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={handleRegisterClick}
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${plan.popular
                                        ? 'bg-[#1673FF] text-white hover:bg-[#1361D6] shadow-lg hover:shadow-blue-500/30'
                                        : 'bg-gray-100 text-[#0A1C37] hover:bg-gray-200'
                                        }`}
                                >
                                    {plan.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-gradient-to-r from-[#1673FF] to-[#0A1C37] rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-10 blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full opacity-10 blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Supercharge Your Sales?</h2>
                            <p className="text-xl text-gray-100 mb-10 max-w-2xl mx-auto">
                                Join thousands of sales professionals who trust WishPro.
                                <br />
                                <span className="font-bold text-white">Start your 30-day free trial now.</span>
                            </p>
                            <button
                                onClick={handleRegisterClick}
                                className="px-10 py-4 bg-white text-[#1673FF] rounded-xl font-bold text-lg hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50"
                            >
                                Start Free Trial
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section (Simplified) */}
            <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">About WishPro</h2>
                    <p className="text-2xl md:text-3xl text-gray-700 font-light leading-relaxed mb-8">
                        "We believe that sales should be about relationships, not paperwork.
                        <strong className="text-[#0A1C37] font-bold"> WishPro </strong>
                        removes the friction from sales management so you can focus on what matters most: closing deals."
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0A1C37] text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-3 mb-6">
                                <TrendingUp size={32} className="text-[#1673FF]" />
                                <span className="text-2xl font-bold">WishPro</span>
                            </div>
                            <p className="text-gray-400 max-w-sm leading-relaxed mb-6">
                                Empowering sales teams worldwide with intelligent tools and real-time insights.
                                Built for the future of sales.
                            </p>
                            <div className="flex space-x-4">
                                {/* Social placeholders */}
                                <div className="w-10 h-10 bg-white/5 rounded-full hover:bg-[#1673FF] transition-colors cursor-pointer flex items-center justify-center">
                                    <span className="sr-only">Twitter</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                                </div>
                                <div className="w-10 h-10 bg-white/5 rounded-full hover:bg-[#1673FF] transition-colors cursor-pointer flex items-center justify-center">
                                    <span className="sr-only">LinkedIn</span>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6">Platform</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#features" className="hover:text-[#1673FF] transition-colors">Features</a></li>
                                <li><a href="#benefits" className="hover:text-[#1673FF] transition-colors">Benefits</a></li>
                                <li><a href="#pricing" className="hover:text-[#1673FF] transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-[#1673FF] transition-colors">Integration</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6">Company</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#about" className="hover:text-[#1673FF] transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-[#1673FF] transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-[#1673FF] transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-[#1673FF] transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>&copy; 2024 WishPro. All rights reserved.</p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
            {/* WhatsApp Floating Button */}
            <a
                href="https://wa.me/919525230232"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-green-500/30 hover:scale-110 transition-all duration-300 flex items-center justify-center animate-bounce-in"
                aria-label="Chat on WhatsApp"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
            </a>
        </div>
    );
}
