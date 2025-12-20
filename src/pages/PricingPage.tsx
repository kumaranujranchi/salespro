


import { useState, useEffect } from 'react';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { useRazorpay } from '../hooks/useRazorpay';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PaymentSuccessModal } from '../components/ui/PaymentSuccessModal';

export function PricingPage() {
  const { openPaymentModal } = useRazorpay();
  const { user, tenant, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Payment Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({ paymentId: '', planName: '' });

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
      
      // If there's a referral code, wait for validation? 
      // Actually creating a slight delay or dependency is better.
      // But for simplicity, we pass the raw values to handleSubscribe 
      // which will re-calculate based on state if possible, 
      // but state might not be ready. 
      // Better: let the user click 'Pay' if they want. 
      // OR: trigger it.
      
      // Issue: validation is async. handleSubscribe uses 'amount' param.
      // We should probably show the pricing page with the applied discount 
      // and let the user click, OR handle it if state is ready.
      // Let's rely on the user seeing the summary if we can, 
      // but the original code auto-triggered.
      // Let's trigger handleSubscribe but pass the referral code to it.
      
      handleSubscribe(decodeURIComponent(plan), parseInt(amount), refCode || undefined);
    }
  }, [searchParams, user]);

  const validateReferral = async (code: string) => {
    if (!code) return;
    setValidatingReferral(true);
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase.rpc('validate_referral_code', { code_input: code });
      
      if (error) throw error;
      
      // RPC returns an array (setof table)
      if (data && data.length > 0 && data[0].is_valid) {
        // Fetch full campaign details including email
        const { data: campaignDetails } = await supabase
            .from('referral_campaigns')
            .select('referrer_email, name')
            .eq('id', data[0].campaign_id)
            .single();

        setReferralData({
          code: code,
          discount: data[0].discount_percent,
          campaignId: data[0].campaign_id,
          referrerEmail: campaignDetails?.referrer_email,
          referrerName: campaignDetails?.name
        });
        console.log('Referral Applied:', data[0], campaignDetails);
      } else {
        console.warn('Invalid Referral Code');
        setReferralData(null);
      }
    } catch (err) {
      console.error('Error validating referral:', err);
    } finally {
      setValidatingReferral(false);
    }
  };

  const handleSubscribe = async (planName: string, originalAmount: number, autoReferralCode?: string) => {
    if (!user) {
      navigate(`/register?plan=${encodeURIComponent(planName)}&amount=${originalAmount}`);
      return;
    }

    if (!tenant?.id) {
      alert('Tenant information not found. Please try again.');
      return;
    }

    // Determine discount
    let finalAmount = originalAmount;
    let appliedDiscount = 0;
    let activeCampaignId = null;

    // Use state if available, or fetch if autoReferralCode provided (edge case)
    // For now, rely on state or the passed code (but we can't await async state update easily here).
    // If autoReferralCode is passed, we might need to validate it strictly before payment?
    // Let's rely on the state having been set if useEffect ran.
    
    if (referralData && referralData.discount > 0) {
        appliedDiscount = referralData.discount;
        activeCampaignId = referralData.campaignId;
        finalAmount = originalAmount - (originalAmount * (appliedDiscount / 100));
    } else if (autoReferralCode) {
        // Fallback for auto-checkout: validate quickly
        try {
            const { supabase } = await import('../lib/supabase');
            const { data } = await supabase.rpc('validate_referral_code', { code_input: autoReferralCode });
            if (data && data.length > 0 && data[0].is_valid) {
                appliedDiscount = data[0].discount_percent;
                activeCampaignId = data[0].campaign_id;
                finalAmount = originalAmount - (originalAmount * (appliedDiscount / 100));
            }
        } catch (e) {
            console.error(e);
        }
    }

    setLoading(true);

    try {
      const billingCycle = planName === '6 Months' ? 'semi_annual' : planName === 'Yearly' ? 'yearly' : 'monthly';

      // Simple Razorpay checkout (no subscription API)
      await openPaymentModal({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RtAvLpEfuEbGu2',
        amount: Math.round(finalAmount * 100), // Amount in paise (round to avoid float issues)
        currency: 'INR',
        name: 'RealSalePro',
        description: `${planName} Plan ${appliedDiscount > 0 ? `(${appliedDiscount}% OFF)` : ''}`,
        image: '/images/RealSalePro_Favicon.png',
        handler: async (response) => {
          try {
            console.log('🎉 Payment Response:', response);
            console.log('📋 Tenant ID:', tenant.id);
            console.log('📋 Billing Cycle:', billingCycle);

            // Import supabase
            const { supabase } = await import('../lib/supabase');
            
            // 0. If Referral Used, Record it!
            if (activeCampaignId) {
                try {
                    await supabase.from('user_referrals').insert({
                        campaign_id: activeCampaignId,
                        referred_user_id: user.id, // Or tenant owner ID
                        tenant_id: tenant.id,
                        status: 'converted', // Since they paid immediately
                        metadata: {
                            payment_id: response.razorpay_payment_id,
                            original_amount: originalAmount,
                            final_amount: finalAmount,
                            discount_percent: appliedDiscount
                        }
                    });
                    console.log('Referral Recorded');

                    // 0.5 Send Notification Email to Referrer (if email exists)
                    // We need to pass the referrer email from state or fetch it
                    let referrerEmailToSend = referralData?.referrerEmail; 
                    let referrerNameToSend = referralData?.referrerName || 'Partner';
                    
                    // If we don't have it in state (auto-applied), try to fetch quickly (though state should have it if validated)
                    // Assuming state has it for now.
                    
                    if (referrerEmailToSend) {
                        fetch('/.netlify/functions/send-referral-notification', {
                            method: 'POST',
                            body: JSON.stringify({
                                email: referrerEmailToSend,
                                referrerName: referrerNameToSend,
                                refereeName: tenant.name || user.email,
                                rewardAmount: (originalAmount * 0.20), // Approx 20% commission - or fetch actual logic
                                totalReferrals: '1+' // Placeholder or fetch count
                            })
                        }).then(res => console.log('Notification sent:', res.status))
                          .catch(err => console.error('Notification failed:', err));
                    }

                } catch (refError) {
                    console.error('Error recording referral:', refError);
                }
            }

            // Update tenant subscription
            console.log('🔄 Updating tenant subscription...');
            const { data: updateData, error: updateError } = await supabase
              .from('tenants')
              .update({
                plan_tier: 'pro',
                billing_cycle: billingCycle,
                is_active: true,
                subscription_status: 'active',
                updated_at: new Date().toISOString()
              })
              .eq('id', tenant.id)
              .select();

            console.log('✅ Update Response:', updateData);
            console.log('❌ Update Error:', updateError);

            if (updateError) {
              console.error('Error updating subscription:', updateError);
              alert('Payment successful but failed to activate subscription. Please contact support with Payment ID: ' + response.razorpay_payment_id);
              return;
            }

            // Record payment in billing history
            try {
              console.log('💾 Recording payment in billing history...');
              const { data: billingData, error: billingError } = await supabase.from('billing_history').insert({
                tenant_id: tenant.id,
                razorpay_payment_id: response.razorpay_payment_id,
                amount: finalAmount, // Use final amount
                currency: 'INR',
                status: 'captured',
                description: `${planName} Plan Payment ${appliedDiscount > 0 ? '(Referral Applied)' : ''}`,
                email: user.email || undefined,
              }).select();

              console.log('✅ Billing Record:', billingData);
              console.log('❌ Billing Error:', billingError);
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
            console.error('❌ Payment Handler Error:', error);
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
          referral_campaign_id: activeCampaignId || '',
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Monthly Plan */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-5 md:p-8 flex flex-col border border-gray-100">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Monthly</h3>
              <div className="mt-2 md:mt-4 flex items-baseline text-gray-900">
                <span className="text-3xl md:text-5xl font-extrabold tracking-tight">₹1,500</span>
                <span className="ml-1 text-base md:text-xl font-semibold text-gray-500">/month</span>
              </div>
              <p className="mt-4 md:mt-6 text-sm md:text-base text-gray-500">Full access, billed monthly</p>
              <ul className="mt-4 md:mt-6 space-y-2 md:space-y-4 flex-1">
                {['All Pro Features Included', 'Unlimited Users', 'Real-time Analytics', 'Priority Email Support', '30-Day Free Trial'].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5" />
                    <span className="ml-2 md:ml-3 text-sm md:text-base text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('Monthly', 1500)}
                disabled={loading}
                className="mt-6 md:mt-8 block w-full bg-indigo-50 border border-transparent rounded-lg py-2 md:py-3 px-4 md:px-6 text-center text-sm md:text-base font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : user ? 'Pay Now ₹1,500' : 'Start Monthly Trial'}
              </button>
            </div>

            {/* 6 Months Plan */}
            <div className="bg-[#0A1C37] rounded-2xl shadow-xl p-5 md:p-8 flex flex-col transform md:-translate-y-4 border border-gray-900 relative">
              <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-lg">
                Most Popular
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">6 Months</h3>
              <div className="mt-2 md:mt-4 flex items-baseline text-white">
                <span className="text-3xl md:text-5xl font-extrabold tracking-tight">₹1,200</span>
                <span className="ml-1 text-base md:text-xl font-semibold text-gray-400">/month</span>
              </div>
              <p className="mt-2 text-xs md:text-sm text-green-400 font-medium">Billed ₹7,200 semi-annually</p>
              <p className="mt-2 text-xs md:text-base text-gray-400">Save 20% with 6-month commitment</p>
              <ul className="mt-4 md:mt-6 space-y-2 md:space-y-4 flex-1">
                {['All Pro Features Included', 'Unlimited Users', 'Real-time Analytics', 'Priority Email Support', '30-Day Free Trial'].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 text-blue-400 mt-0.5" />
                    <span className="ml-2 md:ml-3 text-sm md:text-base text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('6 Months', 7200)}
                disabled={loading}
                className="mt-6 md:mt-8 block w-full bg-[#1673FF] border border-transparent rounded-lg py-2 md:py-3 px-4 md:px-6 text-center text-sm md:text-base font-bold text-white hover:bg-[#1361D6] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : user ? 'Pay Now ₹7,200' : 'Start 6-Month Trial'}
              </button>
            </div>

            {/* Yearly Plan */}
            <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 p-5 md:p-8 flex flex-col border border-gray-100">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">Yearly</h3>
              <div className="mt-2 md:mt-4 flex items-baseline text-gray-900">
                <span className="text-3xl md:text-5xl font-extrabold tracking-tight">₹1,000</span>
                <span className="ml-1 text-base md:text-xl font-semibold text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-xs md:text-sm text-green-600 font-medium">Billed ₹12,000 annually</p>
              <p className="mt-2 text-xs md:text-base text-gray-500">Best Value: Save 33% yearly</p>
              <ul className="mt-4 md:mt-6 space-y-2 md:space-y-4 flex-1">
                {['All Pro Features Included', 'Unlimited Users', 'Real-time Analytics', 'Priority Email Support', '30-Day Free Trial'].map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="flex-shrink-0 w-4 h-4 md:w-5 md:h-5 text-green-500 mt-0.5" />
                    <span className="ml-2 md:ml-3 text-sm md:text-base text-gray-500">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe('Yearly', 12000)}
                disabled={loading}
                className="mt-6 md:mt-8 block w-full bg-indigo-50 border border-transparent rounded-lg py-2 md:py-3 px-4 md:px-6 text-center text-sm md:text-base font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : user ? 'Pay Now ₹12,000' : 'Start Yearly Trial'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={async () => {
          setShowSuccessModal(false);
          // Refresh tenant data from database
          await refreshProfile();
          // Navigate to dashboard with refreshed data
          navigate('/dashboard');
        }}
        paymentId={paymentDetails.paymentId}
        planName={paymentDetails.planName}
      />
    </>
  );
}
