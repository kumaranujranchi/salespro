import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../lib/services';
import { SEOHead } from '../components/seo/SEOHead';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Smartphone,
  Zap,
} from 'lucide-react';
import '../styles/register.css';

/** Which view the card is showing. */
type Mode = 'signin' | 'reset-email' | 'reset-code' | 'reset-done';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const { signIn, user, profile, affiliate, setSessionUser } = useAuth();
  const navigate = useNavigate();

  // Forgot password / email security-code flow (rendered inside the card)
  const [mode, setMode] = useState<Mode>('signin');
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

  // Hide the browser's page scrollbar only while this page is mounted (shared with /register).
  useEffect(() => {
    document.documentElement.classList.add('rr-page');
    return () => document.documentElement.classList.remove('rr-page');
  }, []);

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
    setError('');
    setMode('reset-email');
  };

  const backToSignIn = () => {
    setResetError('');
    setMode('signin');
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
      setMode('reset-code');
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
        setMode('signin');
        setSuccess('Security code verified! Redirecting to dashboard...');
      } else {
        setMode('reset-done');
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

  const headings: Record<Mode, { title: string; sub: React.ReactNode }> = {
    signin: {
      title: 'Log in to your workspace',
      sub: 'Welcome back. Pick up right where your team left off.',
    },
    'reset-email': {
      title: 'Sign in with a code',
      sub: "Forgot your password? Enter your registered email and we'll send a 6-digit security code.",
    },
    'reset-code': {
      title: 'Check your inbox',
      sub: <>We've sent a 6-digit code to <strong>{resetEmail}</strong>.</>,
    },
    'reset-done': {
      title: "You're verified",
      sub: 'Your account has been verified. You can now log in with your credentials.',
    },
  };

  return (
    <>
      <SEOHead
        title="Log In | RealSalePro Real Estate CRM"
        description="Log in to your RealSalePro CRM workspace to manage real estate leads, customer pipelines, and site visits."
        canonicalUrl="https://realsalepro.com/login"
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
              Your sales command centre
            </p>
            <h1 className="rr__title">
              Welcome back. Your <em>pipeline</em> is waiting.
            </h1>
            <p className="rr__lede">
              Today's follow-ups, site visits and fresh portal leads are already synced.
              Log in and <strong>close the next booking</strong>.
            </p>

            <ul className="rr__perks">
              {[
                "Today's follow-ups & site visits, ready the moment you log in",
                'New Meta, Google & 99acres leads auto-assigned to your team',
                'Live dashboards for bookings, collections & targets',
                'Role-based access for every member of your team',
              ].map((perk) => (
                <li key={perk}>
                  <span className="rr__tick"><Check aria-hidden="true" /></span>
                  {perk}
                </li>
              ))}
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
          <div className="rr__card rr__card--login">
            {mode !== 'signin' && (
              <span className="rr__badge" aria-hidden="true">
                {mode === 'reset-done' ? <CheckCircle2 /> : <KeyRound />}
              </span>
            )}

            <h2 className="rr__heading">{headings[mode].title}</h2>
            <p className="rr__sub">{headings[mode].sub}</p>

            {/* ---------- Sign in ---------- */}
            {mode === 'signin' && (
              <form className="rr__form" onSubmit={handleSubmit}>
                <div className="rr__field">
                  <label className="rr__label" htmlFor="login-email">Work email</label>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    className="rr__input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                    placeholder="you@company.com"
                  />
                </div>

                <div className="rr__field">
                  <div className="rr__labelrow">
                    <label className="rr__label" htmlFor="login-password">Password</label>
                    <button type="button" className="rr__link rr__link--sm" onClick={handleOpenForgotPassword}>
                      Forgot password?
                    </button>
                  </div>
                  <div className="rr__control">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="rr__input rr__input--pw"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="rr__eye"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rr__alert rr__alert--error"
                    style={{ opacity: showError ? 1 : 0, transition: 'opacity 0.3s' }}
                  >
                    <AlertCircle aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div role="status" className="rr__alert rr__alert--ok">
                    <CheckCircle2 aria-hidden="true" />
                    <span>{success}</span>
                  </div>
                )}

                <button type="submit" className="rr__btn" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="rr__spin" aria-hidden="true" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Log in
                      <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </button>

                <div className="rr__or"><span>or</span></div>

                <button type="button" className="rr__btn rr__btn--ghost" onClick={handleOpenForgotPassword}>
                  <KeyRound aria-hidden="true" />
                  Email me a sign-in code
                </button>
              </form>
            )}

            {/* ---------- Step 1: request a code ---------- */}
            {mode === 'reset-email' && (
              <form className="rr__form" onSubmit={handleRequestReset}>
                <div className="rr__field">
                  <label className="rr__label" htmlFor="reset-email">Registered email</label>
                  <input
                    id="reset-email"
                    type="email"
                    className="rr__input"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoComplete="username"
                    autoFocus
                    required
                    placeholder="you@company.com"
                  />
                </div>

                {resetError && (
                  <div role="alert" className="rr__alert rr__alert--error">
                    <AlertCircle aria-hidden="true" />
                    <span>{resetError}</span>
                  </div>
                )}

                <button type="submit" className="rr__btn" disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Loader2 className="rr__spin" aria-hidden="true" />
                      Sending code…
                    </>
                  ) : (
                    <>
                      Send security code
                      <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </button>

                <div className="rr__actions">
                  <button type="button" className="rr__link rr__link--muted" onClick={backToSignIn}>
                    ← Back to password login
                  </button>
                </div>
              </form>
            )}

            {/* ---------- Step 2: enter the code ---------- */}
            {mode === 'reset-code' && (
              <form className="rr__form" onSubmit={handleCompleteReset}>
                {resetUserInfo?.fullName && (
                  <p className="rr__chip">Account: {resetUserInfo.fullName}</p>
                )}

                <div className="rr__field">
                  <label className="rr__label" htmlFor="reset-otp">6-digit security code</label>
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    required
                    className="rr__input rr__otp"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                  />
                  <span className="rr__hint">Check your inbox or spam folder.</span>
                </div>

                <div className="rr__field">
                  <div className="rr__labelrow">
                    <label className="rr__label" htmlFor="reset-new">
                      New password <small>(optional)</small>
                    </label>
                    <span className="rr__label"><small>Leave blank to just sign in</small></span>
                  </div>
                  <div className="rr__control">
                    <input
                      id="reset-new"
                      type={showNewPassword ? 'text' : 'password'}
                      className="rr__input rr__input--pw"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      className="rr__eye"
                      onClick={() => setShowNewPassword((s) => !s)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {resetNewPassword.length > 0 && (
                  <div className="rr__field">
                    <label className="rr__label" htmlFor="reset-confirm">Confirm new password</label>
                    <input
                      id="reset-confirm"
                      type="password"
                      className="rr__input"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                    />
                  </div>
                )}

                {resetError && (
                  <div role="alert" className="rr__alert rr__alert--error">
                    <AlertCircle aria-hidden="true" />
                    <span>{resetError}</span>
                  </div>
                )}

                <button type="submit" className="rr__btn" disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Loader2 className="rr__spin" aria-hidden="true" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify & sign in
                      <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </button>

                <div className="rr__actions">
                  {resendCooldown > 0 ? (
                    <p className="rr__muted">Resend code in <b>{resendCooldown}s</b></p>
                  ) : (
                    <button
                      type="button"
                      className="rr__link"
                      disabled={resetLoading}
                      onClick={() => handleRequestReset()}
                    >
                      Didn't receive the code? Resend
                    </button>
                  )}
                  <button type="button" className="rr__link rr__link--muted" onClick={() => setMode('reset-email')}>
                    ← Change email
                  </button>
                </div>
              </form>
            )}

            {/* ---------- Step 3: verified, go sign in ---------- */}
            {mode === 'reset-done' && (
              <div className="rr__form">
                <button
                  type="button"
                  className="rr__btn"
                  onClick={() => {
                    setEmail(resetEmail);
                    setPassword('');
                    setMode('signin');
                    setSuccess('Account verified! Please sign in.');
                  }}
                >
                  Proceed to sign in
                  <ArrowRight aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="rr__trust">
              <span><ShieldCheck aria-hidden="true" /> AES-256 encrypted</span>
              <span><Smartphone aria-hidden="true" /> Works on mobile</span>
              <span><Zap aria-hidden="true" /> Real-time lead sync</span>
            </div>

            <p className="rr__switch">
              New to RealSalePro?
              <Link to="/register">Create a free account</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
