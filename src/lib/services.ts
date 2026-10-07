import { api } from './api';
import { Profile, Tenant } from '../types/database';

export const authService = {
  login: (credentials: { email: string; password?: string }) =>
    api.post<{ profile: Profile }>('/auth/login', credentials),
  getProfile: (params: { userId?: string; email?: string }) =>
    api.get<Profile | null>('/auth/profile', params),
  promote: (email: string) =>
    api.post<{ success: boolean }>('/auth/promote', { email }),
};

export const tenantsService = {
  list: () => api.get<Tenant[]>('/tenants'),
  getById: (id: string) => api.get<Tenant | null>(`/tenants/${id}`),
  update: (id: string, data: Partial<Tenant>) => api.patch<{ success: boolean }>(`/tenants/${id}`, data),
  getBillingHistory: (id: string) => api.get<any[]>(`/tenants/${id}/billing-history`),
};

export const profilesService = {
  listByTenant: (tenantId: string, filters?: { role?: string; is_active?: boolean }) =>
    api.get<Profile[]>('/profiles', { tenant_id: tenantId, ...filters }),
  create: (data: any) => api.post<Profile>('/profiles', data),
  update: (id: string, data: any) => api.patch<{ success: boolean }>(`/profiles/${id}`, data),
  listRoles: (tenantId: string) => api.get<any[]>('/profiles/roles', { tenant_id: tenantId }),
  listDepartments: (tenantId: string) => api.get<any[]>('/profiles/departments', { tenant_id: tenantId }),
};

export const leadsService = {
  list: (tenantId: string, filters?: any) =>
    api.get<any[]>('/leads', { tenant_id: tenantId, ...filters }),
  getStats: (tenantId: string, executiveId?: string) =>
    api.get<any>('/leads/stats', { tenant_id: tenantId, executive_id: executiveId }),
  create: (data: any) => api.post<any>('/leads', data),
  update: (id: string, data: any) => api.patch<{ success: boolean }>(`/leads/${id}`, data),
  assign: (id: string, executiveId: string) =>
    api.post<{ success: boolean }>(`/leads/${id}/assign`, { sales_executive_id: executiveId }),
};

export const salesService = {
  list: (tenantId: string, filters?: any) =>
    api.get<any[]>('/sales', { tenant_id: tenantId, ...filters }),
  create: (data: any) => api.post<any>('/sales', data),
  update: (id: string, data: any) => api.patch<{ success: boolean }>(`/sales/${id}`, data),
  listPayments: (tenantId: string, saleId?: string) =>
    api.get<any[]>('/sales/payments', { tenant_id: tenantId, sale_id: saleId }),
  addPayment: (data: any) => api.post<any>('/sales/payments', data),
};

export const projectsService = {
  list: (tenantId: string, isActive?: boolean) =>
    api.get<any[]>('/projects', { tenant_id: tenantId, is_active: isActive }),
  create: (data: any) => api.post<any>('/projects', data),
  listUnits: (projectId: string, status?: string) =>
    api.get<any[]>('/projects/units', { project_id: projectId, status }),
  bulkAddUnits: (tenantId: string, projectId: string, units: any[]) =>
    api.post<{ success: boolean }>('/projects/units/bulk', { tenant_id: tenantId, project_id: projectId, units }),
};

export const siteVisitsService = {
  list: (tenantId: string, filters?: any) =>
    api.get<any[]>('/site-visits', { tenant_id: tenantId, ...filters }),
  request: (data: any) => api.post<any>('/site-visits', data),
  update: (id: string, data: any) => api.patch<{ success: boolean }>(`/site-visits/${id}`, data),
};

export const targetsService = {
  list: (tenantId: string, userId?: string) =>
    api.get<any[]>('/targets', { tenant_id: tenantId, user_id: userId }),
  setTarget: (data: any) => api.post<any>('/targets', data),
};

export const miscService = {
  listFollowups: (leadId: string) => api.get<any[]>('/misc/followups', { lead_id: leadId }),
  addFollowup: (data: any) => api.post<any>('/misc/followups', data),
  listNotifications: (userId: string) => api.get<any[]>('/misc/notifications', { user_id: userId }),
  markNotificationRead: (id: string) => api.patch<{ success: boolean }>(`/misc/notifications/${id}/read`),
  listAnnouncements: (tenantId: string) => api.get<any[]>('/misc/announcements', { tenant_id: tenantId }),
  listSupportTickets: (tenantId?: string) => api.get<any[]>('/misc/support-tickets', { tenant_id: tenantId }),
  getReferralCampaign: (params: { userId?: string; code?: string }) =>
    api.get<any>('/misc/referrals/campaign', params),
};
