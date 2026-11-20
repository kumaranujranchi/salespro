import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMutation, useAction } from "../lib/reactive";
import { api } from '../lib/api-endpoints';
import { useAuth } from '../contexts/AuthContext';
import { authService, whatsappHubService } from '../lib/services';
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
  RefreshCw,
  MessageSquare,
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
  const [resendTimerWa, setResendTimerWa] = useState(0);
  const [resendTimerEmail, setResendTimerEmail] = useState(0);
  const [isResendingWa, setIsResendingWa] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
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
  const [whatsappOtp, setWhatsappOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [generatedWhatsappOtp, setGeneratedWhatsappOtp] = useState<string | null>(null);
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState<string | null>(null);

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
    if (resendTimerWa > 0 || resendTimerEmail > 0) {
      timer = setInterval(() => {
        setResendTimerWa((prev) => (prev > 0 ? prev - 1 : 0));
        setResendTimerEmail((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimerWa, resendTimerEmail]);

  const handleResendWhatsapp = async () => {
    if (resendTimerWa > 0 || isResendingWa) return;
    setIsResendingWa(true);
    setError(null);

    try {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      let newWaOtp = Math.floor(100000 + Math.random() * 900000).toString();
      while (newWaOtp === generatedEmailOtp) {
        newWaOtp = Math.floor(100000 + Math.random() * 900000).toString();
      }
      setGeneratedWhatsappOtp(newWaOtp);

      const waRes = await whatsappHubService.sendOtp(cleanPhone, 'signup_verification', newWaOtp);
      if (!waRes?.success) {
        throw new Error(waRes?.error || 'Failed to dispatch WhatsApp OTP.');
      }

      setSuccess(`A fresh WhatsApp verification code was sent to ${formData.phone}.`);
      setResendTimerWa(30);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to resend WhatsApp verification code');
    } finally {
      setIsResendingWa(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendTimerEmail > 0 || isResendingEmail) return;
    setIsResendingEmail(true);
    setError(null);

    try {
      let newEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      while (newEmailOtp === generatedWhatsappOtp) {
        newEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      }
      setGeneratedEmailOtp(newEmailOtp);

      await authService.sendRegistrationOtp({
        email: formData.email.trim(),
        name: formData.fullName.trim(),
        otp: newEmailOtp
      });

      setSuccess(`A fresh Email verification code was sent to ${formData.email}.`);
      setResendTimerEmail(30);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to resend Email verification code');
    } finally {
      setIsResendingEmail(false);
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

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number with WhatsApp.");
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

      // 2. Generate two completely separate, unique 6-digit OTPs
      const newEmailOtp = Math.floor(100000 + Math.random() * 900000).toString();
      let newWaOtp = Math.floor(100000 + Math.random() * 900000).toString();
      while (newWaOtp === newEmailOtp) {
        newWaOtp = Math.floor(100000 + Math.random() * 900000).toString();
      }

      setGeneratedEmailOtp(newEmailOtp);
      setGeneratedWhatsappOtp(newWaOtp);

      // A. Dispatch WhatsApp OTP to user's mobile number (MANDATORY)
      const waRes = await whatsappHubService.sendOtp(cleanPhone, 'signup_verification', newWaOtp);
      if (!waRes?.success) {
        throw new Error(waRes?.error || 'Unable to deliver WhatsApp verification code to this mobile number. Please ensure the number is registered on WhatsApp.');
      }

      // B. Dispatch Email OTP to user's email address (MANDATORY)
      await authService.sendRegistrationOtp({
        email: formData.email.trim(),
        name: formData.fullName.trim(),
        otp: newEmailOtp
      });

      setVerificationStep(true);
      setResendTimerWa(30);
      setResendTimerEmail(30);
      setSuccess(`Two separate verification codes have been sent: one to your WhatsApp (${formData.phone}) and another to your Email (${formData.email}). Both are required to verify your identity.`);
    } catch (err: any) {
      if (err?.status === 409 || err?.message?.toLowerCase().includes('already registered')) {
        setIsAlreadyRegistered(true);
        setError("This email is already registered. Please sign in instead.");
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send verification codes. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanWaInput = whatsappOtp.replace(/\D/g, '').trim();
    const cleanEmailInput = emailOtp.replace(/\D/g, '').trim();

    const isWaCorrect = cleanWaInput === generatedWhatsappOtp?.trim();
    const isEmailCorrect = cleanEmailInput === generatedEmailOtp?.trim();

    if (!isWaCorrect && !isEmailCorrect) {
      setError("Both WhatsApp and Email verification codes are incorrect. Please check the codes sent to your phone and email.");
      setLoading(false);
      return;
    }

    if (!isWaCorrect) {
      setError(`Invalid WhatsApp verification code. Please check your WhatsApp messages on ${formData.phone}.`);
      setLoading(false);
      return;
    }

    if (!isEmailCorrect) {
      setError(`Invalid Email verification code. Please check your inbox at ${formData.email}.`);
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
            <span>{verificationStep ? 'Dual Identity Verification' : '100% Free Forever • No Card Needed'}</span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {verificationStep ? 'Verify WhatsApp & Email' : 'Create Your Free Workspace'}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {verificationStep
              ? 'Enter the two separate 6-digit verification codes sent to your WhatsApp and Email.'
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

                  <p className="text-[11px] text-slate-400 text-center leading-relaxed px-2">
                    By registering, you agree to RealSalePro's{' '}
                    <Link to="/terms" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Terms of Service</Link>,{' '}
                    <Link to="/terms#dpa" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Data Processing Agreement (DPA)</Link>, and{' '}
                    <Link to="/privacy" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Privacy Policy</Link>.
                  </p>
                </div>
              </form>
            ) : (
              /* Step 2: Dual OTP Verification Form */
              <form className="space-y-5" onSubmit={verifyOtpAndRegister}>
                
                {/* Security Requirement Banner */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200/90 leading-relaxed flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-emerald-300">Mandatory Dual Verification:</span> To keep workspaces secure and eliminate fake numbers, both your WhatsApp and Email must be verified with their independent 6-digit codes.
                  </div>
                </div>

                {/* WhatsApp Verification Card */}
                <div className="p-4 rounded-xl bg-[#061810] border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                          WhatsApp Verification Code
                          {whatsappOtp.trim().length === 6 && whatsappOtp.trim() === generatedWhatsappOtp && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Matched
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Sent to <span className="text-white font-mono">{formData.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Resend WhatsApp Code */}
                    <div className="text-right">
                      {resendTimerWa > 0 ? (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Resend in <strong className="text-emerald-400">{resendTimerWa}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendWhatsapp}
                          disabled={isResendingWa}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isResendingWa ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Resend Code'
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center pt-1">
                    <input
                      name="whatsappOtp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={whatsappOtp}
                      onChange={(e) => setWhatsappOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="••••••"
                      className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] py-2.5 px-4 rounded-xl bg-[#0a2318] border-2 border-emerald-500/40 text-white placeholder-emerald-900/60 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all shadow-inner"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Email Verification Card */}
                <div className="p-4 rounded-xl bg-[#061810] border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
                          Email Verification Code
                          {emailOtp.trim().length === 6 && emailOtp.trim() === generatedEmailOtp && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Matched
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-[240px]">
                          Sent to <span className="text-white font-mono">{formData.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Resend Email Code */}
                    <div className="text-right">
                      {resendTimerEmail > 0 ? (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Resend in <strong className="text-emerald-400">{resendTimerEmail}s</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendEmail}
                          disabled={isResendingEmail}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isResendingEmail ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            'Resend Code'
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center pt-1">
                    <input
                      name="emailOtp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      placeholder="••••••"
                      className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] py-2.5 px-4 rounded-xl bg-[#0a2318] border-2 border-emerald-500/40 text-white placeholder-emerald-900/60 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all shadow-inner"
                      maxLength={6}
                    />
                  </div>
                </div>

                {/* Alerts */}
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

                {/* Primary Dual Verification Button */}
                <div className="space-y-4 pt-2">
                  <button
                    type="submit"
                    disabled={loading || whatsappOtp.trim().length < 6 || emailOtp.trim().length < 6}
                    className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl font-bold text-[#04120c] bg-[#10b981] hover:bg-[#059669] active:scale-[0.99] transition-all shadow-lg shadow-emerald-500/25 text-sm tracking-wide disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#04120c]" />
                        Verifying & Creating Workspace...
                      </>
                    ) : (
                      'Verify Both Codes & Create Account'
                    )}
                  </button>

                  {/* Back to Edit Info */}
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
                      ← Change Phone or Email / Go Back
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
