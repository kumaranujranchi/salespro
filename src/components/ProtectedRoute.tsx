import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from './ui/Loading';
import { UserRole, TenantSettings } from '../types/database';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredFeature?: keyof TenantSettings['features'];
}

export function ProtectedRoute({ children, allowedRoles, requiredFeature }: ProtectedRouteProps) {
  const { user, profile, tenant, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Check role access
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check feature access
  if (requiredFeature && tenant) {
    const isFeatureEnabled = tenant.settings?.features?.[requiredFeature] !== false;
    if (!isFeatureEnabled) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
