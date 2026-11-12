import { api } from './api';
import { Profile, Tenant } from '../types/database';

export const authService = {
  login: (credentials: { email: string; password?: string }) =>
    api.post<{ profile: Profile; token?: string }>('/auth/login', credentials),
  getProfile: (params: { userId?: string; email?: string }) =>
    api.get<Profile | null>('/auth/profile', params),
  promote: (email: string) =>
    api.post<{ success: boolean }>('/auth/promote', { email }),
  forgotPassword: (email: string) =>
    api.post<{
      success: boolean;
      email: string;
      fullName: string;
      emailSent: boolean;
      emailError?: string;
      message: string;
    }>('/auth/forgot-password', { email }),
  resetPassword: (data: {
    email: string;
    code: string;
    newPassword?: string;
  }) =>
    api.post<{ success: boolean; message: string; profile?: Profile }>('/auth/reset-password', data),
};

export const tenantsService = {
  list: () => api.get<Tenant[]>('/tenants'),
  getById: (id: string) => api.get<Tenant | null>(`/tenants/${id}`),
  update: (id: string, data: Partial<Tenant>) => api.patch<{ success: boolean }>(`/tenants/${id}`, data),
  register: (data: any) => api.post<{ success: boolean; tenant_id: string; tenant?: any }>('/tenants/register', data),
  remove: (id: string) => api.delete<{ success: boolean }>(`/tenants/${id}`),
  getBillingHistory: (id: string) => api.get<any[]>(`/tenants/${id}/billing-history`),
  getWebhookSecret: (id: string) => api.get<{ secret: string }>(`/tenants/${id}/webhook-secret`),
  resetUserPassword: (userId: string, newPassword?: string) =>
    api.post<{ success: boolean; message: string }>('/tenants/reset-user-password', { userId, newPassword }),
};

export const profilesService = {
  listByTenant: (tenantId: string, filters?: { role?: string; is_active?: boolean }) =>
    api.get<Profile[]>('/profiles', { tenant_id: tenantId, ...filters }),
  create: (data: any) => api.post<Profile>('/profiles', data),
  update: (id: string, data: any) => api.patch<{ success: boolean }>(`/profiles/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; message: string }>(`/profiles/${id}`),
  listRoles: (tenantId: string) => api.get<any[]>('/profiles/roles', { tenant_id: tenantId }),
  createRole: (data: any) => api.post<any>('/profiles/roles', data),
  updateRole: (id: string, data: any) => api.patch<any>(`/profiles/roles/${id}`, data),
  deleteRole: (id: string) => api.delete<{ success: boolean }>(`/profiles/roles/${id}`),
  listDepartments: (tenantId: string) => api.get<any[]>('/profiles/departments', { tenant_id: tenantId }),
  createDepartment: (data: any) => api.post<any>('/profiles/departments', data),
  updateDepartment: (id: string, data: any) => api.patch<any>(`/profiles/departments/${id}`, data),
  deleteDepartment: (id: string) => api.delete<{ success: boolean }>(`/profiles/departments/${id}`),
  resetUserPassword: (userId: string, newPassword?: string) =>
    api.post<{ success: boolean; message: string }>('/profiles/reset-password', { userId, newPassword }),
};

export const leadsService = {
  list: (tenantId: string, filters?: any) =>
    api.get<any[]>('/leads', { tenant_id: tenantId, ...filters }),
  getStats: (tenantId: string, executiveId?: string) =>
    api.get<any>('/leads/stats', { tenant_id: tenantId, executive_id: executiveId }),
  getExecutiveStats: (tenantId: string) =>
    api.get<any[]>('/leads/executive-stats', { tenant_id: tenantId }),
  create: (data: any) => api.post<any>('/leads', data),
  update: (id: string, data: any) => api.patch<{ success: boolean }>(`/leads/${id}`, data),
  convert: (id: string, overrides?: any) =>
    api.post<{ success: boolean; sale_id?: string }>(`/leads/${id}/convert`, overrides || {}),
  bulkUpdateStatus: (ids: string[], lead_status: string) =>
    api.post<{ success: boolean; count: number }>('/leads/bulk-status', { ids, lead_status }),
  bulkInsert: (data: { tenant_id: string; leads: any[]; created_by?: string }) =>
    api.post<{
      success: boolean;
      total: number;
      inserted: number;
      failed: number;
      details: Array<{
        row: number;
        customer_name: string;
        mobile: string;
        status: 'success' | 'failed';
        reason?: string;
        lead_id?: string;
      }>;
    }>('/leads/bulk-insert', data),
  assign: (id: string, executiveId: string) =>
    api.post<{ success: boolean }>(`/leads/${id}/assign`, { sales_executive_id: executiveId }),
  bulkAssign: (ids: string[], sales_executive_id: string, updated_by?: string) =>
    api.post<{ success: boolean; count: number }>('/leads/bulk-assign', { ids, sales_executive_id, updated_by }),
  bulkUpdateProject: (ids: string[], project_id: string) =>
    api.post<{ success: boolean; count: number }>('/leads/bulk-project', { ids, project_id }),
  delete: (id: string) => api.delete<{ success: boolean }>(`/leads/${id}`),
  bulkDelete: (ids: string[]) => api.post<{ success: boolean; count: number }>('/leads/bulk-delete', { ids }),
};

export const salesService = {
  list: (tenantId: string, filters?: any) =>
    api.get<any[]>('/sales', { tenant_id: tenantId, ...filters }),
  getOverview: (params: { tenant_id: string; executive_id?: string; view?: string }) =>
    api.get<any>('/sales/overview', params),
  getAnalytics: (params: { tenant_id: string; executive_id?: string; year?: number }) =>
    api.get<any[]>('/sales/analytics', params),
  getLeaderboard: (params: { tenant_id: string; timeFilter?: string; roleFilter?: string }) =>
    api.get<any[]>('/sales/leaderboard', params),
  create: (data: any) => api.post<any>('/sales', data),
  update: (id: string, data: any) => api.patch<{ success: boolean }>(`/sales/${id}`, data),
  listPayments: (tenantId: string, saleId?: string) =>
    api.get<any[]>('/sales/payments', { tenant_id: tenantId, sale_id: saleId }),
  addPayment: (data: any) => api.post<any>('/sales/payments', data),
  deletePayment: (id: string) => api.delete<{ success: boolean }>(`/sales/payments/${id}`),
};

export const projectsService = {
  list: (tenantId: string, isActive?: boolean) =>
    api.get<any[]>('/projects', { tenant_id: tenantId, is_active: isActive }),
  create: (data: any) => api.post<any>('/projects', data),
  update: (id: string, data: any) => api.patch<any>(`/projects/${id}`, data),
  delete: (id: string) => api.delete<{ success: boolean; id: string }>(`/projects/${id}`),
  listUnits: (projectId: string, status?: string) =>
    api.get<any[]>('/projects/units', { project_id: projectId, status }),
  createOrUpdateUnit: (data: any) => api.post<any>('/projects/units', data),
  deleteUnit: (id: string) => api.delete<{ success: boolean; id: string }>(`/projects/units/${id}`),
  bulkAddUnits: (tenantId: string, projectId: string, units: any[]) =>
    api.post<{ success: boolean }>('/projects/units/bulk', { tenant_id: tenantId, project_id: projectId, units }),
};

export const siteVisitsService = {
  list: (tenantId: string, filters?: any) =>
    api.get<any[]>('/site-visits', { tenant_id: tenantId, ...filters }),
  countPending: (tenantId: string) =>
    api.get<number>('/site-visits/count-pending', { tenant_id: tenantId }),
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
  listPublishedAnnouncements: (tenantId: string, limit?: number) =>
    api.get<any[]>('/misc/announcements/published', { tenant_id: tenantId, limit }),
  listActivityLogs: (tenantId: string, limit?: number) =>
    api.get<any[]>('/misc/activity-logs', { tenant_id: tenantId, limit }),
  listIncentives: (tenantId: string, params?: any) =>
    api.get<any[]>('/misc/incentives', { tenant_id: tenantId, ...params }),
  getIncentiveCalculationData: (tenantId: string, params?: any) =>
    api.get<any>('/misc/incentives/calculation-data', { tenant_id: tenantId, ...params }),
  createIncentive: (data: any) => api.post<any>('/misc/incentives', data),
  updateIncentive: (id: string, data: any) => api.patch<{ success: boolean }>(`/misc/incentives/${id}`, data),
  deleteIncentive: (id: string) => api.delete<{ success: boolean }>(`/misc/incentives/${id}`),
  listSupportTickets: (tenantId?: string) => api.get<any[]>('/misc/support-tickets', { tenant_id: tenantId }),
  resolveSupportTicket: (id: string, notes?: string) =>
    api.patch<{ success: boolean }>(`/misc/support-tickets/${id}`, { status: 'resolved', resolution_notes: notes }),
  getReferralCampaign: (params: { userId?: string; code?: string }) =>
    api.get<any>('/misc/referrals/campaign', params),
  listReferralCampaigns: (tenantId?: string) =>
    api.get<any[]>('/misc/referrals/campaigns', { tenant_id: tenantId }),
  getReferralAnalytics: (tenantId?: string) =>
    api.get<any>('/misc/referrals/analytics', { tenant_id: tenantId }),
};

export interface SystemMetrics {
  timestamp: number;
  server: {
    platform: string;
    arch: string;
    nodeVersion: string;
    uptimeSeconds: number;
    systemUptimeSeconds: number;
    hostname: string;
  };
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
    loadAvg: number[];
  };
  memory: {
    totalGb: string;
    usedGb: string;
    freeGb: string;
    usagePercent: number;
    processHeapUsedMb: number;
    processRssMb: number;
  };
  storage: {
    totalGb: string;
    usedGb: string;
    freeGb: string;
    percentUsed: number;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
  };
  liveUsers: {
    activeCount: number;
    activeLast15mCount: number;
    estimatedMaxCapacity: number;
    capacityUsagePercent: number;
    list: Array<{
      id: string;
      email: string;
      role: string;
      tenant_id?: string;
      tenant_name?: string;
      ip?: string;
      userAgent?: string;
      lastActive: number;
    }>;
  };
  database: {
    activeConnections: number;
    databaseSize: string;
    totalTenants: number;
    totalProfiles: number;
    totalLeads: number;
  };
  recommendation: {
    level: 'healthy' | 'warning' | 'critical';
    title: string;
    message: string;
    upgradeNeeded: boolean;
    suggestedTier: string;
  };
}

export const systemService = {
  getMetrics: () => api.get<SystemMetrics>('/system/metrics'),
  checkInactivity: () => api.post<any>('/system/check-inactivity'),
  getInactivityStatus: () => api.get<any>('/system/inactivity-status'),
  reactivateTenant: (tenantId: string) => api.post<any>('/system/reactivate-tenant', { tenantId }),
  restoreAllTenants: () => api.post<any>('/system/restore-inactivity'),
};

export const capiService = {
  test: (data: { pixelId: string; accessToken: string; testEventCode?: string; tenantId?: string }) =>
    api.post<{ success: boolean; message: string; meta_response?: any }>('/capi/test', data),
  getLogs: (tenantId: string) =>
    api.get<any[]>('/capi/logs', { tenant_id: tenantId }),
};

export const metaService = {
  exchangeCodeAndGetPages: async (data: { code: string; redirectUri: string; appId?: string; appSecret?: string }) => {
    const res = await api.post<{ success: boolean; pages: any[] }>('/meta/exchange-code', data);
    return res.pages || [];
  },
  subscribePageToWebhook: (data: { pageId: string; pageAccessToken: string }) =>
    api.post<{ success: boolean }>('/meta/subscribe-page', data),
  verifyPageToken: (data: { pageId: string; pageAccessToken: string }) =>
    api.post<{ success: boolean; page: { id: string; name: string; category?: string }; subscribed: boolean }>('/meta/verify-page-token', data),
  testWhatsAppMessage: (data: {
    provider: string;
    phoneNumberId?: string;
    accessToken?: string;
    bspEndpoint?: string;
    bspApiKey?: string;
    toPhone: string;
    templateName?: string;
    languageCode?: string;
    bodyParams?: string[];
    fallbackText?: string;
  }) => api.post<{ success: boolean; messageId?: string }>('/meta/whatsapp-test', data),
};

export const subscriptionService = {
  getConfig: () =>
    api.get<{ configured: boolean; keyId: string | null; fullKeyId: string | null }>('/subscriptions/config'),
  saveConfig: (data: { key_id: string; key_secret: string }) =>
    api.post<{ success: boolean; message: string; keyId: string }>('/subscriptions/config', data),
  activateTestMode: (data: { tenantId?: string; planTier?: string; billingCycle?: string }) =>
    api.post<{ success: boolean; message: string; planTier: string; billingCycle: string }>('/subscriptions/activate-test-mode', data),
};

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  let norm = digits;
  if (digits.length === 10) norm = `91${digits}`;
  else if (digits.length === 11 && digits.startsWith('0')) norm = `91${digits.slice(1)}`;
  if (norm.length === 12 && norm.startsWith('91')) {
    return `+91 ${norm.slice(2, 7)} ${norm.slice(7)}`;
  }
  return phone;
}

export const whatsappHubService = {
  getConfig: (params?: { tenant_id?: string }) =>
    api.get<{ success: boolean; config: any }>('/whatsapp/config', params),
  saveConfig: (data: any) =>
    api.post<{ success: boolean; message: string; config: any }>('/whatsapp/config', data),
  testConnection: (data?: { phoneNumberId?: string; accessToken?: string; tenant_id?: string }) =>
    api.post<{ success: boolean; verifiedName?: string; displayPhoneNumber?: string; qualityRating?: string; codeVerificationStatus?: string; error?: string; notConfigured?: boolean }>('/whatsapp/test-connection', data || {}),
  testConfirmation: (data: { testPhone: string; customMessage?: string; tenant_id?: string }) =>
    api.post<{ success: boolean; messageId?: string; message?: string; error?: string }>('/whatsapp/test-confirmation', data),
  getWidgetConfig: (tenantId: string) =>
    api.get<{ success: boolean; widget: any }>(`/whatsapp/widget/config?tenantId=${encodeURIComponent(tenantId)}`),
  sendWidgetChat: (data: { tenantId: string; message: string; conversationHistory?: any[] }) =>
    api.post<{ success: boolean; reply: string; detectedPhone?: string }>('/whatsapp/widget/chat', data),
  submitWidgetLead: (data: { tenantId: string; customerName?: string; phone: string; projectInterest?: string; notes?: string }) =>
    api.post<{ success: boolean; leadId?: string; isNew?: boolean }>('/whatsapp/widget/lead', data),
  listConversations: (params?: { status?: string; search?: string; limit?: number; offset?: number; tenant_id?: string }) =>
    api.get<{ success: boolean; conversations: any[]; summary: any }>('/whatsapp/conversations', params),
  getMessages: (conversationId: string) =>
    api.get<{ success: boolean; messages: any[] }>(`/whatsapp/conversations/${conversationId}/messages`),
  sendReply: (conversationId: string, text: string) =>
    api.post<{ success: boolean; message: any }>(`/whatsapp/conversations/${conversationId}/reply`, { text }),
  toggleBot: (conversationId: string, status: string) =>
    api.post<{ success: boolean; conversation: any }>(`/whatsapp/conversations/${conversationId}/toggle-bot`, { status }),
  sendOtp: (phone: string, purpose?: string) =>
    api.post<{ success: boolean; message: string; phone: string; expiresAt: string }>('/whatsapp/otp/send', { phone, purpose }),
  verifyOtp: (phone: string, otp: string, purpose?: string) =>
    api.post<{ success: boolean; message: string }>('/whatsapp/otp/verify', { phone, otp, purpose }),
  listTemplates: (params?: { tenant_id?: string }) =>
    api.get<{ success: boolean; templates: any[]; metaConnected?: boolean; warning?: string }>('/whatsapp/templates', params),
  createTemplate: (data: { name: string; category: string; language?: string; components: any[]; tenant_id?: string }) =>
    api.post<{ success: boolean; templateId: string; status: string; name?: string }>('/whatsapp/templates', data),
  deleteTemplate: (name: string, params?: { tenant_id?: string }) =>
    api.delete<{ success: boolean }>(`/whatsapp/templates/${name}`, { data: params }),
  listBroadcasts: (params?: { tenant_id?: string }) =>
    api.get<{ success: boolean; broadcasts: any[] }>('/whatsapp/broadcasts', params),
  createBroadcast: (data: { title: string; templateName?: string; customMessage?: string; targetAudience?: string; phones?: string[]; tenant_id?: string }) =>
    api.post<{ success: boolean; campaign: any }>('/whatsapp/broadcasts', data),
  labelConversation: (conversationId: string, label: string, notes?: string) =>
    api.post<{ success: boolean; label: string; authenticityScore: number }>(`/whatsapp/conversations/${conversationId}/label`, { label, notes }),
  getLearningPatterns: (params?: { tenant_id?: string }) =>
    api.get<{ success: boolean; patterns: any[] }>('/whatsapp/learning-patterns', params),
};
