import { useState } from 'react';
import { X, Zap, Check, ArrowRight, ShieldCheck, Sparkles, Loader2, CreditCard, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api';
import { invalidateQuery } from '../../lib/reactive';
import { toast } from 'sonner';

interface UpgradeToProModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  description?: string;
}

type BillingCycle = 'monthly' | 'semi_annual' | 'yearly';

const PLANS: {
  id: BillingCycle;
  name: string;
  monthlyPrice: number;
  totalPrice: number;
  periodLabel: string;
  billingNote: string;
  badge: string | null;
  popular?: boolean;
}[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    monthlyPrice: 1500,
    totalPrice: 1500,
    periodLabel: '/mo',
    billingNote: 'Billed monthly',
    badge: null,
  },
  {
    id: 'semi_annual',
    name: '6 Months',
    monthlyPrice: 1200,
    totalPrice: 7200,
    periodLabel: '/mo',
    billingNote: '₹7,200 billed every 6 mo',
    badge: 'Save 20%',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    monthlyPrice: 1000,
    totalPrice: 12000,
    periodLabel: '/mo',
    billingNote: '₹12,000 billed annually',
    badge: 'Save 33% • Best Value',
    popular: true,
  },
];

export function UpgradeToProModal({
  isOpen,
  onClose,
  featureName = 'Pro Features',
  description
}: UpgradeToProModalProps) {
  const { profile, user, tenant } = useAuth();
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('yearly');
  const [loading, setLoading] = useState(false);
  const [isTestActivating, setIsTestActivating] = useState(false);

  if (!isOpen) return null;

  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const canManageBilling =
    normalizedRole === 'super_admin' ||
    normalizedRole === 'platform_admin' ||
    normalizedRole === 'admin' ||
    normalizedRole === 'director' ||
    normalizedRole === 'tenant_owner' ||
    profile?.role === 'super_admin' ||
    profile?.role === 'platform_admin' ||
    profile?.role === 'admin';

  const isPlatformSuperAdmin =
    normalizedRole === 'super_admin' ||
    normalizedRole === 'platform_admin' ||
    profile?.role === 'super_admin' ||
    profile?.role === 'platform_admin';

  const activePlan = PLANS.find(p => p.id === selectedCycle) || PLANS[2];

  const handlePayAndActivate = async () => {
    if (!tenant?.id) {
      toast.error('Workspace information not found. Please reload and try again.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay Subscription via backend API
      const res = await apiClient.post<any>('/subscriptions/create', {
        tenantId: tenant.id,
        tenantName: tenant.name,
        customerEmail: user?.email || profile?.email || '',
        customerContact: profile?.phone || tenant.settings?.company_profile?.phone || '',
        planType: selectedCycle,
      });

      const subscriptionId = res?.subscriptionId;
      const keyId = res?.keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;

      if (!subscriptionId) {
        throw new Error('Failed to create subscription order with gateway.');
      }

      // 2. Load Razorpay Checkout SDK if not yet loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Razorpay SDK failed to load. Please verify your connection.'));
          document.body.appendChild(script);
        });
      }

      // 3. Launch Razorpay payment popup
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: 'RealSalePro',
        description: `Pro Plan (${activePlan.name}) - ₹${activePlan.totalPrice.toLocaleString('en-IN')}`,
        image: tenant.settings?.appearance?.logo_url || tenant.settings?.company_profile?.logo_url || undefined,
        prefill: {
          name: tenant.name,
          email: user?.email || profile?.email || '',
          contact: profile?.phone || tenant.settings?.company_profile?.phone || ''
        },
        theme: {
          color: '#00E576'
        },
        handler: async function (paymentResponse: any) {
          try {
            await apiClient.post('/subscriptions/verify', {
              tenantId: tenant.id,
              subscriptionId: paymentResponse.razorpay_subscription_id || subscriptionId,
              paymentId: paymentResponse.razorpay_payment_id,
              signature: paymentResponse.razorpay_signature,
              planTier: 'pro',
              billingCycle: selectedCycle,
            });

            invalidateQuery('tenants');
            invalidateQuery('subscriptions');
            toast.success('🎉 Pro Plan activated successfully! Welcome to Pro!');
            onClose();
          } catch (verifyErr: any) {
            console.error('Subscription verification warning:', verifyErr);
            toast.success('Payment received! Activating Pro Plan...');
            invalidateQuery('tenants');
            onClose();
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info('Payment window closed');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Payment initialization failed:', error);
      const msg = error?.message || '';
      const isMissingKeys =
        msg.toLowerCase().includes('razorpay keys') ||
        msg.toLowerCase().includes('missing_razorpay_keys') ||
        msg.toLowerCase().includes('missing razorpay');

      if (isMissingKeys) {
        toast.error('Payment gateway setup is in progress. Please contact administrator or configure Razorpay keys.');
      } else {
        toast.error(`Payment initialization failed: ${msg || 'Unknown error'}`);
      }
      setLoading(false);
    }
  };

  const handleInstantTestActivate = async () => {
    if (!tenant?.id) return;
    setIsTestActivating(true);
    try {
      await apiClient.post('/subscriptions/activate-test-mode', {
        tenantId: tenant.id,
        planTier: 'pro',
        billingCycle: selectedCycle
      });
      invalidateQuery('tenants');
      invalidateQuery('subscriptions');
      toast.success(`⚡ Pro Plan (${activePlan.name}) activated in instant test mode!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to activate test mode');
    } finally {
      setIsTestActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className="relative bg-white dark:bg-[#0E1A15] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Banner */}
        <div className="relative bg-gradient-to-r from-[#0A1C37] via-[#0F2942] to-[#0A1C37] text-white p-5 sm:p-6 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#00E576]/20 rounded-full blur-2xl pointer-events-none transform translate-x-12 -translate-y-12" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-2 mb-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#00E576] to-[#00C853] text-[#0A1C37] shadow-sm">
              <Zap size={12} className="fill-current" />
              Pro Feature
            </span>
            <span className="text-xs text-slate-300 flex items-center gap-1">
              <Sparkles size={12} className="text-[#00E576]" /> Instant In-App Activation
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            Unlock {featureName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            {description || 'Complete your upgrade right here in one step. No redirects, immediate activation via UPI or cards.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {canManageBilling ? (
            <>
              {/* Billing Cycle Selector */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Select Billing Cycle:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLANS.map((plan) => {
                    const isSelected = selectedCycle === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedCycle(plan.id)}
                        className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-slate-50/70 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        {plan.badge && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md mb-1.5 inline-block self-start ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {plan.badge}
                          </span>
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {plan.name}
                          </p>
                          <div className="mt-1 flex items-baseline gap-0.5">
                            <span className="text-base sm:text-lg font-black text-[#0A1C37] dark:text-emerald-400">
                              ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {plan.periodLabel}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                          {plan.billingNote}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* What You Get Checklist */}
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3.5 border border-slate-100 dark:border-white/5 space-y-2">
                <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Everything Included in Pro:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                    <span><strong>AI Sales Copilot</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                    <span><strong>Up to 2,00,000 Leads</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                    <span><strong>WhatsApp &amp; Meta Ads API</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                    <span><strong>Unlimited Team Users</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                    <span><strong>99acres &amp; Magicbricks Sync</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                    <span><strong>Financial Ledgers &amp; Receipts</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={loading || isTestActivating}
                  onClick={handlePayAndActivate}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#00E576] to-[#00C853] hover:from-[#00C853] hover:to-[#00B048] disabled:opacity-60 text-[#0A1C37] font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-[#0A1C37]" />
                      <span>Opening Secure Checkout...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} className="text-[#0A1C37]" />
                      <span>Pay ₹{activePlan.totalPrice.toLocaleString('en-IN')} &amp; Activate Pro</span>
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 text-[#0A1C37]" />
                    </>
                  )}
                </button>

                {isPlatformSuperAdmin && (
                  <button
                    type="button"
                    disabled={loading || isTestActivating}
                    onClick={handleInstantTestActivate}
                    className="w-full py-2 px-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100/70 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isTestActivating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Activating test mode...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={13} className="text-amber-600" />
                        <span>Admin Shortcut: Instant 1-Click Test Activation</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors font-medium text-center cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Lock size={18} />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Upgrading subscription plans requires administrator permissions. Please contact your workspace administrator or director to activate the Pro Plan for your organization.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white text-xs font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>Instant In-App Activation • UPI, Cards &amp; NetBanking via Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
}

