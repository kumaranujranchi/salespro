import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useBackend, useAction, useMutation } from '../lib/reactive';
import { api } from '../lib/api-endpoints';
import { SEOHead } from '../components/seo/SEOHead';
import { RelatedSolutionsCluster } from '../components/seo/RelatedSolutionsCluster';
import { initLandingInteractions } from './landingInteractions';
import '../styles/landing.css';

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
  const [referralData, setReferralData] = useState<{ code: string; discount: number; campaignId: string; referrerEmail?: string; referrerName?: string } | null>(null);
  const [validatingReferral, setValidatingReferral] = useState(false);

  useEffect(() => {
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('js');
    const cleanup = initLandingInteractions();
    return () => {
      document.body.classList.remove('landing-page-active');
      cleanup();
    };
  }, []);

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
      setSearchParams({});
      handleSubscribe(decodeURIComponent(plan), parseInt(amount, 10));
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
        toast.success(`Referral code applied! ${(data as any).discount_percent}% discount activated.`);
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
      window.location.href = "mailto:support@realsalepro.com?subject=RealSalePro%20-%20Custom%20Plan%20Inquiry";
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
      const cycle = planName === '6 Months' ? 'semi_annual' : planName === 'Yearly' ? 'yearly' : 'monthly';

      // Import service dynamically
      const { createRazorpaySubscription } = await import('../lib/subscriptionService');

      // Create subscription via backend API
      const { subscription } = await createRazorpaySubscription({
        tenantId: tenant.id,
        planId: '',
        customerName: tenant.name,
        customerEmail: user.email || '',
        customerContact: profile?.phone || tenant.settings?.company_profile?.phone || '', 
        billingCycle: cycle
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
          color: '#00E576'
        },
        handler: async function (response: any) {
          console.log('Payment successful:', response);
          toast.success('Subscription activated successfully!');
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
        toast.error('Payment gateway setup is in progress. Please contact administrator or try again shortly.');
      } else {
        toast.error(`Failed to initialize payment: ${errorMessage}`);
      }
      setLoading(false);
    }
  };

  // Pricing calculations
  const discountMultiplier = referralData ? (1 - referralData.discount / 100) : 1;

  const rawMonthlyTotal = 1500;
  const rawSemiAnnualTotal = 7200;
  const rawYearlyTotal = 12000;

  const payableMonthly = Math.round(rawMonthlyTotal * discountMultiplier);
  const payableSemiAnnual = Math.round(rawSemiAnnualTotal * discountMultiplier);
  const payableYearly = Math.round(rawYearlyTotal * discountMultiplier);

  const effectiveMonthlyForSemiAnnual = Math.round(payableSemiAnnual / 6);
  const effectiveMonthlyForYearly = Math.round(payableYearly / 12);

  const currentPayable = billingCycle === 'monthly'
    ? payableMonthly
    : billingCycle === 'semi_annual'
      ? payableSemiAnnual
      : payableYearly;

  const currentPlanName = billingCycle === 'monthly'
    ? 'Monthly'
    : billingCycle === 'semi_annual'
      ? '6 Months'
      : 'Yearly';

  const isCurrentProPlan = user && tenant?.plan_tier === 'pro' && tenant?.billing_cycle === billingCycle;
  const isCurrentFreePlan = user && tenant?.plan_tier === 'free';

  return (
    <>
      <SEOHead
        title="RealSalePro Pricing | Transparent Real Estate CRM Plans"
        description="Transparent pricing for Indian real estate developers and brokers. Free forever plan up to 1,000 leads, Pro plan with unlimited users, and custom enterprise deployments."
        canonicalUrl="https://realsalepro.com/pricing"
      />

      {/* SVG SPRITE */}
      <svg xmlns="http://www.w3.org/2000/svg" className="sprite" aria-hidden="true">
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6"/></symbol>
        <symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
        <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></symbol>
        <symbol id="i-whatsapp" viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24M8.53 7.33c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.71 0 1.01.74 1.99.84 2.13.1.14 1.44 2.21 3.5 3.1 1.71.74 2.06.59 2.43.56.37-.04 1.19-.49 1.36-.96.17-.47.17-.87.12-.96-.05-.09-.19-.14-.4-.25-.21-.1-1.2-.59-1.39-.66-.19-.07-.33-.1-.47.1-.14.21-.55.69-.67.83-.12.14-.24.16-.45.05-.21-.1-.89-.33-1.69-1.05-.62-.56-1.04-1.25-1.16-1.46-.12-.21-.01-.32.09-.43.09-.1.21-.26.31-.38.1-.12.14-.21.21-.35.07-.14.03-.26-.02-.37-.05-.1-.47-1.14-.65-1.56-.17-.41-.35-.35-.48-.36-.12-.01-.26-.01-.4-.01z"/></symbol>
        <symbol id="i-facebook" viewBox="0 0 24 24"><path fill="currentColor" d="M14 13.5h2.5l1-4H14v-2c0-1.03.77-1.5 1.5-1.5h2v-3.5h-3.5C10.5 2.5 9 4 9 7.5v2H6v4h3v10h5v-10z"/></symbol>
        <symbol id="i-linkedin" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></symbol>
        <symbol id="i-tag" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></symbol>
      </svg>

      <div className="noise" aria-hidden="true"></div>

      {/* FLOATING NAVIGATION */}
      <header className="nav" id="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__brand" aria-label="RealSalePro home">
            <img src="/assets/img/logo-light.png" alt="RealSalePro" width="176" height="34" />
          </Link>

          <nav className="nav__links" aria-label="Primary">
            <Link to="/pricing" className="is-active" style={{ color: 'var(--mint-bright)' }}>Pricing</Link>
            <Link to="/free-real-estate-crm">Free Plan</Link>
            <Link to="/crm-for-real-estate-brokers">For Brokers</Link>
            <Link to="/real-estate-crm-india">India Edition</Link>
            <Link to="/features/lead-management">Lead Management</Link>
            <Link to="/templates/real-estate-crm-excel-template">Excel Template</Link>
          </nav>

          <div className="nav__actions">
            {user ? (
              <Link className="btn btn--primary btn--sm" to="/dashboard">
                <span>Go to Dashboard</span><svg className="icon"><use href="#i-arrow"/></svg>
              </Link>
            ) : (
              <>
                <Link className="nav__login" to="/login">Log in</Link>
                <Link className="btn btn--primary btn--sm" to="/register">
                  <span>Start free</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
              </>
            )}
            <button className="nav__toggle" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
              <svg className="icon"><use href="#i-menu"/></svg>
            </button>
          </div>
        </div>

        <div className="nav__mobile" id="mobileMenu" hidden>
          <Link to="/pricing" style={{ color: 'var(--mint-bright)' }}>Pricing</Link>
          <Link to="/free-real-estate-crm">Free CRM (1,000 Leads)</Link>
          <Link to="/crm-for-real-estate-brokers">For Brokers</Link>
          <Link to="/real-estate-crm-india">India Edition</Link>
          <Link to="/features/lead-management">Lead Management</Link>
          <Link to="/templates/real-estate-crm-excel-template">Free Excel Template</Link>
          {user ? (
            <Link className="btn btn--primary" to="/dashboard">Go to Dashboard <svg className="icon"><use href="#i-arrow"/></svg></Link>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link className="btn btn--primary" to="/register">Start free <svg className="icon"><use href="#i-arrow"/></svg></Link>
            </>
          )}
        </div>
      </header>

      <main id="top">
        {/* ============ HERO SECTION ============ */}
        <section className="hero" style={{ paddingBottom: '30px' }}>
          <div className="hero__bg" aria-hidden="true">
            <div className="hero__grid"></div>
            <div className="hero__glow hero__glow--a"></div>
            <div className="hero__glow hero__glow--b"></div>
            <div className="hero__ring"></div>
          </div>

          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
            <p className="eyebrow" data-reveal style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto 16px' }}>
              <span className="eyebrow__dot"></span> Transparent &amp; Predictable Pricing
            </p>

            <h1 className="hero__title" data-reveal data-reveal-delay="80" style={{ maxWidth: '820px', margin: '0 auto 20px' }}>
              Simple, transparent <em>pricing</em>.
            </h1>

            <p className="hero__lede" data-reveal data-reveal-delay="140" style={{ maxWidth: '640px', margin: '0 auto 36px' }}>
              Choose the plan that's right for your business. No hidden setup fees, no lock-ins — upgrade or cancel anytime.
            </p>

            {/* REFERRAL CODE BOX (GLASSMORPHIC) */}
            <div
              data-reveal
              data-reveal-delay="180"
              style={{
                maxWidth: '460px',
                margin: '0 auto 36px',
                padding: '16px 20px',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(16px)',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: 'var(--shadow-dark)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted-dark)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg className="icon" style={{ width: '14px', height: '14px' }}><use href="#i-tag"/></svg> Have a Referral Code?
                </span>
                {referralData && (
                  <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}>
                    {referralData.discount}% OFF APPLIED
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter code (e.g. SAVE20)"
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#ffffff',
                    outline: 'none',
                    letterSpacing: '0.05em'
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--mint-bright)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
                />
                <button
                  type="button"
                  onClick={() => validateReferral(referralCode)}
                  disabled={validatingReferral || !referralCode}
                  className="btn btn--primary btn--sm"
                  style={{ padding: '0 20px', minWidth: '90px', borderRadius: '10px' }}
                >
                  {validatingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Apply</span>}
                </button>
              </div>
            </div>

            {/* BILLING CYCLE SELECTOR */}
            <div data-reveal data-reveal-delay="220" style={{ display: 'inline-flex', padding: '5px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '56px' }}>
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '9px 20px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: billingCycle === 'monthly' ? 'var(--mint-bright)' : 'transparent',
                  color: billingCycle === 'monthly' ? '#04120c' : 'var(--muted-dark)'
                }}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('semi_annual')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: billingCycle === 'semi_annual' ? 'var(--mint-bright)' : 'transparent',
                  color: billingCycle === 'semi_annual' ? '#04120c' : 'var(--muted-dark)'
                }}
              >
                <span>6 Months</span>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '50px',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: billingCycle === 'semi_annual' ? '#04120c' : 'rgba(0, 229, 118, 0.16)',
                    color: billingCycle === 'semi_annual' ? 'var(--mint-bright)' : 'var(--mint-bright)'
                  }}
                >
                  Save 20%
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: '12px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: billingCycle === 'yearly' ? 'var(--mint-bright)' : 'transparent',
                  color: billingCycle === 'yearly' ? '#04120c' : 'var(--muted-dark)'
                }}
              >
                <span>Yearly</span>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '50px',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    background: billingCycle === 'yearly' ? '#04120c' : 'rgba(0, 229, 118, 0.16)',
                    color: billingCycle === 'yearly' ? 'var(--mint-bright)' : 'var(--mint-bright)'
                  }}
                >
                  Save 33%
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ============ PRICING CARDS SECTION ============ */}
        <section className="section" style={{ paddingTop: 0, paddingBottom: '70px' }}>
          <div className="container">
            <div className="price-grid">
              {/* CARD 1: FREE FOREVER */}
              <article
                className="price price--dark"
                data-reveal
                style={{
                  padding: '36px 32px 42px',
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                  color: '#f4faf6'
                }}
              >
                <div className="price__top">
                  <span className="price__name" style={{ color: '#ffffff' }}>Free Forever</span>
                  <span className="price__badge" style={{ borderColor: 'rgba(255, 255, 255, 0.18)', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--muted-dark)' }}>No card</span>
                </div>
                <div className="price__amount">
                  <b style={{ color: '#ffffff' }}>₹0</b><em style={{ color: 'var(--muted-dark)' }}>forever</em>
                </div>
                <p className="price__desc" style={{ color: 'var(--muted-dark)' }}>
                  For small teams getting organised — full product, not a teaser. Manage up to 1,000 active client leads.
                </p>
                <button
                  type="button"
                  onClick={() => handleSubscribe('Free Forever', 0)}
                  disabled={loading || isCurrentFreePlan}
                  className="btn btn--outline btn--block"
                  style={{
                    marginTop: '24px',
                    marginBottom: '28px',
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.22)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    fontWeight: 700
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isCurrentFreePlan ? 'Current Plan' : 'Get started free'}
                </button>
                <ul className="price__list">
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> All pro CRM features included</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Up to 1,000 active leads</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Up to 5 team users</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Real-time deal pipeline &amp; analytics</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Meta &amp; WhatsApp webhooks</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Standard email support</li>
                </ul>
              </article>

              {/* CARD 2: PRO PLAN (FEATURED) */}
              <article
                className="price price--pro"
                data-reveal
                data-reveal-delay="80"
                style={{
                  padding: '36px 32px 42px',
                  background: 'radial-gradient(500px 280px at 100% 0%, rgba(16, 185, 129, 0.25), transparent 65%), linear-gradient(160deg, #0c3324, #051910)',
                  border: '2px solid rgba(0, 229, 118, 0.45)',
                  boxShadow: '0 30px 80px rgba(4, 18, 12, 0.6), 0 0 50px rgba(0, 229, 118, 0.15)',
                  color: '#f4faf6'
                }}
              >
                <div className="price__top">
                  <span className="price__name" style={{ color: '#ffffff' }}>Pro Plan</span>
                  <span className="price__badge price__badge--solid" style={{ background: 'var(--mint-bright)', color: '#04120c', fontWeight: 800 }}>Most Popular</span>
                </div>
                
                <div className="price__amount">
                  {billingCycle === 'monthly' && (
                    <>
                      <b style={{ color: '#ffffff' }}>₹{payableMonthly.toLocaleString('en-IN')}</b><em style={{ color: 'var(--muted-dark)' }}>/month</em>
                    </>
                  )}
                  {billingCycle === 'semi_annual' && (
                    <>
                      <b style={{ color: '#ffffff' }}>₹{effectiveMonthlyForSemiAnnual.toLocaleString('en-IN')}</b><em style={{ color: 'var(--muted-dark)' }}>/month</em>
                    </>
                  )}
                  {billingCycle === 'yearly' && (
                    <>
                      <b style={{ color: '#ffffff' }}>₹{effectiveMonthlyForYearly.toLocaleString('en-IN')}</b><em style={{ color: 'var(--muted-dark)' }}>/month</em>
                    </>
                  )}
                </div>

                <p className="price__desc" style={{ color: 'var(--muted-dark)' }}>
                  {billingCycle === 'monthly' && 'Billed ₹1,500 monthly. Flexible month-to-month commitment.'}
                  {billingCycle === 'semi_annual' && (
                    <>
                      Billed <strong style={{ color: '#ffffff' }}>₹{payableSemiAnnual.toLocaleString('en-IN')} semi-annually</strong> — Save 20%.
                      {referralData && <span style={{ color: 'var(--mint-bright)', display: 'block', marginTop: '2px' }}>Includes {referralData.discount}% referral discount!</span>}
                    </>
                  )}
                  {billingCycle === 'yearly' && (
                    <>
                      Billed <strong style={{ color: '#ffffff' }}>₹{payableYearly.toLocaleString('en-IN')} annually</strong> — Best Value (Save 33%).
                      {referralData && <span style={{ color: 'var(--mint-bright)', display: 'block', marginTop: '2px' }}>Includes {referralData.discount}% referral discount!</span>}
                    </>
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => handleSubscribe(currentPlanName, currentPayable)}
                  disabled={loading || isCurrentProPlan}
                  className="btn btn--primary btn--block"
                  style={{
                    marginTop: '24px',
                    marginBottom: '28px',
                    background: 'var(--mint-bright)',
                    color: '#04120c',
                    fontWeight: 800,
                    border: 'none'
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : isCurrentProPlan ? (
                    'Current Plan'
                  ) : (
                    <>
                      <span>Pay Now ₹{currentPayable.toLocaleString('en-IN')}</span>
                      <svg className="icon"><use href="#i-arrow"/></svg>
                    </>
                  )}
                </button>

                <ul className="price__list">
                  <li style={{ color: '#ffffff' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.25)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Everything in Free</li>
                  <li style={{ color: '#ffffff' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.25)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Up to 2,00,000 active leads</li>
                  <li style={{ color: '#ffffff' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.25)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Unlimited team members &amp; roles</li>
                  <li style={{ color: '#ffffff' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.25)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Meta CAPI &amp; Portal Webhooks (99acres, Magicbricks)</li>
                  <li style={{ color: '#ffffff' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.25)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Advanced telecaller phone masking</li>
                  <li style={{ color: '#ffffff' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.25)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Priority email &amp; WhatsApp support</li>
                </ul>
              </article>

              {/* CARD 3: CUSTOM / ENTERPRISE */}
              <article
                className="price price--dark"
                data-reveal
                data-reveal-delay="160"
                style={{
                  padding: '36px 32px 42px',
                  background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                  color: '#f4faf6'
                }}
              >
                <div className="price__top">
                  <span className="price__name" style={{ color: '#ffffff' }}>Custom</span>
                  <span className="price__badge" style={{ borderColor: 'rgba(255, 255, 255, 0.18)', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--muted-dark)' }}>Enterprise</span>
                </div>
                <div className="price__amount price__amount--text">
                  <b style={{ color: '#ffffff' }}>Custom</b>
                </div>
                <p className="price__desc" style={{ color: 'var(--muted-dark)' }}>
                  Bespoke limits, integrations and terms for large developer groups and multi-city brokerage networks.
                </p>
                <button
                  type="button"
                  onClick={handleContactSales}
                  disabled={loading}
                  className="btn btn--outline btn--block"
                  style={{
                    marginTop: '24px',
                    marginBottom: '28px',
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.22)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    fontWeight: 700
                  }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <span>Contact sales</span>}
                </button>
                <ul className="price__list">
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Custom lead limits &amp; high-volume scale</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Bring-Your-Own-Database (BYOD) self-host</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Custom ERP &amp; accounting integration</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Dedicated account manager</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Custom SLA guarantee &amp; 99.9% uptime</li>
                  <li style={{ color: 'rgba(255, 255, 255, 0.9)' }}><svg className="icon" style={{ background: 'rgba(0, 229, 118, 0.16)', color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Flexible invoice billing (NET-30)</li>
                </ul>
              </article>
            </div>

            <p className="price-fine" data-reveal>
              No credit card required for the Free plan. All transactions in Indian Rupees (INR) secured with PCI-DSS 256-bit encryption.
            </p>
          </div>
        </section>

        {/* ============ ENTERPRISE SELF-HOST & BYOD CALLOUT ============ */}
        <section className="section section--paper" style={{ padding: '70px 0' }}>
          <div className="container">
            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 36px', background: 'linear-gradient(135deg, #071d14 0%, #04120c 100%)', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.12)', color: '#ffffff', boxShadow: 'var(--shadow-dark)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
              <div>
                <p className="eyebrow eyebrow--mint" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="eyebrow__dot"></span> Complete Data Sovereignty
                </p>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, margin: '0 0 14px' }}>
                  Need to host data on your <em>own servers?</em>
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--muted-dark)', lineHeight: 1.6, margin: 0 }}>
                  RealSalePro's Bring Your Own Database (BYOD) enterprise architecture lets you connect your private AWS RDS or on-premise PostgreSQL instance while using our frontend.
                </p>
              </div>

              <div style={{ textAlign: 'left' }}>
                <ul style={{ display: 'grid', gap: '10px', fontSize: '13px', color: '#ffffff', padding: 0, margin: '0 0 20px', listStyle: 'none' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><svg className="icon" style={{ color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> 100% legal and physical database ownership</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><svg className="icon" style={{ color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> Sits behind your corporate VPC and firewalls</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><svg className="icon" style={{ color: 'var(--mint-bright)' }}><use href="#i-check"/></svg> White-label domain support (crm.yourcompany.com)</li>
                </ul>
                <Link to="/integration" className="btn btn--outline btn--sm" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <span>Explore Database Integration</span> &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============ RELATED REAL ESTATE SOLUTIONS CLUSTER ============ */}
        <RelatedSolutionsCluster currentPath="/pricing" />

        {/* ============ PRICING FAQ ACCORDION ============ */}
        <section className="section section--paper section--alt" id="faq">
          <div className="container faq-wrap">
            <header className="sec-head faq-head">
              <p className="eyebrow" data-reveal><span className="eyebrow__no">02</span> Pricing FAQ</p>
              <h2 className="sec-head__title" data-reveal data-reveal-delay="60">Frequently asked<br /><em>pricing questions</em>.</h2>
              <p className="sec-head__lede" data-reveal data-reveal-delay="120">
                Transparent answers to common billing and subscription questions.
              </p>
            </header>

            <div className="faq" data-faq>
              <div className="faq__item" data-reveal>
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-1">
                  <span>Is the Free plan really free forever?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-1" aria-hidden="true">
                  <p>Yes! Our Free Forever plan has no trial countdown and requires no credit card. Small teams can manage up to 1,000 active leads and 5 team member accounts at zero cost forever.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="40">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-2">
                  <span>Can I upgrade or downgrade between plans anytime?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-2" aria-hidden="true">
                  <p>Absolutely. You can upgrade from Free to Pro seamlessly with 1 click. If you need to switch billing cycles (e.g. from 6 Months to Yearly to save 33%), your account updates immediately.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="80">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-3">
                  <span>What payment methods are supported?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-3" aria-hidden="true">
                  <p>We accept UPI (Google Pay, PhonePe, Paytm), RuPay, Visa, Mastercard, and Net Banking through Razorpay's secure payment gateway. Enterprise clients can also opt for NEFT/RTGS bank transfer invoicing.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="120">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-4">
                  <span>What happens if I reach the 1,000 lead limit on the Free plan?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-4" aria-hidden="true">
                  <p>We will never delete your data or lock you out. When approaching 1,000 leads, you can archive or export old leads to CSV, or upgrade to Pro to unlock up to 2,00,000 leads and unlimited team users.</p>
                </div>
              </div>

              <div className="faq__item" data-reveal data-reveal-delay="160">
                <button className="faq__q" aria-expanded="false" aria-controls="faq-a-5">
                  <span>Are there any hidden onboarding or migration fees?</span>
                  <span className="faq__icon"><svg className="icon"><use href="#i-plus"/></svg></span>
                </button>
                <div className="faq__a" id="faq-a-5" aria-hidden="true">
                  <p>None. What you see is what you pay. Standard cloud onboarding, CSV migration from Excel, and team training are completely free with your subscription.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FINAL CTA ============ */}
        <section className="cta" id="demo">
          <div className="cta__bg" aria-hidden="true"></div>
          <div className="container">
            <div className="cta__card" data-reveal style={{ textAlign: 'center' }}>
              <p className="eyebrow eyebrow--mint" style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto' }}>
                <span className="eyebrow__dot"></span> Instant Setup
              </p>
              <h2 style={{ textAlign: 'center', marginTop: '22px' }}>
                Ready to accelerate your<br /><em>real estate sales?</em>
              </h2>
              <p className="cta__lede" style={{ textAlign: 'center', margin: '22px auto 0', maxWidth: '580px' }}>
                Join hundreds of Indian builders, channel partners, and agents who trust RealSalePro. Start free up to 1,000 leads today.
              </p>
              <div className="cta__actions" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '14px', marginTop: '32px' }}>
                <Link className="btn btn--primary btn--lg" to="/register">
                  <span>Start free — no card needed</span><svg className="icon"><use href="#i-arrow"/></svg>
                </Link>
                <a className="btn btn--ghost btn--lg" href="mailto:support@realsalepro.com?subject=RealSalePro%20Demo%20Request">
                  <span>Book a live demo</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="footer">
        <div className="container">
          <div className="footer__top">
            <div className="footer__brand">
              <img src="/assets/img/logo-light.png" alt="RealSalePro" width="190" height="40" style={{ height: '40px', width: 'auto', display: 'block' }} />
              <p>Empowering real-estate teams with intelligent tools and real-time insight. Built for the future of sales.</p>
              <div className="footer__social">
                <a href="https://www.facebook.com/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><svg className="icon icon--fill"><use href="#i-facebook"/></svg></a>
                <a href="https://www.linkedin.com/company/realsalepro" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg className="icon icon--fill"><use href="#i-linkedin"/></svg></a>
                <a href="https://wa.me/919525230232" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><svg className="icon icon--fill"><use href="#i-whatsapp"/></svg></a>
              </div>
            </div>

            <div className="footer__col">
              <h3>Platform</h3>
              <Link to="/pricing" style={{ color: 'var(--mint)', fontWeight: 600 }}>Pricing</Link>
              <Link to="/free-real-estate-crm">Free Real Estate CRM</Link>
              <Link to="/crm-for-real-estate-brokers">CRM for Brokers</Link>
              <Link to="/real-estate-crm-india">India Real Estate CRM</Link>
              <Link to="/features/lead-management">Lead Management</Link>
              <Link to="/templates/real-estate-crm-excel-template">Free Excel Template</Link>
            </div>

            <div className="footer__col">
              <h3>Integrations</h3>
              <a href="/#integrations">Meta Lead Ads</a>
              <a href="/#integrations">Google Ads</a>
              <a href="/#integrations">WhatsApp Business</a>
              <a href="/#integrations">Magicbricks</a>
              <a href="/#integrations">99acres</a>
            </div>

            <div className="footer__col">
              <h3>Company</h3>
              <a href="/#stories">About us</a>
              <Link to="/referral-program">Refer &amp; earn</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/pricing">Pricing</Link>
            </div>

            <div className="footer__col footer__col--contact">
              <h3>Talk to a human</h3>
              <a href="mailto:support@realsalepro.com">support@realsalepro.com</a>
              <a href="tel:+919525230232">+91 95252 30232</a>
              <a className="footer__wa" href="https://wa.me/919525230232" target="_blank" rel="noopener noreferrer">
                <svg className="icon"><use href="#i-whatsapp"/></svg> Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className="footer__wordmark" aria-hidden="true">RealSalePro</div>

          <div className="footer__bottom">
            <p>© {new Date().getFullYear()} RealSalePro. All rights reserved.</p>
            <div className="footer__legal">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/refund-policy">Refund Policy</Link>
              <Link to="/shipping-policy">Shipping Policy</Link>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp FAB */}
      <a className="wa-float" href="https://wa.me/919525230232" target="_blank" rel="noopener noreferrer" aria-label="Chat with RealSalePro on WhatsApp">
        <svg className="icon"><use href="#i-whatsapp"/></svg>
        <span className="wa-float__tip">Chat with us</span>
      </a>
    </>
  );
}
