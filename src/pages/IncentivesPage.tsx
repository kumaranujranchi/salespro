import { useAuth } from '../contexts/AuthContext';
import { IncentiveCenter } from '../components/sales-executive/IncentiveCenter';
import { IncentiveManagement } from '../components/admin/IncentiveManagement';

export function IncentivesPage() {
  const { profile } = useAuth();
  const normalizedRole = (profile?.role || '').toLowerCase().replace(/[\s_-]+/g, '_');
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin' || normalizedRole === 'director';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A1C37] dark:text-white mb-2">
          {isAdmin ? 'Incentive Management' : 'My Incentives'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isAdmin ? 'Manage user incentives and payouts' : 'View and track your incentive payouts'}
        </p>
      </div>

      {isAdmin ? <IncentiveManagement /> : <IncentiveCenter />}
    </div>
  );
}
