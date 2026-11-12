import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMutation, useAction } from "../lib/reactive";
import { api } from '../lib/api-endpoints';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/services';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  Building2,
  User,
  Phone,
  Tag,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerTenantMutation = useMutation(api.tenants.register);

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
    if (name === 'email') {
      setIsAlreadyRegistered(false);
      setError(null);
    }
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

      await authService.sendRegistrationOtp({
        email: formData.email.trim(),
        name: formData.fullName.trim(),
        otp: newOtp
      });
      
      setSuccess(`A fresh 6-digit code has been sent to ${formData.email}.`);
      setResendTimer(30);
    } catch (err: any) {
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

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setIsAlreadyRegistered(false);

    try {
      // 1. Check if email is already registered in the database
      const checkResult = await authService.checkEmail(formData.email.trim());
      if (checkResult?.exists) {
        setIsAlreadyRegistered(true);
        setError("This email is already registered in our system. Please sign in to your existing account.");
        setLoading(false);
        return;
      }

      // 2. Generate and dispatch secure 6-digit OTP via verified Hostinger SMTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);

      await authService.sendRegistrationOtp({
        email: formData.email.trim(),
        name: formData.fullName.trim(),
        otp: newOtp
      });

      setVerificationStep(true);
      setResendTimer(30);
      setSuccess(`Verification code sent to ${formData.email}! Please check your inbox.`);
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.toLowerCase().includes('already registered')) {
        setIsAlreadyRegistered(true);
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send verification code. Please check your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isValid = (otp.trim() === generatedOtp?.trim());

    if (!isValid) {
      setError("Invalid verification code. Please check your email inbox or spam folder.");
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
        userId: formData.email,
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
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Create Your Free CRM Account | RealSalePro"
        description="Sign up for RealSalePro. 100% Free Forever for up to 1,000 property leads. No credit card required."
        canonicalUrl="https://realsalepro.com/register"
        noindex={true}
      />
      <div className="min-h-screen bg-[#04120c] text-[#f4faf6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500/30 selection:text-white">
        
        {/* Subtle Ambient Background Glow matching Landing Page */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[130px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[400px] bg-emerald-600/5 blur-[120px] rounded-full" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        {/* Back to Home Link */}
        <div className="absolute top-6 left-6 z-20">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-slate-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header Branding */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
          <Link to="/" className="inline-block">
            <img
              src="/assets/img/logo-light.png"
              alt="RealSalePro"
              className="h-9 w-auto mx-auto object-contain"
            />
          </Link>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Free Forever • No Card Needed</span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {verificationStep ? 'Verify Your Email' : 'Create Your Free Workspace'}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {verificationStep
              ? 'We sent a 6-digit cryptographic verification code to your email.'
              : 'Turn real estate enquiries into bookings from one calm tab.'}
          </p>
        </div>

        {/* Form Card Container */}
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
          <div className="bg-[#071d14]/95 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-black/60 rounded-2xl p-6 sm:p-10">

            {!verificationStep ? (
              /* Step 1: Registration Form */
              <form className="space-y-5" onSubmit={handleSignup}>
                
                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                    Agency / Company Name <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Apex Realty & Infra"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0a2318] border border-emerald-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                    Your Full Name <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0a2318] border border-emerald-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                    Official Email Address <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="rahul@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0a2318] border border-emerald-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                    Phone / Mobile Number <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0a2318] border border-emerald-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password in 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                      Password <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0a2318] border border-emerald-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                      Confirm Password <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0a2318] border border-emerald-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Referral Code (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1.5">
                    Referral Code (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Tag className="h-4 w-4" />
                    </div>
                    <input
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleInputChange}
                      placeholder="Enter code if you have one"
                      disabled={!!searchParams.get('ref')}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0a2318] border border-emerald-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-sm transition-all disabled:opacity-60"
                    />
                  </div>
                  {searchParams.get('ref') && (
                    <p className="text-xs text-emerald-400 mt-1">Referral code applied from invite link</p>
                  )}
                </div>

                {/* Duplicate Email Warning Banner with Sign In Action */}
                {isAlreadyRegistered && (
                  <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl p-4 text-center space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm">
                      <AlertCircle className="w-5 h-5 text-emerald-400" />
                      Email Already Registered
                    </div>
                    <p className="text-xs text-slate-300">
                      An account for <strong className="text-white">{formData.email}</strong> is already registered in RealSalePro.
                    </p>
                    <div>
                      <Link
                        to={`/login?email=${encodeURIComponent(formData.email)}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] text-[#04120c] font-bold text-sm hover:bg-[#059669] transition-all shadow-lg shadow-emerald-500/20"
                      >
                        Sign In to Your Workspace <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* General Error Banner */}
                {error && !isAlreadyRegistered && (
                  <div className="bg-red-500/15 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-sm flex items-center gap-2 text-center justify-center">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Primary Action Button (Continue) - High Contrast & Glowing */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl font-bold text-[#04120c] bg-[#10b981] hover:bg-[#059669] active:scale-[0.99] transition-all shadow-lg shadow-emerald-500/25 text-sm tracking-wide disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#04120c]" />
                        Sending Verification Code...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4 text-[#04120c]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: OTP Verification Form with Generous Spacing */
              <form className="space-y-6" onSubmit={verifyOtpAndRegister}>
                
                {/* Email Chip Banner */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{formData.email}</span>
                  </div>
                </div>

                {/* Enter Verification Code Input Section */}
                <div className="text-center">
                  <label className="block text-sm font-semibold text-emerald-100 mb-3 tracking-wide">
                    Enter 6-Digit Verification Code
                  </label>
                  
                  <div className="my-3 flex justify-center">
                    <input
                      name="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="••••••"
                      className="w-full max-w-xs text-center text-3xl font-mono font-bold tracking-[0.4em] py-3.5 px-4 rounded-xl bg-[#0a2318] border-2 border-emerald-500/40 text-white placeholder-emerald-900/60 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all shadow-inner"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Check your inbox or spam folder if you haven't received the code.
                  </p>
                </div>

                {/* Alerts with Clean Breathing Room */}
                {error && (
                  <div className="bg-red-500/15 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-xs text-center flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl text-xs text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Primary Verification Button */}
                <div className="space-y-4 pt-2">
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl font-bold text-[#04120c] bg-[#10b981] hover:bg-[#059669] active:scale-[0.99] transition-all shadow-lg shadow-emerald-500/25 text-sm tracking-wide disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#04120c]" />
                        Verifying & Creating Workspace...
                      </>
                    ) : (
                      'Verify & Create Account'
                    )}
                  </button>

                  {/* Resend Cooldown Section */}
                  <div className="text-center pt-1">
                    {resendTimer > 0 ? (
                      <p className="text-xs text-slate-400">
                        Resend verification code in{' '}
                        <span className="font-bold text-emerald-400">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isResending}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 underline underline-offset-4 decoration-emerald-500/40 cursor-pointer"
                      >
                        {isResending ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Didn't receive the code? Resend"
                        )}
                      </button>
                    )}
                  </div>

                  {/* Back to Edit Email */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationStep(false);
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      ← Change Email / Go Back
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Existing Workspace / Sign In Footer */}
            <div className="mt-8 pt-6 border-t border-emerald-500/15 text-center">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                Already have an account?
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-400 transition-all"
              >
                Sign in to existing workspace
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
