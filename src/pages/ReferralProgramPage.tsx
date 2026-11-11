import { Mail, ArrowRight, Gift, Percent, Share2, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';

const referralSchema = {
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
          "name": "Referral Program",
          "item": "https://realsalepro.com/referral-program"
        }
      ]
    },
    {
      "@type": "WebPage",
      "@id": "https://realsalepro.com/referral-program#webpage",
      "url": "https://realsalepro.com/referral-program",
      "name": "RealSalePro Referral Program — Earn 20% Rewards",
      "description": "Join the RealSalePro Referral Program. Refer real estate builders and brokers and earn 20% recurring commission on every subscription referral.",
      "isPartOf": { "@id": "https://realsalepro.com/#website" }
    }
  ]
};

export function ReferralProgramPage() {
  return (
    <>
      <SEOHead
        title="RealSalePro Referral Program — Earn 20% Rewards"
        description="Join the RealSalePro Referral Program. Refer real estate builders and brokers and earn 20% recurring commission on every subscription referral."
        canonicalUrl="https://realsalepro.com/referral-program"
        keywords="real estate crm referral, affiliate program real estate crm, earn recurring commission, saas partner program india"
        jsonLd={referralSchema}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Navigation */}
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/assets/img/logo-light.png" alt="RealSalePro CRM" className="h-8 w-auto object-contain dark:block hidden" />
              <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro CRM" className="h-8 w-auto object-contain dark:hidden block" />
            </Link>
            <div className="flex gap-4 items-center">
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-2 text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Link>
              <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm">Login</Link>
              <Link to="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-semibold">Get Started Free</Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative py-20 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900 border-b border-emerald-900/10">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 mb-4">
              RealSalePro Partner Network
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
              Refer Indian Real Estate Teams &amp; Earn <span className="text-emerald-600 dark:text-emerald-400">20% Recurring Commission</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              Help property developers, channel partners, and real estate brokers modernize their sales pipeline. Earn 20% monthly recurring commission for every active subscription you refer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/affiliate/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-xl text-base font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">
                <Mail className="w-5 h-5" />
                Join the Partner Program
              </Link>
              <Link to="/affiliate/terms" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-6 py-3.5 rounded-xl text-base font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                Review Partner Agreement
              </Link>
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
              Why Partner with RealSalePro?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
              India's real estate market is rapidly moving away from unorganized Excel sheets and chaotic WhatsApp groups. RealSalePro offers high conversion rates and lasting customer retention.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                <Percent className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">20% Recurring Payout</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Receive 20% of subscription revenue every month for the lifetime of every customer who signs up through your link or referral code.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
                <Gift className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">10% Discount for Your Network</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Your referred contacts and client companies receive an exclusive 10% discount on all Pro plans, ensuring higher signup and activation conversion rates.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                <Share2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Real-Time Portal &amp; Payouts</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Track referral clicks, active paying tenants, and monthly accrued commissions via your dedicated affiliate partner dashboard.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-gray-50 dark:bg-gray-800/40 py-20 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-12">
              Three Simple Steps to Get Started
            </h2>
            
            <div className="space-y-8">
              <div className="flex gap-6 items-start bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg">1</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">Sign Up as a Partner</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Complete our quick <Link to="/affiliate/register" className="text-emerald-600 font-medium hover:underline">Affiliate Registration form</Link> with your contact details and payout information. Approval is typically processed within 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg">2</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">Receive Your Custom Link &amp; Promo Code</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    You'll get a tracking link and a custom coupon code (e.g. <span className="font-mono font-semibold text-emerald-600">VIP20</span>) that entitles your clients to instant discounts and attaches their workspace to your profile.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-lg">3</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">Collect Monthly Bank Payouts</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    Commission earnings are tallied every month and disbursed directly via NEFT/IMPS bank transfer or UPI once you reach the ₹1,000 threshold.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link to="/affiliate/register" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20">
                Enroll as a Partner Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Referral Program FAQ */}
        <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 dark:text-white mb-10">
            Referral Program Questions &amp; Answers
          </h2>
          <div className="space-y-6 text-sm">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">Who is eligible to join?</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Real estate consultants, digital marketing firms, proptech influencers, trainers, website developers, and active RealSalePro customers can all participate in the program.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">How long is the tracking cookie valid?</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Our referral tracking links carry a 60-day cookie window. If a referred visitor signs up within 60 days of clicking your link, the subscription is permanently attributed to you.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">When and how do I get paid?</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Payouts are processed by the 10th of every calendar month for the preceding month's earnings via Indian bank transfer (NEFT/IMPS) or UPI.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="mb-6 flex justify-center items-center gap-2">
              <img src="/assets/img/logo-light.png" alt="RealSalePro CRM" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-gray-400 mb-6 text-sm">
              Empowering real estate professionals with modern sales, pipeline, and WhatsApp automation tools.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
              <Link to="/affiliate/terms" className="text-gray-400 hover:text-white">Partner Agreement</Link>
              <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
              <Link to="/refund-policy" className="text-gray-400 hover:text-white">Refund Policy</Link>
              <Link to="/shipping-policy" className="text-gray-400 hover:text-white">Digital Delivery</Link>
              <Link to="/sitemap" className="text-gray-400 hover:text-white">Site Map</Link>
            </div>
            <p className="text-gray-500 text-xs">
              &copy; {new Date().getFullYear()} RealSalePro (Synergy Brand Architect). All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
