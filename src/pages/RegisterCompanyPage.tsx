import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMutation, useAction } from "../lib/reactive";
import { api } from '../lib/api-endpoints';
import { useAuth } from '../contexts/AuthContext';
import { whatsappHubService } from '../lib/services';
import { ArrowRight, ArrowLeft, Loader2, Check, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, CreditCard, Zap } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import '../styles/register.css';

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const registerTenantMutation = useMutation(api.tenants.register);
  const sendEmailAction = useAction(api.emails.sendEmail);

  const planName = searchParams.get('plan');
  const planAmount = searchParams.get('amount');

  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: searchParams.get('ref') || ''
  });

  const [verificationStep, setVerificationStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      companySlug: name === 'companyName' ? value.toLowerCase().replace(/[^a-z0-9]/g, '-') : prev.companySlug
    }));
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleResendCode = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);

      await sendEmailAction({
        type: 'OTP',
        email: formData.email,
        name: formData.fullName,
        data: { otp: newOtp }
      });

      if (formData.phone) {
        try {
          await whatsappHubService.sendOtp(formData.phone, 'signup_verification');
        } catch (waErr) {
          console.warn('WhatsApp OTP resend warning:', waErr);
        }
      }
      
      setSuccess('A new verification code has been sent to your WhatsApp and Email.');
      setResendTimer(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification code');
    } finally {
      setIsResending(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);

      await sendEmailAction({
        type: 'OTP',
        email: formData.email,
        name: formData.fullName,
        data: { otp: newOtp }
      });

      if (formData.phone) {
        try {
          await whatsappHubService.sendOtp(formData.phone, 'signup_verification');
        } catch (waErr) {
          console.warn('WhatsApp OTP send warning:', waErr);
        }
      }

      setVerificationStep(true);
      setResendTimer(30);
      setSuccess(
        formData.phone
          ? `Verification code sent to your WhatsApp (${formData.phone}) and Email!`
          : 'Verification code sent to your email!'
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let isValid = (otp === generatedOtp);

    // If local match fails, attempt verification via WhatsApp OTP backend service
    if (!isValid && formData.phone) {
      try {
        const waVerify = await whatsappHubService.verifyOtp(formData.phone, otp, 'signup_verification');
        if (waVerify?.data?.success) {
          isValid = true;
        }
      } catch (waErr) {
        console.warn('WhatsApp OTP verify check:', waErr);
      }
    }

    if (!isValid) {
      setError("Invalid verification code. Please check your WhatsApp or Email.");
      setLoading(false);
      return;
    }

    try {
      // Create Tenant and Profile in the backend
      await registerTenantMutation({
        company_name: formData.companyName,
        company_slug: formData.companySlug,
        user_full_name: formData.fullName,
        contact_email: formData.email,
        contact_phone: formData.phone,
        referral_code: formData.referralCode,
        userId: formData.email, // Simulation: use email as Auth ID
        password: formData.password,
      });

      // Sign In locally
      await signIn(formData.email, formData.password);

      if (planName && planName !== 'Free' && planName !== 'Free Forever' && planAmount && parseInt(planAmount) > 0) {
        const referralParam = formData.referralCode ? `&referralCode=${encodeURIComponent(formData.referralCode)}` : '';
        navigate(`/pricing?checkout=true&plan=${encodeURIComponent(planName)}&amount=${planAmount}${referralParam}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isPaidPlan = !!(planName && planName !== 'Free' && planName !== 'Free Forever' && planAmount && parseInt(planAmount) > 0);
  const passwordMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;
  const refFromLink = !!searchParams.get('ref');

  // Hide the browser's page scrollbar only while /register is mounted.
  useEffect(() => {
    document.documentElement.classList.add('rr-page');
    return () => document.documentElement.classList.remove('rr-page');
  }, []);

  return (
    <>
      <SEOHead
        title="Create Your Free CRM Account | RealSalePro"
        description="Sign up for RealSalePro. 100% Free Forever for up to 1,000 property leads. No credit card required."
        canonicalUrl="https://realsalepro.com/register"
        noindex={true}
      />
      <div className="rr">
        <div className="rr__bg" aria-hidden="true">
          <div className="rr__grid" />
          <div className="rr__glow rr__glow--a" />
          <div className="rr__glow rr__glow--b" />
          <div className="rr__ring" />
          <div className="rr__noise" />
        </div>

        {/* ---------- Left: story ---------- */}
        <aside className="rr__story">
          <div className="rr__top">
            <Link to="/" className="rr__brand" aria-label="RealSalePro home">
              <img src="/assets/img/logo-light.png" alt="RealSalePro" width={176} height={34} />
            </Link>
            <Link to="/" className="rr__back">
              <ArrowLeft aria-hidden="true" />
              <span>Back to home</span>
            </Link>
          </div>

          <div className="rr__copy">
            <p className="rr__eyebrow">
              <span className="rr__dot" />
              100% free real-estate CRM
              <span className="rr__new">No card, ever</span>
            </p>
            <h1 className="rr__title">
              Turn every enquiry into a <em>booking</em>.
            </h1>
            <p className="rr__lede">
              Set up your workspace in under two minutes. Pull leads from Meta, Google,
              Magicbricks and WhatsApp into one calm pipeline. Free up to <strong>1,000 leads</strong>.
            </p>

            <ul className="rr__perks">
              {[
                'Auto-sync Meta, Google Ads, 99acres & WhatsApp leads',
                'Site visits, inventory & incentives in one tab',
                'Up to 5 users free. Upgrade only when you grow',
                'Free onboarding & Excel data migration',
              ].map((perk) => (
                <li key={perk}>
                  <span className="rr__tick"><Check aria-hidden="true" /></span>
                  {perk}
                </li>
              ))}
            </ul>

            <ul className="rr__facts">
              <li><b>₹0</b><span>Free forever plan</span></li>
              <li><b>1,000</b><span>Lead capacity</span></li>
              <li><b>4.8<i>★</i></b><span>1,056 reviews</span></li>
            </ul>
          </div>

          <div className="rr__proof rr__proof--story">
            <span className="rr__avatars" aria-hidden="true">
              <i style={{ '--av': 'linear-gradient(135deg,#34d399,#059669)' } as React.CSSProperties}>RS</i>
              <i style={{ '--av': 'linear-gradient(135deg,#f0c987,#c98b3c)' } as React.CSSProperties}>AK</i>
              <i style={{ '--av': 'linear-gradient(135deg,#8fb7ff,#3f6fd8)' } as React.CSSProperties}>NP</i>
              <i style={{ '--av': 'linear-gradient(135deg,#c0f08a,#79b131)' } as React.CSSProperties}>VJ</i>
            </span>
            <p>Trusted by <strong>10,000+ users</strong> and 50+ developer teams across India.</p>
          </div>
        </aside>

        {/* ---------- Right: form ---------- */}
        <main className="rr__panel">
          <div className="rr__card">
            <div className="rr__steps" aria-label="Signup progress">
              <span className={`rr__step ${verificationStep ? 'is-done' : 'is-active'}`}>
                <b>{verificationStep ? <Check aria-hidden="true" /> : '1'}</b>
                <span>Your details</span>
              </span>
              <span className="rr__stepline" />
              <span className={`rr__step ${verificationStep ? 'is-active' : ''}`}>
                <b>2</b>
                <span>Verify</span>
              </span>
            </div>

            <h2 className="rr__heading">
              {verificationStep ? 'Check your inbox' : 'Create your free account'}
            </h2>
            <p className="rr__sub">
              {verificationStep ? (
                <>We've sent a 6-digit code to <strong>{formData.email}</strong>{formData.phone ? ' and your WhatsApp' : ''}.</>
              ) : (
                'Start managing your real estate leads today.'
              )}
            </p>

            {isPaidPlan && (
              <div className="rr__plan">
                <span>Selected plan: <b>{planName}</b></span>
                <span>₹{Number(planAmount).toLocaleString('en-IN')}</span>
              </div>
            )}

            {!verificationStep ? (
              /* Step 1: Registration form */
              <form className="rr__form" onSubmit={handleSignup}>
                <div className="rr__row">
                  <Field label="Company name" htmlFor="rr-company">
                    <input
                      id="rr-company"
                      className="rr__input"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      autoComplete="organization"
                      placeholder="Acme Realty"
                    />
                  </Field>
                  <Field label="Your name" htmlFor="rr-name">
                    <input
                      id="rr-name"
                      className="rr__input"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      autoComplete="name"
                      placeholder="Rahul Sharma"
                    />
                  </Field>
                </div>

                <div className="rr__row">
                  <Field label="Work email" htmlFor="rr-email">
                    <input
                      id="rr-email"
                      className="rr__input"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      autoComplete="email"
                      placeholder="rahul@company.com"
                    />
                  </Field>
                  <Field label="Phone (WhatsApp)" htmlFor="rr-phone">
                    <input
                      id="rr-phone"
                      className="rr__input"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                    />
                  </Field>
                </div>

                <div className="rr__row">
                  <Field label="Password" htmlFor="rr-password">
                    <PasswordInput
                      id="rr-password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                    />
                  </Field>
                  <Field
                    label="Confirm password"
                    htmlFor="rr-confirm"
                    hint={passwordMismatch ? "Passwords don't match yet" : undefined}
                    warn
                  >
                    <PasswordInput
                      id="rr-confirm"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      autoComplete="new-password"
                    />
                  </Field>
                </div>

                <Field
                  label={<>Referral code <small>(optional)</small></>}
                  htmlFor="rr-ref"
                  hint={refFromLink ? 'Referral code applied from link' : undefined}
                >
                  <input
                    id="rr-ref"
                    className="rr__input"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                    disabled={refFromLink}
                    placeholder="Enter code if you have one"
                  />
                </Field>

                {error && (
                  <div className="rr__alert rr__alert--error" role="alert">
                    <AlertCircle aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="rr__btn" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="rr__spin" aria-hidden="true" />
                      Sending verification code…
                    </>
                  ) : (
                    <>
                      Create free account
                      <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </button>

                <p className="rr__fine">
                  By continuing you agree to our <Link to="/terms">Terms</Link> and{' '}
                  <Link to="/privacy">Privacy Policy</Link>.
                </p>
              </form>
            ) : (
              /* Step 2: OTP verification */
              <form className="rr__form" onSubmit={verifyOtpAndRegister}>
                <Field label="Verification code" htmlFor="rr-otp">
                  <input
                    id="rr-otp"
                    className="rr__input rr__otp"
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    maxLength={6}
                    autoFocus
                  />
                </Field>
                <p className="rr__muted">Check your WhatsApp or spam folder if you haven't received the code.</p>

                {error && (
                  <div className="rr__alert rr__alert--error" role="alert">
                    <AlertCircle aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="rr__alert rr__alert--ok" role="status">
                    <CheckCircle2 aria-hidden="true" />
                    <span>{success}</span>
                  </div>
                )}

                <button type="submit" className="rr__btn" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="rr__spin" aria-hidden="true" />
                      Verifying & creating account…
                    </>
                  ) : (
                    <>
                      Verify & create account
                      <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </button>

                <div className="rr__actions">
                  {resendTimer > 0 ? (
                    <p className="rr__muted">Resend code in <b>{resendTimer}s</b></p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="rr__link"
                    >
                      {isResending ? 'Sending…' : "Didn't receive the code? Resend"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setVerificationStep(false)}
                    className="rr__link"
                    style={{ color: 'var(--muted)' }}
                  >
                    ← Change email / go back
                  </button>
                </div>
              </form>
            )}

            <div className="rr__trust">
              <span><ShieldCheck aria-hidden="true" /> AES-256 encrypted</span>
              <span><CreditCard aria-hidden="true" /> No credit card</span>
              <span><Zap aria-hidden="true" /> Live in 2 minutes</span>
            </div>

            <p className="rr__switch">
              Already have an account?
              <Link to="/login">Log in</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  warn,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  hint?: string;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rr__field">
      <label className="rr__label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <span className={`rr__hint ${warn ? 'rr__hint--warn' : ''}`}>{hint}</span>}
    </div>
  );
}

function PasswordInput(props: {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="rr__control">
      <input
        {...props}
        className="rr__input rr__input--pw"
        type={show ? 'text' : 'password'}
        required
        placeholder="••••••••"
      />
      <button
        type="button"
        className="rr__eye"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </div>
  );
}
