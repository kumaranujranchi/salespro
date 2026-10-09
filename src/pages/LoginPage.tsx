import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConvex } from 'convex/react';
import { api } from '../lib/api-endpoints';
import { Input } from '../components/ui/Input';
import { authService } from '../lib/services';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Key,
  X,
  ArrowRight,
  UserCheck
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
  const convex = useConvex();
  const navigate = useNavigate();

  // Forgot Password / Security Code Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetEmployeeId, setResetEmployeeId] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetUserInfo, setResetUserInfo] = useState<{
    fullName?: string;
    hasPhone?: boolean;
    maskedPhone?: string | null;
    hasEmployeeId?: boolean;
    maskedEmployeeId?: string | null;
    emailSent?: boolean;
    message?: string;
  } | null>(null);

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
    // Simulate minimum loading time for better UX
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));

    const { error: signInError } = await signIn(cleanEmail, password);
    await minLoadTime;

    if (signInError) {
      console.error('Login error:', signInError);
      setError(signInError.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      setSuccess('Login successful! Redirecting...');
    }
  };

  const handleOpenForgotPassword = () => {
    setResetEmail(email.trim());
    setResetPhone('');
    setResetEmployeeId('');
    setResetOtp('');
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetError('');
    setResetUserInfo(null);
    setResetStep(1);
    setShowForgotPassword(true);
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    const clean = resetEmail.trim().toLowerCase();
    if (!clean) {
      setResetError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      // 1. Try REST API
      const res = await authService.forgotPassword(clean);
      setResetUserInfo(res);
      setResetStep(2);
    } catch (apiErr: any) {
      // 2. Fallback to Convex query if REST API is unreachable
      try {
        const convexProfile = await convex.query(api.profiles.getByEmail, { email: clean });
        if (!convexProfile) {
          throw new Error('No account found with this email. Please check your spelling.');
        }
        const rawPhone = convexProfile.phone ? String(convexProfile.phone).trim() : null;
        const phoneDigits = rawPhone ? rawPhone.replace(/\D/g, '') : '';
        const maskedPhone = phoneDigits.length >= 4 ? `******${phoneDigits.slice(-4)}` : (rawPhone ? 'Registered Phone' : null);

        setResetUserInfo({
          fullName: convexProfile.full_name,
          hasPhone: Boolean(convexProfile.phone),
          maskedPhone,
          hasEmployeeId: Boolean(convexProfile.employee_id),
          maskedEmployeeId: convexProfile.employee_id ? `***${convexProfile.employee_id.slice(-3)}` : null,
          emailSent: false,
        });
        setResetStep(2);
      } catch (convexErr: any) {
        setResetError(apiErr.message || convexErr.message || 'Account not found. Please verify your email.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const cleanCode = resetOtp.trim();
    if (!cleanCode && !resetPhone) {
      setResetError('Please enter the 6-digit security code sent to your email');
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
      // 1. Call REST API reset
      const res = await authService.resetPassword({
        email: clean,
        code: cleanCode,
        phone: resetPhone ? resetPhone.trim() : undefined,
        newPassword: resetNewPassword || undefined,
      });

      // 2. Direct login if profile returned!
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

  // Handle redirection reactively when profile/affiliate data becomes available
  useEffect(() => {
    if (success && !authLoading) {
      if (profile) {
        const timer = setTimeout(() => {
          if (profile.role === 'affiliate' || affiliate) {
            navigate('/affiliate/dashboard');
          } else if (profile.role === 'platform_admin') {
            navigate('/platform/dashboard');
          } else {
            navigate('/dashboard');
          }
        }, 500);
        return () => clearTimeout(timer);
      } else if (user && profile === null) {
        // User attempted login but profile doesn't exist in database
        setError('No account found with this email. Please check your spelling.');
        setSuccess('');
        setLoading(false);
        signOut(); // Clear the bad session
      }
    }
  }, [success, profile, user, affiliate, navigate, authLoading, signOut]);

  return (
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

                {/* 6-Digit Security Code Field (Always Visible) */}
                <div className="space-y-1">
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
                      required={!resetPhone}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-base tracking-widest font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-gray-50 hover:bg-white text-center"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">Check your inbox or spam folder for the email.</p>
                </div>

                {/* Optional Fallback Phone verification */}
                {resetUserInfo?.hasPhone && !resetOtp && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-gray-700">
                        Or verify with Phone {resetUserInfo.maskedPhone && <span className="text-gray-400 font-normal">({resetUserInfo.maskedPhone})</span>}
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <Phone size={16} />
                      </div>
                      <input
                        type="text"
                        value={resetPhone}
                        onChange={(e) => setResetPhone(e.target.value)}
                        placeholder="Last 4 digits or full phone"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] bg-gray-50 hover:bg-white"
                      />
                    </div>
                  </div>
                )}

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
  );
}
