import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AffiliateTermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-[#0E1A15] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
            <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center gap-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800"
            >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
            Back
            </button>
            <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Effective Date</p>
                <p className="text-gray-900 dark:text-white font-semibold">December 20, 2025</p>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
          {/* Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-[#0E1A15] px-8 py-12 md:px-12 md:py-16 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                   <ShieldCheck className="w-64 h-64 text-white transform rotate-12" />
               </div>
               <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-emerald-200 text-sm font-medium mb-4 border border-white/10">
                        <FileText className="w-4 h-4" /> Legal Agreement
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                        Partner Program <span className="text-emerald-400">Terms</span>
                    </h1>
                    <p className="text-emerald-100/80 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                        Please review our terms and conditions carefully. By joining the RealSalePro Affiliate Program, you agree to abide by these guidelines to ensure a fair and successful partnership.
                    </p>
               </div>
          </div>

          <div className="p-8 md:p-12 space-y-12">
            
            {/* 1. Introduction */}
            <div className="prose prose-emerald max-w-none dark:prose-invert">
                <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">1</span>
                        Introduction
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11">
                    This Affiliate Partner Program Agreement ("Agreement") constitutes a legal agreement between RealSalePro ("Company", "we", "us", or "our") and the individual or entity applying to participate in the RealSalePro Affiliate Partner Program ("Affiliate", "you", or "your"). By submitting an application or participating in the Program, you agree to be bound by the terms and conditions set forth in this Agreement.
                    </p>
                </div>

                <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">2</span>
                        Enrollment and Status
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11">
                    Enrollment in the Program is subject to our approval. We may reject or terminate your application or status at any time, for any reason, at our sole discretion. You must provide accurate and complete information during the registration process.
                    </p>
                </div>

                <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">3</span>
                        Referral Links and Promotion
                    </h3>
                    <div className="ml-11 text-gray-600 dark:text-gray-300">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Unique Link:</strong> You will be issued a unique referral code and link. You are responsible for ensuring these are used correctly to track referrals.</li>
                            <li><strong>Allowed Channels:</strong> You may promote RealSalePro via your website, blog, social media channels, email newsletters, and direct networking.</li>
                            <li><strong>Prohibited Activities:</strong> You strictly agree NOT to:
                                <ul className="list-circle pl-5 mt-2 space-y-1">
                                    <li>Send unsolicited email (SPAM) or violate any anti-spam laws.</li>
                                    <li>Bid on branded keywords (e.g., "RealSalePro", "RealSalePro Login") in Pay-Per-Click (PPC) advertising.</li>
                                    <li>Misrepresent the Company, its products, or prices.</li>
                                    <li>Offer cash rebates or kickbacks to users without our prior written consent.</li>
                                    <li>Use any illegal, offensive, or infringing content in your promotions.</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">4</span>
                        Commissions and Payouts
                    </h3>
                     <div className="ml-11 text-gray-600 dark:text-gray-300">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Commission Rate:</strong> You will earn a recurring commission of 20% on the subscription fees actually paid by customers you refer, for up to 12 months from their signup date, provided they remain active subscribers.</li>
                            <li><strong>Payment Schedule:</strong> Commissions are calculated monthly. Payouts are made within 30 days after the end of the month in which the commission exceeded the minimum payout threshold.</li>
                            <li><strong>Minimum Payout:</strong> The minimum payout threshold is ₹2,000 (or equivalent in other currencies). Earnings below this amount will roll over to the next month.</li>
                            <li><strong>Refunds/Chargebacks:</strong> If a referred customer requests a refund or issues a chargeback, any commission earned on that transaction will be deducted from your future earnings.</li>
                        </ul>
                    </div>
                </div>

                 <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">5</span>
                        Independent Contractor Relationship
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11">
                    You are an independent contractor, not an employee, agent, or partner of the Company. You have no authority to bind the Company to any agreement or obligation. You are solely responsible for all taxes, fees, and other costs associated with your participation in the Program.
                    </p>
                </div>

                 <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">6</span>
                        Intellectual Property
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11">
                    RealSalePro grants you a non-exclusive, non-transferable, revocable license to use our logos, trade names, and marketing materials solely for the purpose of promoting our services in accordance with this Agreement. You may not modify our intellectual property without prior written consent.
                    </p>
                </div>

                 <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">7</span>
                        Limitation of Liability
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11 uppercase font-medium">
                    TO THE FULLEST EXTENT PERMITTED BY LAW, REALSALEPRO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, REVENUE, OR DATA, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR THE PROGRAM. OUR TOTAL LIABILITY SHALL NOT EXCEED THE TOTAL COMMISSIONS PAID TO YOU UNDER THIS AGREEMENT IN THE SIX (6) MONTHS PRIOR TO THE CLAIM.
                    </p>
                </div>
                
                 <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">8</span>
                        Indemnification
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11">
                    You agree to indemnify, defend, and hold harmless RealSalePro and its officers, directors, employees, and agents from any claims, damages, liabilities, costs, and expenses (including legal fees) arising from your participation in the Program, your marketing activities, or your breach of this Agreement.
                    </p>
                </div>

                 <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">9</span>
                        Termination
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11">
                    Either party may terminate this Agreement at any time, with or without cause, by giving written notice. Upon termination, you must immediately cease all use of our intellectual property and remove all referral links. Any outstanding commissions earned prior to termination will be paid in the next scheduled cycle, provided the amount meets the minimum threshold.
                    </p>
                </div>

                <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">10</span>
                        Governing Law
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11">
                    This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of the courts in Ranchi, Jharkhand.
                    </p>
                </div>

                 <div className="mb-10">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-sm">11</span>
                        Modifications
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed ml-11">
                    We reserve the right to modify these terms at any time. We will notify you of any material changes via email or dashboard notification. Your continued participation in the Program after such changes constitutes acceptance of the new terms.
                    </p>
                </div>

            </div>

            {/* Footer Note */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 text-center border border-gray-100 dark:border-gray-800">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                    Have questions about the program?
                </p>
                <a href="mailto:partners@realsalepro.com" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                    Contact Partner Support
                </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
