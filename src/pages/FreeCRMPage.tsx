import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Check, ArrowRight, Shield, Zap, Users, Smartphone, 
  HelpCircle, ChevronDown, ChevronUp, Database, Download,
  Sparkles, Star, Lock, Award, FileSpreadsheet, Building2
} from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';

export function FreeCRMPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [teamSize, setTeamSize] = useState<number>(3);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const annualSavings = teamSize * 36000; // Average ₹3,000/user/mo on paid CRM

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
          "text": "You can either archive/delete older leads to stay on the 100% Free Forever plan, or easily upgrade to the Pro Plan for ₹1,000/month which gives you 2,00,000 leads capacity and unlimited users. Your data is always safe."
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
        "name": "Can my sales executives steal or copy my customer database?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. RealSalePro includes tenant-level phone number masking where the last 5 digits of customer numbers are hidden for non-admin executives, preventing database theft by disgruntled staff."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#07130E] text-slate-100 font-sans selection:bg-[#00E576] selection:text-[#07130E]">
      <SEOHead
        title="Free Real Estate CRM Software | 1,000 Leads Free Forever | RealSalePro"
        description="Looking for the best free CRM for real estate? RealSalePro gives you 1,000 leads free forever, Meta & WhatsApp auto-sync, site visit tracker & pipeline with no credit card required."
        canonicalUrl="https://realsalepro.com/free-real-estate-crm"
        keywords="free crm for real estate, free crm for realtors, best free crm for real estate, free real estate crm software, crm for real estate agents free, cheap crm for real estate, real estate crm software free download, best crm for real estate free"
        jsonLd={faqSchema}
      />

      {/* Navigation */}
      <nav className="border-b border-emerald-950/60 bg-[#07130E]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="/images/RealSalePro_Favicon.png" 
              alt="RealSalePro Logo" 
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-bold tracking-tight text-white flex items-center">
              RealSale<span className="text-[#00E576]">Pro</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Free Features</a>
            <a href="#why-free" className="hover:text-white transition-colors">Why It's Free</a>
            <a href="#comparison" className="hover:text-white transition-colors">Compare vs Paid</a>
            <Link to="/templates/real-estate-crm-excel-template" className="hover:text-white transition-colors flex items-center gap-1.5 text-emerald-400">
              <FileSpreadsheet size={15} /> Free Excel Template
            </Link>
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-xs sm:text-sm font-bold bg-[#00E576] hover:bg-[#00c853] text-[#07130E] px-4 py-2.5 rounded-full shadow-lg shadow-[#00E576]/20 transition-all hover:scale-105"
            >
              Claim Free Account →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-emerald-950/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(0,229,118,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-semibold mb-6">
            <Sparkles size={14} className="text-[#00E576]" />
            100% Free Forever • No Credit Card Required • Instant Setup
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            The #1 Free Real Estate CRM for <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E576] via-emerald-300 to-teal-400">
              Brokers, Realtors & Small Teams
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-300 leading-relaxed mb-10">
            Stop paying ₹15,000+ every month for bloated corporate software. RealSalePro gives you automatic Meta & WhatsApp lead sync, 
            a calm visual pipeline, site visit dispatching, and inventory management — 
            <strong className="text-white font-semibold"> 100% free up to 1,000 leads</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-[#00E576] to-emerald-400 text-[#07130E] text-base font-extrabold rounded-2xl shadow-xl shadow-[#00E576]/25 hover:opacity-95 hover:scale-[1.02] transition-all cursor-pointer"
            >
              Start Free — No Card Needed
              <ArrowRight size={18} />
            </Link>
            <a
              href="#comparison"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-base font-semibold rounded-2xl border border-white/10 transition-all"
            >
              Compare Free vs Paid CRMs
            </a>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6 border-t border-emerald-950/60">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#00E576]">₹0</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">To Get Started</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">1,000</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Free Active Leads</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">4.8 <Star size={18} className="inline text-amber-400 fill-amber-400 mb-1" /></div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">1,056+ Reviews</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">50+</div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Agencies Across India</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Included in Free Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-3">Complete Real Estate Toolkit</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            What You Get in the <span className="text-[#00E576]">Free-Forever Plan</span>
          </h2>
          <p className="text-slate-400 mt-3 text-base">
            Not a watered-down demo or 7-day trial. You get the whole product with zero time limit.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#00E576] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Database size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Up to 1,000 Active Leads</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Store contact numbers, property preferences, budgets, and full interaction timelines for up to 1,000 client prospects.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#00E576] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Meta & WhatsApp Webhooks</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Leads from Facebook Ads, Instagram, and web forms sync within 30 seconds. No manual data entry or copy-pasting.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#00E576] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Up to 5 User Seats</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Collaborate with your sales executives, telecallers, and site staff with separate role-based logins and assignments.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#00E576] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Site Visit & Inventory Management</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dispatch site visits, log driver feedback, share Google location pins with buyers, and track available unit inventory.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#00E576] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Lock size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Phone Number Masking & Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Prevent disgruntled staff or telecallers from copying your database. Hide the last 5 digits of customer numbers automatically.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-[#00E576] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Smartphone size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Field-Ready Mobile Access</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Update booking notes and site visits directly from your smartphone while standing at the project site, not at 9 PM on a laptop.
            </p>
          </div>
        </div>
      </section>

      {/* Why Is It Really Free Section (Addresses Skepticism) */}
      <section id="why-free" className="py-20 bg-emerald-950/20 border-y border-emerald-950/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Shield size={160} className="text-[#00E576]" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-[#00E576] text-xs font-bold mb-6">
              <Award size={14} /> Transparent Pricing Philosophy
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
              "Is it really free? What's the catch?"
            </h2>

            <div className="space-y-4 text-base text-slate-300 leading-relaxed max-w-3xl">
              <p>
                We hear this every day from property dealers and real estate founders who have been burned by "free trials" 
                that lock up their data after 7 days unless they swipe a credit card for ₹20,000.
              </p>
              <p>
                <strong className="text-white">Here is the honest truth:</strong> We built RealSalePro because existing real estate CRMs (like Sell.Do and LeadSquared) 
                charge exorbitant setup fees and ₹1,500+ per user per month. Small agencies and solo brokers cannot afford that before they even close their first deal.
              </p>
              <p>
                Our Free-Forever plan gives you up to <strong className="text-[#00E576]">1,000 active leads</strong> and 5 team accounts. 
                We only charge when you become a large agency with hundreds of bookings and cross 1,000 leads — at which point our Pro plan is just ₹1,000/month. 
                Until then, you pay <strong className="text-white">₹0, forever</strong>.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 pt-6 border-t border-white/10 text-xs sm:text-sm text-slate-400">
              <div className="flex items-center gap-2 text-white">
                <Check size={16} className="text-[#00E576]" /> No credit card needed
              </div>
              <div className="flex items-center gap-2 text-white">
                <Check size={16} className="text-[#00E576]" /> No expiring 14-day timer
              </div>
              <div className="flex items-center gap-2 text-white">
                <Check size={16} className="text-[#00E576]" /> 1-click CSV database export
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="comparison" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-3">Honest Breakdown</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            RealSalePro Free vs Traditional Paid CRMs
          </h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            See how our Free plan stacks up against tools that charge tens of thousands per month.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-slate-300">
              <tr>
                <th className="py-4 px-6 font-semibold">Capability</th>
                <th className="py-4 px-6 font-bold text-[#00E576] bg-emerald-500/10">RealSalePro Free Plan</th>
                <th className="py-4 px-6 font-semibold">Sell.Do / LeadSquared</th>
                <th className="py-4 px-6 font-semibold">Excel / Google Sheets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-4 px-6 font-medium text-white">Monthly Subscription</td>
                <td className="py-4 px-6 font-extrabold text-[#00E576] bg-emerald-500/5">₹0 / forever</td>
                <td className="py-4 px-6 text-rose-400 font-medium">₹15,000 – ₹50,000/mo</td>
                <td className="py-4 px-6 text-slate-300">Free (High labor cost)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Credit Card Required</td>
                <td className="py-4 px-6 font-bold text-[#00E576] bg-emerald-500/5">No (Never asked)</td>
                <td className="py-4 px-6 text-slate-400">Yes</td>
                <td className="py-4 px-6 text-slate-300">No</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Lead Capacity</td>
                <td className="py-4 px-6 font-bold text-white bg-emerald-500/5">Up to 1,000 Leads</td>
                <td className="py-4 px-6 text-slate-400">Strict per-lead billing</td>
                <td className="py-4 px-6 text-slate-300">Crashes with large data</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Meta / WhatsApp Auto-Sync</td>
                <td className="py-4 px-6 font-bold text-[#00E576] bg-emerald-500/5">
                  <Check size={18} className="inline mr-1 text-[#00E576]" /> Included Free
                </td>
                <td className="py-4 px-6 text-slate-400">Expensive add-on integration</td>
                <td className="py-4 px-6 text-rose-400">None (Manual typing)</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Site Visit Tracking & Driver Log</td>
                <td className="py-4 px-6 font-bold text-[#00E576] bg-emerald-500/5">
                  <Check size={18} className="inline mr-1 text-[#00E576]" /> Included Free
                </td>
                <td className="py-4 px-6 text-slate-400">Extra module fees</td>
                <td className="py-4 px-6 text-rose-400">None</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Staff Lead Theft Masking</td>
                <td className="py-4 px-6 font-bold text-[#00E576] bg-emerald-500/5">
                  <Check size={18} className="inline mr-1 text-[#00E576]" /> Included Free
                </td>
                <td className="py-4 px-6 text-slate-400">Enterprise tier only</td>
                <td className="py-4 px-6 text-rose-400">Zero security</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-medium text-white">Setup / Onboarding Fee</td>
                <td className="py-4 px-6 font-extrabold text-[#00E576] bg-emerald-500/5">₹0 (Self-serve)</td>
                <td className="py-4 px-6 text-rose-400 font-medium">₹25,000 – ₹50,000</td>
                <td className="py-4 px-6 text-slate-300">None</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Savings Calculator */}
      <section className="py-16 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Calculate How Much You Save With RealSalePro Free
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Compared to standard paid CRMs charging ₹1,500 – ₹3,000 per user per month.
          </p>

          <div className="p-8 rounded-2xl bg-[#0B1E15] border border-emerald-500/20 max-w-xl mx-auto">
            <div className="mb-6">
              <label className="text-sm font-semibold text-slate-300 block mb-3">
                Your Sales Team Size: <span className="text-[#00E576] font-bold text-lg">{teamSize} Users</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value, 10))}
                className="w-full accent-[#00E576] h-2 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1 Solo Broker</span>
                <span>2 Agents</span>
                <span>3 Telecallers</span>
                <span>4 Staff</span>
                <span>5 Full Team</span>
              </div>
            </div>

            <div className="pt-6 border-t border-emerald-950/60">
              <div className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Estimated Annual Money Saved</div>
              <div className="text-4xl font-extrabold text-[#00E576] mt-1">
                ₹{annualSavings.toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-400">/ year</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Plus zero setup fees and zero lost leads from missed follow-ups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Magnet Callout (Cross Link to Template Page) */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-[#00E576] flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Still Prefer Excel or Google Sheets?</h3>
              <p className="text-sm text-slate-300">
                Download our free pre-configured 2026 Real Estate CRM spreadsheet with pipeline stages and visit tracker.
              </p>
            </div>
          </div>
          <Link
            to="/templates/real-estate-crm-excel-template"
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/15 transition-all"
          >
            <Download size={16} /> Download Free Excel Template
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-3">Got Questions?</div>
          <h2 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Is RealSalePro really 100% free forever?",
              a: "Yes. Our Free plan has no time limit, no expiration date, and requires no credit card. You can keep using it forever up to 1,000 active leads and 5 team accounts."
            },
            {
              q: "What happens when I reach 1,000 leads?",
              a: "You will receive a notification. You can either delete old disqualified leads to maintain space under 1,000 leads for free, or upgrade to our Pro plan (₹1,000/month) for a massive 2,00,000 leads capacity."
            },
            {
              q: "Can I import my existing customer list from Excel or Google Sheets?",
              a: "Yes! RealSalePro provides a simple CSV/Excel bulk import tool. You can upload thousands of leads in under 30 seconds with automatic duplicate phone number detection."
            },
            {
              q: "Can I export my database if I ever want to leave?",
              a: "100% yes. You own your data completely. You can export your entire database into Excel/CSV with all client notes and dates at any time."
            },
            {
              q: "Does this free real estate CRM work on mobile phones?",
              a: "Yes. RealSalePro is designed as a responsive mobile-first web app (PWA). Your executives can update site visit notes, call clients, and check floor inventory directly on their phones."
            },
            {
              q: "How does the Meta and WhatsApp auto-sync work?",
              a: "Under Settings > Integrations, you can connect your Facebook Lead Ads page or WhatsApp webhook in a couple of clicks. Any new inquiry instantly lands in your RealSalePro New Leads column."
            }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left py-4 px-6 flex items-center justify-between text-base font-semibold text-white focus:outline-none cursor-pointer"
              >
                <span>{item.q}</span>
                {openFaq === idx ? (
                  <ChevronUp size={18} className="text-[#00E576] flex-shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 border-t border-emerald-950/60 bg-gradient-to-b from-[#07130E] to-[#040C09] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-[#00E576] mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6">
            Ready to Supercharge Your Real Estate Pipeline?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10">
            Join 10,000+ real estate brokers and developers across India who manage leads without spending a fortune.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 px-10 py-4 bg-[#00E576] hover:bg-[#00c853] text-[#07130E] text-base font-extrabold rounded-2xl shadow-2xl shadow-[#00E576]/30 transition-all hover:scale-105 cursor-pointer"
          >
            Claim Your Free Account Now
            <ArrowRight size={18} />
          </Link>
          <div className="text-xs text-slate-500 mt-4">
            Takes 60 seconds • No credit card required • Instant dashboard access
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-950/80 bg-[#040C09] py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/images/RealSalePro_Favicon.png" alt="RealSalePro Logo" className="w-6 h-6 object-contain" />
            <span className="font-semibold text-slate-300">RealSalePro © {new Date().getFullYear()}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/templates/real-estate-crm-excel-template" className="hover:text-white">Free Excel Template</Link>
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white">Terms of Service</Link>
            <Link to="/contact" className="hover:text-white">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
