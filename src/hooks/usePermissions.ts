import { useAuth } from '../contexts/AuthContext';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'assign';
export type DataPerspective = 'none' | 'self' | 'team' | 'overall';

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

  // Determine data visibility perspectives (self / team / overall)
  const isExecutiveRole = (role: string) => {
    const r = role.replace(/[\s_-]+/g, '');
    return r.includes('executive') || r.includes('caller') || r.includes('telecaller') || r.includes('agent');
  };

  const isManagerRole = (role: string) => {
    const r = role.replace(/[\s_-]+/g, '');
    return r.includes('manager') || r.includes('leader') || r.includes('director');
  };

  const rawLeadPerspective = (
    permissions?.modules?.leads?.perspective ||
    permissions?.leads_view ||
    (isExecutiveRole(normalizedRole) ? 'self' : isManagerRole(normalizedRole) ? 'team' : (isAdmin ? 'overall' : 'self'))
  ) as DataPerspective;

  const rawSalesPerspective = (
    permissions?.modules?.sales?.perspective ||
    permissions?.dashboard?.sales_view ||
    (isExecutiveRole(normalizedRole) ? 'self' : isManagerRole(normalizedRole) ? 'team' : (isAdmin ? 'overall' : 'self'))
  ) as DataPerspective;

  // Final effective perspectives
  const leadPerspective: DataPerspective = isSuperAdmin ? 'overall' : rawLeadPerspective;
  const salesPerspective: DataPerspective = isSuperAdmin ? 'overall' : rawSalesPerspective;

  // Boolean flags for easy UI decisions
  const canViewAllLeads = (isAdmin || leadPerspective === 'overall') && leadPerspective !== 'self' && leadPerspective !== 'none';
  const canViewAllSales = (isAdmin || salesPerspective === 'overall') && salesPerspective !== 'self' && salesPerspective !== 'none';
  const isSalesExecutive = leadPerspective === 'self' || isExecutiveRole(normalizedRole);

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
    isSalesExecutive,
    permissions,
    leadPerspective,
    salesPerspective,
    canViewAllLeads,
    canViewAllSales,
    can,
    canView: (moduleName: string) => can(moduleName, 'view'),
    canCreate: (moduleName: string) => can(moduleName, 'create'),
    canEdit: (moduleName: string) => can(moduleName, 'edit'),
    canDelete: (moduleName: string) => can(moduleName, 'delete'),
    canExport: (moduleName: string) => can(moduleName, 'export'),
    canAssign: (moduleName: string) => can(moduleName, 'assign'),
  };
}
