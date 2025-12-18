
import { useState, useEffect } from 'react';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { useRazorpay } from '../hooks/useRazorpay';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function PricingPage() {
  const { openPaymentModal } = useRazorpay();
  const { user, tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-trigger checkout if returning from registration
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    const plan = searchParams.get('plan');
    const amount = searchParams.get('amount');

    if (checkout === 'true' && plan && amount && user) {
      // Clear the checkout params
      setSearchParams({});
      // Trigger payment
      handleSubscribe(decodeURIComponent(plan), parseInt(amount));
    }
  }, [searchParams, user]);

  const handleSubscribe = async (planName: string, amount: number) => {
    if (!user) {
      // Redirect to registration with plan details
      navigate(`/register?plan=${encodeURIComponent(planName)}&amount=${amount}`);
      return;
    }

    setLoading(true);
    try {
      // 1. Create Order on Backend
      const response = await fetch('/.netlify/functions/create-payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR', receipt: `receipt_${Date.now()}` })
      });

      if (!response.ok) throw new Error('Failed to create order');
      const order = await response.json();

      // 2. Open Razorpay Checkout
      await openPaymentModal({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RtAvLpEfuEbGu2', // Frontend Key with fallback
        amount: order.amount, // Amount in paise
        currency: order.currency,
        name: 'RealSalePro',
        description: `Subscription for ${planName}`,
        order_id: order.id,
        image: '/images/RealSalePro_Favicon.png',
        handler: async (response) => {
          // 3. Update Tenant Subscription on Success
          if (tenant?.id) {
            const billingCycle = planName === '6 Months' ? 'semi_annual' : planName.toLowerCase();
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 30); // 30 Day Free Trial

            const { error: updateError } = await supabase
              .from('tenants')
              .update({
                plan_tier: 'pro',
                billing_cycle: billingCycle,
                is_active: true,
                trial_ends_at: trialEndsAt.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', tenant.id);

            if (updateError) {
              console.error('Error updating subscription:', updateError);
              alert('Payment successful but failed to update subscription. Please contact support.');
            }
          }

          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          setLoading(false);
          navigate('/dashboard');
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#0F172A'
        }
      });
    } catch (error: any) {
      console.warn('Backend Order Creation Failed, falling back to Client-Side (TEST MODE ONLY)', error);

      // Fallback for Local Development (when backend function is unreachable)
      const isDev = import.meta.env.DEV;
      if (isDev) {
        try {
          await openPaymentModal({
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RtAvLpEfuEbGu2',
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            name: 'RealSalePro',
            description: `Subscription for ${planName} (Test Mode)`,
            order_id: '', // Empty order_id for client-side test
            image: '/images/RealSalePro_Favicon.png',
            handler: async (response) => {
              // Update Tenant Subscription on Success (Test Mode)
              if (tenant?.id) {
                const billingCycle = planName === '6 Months' ? 'semi_annual' : planName.toLowerCase();
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + 30);

                const { error: updateError } = await supabase
                  .from('tenants')
                  .update({
                    plan_tier: 'pro',
                    billing_cycle: billingCycle,
                    is_active: true,
                    trial_ends_at: trialEndsAt.toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', tenant.id);

                if (updateError) console.error('Error updating subscription (mock):', updateError);
              }

              alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
              setLoading(false);
              navigate('/dashboard');
            },
            prefill: {
              name: 'Test User',
              email: 'test@example.com',
              contact: '9999999999'
            },
            theme: {
              color: '#0F172A'
            }
          });
        } catch (fallbackError: any) {
          alert(`Payment execution failed: ${fallbackError.message}`);
        }
      } else {
        alert(`Payment execution failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Monthly</h3>
            <div className="mt-4 flex items-baseline text-gray-900">
              <span className="text-5xl font-extrabold tracking-tight">₹1,500</span>
              <span className="ml-1 text-xl font-semibold text-gray-500">/month</span>
            </div>
            <p className="mt-6 text-gray-500">Full access, billed monthly</p>
            <ul className="mt-6 space-y-4 flex-1">
              {['All Pro Features Included', 'Unlimited Users', 'Real-time Analytics', 'Priority Email Support', '30-Day Free Trial'].map((feature) => (
                <li key={feature} className="flex">
                  <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('Monthly', 1500)}
              disabled={loading}
              className="mt-8 block w-full bg-indigo-50 border border-transparent rounded-lg py-3 px-6 text-center font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : user ? 'Pay Now ₹1,500' : 'Start Monthly Trial'}
            </button>
          </div>

          {/* 6 Months Plan */}
          <div className="bg-[#0A1C37] rounded-2xl shadow-xl p-8 flex flex-col transform md:-translate-y-4 border border-gray-900 relative">
            <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              Most Popular
            </div>
            <h3 className="text-xl font-semibold text-white">6 Months</h3>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-5xl font-extrabold tracking-tight">₹1,200</span>
              <span className="ml-1 text-xl font-semibold text-gray-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-green-400 font-medium">Billed ₹7,200 semi-annually</p>
            <p className="mt-4 text-gray-400">Save 20% with 6-month commitment</p>
            <ul className="mt-6 space-y-4 flex-1">
              {['All Pro Features Included', 'Unlimited Users', 'Real-time Analytics', 'Priority Email Support', '30-Day Free Trial'].map((feature) => (
                <li key={feature} className="flex">
                  <Check className="flex-shrink-0 w-5 h-5 text-blue-400" />
                  <span className="ml-3 text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('6 Months', 7200)}
              disabled={loading}
              className="mt-8 block w-full bg-[#1673FF] border border-transparent rounded-lg py-3 px-6 text-center font-bold text-white hover:bg-[#1361D6] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : user ? 'Pay Now ₹7,200' : 'Start 6-Month Trial'}
            </button>
          </div>

          {/* Yearly Plan */}
          <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-8 flex flex-col border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Yearly</h3>
            <div className="mt-4 flex items-baseline text-gray-900">
              <span className="text-5xl font-extrabold tracking-tight">₹1,000</span>
              <span className="ml-1 text-xl font-semibold text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-green-600 font-medium">Billed ₹12,000 annually</p>
            <p className="mt-4 text-gray-500">Best Value: Save 33% yearly</p>
            <ul className="mt-6 space-y-4 flex-1">
              {['All Pro Features Included', 'Unlimited Users', 'Real-time Analytics', 'Priority Email Support', '30-Day Free Trial'].map((feature) => (
                <li key={feature} className="flex">
                  <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-gray-500">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe('Yearly', 12000)}
              disabled={loading}
              className="mt-8 block w-full bg-indigo-50 border border-transparent rounded-lg py-3 px-6 text-center font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : user ? 'Pay Now ₹12,000' : 'Start Yearly Trial'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
