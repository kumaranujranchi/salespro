import { Mail, ArrowRight, Gift, Percent, Share2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ReferralProgramPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation (Simplified) */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <Link to="/" className="flex items-center gap-2">
              <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro" className="h-8 w-auto dark:hidden" />
              <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro" className="h-16 w-auto hidden dark:block" />
              <span className="font-bold text-xl text-gray-900 dark:text-white">RealSalePro</span>
           </Link>
           <div className="flex gap-4 items-center">
             <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium flex items-center gap-2">
                 <ArrowLeft className="w-4 h-4" />
                 <span className="hidden sm:inline">Back to Home</span>
             </Link>
             <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">Login</Link>
             <Link to="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">Get Started</Link>
           </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative py-20 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/20 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Refer & Earn with <span className="text-emerald-600">RealSalePro</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
            Join our partner program and earn high commissions for every new customer you bring. 
            Give your audience a discount, and build a passive income stream.
          </p>
          <a href="mailto:support@realsalepro.com?subject=Referral%20Partner%20Application" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
             <Mail className="w-5 h-5" />
             Apply Now via Email
          </a>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-20 max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
           <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
                <Percent className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">20% Commission</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Earn 20% of the subscription revenue for every customer you refer, for as long as they stay subscribed.
              </p>
           </div>
           <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600 dark:text-purple-400">
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">10% Discount</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your referrals get a flat 10% discount on their subscription when they use your unique code.
              </p>
           </div>
           <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                <Share2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Easy Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track your clicks, conversions, and payouts in real-time through our dedicated partner dashboard.
              </p>
           </div>
        </div>
      </div>

      {/* How to Join */}
      <div className="bg-gray-50 dark:bg-gray-800/50 py-20">
        <div className="max-w-4xl mx-auto px-4">
           <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How to Enroll?</h2>
           
           <div className="space-y-8">
              <div className="flex gap-6 items-start">
                 <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
                 <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Request an Account</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Send an email to <a href="mailto:support@realsalepro.com" className="text-emerald-600 font-medium hover:underline">support@realsalepro.com</a> with the subject "Referral Partner Request". 
                      Please include your name, platform details (YouTube, Blog, etc.), and how you plan to promote usage.
                    </p>
                 </div>
              </div>

              <div className="flex gap-6 items-start">
                 <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
                 <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get Your Unique Code</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Our team will review your application. Once approved, we will generate a unique referral code (e.g. <strong>YOURNAME20</strong>) and email it back to you along with dashboard access.
                    </p>
                 </div>
              </div>

              <div className="flex gap-6 items-start">
                 <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
                 <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Start Earning</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Share your code with your audience. You will receive an email notification for every successful signup, and payouts are processed monthly.
                    </p>
                 </div>
              </div>
           </div>

           <div className="mt-12 text-center">
              <a href="mailto:support@realsalepro.com?subject=Referral%20Partner%20Application" className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition">
                 Email Us to Enroll <ArrowRight className="w-4 h-4" />
              </a>
           </div>
        </div>
      </div>

       {/* Footer */}
       <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-6 flex justify-center items-center gap-2">
            <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro" className="h-8 w-auto" />
            <span className="font-bold text-xl">RealSalePro</span>
          </div>
          <p className="text-gray-400 mb-6">
            Empowering real estate professionals with modern sales tools.
          </p>
          <div className="flex justify-center gap-6 mb-8 text-sm">
             <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
             <Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
             <Link to="/refund-policy" className="text-gray-400 hover:text-white">Refund Policy</Link>
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Synergy Brand Architect. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
