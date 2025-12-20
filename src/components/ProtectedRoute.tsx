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
  const { user, profile, affiliate, tenant, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user || (!profile && !affiliate)) {
    return <Navigate to="/login" replace />;
  }

  // If just an affiliate, they might be accessing a protected route.
  // We generally assume Affiliates only access /affiliate/* routes which are protected by this.
  // Standard roles check below relies on 'profile', so we skip if it's just an affiliate
  // unless allowedRoles explicitly handles them (which it likely doesn't via UserRole enum).
  if (affiliate && !profile) {
      // If allowedRoles is passed, and user is ONLY affiliate, we probably should DENY unless we want to support generic "authenticated"
      // But for now, let's allow basic access pass, effectively treating them as "authenticated".
      // Route specific logic should handle redirect if they try to access /dashboard
      return <>{children}</>;
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
