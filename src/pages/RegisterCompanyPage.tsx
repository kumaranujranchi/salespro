import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowRight, Loader2 } from 'lucide-react';

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

      const response = await fetch(`${window.location.origin}/.netlify/functions/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OTP',
          email: formData.email,
          name: formData.fullName,
          data: { otp: newOtp }
        })
      });

      if (!response.ok) throw new Error('Failed to send verification email');
      
      setSuccess('A new verification code has been sent to your email.');
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

      const response = await fetch(`${window.location.origin}/.netlify/functions/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OTP',
          email: formData.email,
          name: formData.fullName,
          data: { otp: newOtp }
        })
      });

      if (!response.ok) throw new Error('Failed to send verification email');

      setVerificationStep(true);
      setResendTimer(30);
      setSuccess('Verification code sent! Please check your email.');
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

    if (otp !== generatedOtp) {
      setError("Invalid verification code");
      setLoading(false);
      return;
    }

    try {
      // Create Tenant and Profile in Convex
      await registerTenantMutation({
        company_name: formData.companyName,
        company_slug: formData.companySlug,
        user_full_name: formData.fullName,
        contact_email: formData.email,
        contact_phone: formData.phone,
        referral_code: formData.referralCode,
        userId: formData.email, // Simulation: use email as Auth ID
      });

      // Sign In locally
      await signIn(formData.email, formData.password);

      if (planName && planAmount) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Link to="/" className="absolute top-8 left-8 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 transition-colors">
        <ArrowRight className="h-4 w-4 rotate-180" />
        Back to Home
      </Link>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro" className="h-12 w-auto dark:hidden" />
          <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro" className="h-12 w-auto hidden dark:block" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {verificationStep ? 'Verify your Email' : 'Register your Company'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {verificationStep
            ? `We've sent a 6-digit code to ${formData.email}`
            : 'Start your 30-day free trial. No credit card required.'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">

          {!verificationStep ? (
            /* Step 1: Registration Form */
            <form className="space-y-6" onSubmit={handleSignup}> {/* Changed onSubmit to handleSignup */}
              <div>
                <Input
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <Input
                  label="Your Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div>
                <Input
                  label="Referral Code (Optional)"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleInputChange}
                  placeholder="Enter code if you have one"
                  disabled={!!searchParams.get('ref')}
                  helperText={searchParams.get('ref') ? "Referral code applied from link" : ""}
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* Step 2: OTP Verification Form */
            <form className="space-y-6" onSubmit={verifyOtpAndRegister}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Verification Code
                </label>
                <div className="flex gap-2 justify-center">
                  <Input
                    name="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="123456"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Check your spam folder if you don't see the email.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm text-center">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-md text-sm text-center">
                  {success}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                      Verifying & Creating Account...
                    </>
                  ) : (
                    'Verify & Create Account'
                  )}
                </Button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend code in <span className="font-bold">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-500 transition disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setVerificationStep(false)}
                  className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Change Email / Go Back
                </button>
              </div>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in to existing workspace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
