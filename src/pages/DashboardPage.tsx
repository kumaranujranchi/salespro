import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { SalesExecutiveDashboard } from '../components/dashboards/SalesExecutiveDashboard';
import { TeamLeaderDashboard } from '../components/dashboards/TeamLeaderDashboard';
import { CRMDashboard } from '../components/dashboards/CRMDashboard';
import { AccountantDashboard } from '../components/dashboards/AccountantDashboard';
import { DriverDashboard } from '../components/dashboards/DriverDashboard';
import { ReceptionistDashboard } from '../components/dashboards/ReceptionistDashboard';
import { PlatformDashboard } from './PlatformDashboard';

export function DashboardPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  const role = profile.role;
  const permissions = profile.role_details?.permissions;

  const normalizedRole = role.toLowerCase().replace(/[\s_-]+/g, '_');

  // 1. Precise Match for System Roles
  switch (normalizedRole) {
    case 'platform_admin':
      return <PlatformDashboard />;
    case 'super_admin':
    case 'admin':
    case 'director':
      return <AdminDashboard />;
    case 'team_leader':
      return <TeamLeaderDashboard />;
    case 'sales_executive':
      return <SalesExecutiveDashboard />;
    case 'crm_staff':
      return <CRMDashboard />;
    case 'accountant':
      return <AccountantDashboard />;
    case 'driver':
      return <DriverDashboard />;
    case 'receptionist':
      return <ReceptionistDashboard />;
  }

  // 2. Dynamic Fallback for Custom Roles based on Permissions
  if (permissions?.dashboard?.sales_view) {
    const view = permissions.dashboard.sales_view;
    if (view === 'overall') return <AdminDashboard />;
    if (view === 'team') return <TeamLeaderDashboard />;
    if (view === 'self') return <SalesExecutiveDashboard />;
  }

  // 3. Fallback based on CRM menu permission
  if (permissions?.menu?.crm === 'read' || permissions?.menu?.crm === 'edit') {
    return <CRMDashboard />;
  }

  // 3. Last Resort Fallback
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-900/30 text-center">
        <h3 className="font-bold text-lg mb-1">Dashboard not configured</h3>
        <p>Your role ({profile.role_details?.name || role}) does not have a specific dashboard assigned. 
           Please contact your administrator to configure your dashboard view permissions.</p>
      </div>
    </div>
  );
}
