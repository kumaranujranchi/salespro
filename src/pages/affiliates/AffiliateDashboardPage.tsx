import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Copy, CheckCircle, ExternalLink, IndianRupee, Users, TrendingUp, LogOut } from 'lucide-react';

export function AffiliateDashboardPage() {
  const { user, profile, affiliate, signOut } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Convex Queries
  const statsData = useQuery(api.referrals.getCampaignStats, 
    affiliate ? { campaign_id: affiliate._id as Id<"referral_campaigns"> } : "skip"
  );

  const stats = useMemo(() => ({
    totalReferrals: statsData?.totalSignups || 0,
    totalEarnings: statsData?.totalEarnings || 0,
    pendingPayouts: 0 // Logic for pending can be added to Convex
  }), [statsData]);

  const referrals = statsData?.ledger || [];
  const isLoading = affiliate === undefined || (affiliate !== null && statsData === undefined);

  const copyLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}/?ref=${affiliate.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!affiliate) {
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

  const referralLink = `${window.location.origin}/register?ref=${affiliate.code}`;

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
               Welcome back, {profile?.full_name || user?.email || 'Partner'}.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
             <div>
               <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1">Your Unique Code</label>
               <div className="text-2xl font-mono font-bold text-emerald-600">{affiliate.code}</div>
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
          
          <button 
            onClick={handleLogout}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-red-600 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
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
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Commission</th>
                                <th className="px-6 py-3">Payout Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {referrals.map((ref: any) => {
                                const isConverted = ref.referred_tenant?.subscription_status === 'active';
                                const commission = isConverted ? 
                                    (ref.referred_tenant?.plan_tier === 'enterprise' ? 5000 : 2000) : 0; // Dummy logic
                                
                                return (
                                <tr key={ref._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {ref.referred_tenant?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {new Date(ref._creationTime).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            isConverted 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {isConverted ? 'Active' : 'Trial'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 capitalize">
                                        {ref.referred_tenant?.plan_tier || 'Starter'}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {isConverted ? `₹${commission.toLocaleString()}` : '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                         <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            ref.payout_status === 'paid'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {ref.payout_status === 'paid' ? 'Paid' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

      </div>
    </div>
  );
}
