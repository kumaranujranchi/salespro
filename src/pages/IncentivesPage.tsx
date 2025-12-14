import { IncentiveCenter } from '../components/sales-executive/IncentiveCenter';

export function IncentivesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A1C37] dark:text-white mb-2">My Incentives</h1>
        <p className="text-gray-600 dark:text-gray-400">View and track your incentive payouts</p>
      </div>

      <IncentiveCenter />
    </div>
  );
}
