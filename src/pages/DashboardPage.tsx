import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../components/dashboards/AdminDashboard';
import { SalesExecutiveDashboard } from '../components/dashboards/SalesExecutiveDashboard';
import { TeamLeaderDashboard } from '../components/dashboards/TeamLeaderDashboard';
import { CRMDashboard } from '../components/dashboards/CRMDashboard';
import { AccountantDashboard } from '../components/dashboards/AccountantDashboard';
import { DriverDashboard } from '../components/dashboards/DriverDashboard';
import { ReceptionistDashboard } from '../components/dashboards/ReceptionistDashboard';

export function DashboardPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  switch (profile.role) {
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
    default:
      return <div>Dashboard not configured for your role</div>;
  }
}
