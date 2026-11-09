import { X, Zap, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  description?: string;
}

export function UpgradeToProModal({
  isOpen,
  onClose,
  featureName = 'Pro Features',
  description
}: UpgradeToProModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative bg-white dark:bg-[#0E1A15] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Banner */}
        <div className="relative bg-gradient-to-r from-[#0A1C37] via-[#0F2942] to-[#0A1C37] text-white p-6 sm:p-7 overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00E576]/20 rounded-full blur-2xl pointer-events-none transform translate-x-12 -translate-y-12" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] shadow-sm">
              <Zap size={12} className="fill-current" />
              Pro Feature
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <Sparkles size={12} className="text-[#00E576]" /> RealSalePro Pro Plan
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            Unlock {featureName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            {description || `This feature is exclusively available on the Pro Plan. Upgrade now to remove limits and unlock automated tools.`}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Features Included Checklist */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Everything Included with Pro:
            </h4>
            <div className="grid grid-cols-1 gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={13} strokeWidth={3} />
                </div>
                <span><strong>All Lead Integrations:</strong> Meta Ads, WhatsApp API, Google Ads, 99acres, Magicbricks & Webhooks</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={13} strokeWidth={3} />
                </div>
                <span><strong>Unlimited Leads:</strong> Scale your CRM without any 1,000 lead ceiling</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={13} strokeWidth={3} />
                </div>
                <span><strong>Unlimited Users:</strong> Add your entire sales force, managers & telecallers</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={13} strokeWidth={3} />
                </div>
                <span><strong>Financial Ledgers:</strong> Export & WhatsApp share customer payment receipts</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={13} strokeWidth={3} />
                </div>
                <span><strong>Conversion APIs:</strong> Meta CAPI & Google Offline Conversions tracking</span>
              </div>
            </div>
          </div>

          {/* Pricing Highlight Box */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Flexible Plans Available
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-[#0A1C37] dark:text-white">₹1,200</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/month (Yearly billing)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                Save 33%
              </span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-1">Monthly plan ₹1,500</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleUpgradeClick}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#00E576] to-[#00C853] hover:from-[#00C853] hover:to-[#00B048] text-[#0A1C37] font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Upgrade to Pro Now</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors font-medium text-center"
            >
              Maybe Later
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Instant Activation • Secure Payment via Razorpay • Cancel Anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
