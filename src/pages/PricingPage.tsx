


import { useState, useEffect } from 'react';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { useRazorpay } from '../hooks/useRazorpay';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PaymentSuccessModal } from '../components/ui/PaymentSuccessModal';

export function PricingPage() {
  const { openPaymentModal } = useRazorpay();
  const { user, tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Payment Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({ paymentId: '', planName: '' });

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
      navigate(`/register?plan=${encodeURIComponent(planName)}&amount=${amount}`);
      return;
    }

    if (!tenant?.id) {
      alert('Tenant information not found. Please try again.');
      return;
    }

    setLoading(true);
    
    try {
      const billingCycle = planName === '6 Months' ? 'semi_annual' : planName === 'Yearly' ? 'yearly' : 'monthly';
      
      // Simple Razorpay checkout (no subscription API)
      await openPaymentModal({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RtAvLpEfuEbGu2',
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'RealSalePro',
        description: `${planName} Plan - ${billingCycle === 'monthly' ? 'Monthly' : billingCycle === 'semi_annual' ? '6 Months' : 'Yearly'} Subscription`,
        image: '/images/RealSalePro_Favicon.png',
        handler: async (response) => {
          try {
            // Import supabase
            const { supabase } = await import('../lib/supabase');
            
            // Update tenant subscription
            const { error: updateError } = await supabase
              .from('tenants')
              .update({
                plan_tier: 'pro',
                billing_cycle: billingCycle,
                is_active: true,
                subscription_status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', tenant.id);

            if (updateError) {
              console.error('Error updating subscription:', updateError);
              alert('Payment successful but failed to activate subscription. Please contact support with Payment ID: ' + response.razorpay_payment_id);
              return;
            }

            // Record payment in billing history
            try {
              await supabase.from('billing_history').insert({
                tenant_id: tenant.id,
                razorpay_payment_id: response.razorpay_payment_id,
                amount: amount * 100,
                currency: 'INR',
                status: 'captured',
                description: `${planName} Plan Payment`,
                email: user.email || undefined,
              });
            } catch (billingError) {
              console.error('Error recording billing:', billingError);
              // Don't fail the whole flow if billing record fails
            }

            // Show success modal instead of alert
            setPaymentDetails({
              paymentId: response.razorpay_payment_id,
              planName: planName
            });
            setShowSuccessModal(true);
          } catch (error) {
            console.error('Error processing payment:', error);
            alert('Payment successful but failed to update account. Please contact support with Payment ID: ' + response.razorpay_payment_id);
          }
        },
        prefill: {
          name: tenant.name,
          email: user.email || 'customer@example.com',
          contact: '9999999999',
        },
        theme: {
          color: '#0F172A',
        },
        notes: {
          tenant_id: tenant.id,
          plan_name: planName,
          billing_cycle: billingCycle,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Payment initialization failed:', error);
      alert(`Failed to initialize payment: ${errorMessage}\n\nPlease try again or contact support.`);
    } finally {
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

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Reload page to refresh tenant data from AuthContext
          window.location.href = '/dashboard';
        }}
        paymentId={paymentDetails.paymentId}
        planName={paymentDetails.planName}
      />
    </>
  );
}
