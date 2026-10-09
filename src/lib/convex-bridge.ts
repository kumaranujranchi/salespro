import { useState, useEffect, useCallback } from 'react';
import {
  authService, tenantsService, profilesService, leadsService,
  salesService, projectsService, siteVisitsService, targetsService, miscService
} from './services';

// Global cache and listeners for fast reactive updates across components
const queryListeners = new Map<string, Set<() => void>>();

export function ConvexProvider({ children }: { children: any; client?: any }) {
  return children;
}

export class ConvexReactClient {
  constructor(public address: string) {}
}

export function invalidateQuery(tag?: string) {
  queryListeners.forEach((listeners, key) => {
    if (!tag || key.includes(tag)) {
      listeners.forEach((fn) => fn());
    }
  });
}

function registerListener(key: string, listener: () => void) {
  if (!queryListeners.has(key)) {
    queryListeners.set(key, new Set());
  }
  queryListeners.get(key)!.add(listener);
  return () => {
    queryListeners.get(key)?.delete(listener);
  };
}

// Map function names to REST API service calls
async function resolveApiCall(functionKey: any, args: any) {
  let key = '';
  if (typeof functionKey === 'string') {
    key = functionKey;
  } else if (typeof functionKey === 'function') {
    try {
      key = functionKey._name || functionKey() || '';
    } catch {
      key = '';
    }
  } else if (functionKey && typeof functionKey === 'object') {
    key = functionKey._name || '';
  }
  if (!key) {
    try {
      key = String(functionKey);
    } catch {
      key = '';
    }
  }

  // AUTH / PROFILES
  if (key.includes('profiles.getByUserId')) {
    return await authService.getProfile({ userId: args?.userId });
  }
  if (key.includes('profiles.getByEmail')) {
    return await authService.getProfile({ email: args?.email });
  }
  if (key.includes('profiles.createUserProfile') || key.includes('profiles.create')) {
    return await profilesService.create(args);
  }
  if (key.includes('profiles.updateProfile') || key.includes('profiles.update')) {
    return await profilesService.update(args?.id || args?._id, args);
  }
  if (key.includes('profiles.resetPassword')) {
    return await authService.resetPassword(args);
  }
  if (key.includes('tenants.resetUserPassword')) {
    return await authService.resetPassword({
      email: args?.userId,
      newPassword: args?.newPassword,
      phone: args?.phone,
    });
  }
  if (key.includes('profiles.listUsersByTenant')) {
    return await profilesService.listByTenant(args?.tenant_id, args);
  }
  if (key.includes('profiles.promoteToPlatformAdmin')) {
    return await authService.promote(args?.email);
  }
  if (key.includes('departments.list')) {
    return await profilesService.listDepartments(args?.tenant_id);
  }
  if (key.includes('roles.list')) {
    return await profilesService.listRoles(args?.tenant_id);
  }

  // TENANTS
  if (key.includes('tenants.getById')) {
    return await tenantsService.getById(args?.id || args?.tenantId);
  }
  if (key.includes('tenants.listBillingHistory')) {
    return await tenantsService.getBillingHistory(args?.tenant_id || args?.id);
  }
  if (key.includes('tenants.list')) {
    return await tenantsService.list();
  }
  if (key.includes('tenants.update')) {
    return await tenantsService.update(args?.id, args);
  }

  // LEADS
  if (key.includes('leads.list') || key.includes('leads.listLeads')) {
    return await leadsService.list(args?.tenant_id, args);
  }
  if (key.includes('leads.getDashboardStats')) {
    return await leadsService.getStats(args?.tenant_id, args?.executive_id);
  }
  if (key.includes('leads.create') || key.includes('leads.createLead')) {
    return await leadsService.create(args);
  }
  if (key.includes('leads.update') || key.includes('leads.updateLead')) {
    return await leadsService.update(args?.id || args?._id, args);
  }
  if (key.includes('leads.assignLead') || key.includes('leads.assign')) {
    return await leadsService.assign(args?.id || args?._id, args?.sales_executive_id);
  }

  // SALES & PAYMENTS
  if (key.includes('sales.listSales') || key.includes('sales.list')) {
    return await salesService.list(args?.tenant_id, args);
  }
  if (key.includes('sales.createSale') || key.includes('sales.create')) {
    return await salesService.create(args);
  }
  if (key.includes('sales.updateSale') || key.includes('sales.update')) {
    return await salesService.update(args?.id || args?._id, args);
  }
  if (key.includes('payments.listPayments') || key.includes('payments.list')) {
    return await salesService.listPayments(args?.tenant_id, args?.sale_id);
  }
  if (key.includes('payments.addPayment') || key.includes('payments.add')) {
    return await salesService.addPayment(args);
  }

  // PROJECTS & INVENTORY
  if (key.includes('projects.listAllProjects') || key.includes('projects.listRunningProjects') || key.includes('projects.list')) {
    return await projectsService.list(args?.tenant_id, args?.is_active);
  }
  if (key.includes('projects.listUnits')) {
    return await projectsService.listUnits(args?.project_id, args?.status);
  }
  if (key.includes('projects.bulkAddUnits')) {
    return await projectsService.bulkAddUnits(args?.tenant_id, args?.project_id, args?.units);
  }

  // SITE VISITS
  if (key.includes('site_visits.list') || key.includes('site_visits.listVisits')) {
    return await siteVisitsService.list(args?.tenant_id, args);
  }
  if (key.includes('site_visits.request') || key.includes('site_visits.create')) {
    return await siteVisitsService.request(args);
  }
  if (key.includes('site_visits.update')) {
    return await siteVisitsService.update(args?.id || args?._id, args);
  }

  // TARGETS
  if (key.includes('targets.listTargets') || key.includes('targets.list')) {
    return await targetsService.list(args?.tenant_id, args?.user_id);
  }
  if (key.includes('targets.setTarget') || key.includes('targets.create')) {
    return await targetsService.setTarget(args);
  }

  // MISC (FOLLOWUPS, NOTIFICATIONS, ANNOUNCEMENTS, SUPPORT, REFERRALS)
  if (key.includes('followups.listByLead') || key.includes('followups.list')) {
    return await miscService.listFollowups(args?.lead_id);
  }
  if (key.includes('followups.add') || key.includes('followups.create')) {
    return await miscService.addFollowup(args);
  }
  if (key.includes('notifications.list')) {
    return await miscService.listNotifications(args?.user_id);
  }
  if (key.includes('notifications.markRead')) {
    return await miscService.markNotificationRead(args?.id || args?._id);
  }
  if (key.includes('announcements.listAll') || key.includes('announcements.list')) {
    return await miscService.listAnnouncements(args?.tenant_id);
  }
  if (key.includes('support.listAll') || key.includes('support.listByTenant')) {
    return await miscService.listSupportTickets(args?.tenant_id);
  }
  if (key.includes('referrals.getCampaignByCreator')) {
    return await miscService.getReferralCampaign({ userId: args?.userId });
  }

  // Fallback
  return null;
}

// Compatible useQuery hook connected to REST API
export function useQuery(fn: any, args?: any): any {
  if (args === 'skip' || !fn) {
    return undefined;
  }

  const queryKey = JSON.stringify({ fn: String(fn), args });
  const [data, setData] = useState<any>(undefined);

  const fetchData = useCallback(() => {
    let isMounted = true;
    resolveApiCall(fn, args)
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch((err) => {
        console.error('Bridge query error:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [queryKey]);

  useEffect(() => {
    const cleanup = fetchData();
    const unregister = registerListener(queryKey, fetchData);
    return () => {
      if (cleanup) cleanup();
      unregister();
    };
  }, [fetchData, queryKey]);

  return data;
}

// Compatible useMutation hook connected to REST API
export function useMutation(fn: any): (args: any) => Promise<any> {
  return useCallback(async (args: any) => {
    const result = await resolveApiCall(fn, args);
    // Invalidate queries so that UI refreshes instantly
    invalidateQuery();
    return result;
  }, [fn]);
}

// Compatible useAction hook connected to REST API
export function useAction(fn: any): (args: any) => Promise<any> {
  return useMutation(fn);
}

// Compatible usePaginatedQuery hook
export function usePaginatedQuery(fn: any, args: any, options: any) {
  const data = useQuery(fn, args);
  return {
    results: Array.isArray(data) ? data : [],
    status: data === undefined ? 'LoadingFirstPage' : 'CanLoadMore',
    loadMore: () => {},
    isLoading: data === undefined,
  };
}

// Compatible useConvex hook
export function useConvex() {
  return {
    query: (fn: any, args: any) => resolveApiCall(fn, args),
    mutation: (fn: any, args: any) => {
      const p = resolveApiCall(fn, args);
      invalidateQuery();
      return p;
    },
    action: (fn: any, args: any) => resolveApiCall(fn, args),
  };
}

export const convex = {
  query: (fn: any, args: any) => resolveApiCall(fn, args),
  mutation: async (fn: any, args: any) => {
    const p = await resolveApiCall(fn, args);
    invalidateQuery();
    return p;
  },
  action: (fn: any, args: any) => resolveApiCall(fn, args),
};

