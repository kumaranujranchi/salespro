import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowRight, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { useMutation, useAction } from "../../lib/reactive";
import { api } from '../../lib/api-endpoints';
import { SEOHead } from '../../components/seo/SEOHead';
import { PublicShell, PublicHero } from '../../components/public/PublicShell';

export function AffiliateRegistrationPage() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const registerAffiliate = useMutation(api.referrals.affiliateRegister);
  const sendEmailAction = useAction(api.emails.sendEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    channel: '',
    referralCode: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  // If user is already logged in, pre-fill known data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || '',
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const generateCode = () => {
    const namePart = formData.fullName
      ? formData.fullName.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'PART')
      : 'PARTNER';
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, referralCode: `${namePart}${randomPart}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeTerms) {
      setError('You must agree to the terms to proceed.');
      return;
    }

    // Validation for new users
    if (!user) {
         if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
         }
         if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
         }
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Register with the backend (simulating auth with email as userId for now)
      // In a real app, you'd use a full auth provider first.
      const userId = user?.id || formData.email;

      await registerAffiliate({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        referralCode: formData.referralCode,
        channel: formData.channel,
        userId: userId,
      });

      // 2. Sign in locally if not already logged in
      if (!user) {
        await signIn(formData.email, formData.password);
      }

      // 3. Trigger Welcome Email (optional, keep it for now)
      try {
        await sendEmailAction({
          type: 'AFFILIATE_WELCOME',
          email: formData.email,
          name: formData.fullName,
          data: {
            referralCode: formData.referralCode.toUpperCase()
          }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email', emailError);
      }

      setShowToast(true);

      // Redirect
      setTimeout(() => {
        navigate('/affiliate/dashboard');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Affiliate Partner Registration | RealSalePro"
        description="Register as an affiliate partner with RealSalePro and earn recurring revenue by referring real estate agencies."
        canonicalUrl="https://realsalepro.com/affiliate/register"
        noindex={true}
      />
      <PublicShell>
        <PublicHero
          compact
          eyebrow="Partner Program"
          title={<>Partner Program <em>Application</em></>}
          lede="Join our network and earn 20% recurring commission."
        />

        <section className="section section--dark pp-section pp-section--tight">
          <div className="container">
            <div className="pp-narrow pp-narrow--form">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="pp-back"
              >
                <ArrowLeft /> Back to Home
              </button>

              <div className="pp-card" data-reveal>
                <form className="pp-form" onSubmit={handleSubmit}>
                  {error && (
                    <div className="pp-alert pp-alert--error" role="alert">
                      <AlertCircle className="pp-alert__icon" />
                      <p>{error}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="fullName" className="pp-label">Full Name</label>
                    <input
                      id="fullName"
                      className="pp-input"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="Rahul Sharma"
                      readOnly={!!user} // Read-only if logged in
                      onBlur={() => !formData.referralCode && generateCode()}
                    />
                  </div>

                  <div className="pp-form__row">
                    <div>
                      <label htmlFor="email" className="pp-label">Email Address</label>
                      <input
                        id="email"
                        className="pp-input"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="rahul@example.com"
                        readOnly={!!user}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="pp-label">Mobile Number</label>
                      <input
                        id="phone"
                        className="pp-input"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="channel" className="pp-label">
                      Primary Promotion Channel
                    </label>
                    <select
                      id="channel"
                      name="channel"
                      value={formData.channel}
                      onChange={handleInputChange}
                      required
                      className="pp-input"
                    >
                      <option value="">Select a channel...</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Blog/Website">Blog / Website</option>
                      <option value="SocialMedia">Other Social Media (LinkedIn, twitter, etc.)</option>
                      <option value="Offline">Offline Network / Consultancy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Password Fields - Only for new users */}
                  {!user && (
                    <div className="pp-form__row">
                      <div>
                        <label htmlFor="password" className="pp-label">Create Password</label>
                        <input
                          id="password"
                          className="pp-input"
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="pp-label">Confirm Password</label>
                        <input
                          id="confirmPassword"
                          className="pp-input"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pp-divider-top">
                    <label htmlFor="referralCode" className="pp-label">
                      Create your Unique Referral Code
                    </label>
                    <div className="pp-input-group">
                      <input
                        type="text"
                        name="referralCode"
                        id="referralCode"
                        className="pp-input pp-input--code"
                        placeholder="Auto-Generated"
                        value={formData.referralCode}
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={generateCode}
                        className="btn btn--ghost"
                      >
                        Auto-Gen
                      </button>
                    </div>
                  </div>

                  <div className="pp-checkbox">
                    <input
                      id="agreeTerms"
                      name="agreeTerms"
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                    />
                    <label htmlFor="agreeTerms">
                      I agree to the <a href="/affiliate/terms" target="_blank" className="pp-inline-link">Partner Terms & Conditions</a>
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading || !formData.referralCode || !formData.agreeTerms}
                      className="btn btn--primary btn--lg btn--block"
                    >
                      {isLoading ? (
                        <Loader2 className="pp-spin" />
                      ) : (
                        <>
                          <span>{user ? 'Register & Start Earning' : 'Create Account & Join'}</span>
                          <ArrowRight className="icon" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        <Toast
          isVisible={showToast}
          message="Registration Successful! Redirecting..."
          type="success"
          onClose={() => setShowToast(false)}
        />
      </PublicShell>
    </>
  );
}
