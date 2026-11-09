import { useState, useEffect } from 'react';
import { Check, Loader2, ArrowLeft, KeyRound, Zap, Sparkles, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useBackend, useAction, useMutation } from "../lib/reactive";
import { api } from '../lib/api-endpoints';
import { subscriptionService } from '../lib/services';

export function PricingPage() {
  const { user, tenant, profile } = useAuth();
  const backend = useBackend();
  const sendEmailAction = useAction(api.emails.sendEmail);
  const updateTenant = useMutation(api.tenants.update);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semi_annual' | 'yearly'>('semi_annual');

  // Referral State
  const [referralCode, setReferralCode] = useState('');
  const [referralData, setReferralData] = useState<{ code: string, discount: number, campaignId: string, referrerEmail?: string, referrerName?: string } | null>(null);
  const [validatingReferral, setValidatingReferral] = useState(false);

  // Razorpay Gateway Setup & Test Mode Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<{ planName: string; originalAmount: number } | null>(null);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [activatingTest, setActivatingTest] = useState(false);

  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'platform_admin';

  useEffect(() => {
    if (showConfigModal && isSuperAdmin) {
      subscriptionService.getConfig().then((res) => {
        if (res?.fullKeyId) {
          setRazorpayKeyId(res.fullKeyId);
        }
      }).catch(() => {});
    }
  }, [showConfigModal, isSuperAdmin]);

  const handleSaveRazorpayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razorpayKeyId.trim() || !razorpayKeySecret.trim()) {
      toast.error('Please enter both Razorpay Key ID and Key Secret');
      return;
    }
    setSavingConfig(true);
    try {
      await subscriptionService.saveConfig({
        key_id: razorpayKeyId.trim(),
        key_secret: razorpayKeySecret.trim()
      });
      toast.success('Razorpay credentials saved successfully!');
      setShowConfigModal(false);
      if (pendingPlan) {
        handleSubscribe(pendingPlan.planName, pendingPlan.originalAmount);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Razorpay keys');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleActivateTestMode = async () => {
    if (!tenant?.id) return;
    setActivatingTest(true);
    try {
      const cycle = pendingPlan?.planName === '6 Months' ? 'semi_annual' : pendingPlan?.planName === 'Yearly' ? 'yearly' : 'monthly';
      const res = await subscriptionService.activateTestMode({
        tenantId: tenant.id,
        planTier: 'pro',
        billingCycle: cycle
      });
      toast.success(res.message || 'Pro Plan activated successfully in Test Mode!');
      setShowConfigModal(false);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate test mode');
    } finally {
      setActivatingTest(false);
    }
  };

  // Auto-trigger checkout if returning from registration
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    const plan = searchParams.get('plan');
    const amount = searchParams.get('amount');
    const refCode = searchParams.get('referralCode');

    if (refCode) {
      setReferralCode(refCode);
      validateReferral(refCode);
    }

    if (checkout === 'true' && plan && amount && user) {
      // Clear the checkout params
      setSearchParams({});
      handleSubscribe(decodeURIComponent(plan), parseInt(amount));
    }
  }, [searchParams, user]);

  const validateReferral = async (code: string) => {
    if (!code) return;
    setValidatingReferral(true);
    try {
      const data = await backend.query(api.referrals.validateCode, { code });
      
      if (data && (data as any).is_valid) {
        setReferralData({
          code: code,
          discount: (data as any).discount_percent,
          campaignId: (data as any).campaign_id,
          referrerEmail: (data as any).referrer_email,
          referrerName: (data as any).name
        });
      } else {
        setReferralData(null);
        if (code !== searchParams.get('referralCode')) {
           toast.error('Invalid referral code');
        }
      }
    } catch (err) {
      console.error('Error validating referral:', err);
    } finally {
      setValidatingReferral(false);
    }
  };

  const handleContactSales = async () => {
    if (!user || !tenant) {
      window.location.href = "mailto:support@realsalepro.com?subject=RealSalePro - Custom Plan Inquiry";
      return;
    }
    
    setLoading(true);
    try {
      await sendEmailAction({
        type: 'CUSTOM_PLAN_REQUEST',
        email: 'support@realsalepro.com',
        name: profile?.full_name || user.email || 'Client',
        data: {
          tenantName: tenant.name,
          tenantId: tenant.id,
          phone: profile?.phone || '',
          userEmail: user.email || ''
        }
      });
      toast.success('Your request has been sent to our sales team. We will get back to you shortly!');
    } catch (err: any) {
      console.error('Failed to send sales request:', err);
      toast.error('Failed to send request. Please contact support@realsalepro.com directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string, originalAmount: number) => {
    if (!user) {
      navigate(`/register?plan=${encodeURIComponent(planName)}&amount=${originalAmount}`);
      return;
    }

    if (!tenant?.id) {
      toast.error('Tenant information not found. Please try again.');
      return;
    }

    if (planName === 'Free' || planName === 'Free Forever') {
      setLoading(true);
      try {
        await updateTenant({
          id: tenant.id,
          plan_tier: 'free',
          subscription_status: 'active',
          billing_cycle: 'free',
          subscription_id: undefined
        });
        toast.success('Free Plan activated successfully!');
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Failed to subscribe to free plan:', err);
        toast.error('Failed to activate free plan');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      const billingCycle = planName === '6 Months' ? 'semi_annual' : planName === 'Yearly' ? 'yearly' : 'monthly';

      // Import service dynamically
      const { createRazorpaySubscription } = await import('../lib/subscriptionService');

      // Create subscription via backend API
      const { subscription } = await createRazorpaySubscription({
        tenantId: tenant.id,
        planId: '', // Handled by backend auto-provisioning
        customerName: tenant.name,
        customerEmail: user.email || '',
        customerContact: profile?.phone || tenant.settings?.company_profile?.phone || '', 
        billingCycle: billingCycle
      });

      // Load Razorpay Checkout script if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // Initialize Razorpay Checkout with subscription_id
      const options = {
        key: (subscription as any)?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: subscription.razorpay_subscription_id,
        name: 'RealSalePro',
        description: `${planName} Subscription`,
        image: tenant.settings?.appearance?.logo_url || tenant.settings?.company_profile?.logo_url || undefined,
        prefill: {
          name: tenant.name,
          email: user.email,
          contact: profile?.phone || tenant.settings?.company_profile?.phone || ''
        },
        theme: {
          color: tenant.settings?.appearance?.primary_color || '#3b82f6'
        },
        handler: async function (response: any) {
          // Payment successful
          console.log('Payment successful:', response);
          toast.success('Subscription activated successfully!');
          
          // Redirect to dashboard
          navigate('/dashboard');
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Payment initialization failed:', error);

      const isMissingKeys =
        errorMessage.toLowerCase().includes('razorpay keys') ||
        errorMessage.toLowerCase().includes('missing_razorpay_keys') ||
        errorMessage.toLowerCase().includes('missing razorpay');

      if (isMissingKeys) {
        setPendingPlan({ planName, originalAmount });
        setShowConfigModal(true);
      } else {
        toast.error(`Failed to initialize payment: ${errorMessage}`);
      }
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link to={user ? "/dashboard" : "/"} className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {user ? "Back to Dashboard" : "Back to Home"}
          </Link>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Choose the plan that's right for your business
            </p>
          </div>
          
          {/* Referral Code Section */}
          <div className="max-w-md mx-auto mb-12 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Have a Referral Code?</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g. SAVE20)"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
                <button
                  onClick={() => validateReferral(referralCode)}
                  disabled={validatingReferral || !referralCode}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {validatingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </button>
              </div>
              {referralData && (
                <div className="mt-2 text-sm text-green-600 flex items-center gap-1 font-medium bg-green-50 p-2 rounded">
                  <Check className="w-4 h-4" />
                  Code applied! You get {referralData.discount}% OFF.
                </div>
              )}
            </div>
          </div>

          {/* Billing Cycle Selector for Pro Plan */}
          <div className="flex justify-center mb-12">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex items-center gap-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('semi_annual')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  billingCycle === 'semi_annual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>6 Months</span>
                <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  Save 20%
                </span>
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Yearly</span>
                <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  Save 33%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Forever Plan */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-5 md:p-8 flex flex-col border border-gray-100 relative">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Free Forever</h3>
              <div className="mt-2 md:mt-4 flex items-baseline text-gray-900">
                <span className="text-3xl md:text-5xl font-extrabold tracking-tight">₹0</span>
                <span className="ml-1 text-base md:text-xl font-semibold text-gray-500">/forever</span>
              </div>
              <p className="mt-4 md:mt-6 text-sm md:text-base text-gray-500">For small teams starting out, manage up to 1,000 leads</p>
              <ul className="mt-4 md:mt-6 space-y-2 md:space-y-4 flex-1">
                {['All Pro Features Included', 'Up to 1,000 Leads Limit', 'Up to 5 Users', 'Real-time Analytics', 'Standard Email Support'].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5" />
                    <span className="ml-2 md:ml-3 text-sm md:text-base text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('Free Forever', 0)}
                disabled={loading || (user && tenant?.plan_tier === 'free')}
                className={`mt-6 md:mt-8 block w-full border rounded-lg py-2 md:py-3 px-4 md:px-6 text-center text-sm md:text-base font-medium transition-all ${
                  user && tenant?.plan_tier === 'free'
                    ? 'bg-gray-100 text-gray-500 border-transparent cursor-not-allowed'
                    : 'bg-indigo-50 text-indigo-700 border-transparent hover:bg-indigo-100'
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (user && tenant?.plan_tier === 'free') ? 'Current Plan' : 'Get Started Free'}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#0A1C37] rounded-2xl shadow-xl p-5 md:p-8 flex flex-col transform md:-translate-y-4 border border-gray-900 relative">
              <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg">
                Most Popular
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">Pro Plan</h3>
              
              {billingCycle === 'monthly' && (
                <>
                  <div className="mt-2 md:mt-4 flex items-baseline text-white">
                    <span className="text-3xl md:text-5xl font-extrabold tracking-tight">₹1,500</span>
                    <span className="ml-1 text-base md:text-xl font-semibold text-gray-400">/month</span>
                  </div>
                  <p className="mt-2 text-xs md:text-sm text-gray-400">Billed monthly</p>
                </>
              )}

              {billingCycle === 'semi_annual' && (
                <>
                  <div className="mt-2 md:mt-4 flex items-baseline text-white">
                    <span className="text-3xl md:text-5xl font-extrabold tracking-tight">₹1,200</span>
                    <span className="ml-1 text-base md:text-xl font-semibold text-gray-400">/month</span>
                  </div>
                  <p className="mt-2 text-xs md:text-sm text-green-400 font-medium">Billed ₹7,200 semi-annually</p>
                  <p className="mt-1 text-xs md:text-sm text-gray-400">Save 20% with 6-month commitment</p>
                </>
              )}

              {billingCycle === 'yearly' && (
                <>
                  <div className="mt-2 md:mt-4 flex items-baseline text-white">
                    <span className="text-3xl md:text-5xl font-extrabold tracking-tight">₹1,000</span>
                    <span className="ml-1 text-base md:text-xl font-semibold text-gray-400">/month</span>
                  </div>
                  <p className="mt-2 text-xs md:text-sm text-green-400 font-medium">Billed ₹12,000 annually</p>
                  <p className="mt-1 text-xs md:text-sm text-gray-400">Best Value: Save 33% yearly</p>
                </>
              )}

              <ul className="mt-4 md:mt-6 space-y-2 md:space-y-4 flex-1">
                {['All Pro Features Included', 'Up to 2,00,000 Leads Limit', 'Unlimited Users', 'Real-time Analytics', 'Priority Email Support'].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 text-blue-400 mt-0.5" />
                    <span className="ml-2 md:ml-3 text-sm md:text-base text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {billingCycle === 'monthly' && (
                <button
                  onClick={() => handleSubscribe('Monthly', 1500)}
                  disabled={loading || (user && tenant?.plan_tier === 'pro' && tenant?.billing_cycle === 'monthly')}
                  className="mt-6 md:mt-8 block w-full bg-[#1673FF] border border-transparent rounded-lg py-2 md:py-3 px-4 md:px-6 text-center text-sm md:text-base font-bold text-white hover:bg-[#1361D6] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (user && tenant?.plan_tier === 'pro' && tenant?.billing_cycle === 'monthly') ? 'Current Plan' : 'Pay Now ₹1,500'}
                </button>
              )}

              {billingCycle === 'semi_annual' && (
                <button
                  onClick={() => handleSubscribe('6 Months', 7200)}
                  disabled={loading || (user && tenant?.plan_tier === 'pro' && tenant?.billing_cycle === 'semi_annual')}
                  className="mt-6 md:mt-8 block w-full bg-[#1673FF] border border-transparent rounded-lg py-2 md:py-3 px-4 md:px-6 text-center text-sm md:text-base font-bold text-white hover:bg-[#1361D6] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (user && tenant?.plan_tier === 'pro' && tenant?.billing_cycle === 'semi_annual') ? 'Current Plan' : 'Pay Now ₹7,200'}
                </button>
              )}

              {billingCycle === 'yearly' && (
                <button
                  onClick={() => handleSubscribe('Yearly', 12000)}
                  disabled={loading || (user && tenant?.plan_tier === 'pro' && tenant?.billing_cycle === 'yearly')}
                  className="mt-6 md:mt-8 block w-full bg-[#1673FF] border border-transparent rounded-lg py-2 md:py-3 px-4 md:px-6 text-center text-sm md:text-base font-bold text-white hover:bg-[#1361D6] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (user && tenant?.plan_tier === 'pro' && tenant?.billing_cycle === 'yearly') ? 'Current Plan' : 'Pay Now ₹12,000'}
                </button>
              )}
            </div>

            {/* Custom Plan */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-5 md:p-8 flex flex-col border border-gray-100">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Custom</h3>
              <div className="mt-2 md:mt-4 flex items-baseline text-gray-900">
                <span className="text-3xl md:text-5xl font-extrabold tracking-tight">Custom</span>
              </div>
              <p className="mt-4 md:mt-6 text-sm md:text-base text-gray-500">Bespoke limits & terms</p>
              <ul className="mt-4 md:mt-6 space-y-2 md:space-y-4 flex-1">
                {['Custom Lead Limits', 'Custom Integrations', 'Dedicated Support Manager', 'Custom SLA Guarantee', 'Flexible Billing Options'].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5" />
                    <span className="ml-2 md:ml-3 text-sm md:text-base text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleContactSales}
                disabled={loading}
                className="mt-6 md:mt-8 block w-full bg-indigo-600 border border-transparent rounded-lg py-2 md:py-3 px-4 md:px-6 text-center text-sm md:text-base font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Contact Sales'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Razorpay Gateway Configuration & Test Mode Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfigModal(false)}
          />
          <div className="relative bg-white dark:bg-[#0E1A15] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#0A1C37] via-[#0F2942] to-[#0A1C37] text-white p-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950">
                  <KeyRound size={12} /> Payment Gateway
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">Razorpay Setup Required</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                To process live online payments, RealSalePro connects to your Razorpay merchant account.
              </p>
            </div>

            <div className="p-6 space-y-5">
              {isSuperAdmin ? (
                <>
                  <form onSubmit={handleSaveRazorpayConfig} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Razorpay Key ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="rzp_live_xxxxxxxx or rzp_test_xxxxxxxx"
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Get from Razorpay Dashboard &rarr; Settings &rarr; API Keys
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Razorpay Key Secret <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter your 24-character Key Secret"
                        value={razorpayKeySecret}
                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingConfig ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      <span>Save Keys &amp; Proceed to Payment</span>
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-[#0E1A15] px-2 text-slate-400 font-semibold text-[10px]">
                        Or Test Without Payment
                      </span>
                    </div>
                  </div>

                  {/* Test Mode Activation Box */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                      <Sparkles size={14} />
                      <span>Testing the System?</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      As Super Admin, you can activate the Pro Plan in Demo/Test Mode right now to test all features without paying.
                    </p>
                    <button
                      type="button"
                      onClick={handleActivateTestMode}
                      disabled={activatingTest}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {activatingTest ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                      <span>Activate Pro Plan (Test Mode)</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Online payment gateway is not yet configured on this system. Please contact your Organization Super Admin to configure Razorpay keys.
                  </p>
                  <button
                    onClick={() => setShowConfigModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

