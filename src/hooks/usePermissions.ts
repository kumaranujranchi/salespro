import { useAuth } from '../contexts/AuthContext';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'assign';

export function usePermissions() {
  const { profile } = useAuth();

  // Super Admin & Platform Admin always have complete, unrestricted access
  const normalizedRole = String(profile?.role || '').toLowerCase().trim();
  const isSuperAdmin =
    normalizedRole === 'super_admin' ||
    normalizedRole === 'platform_admin';
  const isAdmin =
    isSuperAdmin ||
    normalizedRole === 'admin' ||
    normalizedRole.includes('admin');

  // Extract permissions from role_details or top-level profile permissions
  const permissions = (profile?.role_details?.permissions || profile?.permissions || {}) as any;

  const can = (moduleName: string, action: PermissionAction = 'view'): boolean => {
    // SECURITY: Bulk leads export is strictly restricted to Super Admin only
    if (action === 'export' && moduleName.toLowerCase() === 'leads') {
      return isSuperAdmin;
    }

    if (isAdmin) return true;

    // 1. Direct granular module permission check (e.g., permissions.modules.leads.edit)
    const moduleKey = moduleName.toLowerCase();
    const modulePerms = permissions?.modules?.[moduleKey];

    if (modulePerms && typeof modulePerms[action] === 'boolean') {
      return modulePerms[action];
    }

    // 2. Legacy menu permission fallback (backwards compatibility)
    // Legacy maps 'none' | 'read' | 'edit'
    const legacyMenuKey =
      moduleKey === 'leads' ? 'crm' :
      moduleKey === 'pipeline' ? 'crm' :
      moduleKey === 'site_visits' ? 'site_visits' :
      moduleKey;

    const legacyMenuVal = permissions?.menu?.[legacyMenuKey];

    if (legacyMenuVal === 'none') {
      return false;
    }

    if (legacyMenuVal === 'read') {
      // Read-only gives view rights, but strictly forbids create, edit, delete
      return action === 'view';
    }

    if (legacyMenuVal === 'edit') {
      // Legacy edit gives view, create, and edit, but delete was reserved for super_admin
      if (action === 'delete') return false;
      return true;
    }

    // Default safety fallback for custom roles if unspecified:
    // If it's a custom role without explicit grants, disallow edit and delete
    if (profile?.role_details && !profile.role_details.is_system) {
      if (action === 'view') return true;
      return false;
    }

    // Default system fallback for sales_executive:
    if (action === 'delete') return false;
    return true;
  };

  return {
    isAdmin,
    isSuperAdmin,
    permissions,
    can,
    canView: (moduleName: string) => can(moduleName, 'view'),
    canCreate: (moduleName: string) => can(moduleName, 'create'),
    canEdit: (moduleName: string) => can(moduleName, 'edit'),
    canDelete: (moduleName: string) => can(moduleName, 'delete'),
    canExport: (moduleName: string) => can(moduleName, 'export'),
    canAssign: (moduleName: string) => can(moduleName, 'assign'),
    salesPerspective: (permissions?.dashboard?.sales_view || 'overall') as 'none' | 'self' | 'team' | 'overall',
  };
}
