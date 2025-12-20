import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowRight, Loader2 } from 'lucide-react';

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract plan details from URL if present
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
    referralCode: ''
  });

  const [verificationStep, setVerificationStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from company name
      companySlug: name === 'companyName' ? value.toLowerCase().replace(/[^a-z0-9]/g, '-') : prev.companySlug
    }));
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.phone || formData.phone.trim().length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Generate a random 6-digit OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);

      // 2. Send OTP via Netlify Function (using Nodemailer)
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'OTP',
          email: formData.email,
          name: formData.fullName,
          data: { otp: newOtp }
        })
      });

      if (!response.ok) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || 'Failed to send verification email');
        } catch {
            throw new Error(`Server Error (${response.status}): ${text || response.statusText}`);
        }
      }

      // 3. Move to Verification Step
      setVerificationStep(true);

    } catch (err: any) {
      console.error('OTP Error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Verify OTP
    if (otp !== generatedOtp) {
      setError("Invalid verification code. Please check your email and try again.");
      setLoading(false);
      return;
    }

    try {
      // 2. Sign Up (Create Auth User)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'super_admin'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // 3. Create Tenant & Link User
      const { error: rpcError } = await supabase.rpc('register_tenant', {
        company_name: formData.companyName,
        company_slug: formData.companySlug,
        user_full_name: formData.fullName,
        contact_email: formData.email,
        contact_phone: formData.phone
      });

      if (rpcError) {
        throw new Error(rpcError.message || 'Failed to create company workspace');
      }

      // 4. Auto Sign In
      await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      // 5. Redirect to pricing checkout if plan was selected, otherwise dashboard
      if (planName && planAmount) {
        const referralParam = formData.referralCode ? `&referralCode=${encodeURIComponent(formData.referralCode)}` : '';
        navigate(`/pricing?checkout=true&plan=${encodeURIComponent(planName)}&amount=${planAmount}${referralParam}`);
      } else {
        navigate('/dashboard');
      }

    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(err.message || 'Failed to complete registration');
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
          <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro" className="h-24 w-auto dark:hidden" />
          <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro" className="h-24 w-auto hidden dark:block" />
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
            <form className="space-y-6" onSubmit={sendOtp}>
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
