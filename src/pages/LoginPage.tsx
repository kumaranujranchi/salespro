import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBackend } from '../lib/reactive';
import { api } from '../lib/api-endpoints';
import { Input } from '../components/ui/Input';
import { authService } from '../lib/services';
import { SEOHead } from '../components/seo/SEOHead';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Key,
  X,
  ArrowRight,
  UserCheck,
  RefreshCw
} from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { signIn, signOut, user, profile, affiliate, loading: authLoading, setSessionUser } = useAuth();
  const backend = useBackend();
  const navigate = useNavigate();

  // Forgot Password / Security Code Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resetUserInfo, setResetUserInfo] = useState<{
    fullName?: string;
    emailSent?: boolean;
    message?: string;
  } | null>(null);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        setTimeout(() => setError(''), 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const cleanEmail = email.trim();
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 500));

    const { error: signInError, profile: loggedProfile } = await signIn(cleanEmail, password);
    await minLoadTime;

    if (signInError) {
      console.error('Login error:', signInError);
      setError(signInError.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      setSuccess('Login successful! Redirecting...');
      const role = loggedProfile?.role || 'admin';
      setTimeout(() => {
        let dest = '/dashboard';
        if (role === 'affiliate') {
          dest = '/affiliate/dashboard';
        } else if (role === 'platform_admin') {
          dest = '/platform/dashboard';
        }
        window.location.href = dest;
      }, 300);
    }
  };

  const handleOpenForgotPassword = () => {
    setResetEmail(email.trim());
    setResetOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError('');
    setResetUserInfo(null);
    setResetStep(1);
    setShowForgotPassword(true);
  };

  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setResetError('');
    const clean = resetEmail.trim().toLowerCase();
    if (!clean) {
      setResetError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      const res = await authService.forgotPassword(clean);
      setResetUserInfo(res);
      setResendCooldown(60);
      setResetStep(2);
    } catch (apiErr: any) {
      setResetError(apiErr.message || 'Unable to send security code. Please check your email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const cleanCode = resetOtp.trim();
    if (!cleanCode) {
      setResetError('Please enter the 6-digit security code sent to your email');
      return;
    }

    if (!/^\d{6}$/.test(cleanCode)) {
      setResetError('Security code must be exactly 6 digits');
      return;
    }

    if (resetNewPassword) {
      if (resetNewPassword.length < 6) {
        setResetError('New password must be at least 6 characters long');
        return;
      }
      if (resetNewPassword !== resetConfirmPassword) {
        setResetError('Passwords do not match');
        return;
      }
    }

    const clean = resetEmail.trim().toLowerCase();
    setResetLoading(true);

    try {
      // Strict REST API reset: only verified by 6-digit email code
      const res = await authService.resetPassword({
        email: clean,
        code: cleanCode,
        newPassword: resetNewPassword || undefined,
      });

      // Direct login if profile returned!
      if (res?.profile) {
        setSessionUser({
          id: res.profile.userId || (res.profile as any)._id || clean,
          email: res.profile.email || clean,
        });
        setShowForgotPassword(false);
        setSuccess('Security code verified! Redirecting to dashboard...');
      } else {
        setResetStep(3);
      }
    } catch (err: any) {
      setResetError(err.message || 'Invalid or expired security code. Please check your email and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // If already authenticated and not submitting, redirect to dashboard
  useEffect(() => {
    if (user && profile && !loading && !success) {
      let dest = '/dashboard';
      if (profile.role === 'affiliate' || affiliate) {
        dest = '/affiliate/dashboard';
      } else if (profile.role === 'platform_admin') {
        dest = '/platform/dashboard';
      }
      navigate(dest, { replace: true });
    }
  }, [user, profile, affiliate, loading, success, navigate]);

  return (
    <>
      <SEOHead
        title="Log In | RealSalePro Real Estate CRM"
        description="Log in to your RealSalePro CRM workspace to manage real estate leads, customer pipelines, and site visits."
        canonicalUrl="https://realsalepro.com/login"
        noindex={true}
      />
      <div className="min-h-screen bg-[#0E1A15] relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0E1A15] via-[#113028] to-[#10B981] opacity-20 pointer-events-none"></div>

      {/* Back to Home Link */}
      <div className="absolute top-4 left-4 z-50">
        <Link
          to="/"
          className="group flex items-center space-x-2 text-white/70 hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[400px] relative z-10">
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#10B981] to-[#0E1A15] px-6 py-5 text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center mb-3 transform transition-transform duration-500 hover:scale-105">
                <img src="/images/RealSalePro_LighLogo.png" alt="RealSalePro Logo" className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1" />
              </div>
              <h1 className="text-xl font-bold text-white mb-1 tracking-tight">Welcome Back</h1>
              <p className="text-white/80 text-[11px] uppercase tracking-wider font-medium">Sign in to your dashboard</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-5 py-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0E1A15] ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${emailFocused ? 'text-[#10B981]' : 'text-gray-400'}`}>
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    placeholder="Enter your email"
                    className={`
                        w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm text-[#0E1A15] placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981]
                        transition-all duration-300 bg-gray-50 hover:bg-white
                        ${emailFocused ? 'border-[#10B981] bg-white shadow-sm' : 'border-gray-200'}
                      `}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#0E1A15] ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${passwordFocused ? 'text-[#10B981]' : 'text-gray-400'}`}>
                    <Lock size={16} />
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    placeholder="Enter password"
                    showPasswordToggle
                    className={`
                        pl-10 pr-10 py-2.5 border rounded-lg text-sm bg-gray-50 hover:bg-white
                        transition-all duration-300
                        ${passwordFocused ? 'border-[#10B981] bg-white shadow-sm' : 'border-gray-200'}
                      `}
                  />
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[#10B981] focus:ring-[#10B981] transition-all cursor-pointer"
                  />
                  <span className="text-gray-500 group-hover:text-[#0E1A15] transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="text-[#10B981] hover:text-[#059669] font-medium transition-colors hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Box */}
              {error && (
                <div className={`flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs transition-all ${showError ? 'opacity-100' : 'opacity-0'}`}>
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              {/* Success Box */}
              {success && (
                <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs animate-fadeIn">
                  <CheckCircle size={14} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`
                    group w-full py-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold text-sm
                    transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                    disabled:opacity-75 disabled:cursor-not-allowed disabled:transform-none
                    flex items-center justify-center space-x-2
                  `}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    <span>Sign In Securely</span>
                  </>
                )}
              </button>

              {/* Quick Login with Email Security Code */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleOpenForgotPassword}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#10B981] hover:text-[#059669] font-medium transition-colors hover:underline"
                >
                  <Key size={13} />
                  <span>Login with Email Security Code / Forgot Password</span>
                </button>
              </div>
            </form>

            {/* Security Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-center">
              <div className="flex items-center justify-center space-x-1.5 text-[10px] text-gray-400">
                <Shield size={12} className="text-[#10B981]" />
                <span>256-bit SSL Encrypted Connection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="mt-6 text-center">
          <p className="text-white/30 text-[10px]">
            &copy; 2025 RealSalePro. All rights reserved.
          </p>
        </div>
      </div>

      {/* Modern Interactive Forgot Password & Security Code Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowForgotPassword(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 animate-scaleIn border border-gray-100">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* STEP 1: Enter Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-[#10B981] shadow-inner">
                    <Key size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Email Security Code Login</h3>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
                    Enter your registered email address. We will send a 6-digit security code so you can sign in directly and update your password.
                  </p>
                </div>

                {resetError && (
                  <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      placeholder="e.g. yourname@example.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-gray-50 hover:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-1/3 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-xs hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-2/3 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-75"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Security Code</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter Security Code & Sign In */}
            {resetStep === 2 && (
              <form onSubmit={handleCompleteReset} className="space-y-4">
                <div className="text-center space-y-1 mb-2">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-[#10B981] mb-2 shadow-inner">
                    <Shield size={24} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">
                    Enter Security Code
                  </h3>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
                    A 6-digit security code was sent to <strong className="text-gray-800">{resetEmail}</strong>. Enter it below to sign in.
                  </p>
                  {resetUserInfo?.fullName && (
                    <div className="inline-block bg-emerald-50 text-emerald-800 text-[11px] font-medium px-2.5 py-0.5 rounded-full mt-1">
                      Account: {resetUserInfo.fullName}
                    </div>
                  )}
                </div>

                {resetError && (
                  <div className="flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* 6-Digit Security Code Field (Strict Email OTP Only) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">
                    6-Digit Security Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Key size={16} />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-base tracking-widest font-mono font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-gray-50 hover:bg-white text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 px-0.5">
                    <span className="text-gray-400">Check your inbox or spam folder</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || resetLoading}
                      onClick={() => handleRequestReset()}
                      className="text-[#10B981] hover:text-[#059669] hover:underline font-medium inline-flex items-center space-x-1 disabled:text-gray-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw size={11} className={resetLoading ? "animate-spin" : ""} />
                      <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                    </button>
                  </div>
                </div>

                {/* Optional New Password */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gray-700">
                        New Password (Optional)
                      </label>
                      <span className="text-[10px] text-gray-400">Leave blank to just sign in</span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Create a new password (min 6 chars)"
                        className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-gray-50 hover:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {resetNewPassword.length > 0 && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                          <Lock size={16} />
                        </div>
                        <input
                          type="password"
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-gray-50 hover:bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="w-1/3 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-xs hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-2/3 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-75"
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Success Confirmation */}
            {resetStep === 3 && (
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 bg-emerald-100 text-[#10B981] rounded-full flex items-center justify-center mx-auto shadow-inner animate-scaleIn">
                  <CheckCircle size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">Success!</h3>
                  <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
                    Your account has been verified. You can now log in using your credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(resetEmail);
                    setPassword('');
                    setShowForgotPassword(false);
                    setSuccess('Account verified! Please sign in.');
                  }}
                  className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-semibold text-sm transition-all shadow-md"
                >
                  Proceed to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
