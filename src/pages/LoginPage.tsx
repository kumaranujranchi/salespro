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
import { supabase } from '../lib/supabase';

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
      setError(signInError.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    } else {
      setSuccess('Login successful! Redirecting...');
      
      try {
        // Redirection logic based on role or affiliate status
        const { data: { user } } = await supabase.auth.getUser();
        
        // 1. Check Profile for role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id)
          .maybeSingle();

        // 2. Check if they are an affiliate (have a campaign) - fallback/verify
        const { data: affiliate } = await supabase
          .from('referral_campaigns')
          .select('id')
          .eq('created_by', user?.id)
          .maybeSingle();

        setTimeout(() => {
          if (profile?.role === 'affiliate' || affiliate) {
              navigate('/affiliate/dashboard');
          } else if (profile?.role === 'platform_admin') {
              navigate('/platform/dashboard');
          } else {
              navigate('/dashboard');
          }
        }, 1000);
      } catch (err) {
        console.error('Redirection check failed:', err);
        navigate('/dashboard');
      }
    }
  };

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
                  onClick={() => setShowForgotPassword(true)}
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowForgotPassword(false)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5 relative z-10 animate-scaleIn">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="text-[#10B981]" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Please contact your system administrator or email support at:
                <br />
                <a href="mailto:anuj.kumar@wishluvbuildcon.com" className="text-[#10B981] font-medium hover:underline block mt-1">
                  anuj.kumar@wishluvbuildcon.com
                </a>
              </p>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-semibold text-sm transition-colors mt-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
