import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, FileSpreadsheet, Tag, Mail } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';

export function NotFoundPage() {
  return (
    <>
      <SEOHead
        title="404: Page Not Found | RealSalePro"
        description="The page you are looking for does not exist or has been moved. Explore RealSalePro's free real estate CRM tools, pricing, and features."
        canonicalUrl="https://realsalepro.com/404"
        noindex={true}
      />

      <div className="min-h-screen bg-[#0A1C14] text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
        {/* Navigation Bar */}
        <header className="border-b border-emerald-950/60 bg-[#07130D]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/assets/img/logo-light.png"
                alt="RealSalePro — Real Estate CRM"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* 404 Hero Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl w-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-8 shadow-inner shadow-emerald-500/20">
              <span className="text-3xl font-extrabold tracking-wider">404</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Page Not Found
            </h1>

            <p className="text-lg text-emerald-100/70 max-w-lg mx-auto mb-10 leading-relaxed">
              We couldn't find the page you're looking for. It might have been moved, renamed, or is temporarily unavailable.
            </p>

            {/* Quick Destination Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto mb-10 text-left">
              <Link
                to="/"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Homepage</div>
                  <div className="text-xs text-emerald-200/60">RealSalePro CRM overview</div>
                </div>
              </Link>

              <Link
                to="/free-real-estate-crm"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Free CRM</div>
                  <div className="text-xs text-emerald-200/60">1,000 leads free forever</div>
                </div>
              </Link>

              <Link
                to="/pricing"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Pricing & Plans</div>
                  <div className="text-xs text-emerald-200/60">Transparent Indian pricing</div>
                </div>
              </Link>

              <Link
                to="/templates/real-estate-crm-excel-template"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Excel Template</div>
                  <div className="text-xs text-emerald-200/60">Free spreadsheet tracker</div>
                </div>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Home className="w-4 h-4" /> Return to Homepage
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-all"
              >
                <Mail className="w-4 h-4" /> Contact Support
              </Link>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="border-t border-emerald-950/60 py-6 text-center text-xs text-emerald-200/40">
          <p>© {new Date().getFullYear()} RealSalePro. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

