import { useState, useEffect } from 'react';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConvex, useAction, useMutation } from "convex/react";
import { api } from '../../convex/_generated/api';

export function PricingPage() {
  const { user, tenant, profile } = useAuth();
  const convex = useConvex();
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
      const data = await convex.query(api.referrals.validateCode, { code });
      
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

      // Create subscription via backend (Netlify Function)
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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
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
      toast.error(`Failed to initialize payment: ${errorMessage}`);
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
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex gap-1">
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
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all relative ${
                  billingCycle === 'semi_annual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                6 Months
                <span className="absolute -top-3 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-3 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
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
                {['All Pro Features Included', 'Up to 1,000 Leads Limit', 'Unlimited Users', 'Real-time Analytics', 'Standard Email Support'].map((feature) => (
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
                {['All Pro Features Included', 'Up to 1,00,000 Leads Limit', 'Unlimited Users', 'Real-time Analytics', 'Priority Email Support'].map((feature) => (
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
    </>
  );
}

