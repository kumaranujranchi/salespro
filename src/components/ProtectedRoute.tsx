import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from './ui/Loading';
import { UserRole, TenantSettings } from '../types/database';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  permissionKey?: string; // Add dynamic permission key support
  requiredFeature?: keyof TenantSettings['features'];
}

export function ProtectedRoute({ children, allowedRoles, permissionKey, requiredFeature }: ProtectedRouteProps) {
  const { user, profile, affiliate, tenant, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !timedOut) {
    return <Loading />;
  }

  if (!user || (!profile && !affiliate) || timedOut) {
    return <Navigate to="/login" replace />;
  }

  // 0. Master Bypass - Super Admin & Platform Admin always have access
  if (profile?.role === 'super_admin' || profile?.role === 'platform_admin') {
    return <>{children}</>;
  }

  // 1. Check Dynamic Permissions (Priority for Custom Roles)
  if (permissionKey && profile?.role_details?.permissions?.menu) {
    const menuPerm = profile.role_details.permissions.menu[permissionKey];
    
    // If permission is explicitly set
    if (menuPerm === 'none') {
      return <Navigate to="/unauthorized" replace />;
    }
    
    // If we have 'read' or 'edit' access, allow
    if (menuPerm === 'read' || menuPerm === 'edit') {
      return <>{children}</>;
    }
    
    // If it's a custom role and permission is missing, block it
    if (!profile.role_details.is_system) {
       return <Navigate to="/unauthorized" replace />;
    }
  }

  // 2. Check Role Access (Fallback for System Roles or special routes)
  const currentRole = profile?.role || (affiliate ? 'affiliate' as UserRole : null);
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
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
