import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/Input';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  Mail
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
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

    // Simulate minimum loading time for better UX
    const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));

    const { error: signInError } = await signIn(email, password);
    await minLoadTime;

    if (signInError) {
      console.error('Login error:', signInError);
      // Show actual error to help debugging recursion/database issues
      setError(signInError.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      setSuccess('Login successful! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1C37] via-[#0F2744] to-[#1673FF] relative overflow-y-auto overflow-x-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 -left-20 md:left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 -right-20 md:right-10 w-96 h-96 bg-[#1673FF] rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-50 animate-fadeIn">
        <Link
          to="/"
          className="group flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-300"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="min-h-[100dvh] flex items-center justify-center p-4 md:p-8 relative z-10">
        <div className="max-w-md w-full animate-fadeInUp">
          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-card-custom overflow-hidden transform transition-all duration-500">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-[#1673FF] to-[#0A1C37] px-8 py-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center mb-4 transform transition-transform duration-500 hover:scale-110 hover:rotate-3">
                  <img src="/logo-light.png" alt="WishPro Logo" className="w-20 h-20 object-contain rounded-2xl" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                <p className="text-white/80 text-sm">Sign in to access your WishPro dashboard</p>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
            </div>

            {/* Form Section */}
            <div className="px-8 py-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                  <label className="block text-sm font-semibold text-[#0A1C37] mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${emailFocused ? 'text-[#1673FF]' : 'text-gray-400'
                      }`}>
                      <Mail size={20} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      required
                      placeholder="your.email@company.com"
                      autoComplete="email"
                      className={`
                        w-full pl-12 pr-4 py-4 border-2 rounded-xl text-[#0A1C37] placeholder-gray-400
                        focus:outline-none focus:ring-4 focus:ring-[#1673FF]/20 focus:border-[#1673FF]
                        transition-all duration-300 bg-gray-50 hover:bg-white
                        ${emailFocused ? 'border-[#1673FF] bg-white shadow-lg' : 'border-gray-200'}
                      `}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
                  <label className="block text-sm font-semibold text-[#0A1C37] mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${passwordFocused ? 'text-[#1673FF]' : 'text-gray-400'
                      }`}>
                      <Lock size={20} />
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      required
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      showPasswordToggle
                      className={`
                        pl-12 pr-12 py-4 border-2 rounded-xl bg-gray-50 hover:bg-white
                        transition-all duration-300
                        ${passwordFocused ? 'border-[#1673FF] bg-white shadow-lg' : 'border-gray-200'}
                      `}
                    />
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm animate-fadeInUp" style={{ animationDelay: '300ms' }}>
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-[#1673FF] focus:ring-[#1673FF] focus:ring-2 transition-all cursor-pointer"
                    />
                    <span className="text-gray-600 group-hover:text-[#0A1C37] transition-colors">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[#1673FF] hover:text-[#0A1C37] font-medium transition-colors duration-300 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className={`
                    flex items-start space-x-3 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-4 rounded-xl
                    transition-all duration-300 transform
                    ${showError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                  `}>
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="flex items-start space-x-3 bg-green-50 border-2 border-green-200 text-green-700 px-4 py-4 rounded-xl animate-fadeIn">
                    <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{success}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    group relative w-full px-8 py-4 bg-gradient-to-r from-[#1673FF] to-[#0A1C37] text-white rounded-xl font-semibold text-lg
                    transition-all duration-300 transform
                    ${loading
                      ? 'opacity-75 cursor-not-allowed'
                      : 'hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]'
                    }
                    animate-fadeInUp
                  `}
                  style={{ animationDelay: '400ms' }}
                >
                  <div className="flex items-center justify-center space-x-3">
                    {loading ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <Shield size={24} className="group-hover:scale-110 transition-transform" />
                        <span>Sign In Securely</span>
                      </>
                    )}
                  </div>

                  {/* Button Shine Effect */}
                  {!loading && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                  )}
                </button>
              </form>

              {/* Security Badge */}
              <div className="mt-8 pt-6 border-t border-gray-200 animate-fadeInUp" style={{ animationDelay: '500ms' }}>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Shield size={16} className="text-[#2BA67A]" />
                  <span>256-bit SSL Encrypted Connection</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4 animate-fadeIn" style={{ animationDelay: '600ms' }}>
            <p className="text-white/60 text-sm">
              Don't have an account?{' '}
              <button className="text-white font-semibold hover:underline transition-all">
                Contact Administrator
              </button>
            </p>
            <p className="text-white/40 text-xs">
              &copy; 2024 WishPro. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Apple-style Jumping Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setShowForgotPassword(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 animate-bounce-in transform transition-all scale-100">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-[#1673FF]" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Please contact your system administrator or email support at
                <br />
                <a href="mailto:anuj.kumar@wishluvbuildcon.com" className="text-[#1673FF] font-medium hover:underline">
                  anuj.kumar@wishluvbuildcon.com
                </a>
                <br />
                to initiate a password reset.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full py-3 bg-[#1673FF] hover:bg-[#0A1C37] text-white rounded-xl font-semibold transition-colors duration-200"
                >
                  Okay, understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
