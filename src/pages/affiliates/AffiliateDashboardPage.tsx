import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Loader2, Copy, CheckCircle, ExternalLink, IndianRupee, Users, TrendingUp } from 'lucide-react';

interface Campaign {
  id: string;
  code: string;
  name: string;
  referrer_commission_percent: number;
}

interface Stats {
  totalReferrals: number;
  totalEarnings: number;
  pendingPayouts: number;
}

export function AffiliateDashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stats>({ totalReferrals: 0, totalEarnings: 0, pendingPayouts: 0 });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // 1. Get Campaign
        const { data: campaigns, error: campError } = await supabase
          .from('referral_campaigns')
          .select('*')
          .eq('created_by', user.id)
          .eq('is_active', true)
          .single();

        if (campError) {
           // If no campaign found, maybe redirect to register?
           // For now just stop loading
           console.log('No active campaign found');
           setIsLoading(false);
           return;
        }

        setCampaign(campaigns);

        // 2. Get Referrals
        const { data: refs, error: refError } = await supabase
          .from('user_referrals')
          .select('*, referred_tenant:referred_tenant_id(name, created_at)')
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false });

        if (refError && refError.code !== 'PGRST116') {
             console.error('Error fetching referrals', refError);
        }

        const refList = refs || [];
        setReferrals(refList);

        // 3. Get Commissions Stats
        const { data: comms } = await supabase
           .from('commissions')
           .select('amount, status')
           .eq('referrer_id', user.id);

        const totalEarnings = comms?.filter(c => c.status === 'paid').reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        const pendingPayouts = comms?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        setStats({
          totalReferrals: refList.length,
          totalEarnings,
          pendingPayouts
        });

      } catch (error) {
        console.error('Error loading affiliate data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user]);

  const copyLink = () => {
    if (!campaign) return;
    const link = `${window.location.origin}/?ref=${campaign.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Active Partner Account Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">You haven't registered as a partner yet.</p>
            <a href="/affiliate/register" className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
                Register Now
            </a>
        </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${campaign.code}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Partner Dashboard <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full border border-emerald-200">Active</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
               Welcome back, {user?.user_metadata?.first_name || 'Partner'}.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
             <div>
               <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Your Unique Code</label>
               <div className="text-2xl font-mono font-bold text-emerald-600">{campaign.code}</div>
             </div>
             <div className="h-10 w-px bg-gray-200 dark:bg-gray-700"></div>
             <button 
               onClick={copyLink}
               className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors"
             >
               {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
               {copied ? 'Copied!' : 'Copy Link'}
             </button>
          </div>
        </div>

        {/* Share Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white shadow-lg">
             <h2 className="text-xl font-bold mb-4">Start Earning 20% Commission</h2>
             <p className="text-emerald-50 mb-6 max-w-2xl">
               Share this link with your network. When they sign up using your link, they currently get a 10% discount, and you earn recurring revenue.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 max-w-3xl">
                <input 
                  type="text" 
                  readOnly 
                  value={referralLink} 
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 font-mono text-sm border-0 focus:ring-2 focus:ring-white/50"
                />
                <button 
                   onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                   }}
                   className="bg-white text-emerald-700 px-6 py-3 rounded-lg font-bold hover:bg-emerald-50 transition flex items-center justify-center gap-2"
                >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    Copy Link
                </button>
                <a 
                   href={referralLink} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="bg-emerald-700/50 border border-white/20 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                    <ExternalLink className="w-5 h-5" />
                    Test Link
                </a>
             </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Referrals</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReferrals}</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                        <IndianRupee className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Paid Earnings</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.totalEarnings.toLocaleString()}</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payout</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{stats.pendingPayouts.toLocaleString()}</h3>
                    </div>
                </div>
            </div>
        </div>

        {/* Recent Referrals Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">Recent Referrals</h3>
            </div>
            {referrals.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No referrals yet. Share your code to get started!
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-3">Tenant Name</th>
                                <th className="px-6 py-3">Date Joined</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {referrals.map((ref) => (
                                <tr key={ref.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {ref.referred_tenant?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {new Date(ref.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            ref.status === 'converted' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {ref.status === 'converted' ? 'Converted' : 'Trial'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
