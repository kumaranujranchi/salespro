import { useState } from 'react';
import { ReferralCampaigns } from '../../components/admin/ReferralCampaigns';
import { ReferralAnalytics } from '../../components/admin/ReferralAnalytics';

export function ReferralManagementPage() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics'>('campaigns');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Referral Management</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`${
              activeTab === 'campaigns'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${
              activeTab === 'analytics'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Analytics & Ledger
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'campaigns' && <ReferralCampaigns />}
        {activeTab === 'analytics' && <ReferralAnalytics />}
      </div>
    </div>
  );
}
