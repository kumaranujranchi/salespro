import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Check, Clock, Zap, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

interface TenantData {
  id: string;
  name: string;
  plan_tier: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  subscription_status: string;
  is_active: boolean;
}

export function SubscriptionPage() {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    fetchTenantData();
  }, [tenant]);

  const fetchTenantData = async () => {
    if (!tenant?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenant.id)
        .single();

      if (fetchError) throw fetchError;

      setTenantData(data);

      // Calculate days remaining
      // Use trial_ends_at if available, otherwise calculate 30 days from created_at
      let endDate: Date;

      if (data.trial_ends_at) {
        endDate = new Date(data.trial_ends_at);
      } else if (data.created_at) {
        // Fallback: 30 days trial from creation
        const createdDate = new Date(data.created_at);
        endDate = new Date(createdDate.setDate(createdDate.getDate() + 30));
      } else {
        // Fallback if no dates (shouldn't happen)
        setDaysRemaining(0);
        return;
      }

      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays);

    } catch (err: any) {
      console.error('Error fetching tenant data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  // Redirect non-trial users
  useEffect(() => {
    if (!loading && tenantData && tenantData.subscription_status !== 'trial') {
      navigate('/dashboard');
    }
  }, [loading, tenantData, navigate]);

  const trialFeatures = [
    'All Pro Features Included',
    'Unlimited Users',
    'Real-time Analytics',
    'Priority Email Support',
    'Full CRM Module Access',
    'Lead Management',
    'Sales Tracking',
    'Custom Reports'
  ];

  const paidPlanAdvantages = [
    'No trial limitations',
    'Guaranteed uptime SLA',
    'Advanced integrations',
    'Dedicated account manager',
    'Custom feature requests'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Subscription</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tenantData) {
    return null;
  }

  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E1A15] py-12">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Subscription</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your trial and explore upgrade options</p>
        </div>

        {/* Trial Status Card */}
        <div className={`rounded-2xl p-8 border-2 ${isExpired ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800' :
          isExpiringSoon ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800' :
            'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-700'
          }`}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className={`w-6 h-6 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-emerald-600'}`} />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {tenantData.plan_tier === 'pro' ? 'Pro' : 'Starter'} Trial
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                {isExpired ? 'Your trial has ended' : `You have ${daysRemaining} days remaining in your trial`}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-extrabold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-emerald-600'}`}>
                {daysRemaining > 0 ? daysRemaining : 0}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {daysRemaining === 1 ? 'Day Remaining' : 'Days Remaining'}
              </div>
            </div>
          </div>

          {tenantData.trial_ends_at && (
            <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Trial ends on:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(tenantData.trial_ends_at).toLocaleDateString('en-CA')}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                {isExpired ? 'Upgrade now to continue using all features' : 'After your trial ends, you\'ll need to upgrade to continue accessing all features'}
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Plan Features */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              What's Included in Your Trial
            </h3>
            <ul className="space-y-3">
              {trialFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade Benefits */}
          <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6" />
              <h3 className="text-xl font-bold">Upgrade to Pro</h3>
            </div>
            <p className="text-emerald-100 mb-6">
              Unlock the full potential of RealSalePro with a paid subscription
            </p>
            <ul className="space-y-3 mb-8">
              {paidPlanAdvantages.map((advantage) => (
                <li key={advantage} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-200 flex-shrink-0 mt-0.5" />
                  <span className="text-white">{advantage}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full bg-white text-emerald-600 font-bold py-3 px-6 rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 group"
            >
              Upgrade Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-xs text-emerald-200 mt-3">
              Starting at ₹1,000/month • Cancel anytime
            </p>
          </div>
        </div>

        {/* FAQ / What Happens Next */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">What happens when my trial ends?</h3>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>
              • Your account will be automatically downgraded to the free tier with limited features
            </p>
            <p>
              • All your data will be preserved and available when you upgrade
            </p>
            <p>
              • You can upgrade at any time to regain full access
            </p>
            <p className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs">
              Need more time to evaluate? <a href="/support" className="text-emerald-600 dark:text-emerald-400 hover:underline">Contact our support team</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
