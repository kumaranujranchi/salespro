import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowRight, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Toast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';

export function AffiliateRegistrationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        fullName: user.user_metadata?.full_name || prev.fullName,
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
      let userId = user?.id;

      // 1. If no user, create account first
      if (!userId) {
         const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
               data: {
                  full_name: formData.fullName,
                  role: 'affiliate' // Or default role, permissions handled by RLS
               }
            }
         });

         if (authError) {
             // If user already exists, try to sign in
             if (authError.message.includes('already registered')) {
                 const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password
                 });

                 if (signInError) {
                     if (signInError.message.includes('Invalid login credentials')) {
                         throw new Error('Account exists with a different password. Please log in first.');
                     } else if (signInError.message.includes('Email not confirmed')) {
                         throw new Error('Account exists but email is not confirmed. Please check your inbox.');
                     }
                     throw signInError;
                 }
                 
                 // If sign in successful, use this user ID
                 if (signInData.user) {
                     userId = signInData.user.id;
                 } else {
                     throw new Error('Login failed during registration.');
                 }
             } else {
                 throw authError;
             }
         } else if (authData.user) {
             userId = authData.user.id;

             // Auto sign in immediately to proceed (if not implicit)
             const { error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
             });
             
             // Ignore 'Email not confirmed' error here if we want to block them later, 
             // but for now, we assume we might need it.
             // However, for pure new signup, Supabase might not allow sign in if 'Confirm Email' is on.
             // If we can't sign in, we can't create the campaign due to RLS.
             if (signInError) {
                  if (signInError.message.includes('Email not confirmed')) {
                      // Special case: New user, email needs confirmation.
                      // We can't create campaign yet.
                      setError('Please check your email to confirm your account, then log in to complete setup.');
                      setIsLoading(false);
                      return;
                  }
                  throw signInError;
             }
         } else {
             throw new Error('Registration failed.');
         }
      }

       // 2. Create Campaign
       const { error: dbError } = await supabase
        .from('referral_campaigns')
        .insert({
          code: formData.referralCode.toUpperCase(),
          name: `${formData.fullName}'s Campaign`,
          created_by: userId,
          referrer_commission_percent: 20.00,
          referee_discount_percent: 10.00,
          is_active: true,
          channel: formData.channel // Store channel info
        })
        .select()
        .single();

      if (dbError) {
        if (dbError.code === '23505') {
          throw new Error('This referral code is already taken. Please try another.');
        }
        throw dbError;
      }

      // 3. Trigger Welcome Email
      try {
        await fetch('/.netlify/functions/send-affiliate-welcome', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            name: formData.fullName,
            referralCode: formData.referralCode.toUpperCase()
          })
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
       {/* Back Button */}
       <button 
         onClick={() => navigate('/')} 
         className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
       >
         <ArrowLeft className="w-5 h-5" /> Back to Home
       </button>

      <div className="max-w-xl w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="text-center">
           <img src="/images/RealSalePro_DarkLogo.png" alt="RealSalePro" className="h-12 w-auto mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Partner Program Application
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
             Join our network and earn 20% recurring commission.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
             <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                  readOnly={!!user} // Read-only if logged in
                  onBlur={() => !formData.referralCode && generateCode()}
                />
             </div>

             <div className="sm:col-span-1">
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                  readOnly={!!user}
                />
             </div>

             <div className="sm:col-span-1">
                <Input
                  label="Mobile Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="+91 98765 43210"
                />
             </div>

             <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   Primary Promotion Channel
                </label>
                <select
                  name="channel"
                  value={formData.channel}
                  onChange={handleInputChange}
                  required
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white py-2.5 px-3"
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
                 <>
                    <div className="sm:col-span-1">
                        <Input
                        label="Create Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="••••••••"
                        />
                    </div>
                    <div className="sm:col-span-1">
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
                 </>
             )}

             <div className="sm:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Create your Unique Referral Code
                </label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="referralCode"
                    id="referralCode"
                    className="flex-1 focus:ring-emerald-500 focus:border-emerald-500 block w-full min-w-0 rounded-none rounded-l-md sm:text-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 uppercase tracking-wider font-bold bg-gray-50 cursor-not-allowed"
                    placeholder="Auto-Generated"
                    value={formData.referralCode}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none text-sm font-medium"
                  >
                    Auto-Gen
                  </button>
                </div>
             </div>
          </div>

          <div className="flex items-start mt-6">
              <div className="flex items-center h-5">
                <input
                  id="agreeTerms"
                  name="agreeTerms"
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({...formData, agreeTerms: e.target.checked})}
                  className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeTerms" className="font-medium text-gray-700 dark:text-gray-300">
                  I agree to the <a href="/affiliate/terms" target="_blank" className="text-emerald-600 hover:underline">Partner Terms & Conditions</a>
                </label>
              </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.referralCode || !formData.agreeTerms}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {user ? 'Register & Start Earning' : 'Create Account & Join'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <Toast 
        isVisible={showToast} 
        message="Registration Successful! Redirecting..." 
        type="success" 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
}
