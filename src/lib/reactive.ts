import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  authService, tenantsService, profilesService, leadsService,
  salesService, projectsService, siteVisitsService, targetsService, miscService, systemService, capiService, metaService,
  reportsService, aiService
} from './services';
import { handleSessionExpired } from './auth-token';

// Global cache and listeners for fast reactive updates across components
const queryListeners = new Map<string, Set<() => void>>();

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

// `api.*` is a Proxy that returns a brand new object on every property access,
// so function identity is never stable across renders. Derive a stable string
// key instead of comparing references.
function functionKeyOf(fn: unknown): string {
  if (!fn) return '';
  try {
    if (typeof fn === 'function') {
      const name = (fn as { _name?: unknown })._name;
      if (typeof name === 'string' && name) return name;
    }
    return String(fn);
  } catch {
    return '';
  }
}

// Map function names to REST API service calls
async function resolveApiCall(functionKey: any, args: any) {
  let key = '';
  if (typeof functionKey === 'string') {
    key = functionKey;
  } else if (typeof functionKey === 'function') {
    try {
      const name = functionKey._name;
      key = typeof name === 'string' ? name : (typeof functionKey() === 'string' ? functionKey() : '');
    } catch {
      key = '';
    }
  } else if (functionKey && typeof functionKey === 'object') {
    const name = functionKey._name;
    key = typeof name === 'string' ? name : '';
  }
  if (!key || typeof key !== 'string') {
    try {
      key = String(functionKey || '');
    } catch {
      key = '';
    }
  }
  key = String(key || '');

  // AUTH / PROFILES
  if (key.includes('profiles.getByUserId')) {
    return await authService.getProfile({ userId: args?.userId });
  }
  if (key.includes('profiles.getByEmail')) {
    return await authService.getProfile({ email: args?.email });
  }
  if (key.includes('profiles.createUserProfile') || key.includes('profiles.create')) {
    const res = await profilesService.create(args);
    invalidateQuery('profiles');
    return res;
  }
  if (key.includes('profiles.updateProfile') || key.includes('profiles.update')) {
    const res = await profilesService.update(args?.id || args?._id, args);
    invalidateQuery('profiles');
    return res;
  }
  if (key.includes('profiles.toggleProfileStatus')) {
    const res = await profilesService.update(args?.id || args?._id, { is_active: args?.is_active });
    invalidateQuery('profiles');
    return res;
  }
  if (key.includes('profiles.deleteProfile') || key.includes('profiles.delete') || key.includes('profiles.remove')) {
    const res = await profilesService.delete(args?.id || args?._id);
    invalidateQuery('profiles');
    return res;
  }
  if (key.includes('profiles.resetPassword')) {
    return await authService.resetPassword(args);
  }
  if (key.includes('tenants.resetUserPassword') || key.includes('profiles.resetUserPassword')) {
    return await tenantsService.resetUserPassword(
      args?.userId || args?.email || args?.id,
      args?.newPassword
    );
  }
  if (key.includes('profiles.listUsersByTenant')) {
    return await profilesService.listByTenant(args?.tenant_id, args);
  }
  if (key.includes('profiles.listActiveStaff')) {
    return await profilesService.listByTenant(args?.tenant_id, { is_active: true });
  }
  if (key.includes('profiles.listExecutives')) {
    const res = await profilesService.listByTenant(args?.tenant_id, { role: 'sales_executive', is_active: true });
    if (Array.isArray(res) && res.length > 0) return res;
    // Fallback: return all active staff so executive dropdowns are NEVER empty
    return await profilesService.listByTenant(args?.tenant_id, { is_active: true });
  }
  if (key.includes('profiles.listDrivers')) {
    const tId = args?.tenant_id;
    if (!tId) return [];
    try {
      const res = await profilesService.listDrivers(tId);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch (e) {
      console.warn('Dedicated listDrivers failed, trying listByTenant fallback:', e);
    }
    try {
      const byRole = await profilesService.listByTenant(tId, { role: 'driver', is_active: true });
      if (Array.isArray(byRole) && byRole.length > 0) return byRole;
    } catch (e) {
      console.warn('listByTenant role=driver failed:', e);
    }
    // Fallback: load all staff and filter in memory by role / role_name / department_name
    try {
      const allStaff = await profilesService.listByTenant(tId);
      if (Array.isArray(allStaff)) {
        const isDriverUser = (p: any) => {
          const r = String(p.role || '').toLowerCase().trim();
          const rn = String(p.role_name || p.role_title || '').toLowerCase().trim();
          const dept = String(p.department_name || '').toLowerCase().trim();
          return (
            r.includes('driver') || rn.includes('driver') ||
            r.includes('cab') || rn.includes('cab') ||
            r.includes('chauffeur') || rn.includes('chauffeur') ||
            dept.includes('driver') || dept.includes('transport')
          );
        };
        const drivers = allStaff.filter(p => isDriverUser(p) && p.is_active !== false);
        if (drivers.length > 0) return drivers;
      }
    } catch (e) {
      console.warn('allStaff driver search fallback failed:', e);
    }
    return [];
  }
  if (key.includes('profiles.promoteToPlatformAdmin')) {
    return await authService.promote(args?.email);
  }

  // DEPARTMENTS
  if (key.includes('departments.list')) {
    return await profilesService.listDepartments(args?.tenant_id);
  }
  if (key.includes('departments.create') || key.includes('departments.add')) {
    const res = await profilesService.createDepartment(args);
    invalidateQuery('departments');
    return res;
  }
  if (key.includes('departments.update') || key.includes('departments.edit')) {
    const id = args?.id || args?._id;
    const res = await profilesService.updateDepartment(id, args);
    invalidateQuery('departments');
    return res;
  }
  if (key.includes('departments.remove') || key.includes('departments.delete')) {
    const id = args?.id || args?._id;
    const res = await profilesService.deleteDepartment(id);
    invalidateQuery('departments');
    return res;
  }

  // ROLES
  if (key.includes('roles.list')) {
    return await profilesService.listRoles(args?.tenant_id);
  }
  if (key.includes('roles.create') || key.includes('roles.add')) {
    const res = await profilesService.createRole(args);
    invalidateQuery('roles');
    return res;
  }
  if (key.includes('roles.update') || key.includes('roles.edit')) {
    const id = args?.id || args?._id;
    const res = await profilesService.updateRole(id, args);
    invalidateQuery('roles');
    return res;
  }
  if (key.includes('roles.remove') || key.includes('roles.delete')) {
    const id = args?.id || args?._id;
    const res = await profilesService.deleteRole(id);
    invalidateQuery('roles');
    return res;
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
  if (key.includes('tenants.register')) {
    return await tenantsService.register(args);
  }
  if (key.includes('tenants.remove')) {
    return await tenantsService.remove(args?.id || args?._id);
  }

  // LEADS
  if (key.includes('leads.searchLeads') || key.includes('leads.search')) {
    const tId = args?.tenant_id;
    if (!tId) return [];
    return await leadsService.list(tId, {
      searchQuery: args?.searchQuery || args?.search || '',
      limit: args?.limit || 20,
      profileId: args?.profileId,
      showOnlyMyLeads: args?.showOnlyMyLeads
    });
  }
  if (key.includes('leads.list') || key.includes('leads.listLeads')) {
    return await leadsService.list(args?.tenant_id, args);
  }
  if (key.includes('leads.getExecutiveLeadStats') || key.includes('leads.getExecutiveStats')) {
    return await leadsService.getExecutiveStats(args?.tenant_id);
  }
  if (key.includes('leads.getDashboardStats')) {
    return await leadsService.getStats(args?.tenant_id, args?.executive_id);
  }
  if (key.includes('leads.create') || key.includes('leads.createLead')) {
    const res = await leadsService.create(args);
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('leads.update') || key.includes('leads.updateLead')) {
    const res = await leadsService.update(args?.id || args?._id, args);
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('leads.convertLead') || key.includes('leads.convert')) {
    const res = await leadsService.convert(args?.id || args?._id, args);
    invalidateQuery('leads');
    invalidateQuery('sales');
    return res;
  }
  if (key.includes('leads.bulkUpdateLeadStatus') || key.includes('leads.bulkUpdateStatus')) {
    const res = await leadsService.bulkUpdateStatus(args?.ids || [], args?.lead_status);
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('leads.bulkInsertLeads') || key.includes('leads.bulkInsert')) {
    const res = await leadsService.bulkInsert(args);
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('leads.bulkAssignLeads') || key.includes('leads.bulkAssign')) {
    const res = await leadsService.bulkAssign(args?.ids || [], args?.sales_executive_id, args?.updated_by);
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('leads.bulkUpdateLeadProject') || key.includes('leads.bulkUpdateProject')) {
    const res = await leadsService.bulkUpdateProject(args?.ids || [], args?.project_id);
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('leads.deleteLead') || key.includes('leads.delete')) {
    const res = await leadsService.delete(args?.id || args?._id);
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('leads.bulkDeleteLeads') || key.includes('leads.bulkDelete')) {
    const res = await leadsService.bulkDelete(args?.ids || []);
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('leads.assignLead') || key.includes('leads.assign')) {
    const res = await leadsService.assign(args?.id || args?._id, args?.sales_executive_id);
    invalidateQuery('leads');
    return res;
  }

  // SALES & PAYMENTS
  if (key.includes('sales.getSalesOverview') || key.includes('sales.getOverview')) {
    return await salesService.getOverview(args);
  }
  if (key.includes('sales.getSalesAnalytics') || key.includes('sales.getAnalytics')) {
    return await salesService.getAnalytics(args);
  }
  if (key.includes('sales.getLeaderboard')) {
    return await salesService.getLeaderboard(args);
  }
  if (key.includes('sales.listSales') || key.includes('sales.list')) {
    return await salesService.list(args?.tenant_id, args);
  }
  if (key.includes('sales.createSale') || key.includes('sales.create')) {
    return await salesService.create(args);
  }
  if (key.includes('sales.updateSale') || key.includes('sales.update')) {
    const res = await salesService.update(args?.id || args?._id, args);
    invalidateQuery('sales');
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('payments.listPayments') || key.includes('payments.list')) {
    return await salesService.listPayments(args?.tenant_id, args);
  }
  if (key.includes('payments.addPayment') || key.includes('payments.add')) {
    const res = await salesService.addPayment(args);
    invalidateQuery('payments');
    invalidateQuery('sales');
    return res;
  }
  if (key.includes('payments.deletePayment') || key.includes('payments.delete') || key.includes('payments.remove')) {
    const res = await salesService.deletePayment(args?.id || args?._id);
    invalidateQuery('payments');
    invalidateQuery('sales');
    return res;
  }

  // PROJECTS & INVENTORY - UNITS
  if (key.includes('projects.listUnits')) {
    return await projectsService.listUnits(args?.project_id, args?.status);
  }
  if (key.includes('projects.createOrUpdateUnit') || key.includes('projects.addUnit') || key.includes('projects.updateUnit')) {
    const res = await projectsService.createOrUpdateUnit(args);
    invalidateQuery('projects');
    return res;
  }
  if (key.includes('projects.deleteUnit') || key.includes('projects.removeUnit')) {
    const id = args?.id || args?._id;
    const res = await projectsService.deleteUnit(id);
    invalidateQuery('projects');
    return res;
  }
  if (key.includes('projects.bulkAddUnits')) {
    const res = await projectsService.bulkAddUnits(args?.tenant_id, args?.project_id, args?.units);
    invalidateQuery('projects');
    return res;
  }

  // PROJECTS - CORE CRUD
  if (key.includes('projects.listAllProjects') || key.includes('projects.listRunningProjects') || key === 'projects.list' || (key.startsWith('projects.list') && !key.includes('Unit'))) {
    const isActive = key.includes('projects.listRunningProjects') ? true : args?.is_active;
    return await projectsService.list(args?.tenant_id, isActive);
  }
  if (key.includes('projects.createProject') || key === 'projects.create') {
    const res = await projectsService.create(args);
    invalidateQuery('projects');
    return res;
  }
  if (key.includes('projects.updateProject') || key === 'projects.update') {
    const id = args?.id || args?._id;
    const res = await projectsService.update(id, args);
    invalidateQuery('projects');
    return res;
  }
  if (key.includes('projects.deleteProject') || key === 'projects.delete' || key === 'projects.remove') {
    const id = args?.id || args?._id;
    const res = await projectsService.delete(id);
    invalidateQuery('projects');
    return res;
  }

  // SITE VISITS
  if (key.includes('site_visits.countPendingVisits') || key.includes('site_visits.countPending')) {
    return await siteVisitsService.countPending(args?.tenant_id);
  }
  if (key.includes('site_visits.list') || key.includes('site_visits.listVisits')) {
    return await siteVisitsService.list(args?.tenant_id, args);
  }
  if (key.includes('site_visits.request') || key.includes('site_visits.create')) {
    const res = await siteVisitsService.request(args);
    invalidateQuery('site_visits');
    invalidateQuery('reports');
    return res;
  }
  if (key.includes('site_visits.update')) {
    const res = await siteVisitsService.update(args?.id || args?._id, args);
    invalidateQuery('site_visits');
    invalidateQuery('reports');
    return res;
  }
  if (key.includes('site_visits.delete')) {
    const res = await siteVisitsService.delete(args?.id || args?._id);
    invalidateQuery('site_visits');
    invalidateQuery('reports');
    return res;
  }

  // REPORTS & ODOMETER ANALYTICS
  if (key.includes('reports.getReportsData') || key.includes('reports.get')) {
    return await reportsService.getReportsData(args);
  }

  // TARGETS
  if (key.includes('targets.listTargets') || key.includes('targets.list')) {
    return await targetsService.list(args?.tenant_id, args?.user_id);
  }
  if (key.includes('targets.setTarget') || key.includes('targets.create')) {
    return await targetsService.setTarget(args);
  }
  if (key.includes('targets.updateTarget') || key.includes('targets.update')) {
    return await targetsService.updateTarget(args?.id || args?._id, args);
  }
  if (key.includes('targets.deleteTarget') || key.includes('targets.delete')) {
    return await targetsService.deleteTarget(args?.id || args?._id);
  }

  // MISC (FOLLOWUPS, NOTIFICATIONS, ANNOUNCEMENTS, SUPPORT, REFERRALS)
  if (key.includes('followups.listByLead') || key.includes('followups.list')) {
    const leadId = args?.leadId || args?.lead_id || args?.id || args?._id;
    if (!leadId || leadId === 'skip' || leadId === 'undefined') return [];
    return await miscService.listFollowups(leadId);
  }
  if (key.includes('followups.add') || key.includes('followups.create')) {
    const res = await miscService.addFollowup(args);
    invalidateQuery('followups');
    invalidateQuery('leads');
    return res;
  }
  if (key.includes('notifications.list')) {
    return await miscService.listNotifications(args?.user_id);
  }
  if (key.includes('notifications.markRead')) {
    return await miscService.markNotificationRead(args?.id || args?._id);
  }
  if (key.includes('announcements.listPublished')) {
    return await miscService.listPublishedAnnouncements(args?.tenant_id, args?.limit);
  }
  if (key.includes('announcements.listAll') || key.includes('announcements.list')) {
    return await miscService.listAnnouncements(args?.tenant_id);
  }
  if (key.includes('activity_logs.listRecent') || key.includes('activity_logs.list')) {
    return await miscService.listActivityLogs(args?.tenant_id, args?.limit);
  }
  if (key.includes('incentives.listIncentives') || key.includes('incentives.list')) {
    return await miscService.listIncentives(args?.tenant_id, args);
  }
  if (key.includes('incentives.getIncentiveCalculationData') || key.includes('incentives.getCalculationData')) {
    return await miscService.getIncentiveCalculationData(args?.tenant_id, args);
  }
  if (key.includes('incentives.createIncentive') || key.includes('incentives.create')) {
    return await miscService.createIncentive(args);
  }
  if (key.includes('incentives.updateIncentive') || key.includes('incentives.update')) {
    return await miscService.updateIncentive(args?.id || args?._id, args);
  }
  if (key.includes('incentives.deleteIncentive') || key.includes('incentives.delete')) {
    return await miscService.deleteIncentive(args?.id || args?._id);
  }
  if (key.includes('support.resolve')) {
    return await miscService.resolveSupportTicket(args?.id || args?._id, args?.resolution_notes);
  }
  if (key.includes('support.listAll') || key.includes('support.listByTenant')) {
    return await miscService.listSupportTickets(args?.tenant_id);
  }
  if (key.includes('referrals.listCampaigns') || key.includes('referrals.list')) {
    return await miscService.listReferralCampaigns(args?.tenant_id);
  }
  if (key.includes('referrals.getReferralAnalytics') || key.includes('referrals.getCampaignStats')) {
    return await miscService.getReferralAnalytics(args?.tenant_id);
  }
  if (key.includes('referrals.getCampaignByCreator')) {
    return await miscService.getReferralCampaign({ userId: args?.userId });
  }
  if (key.includes('emails.sendEmail')) {
    const email = args?.email;
    const name = args?.name || args?.fullName;
    const otp = args?.data?.otp || args?.otp;
    return await authService.sendRegistrationOtp({ email, name, otp });
  }
  if (key.includes('files.generateUploadUrl')) {
    return '/api/files/upload';
  }
  if (key.includes('files.getUrl')) {
    const sId = args?.storageId || args?.id || '';
    if (!sId) return null;
    const str = String(sId);
    if (str.startsWith('http') || str.startsWith('data:')) return str;
    return `/api/files/${encodeURIComponent(str)}`;
  }
  if (key.includes('system.getMetrics')) {
    return await systemService.getMetrics();
  }
  if (key.includes('system.checkInactivity')) {
    return await systemService.checkInactivity();
  }
  if (key.includes('system.getInactivityStatus')) {
    return await systemService.getInactivityStatus();
  }
  if (key.includes('system.reactivateTenant')) {
    return await systemService.reactivateTenant(args?.tenantId || args?.id);
  }
  if (key.includes('capi.test') || key.includes('capi.sendTestEvent')) {
    return await capiService.test(args);
  }
  if (key.includes('capi.getLogs') || key.includes('capi.listLogs')) {
    return await capiService.getLogs(args?.tenant_id);
  }
  if (key.includes('meta:exchangeCodeAndGetPages') || key.includes('meta.exchangeCodeAndGetPages')) {
    return await metaService.exchangeCodeAndGetPages(args);
  }
  if (key.includes('meta:subscribePageToWebhook') || key.includes('meta.subscribePageToWebhook')) {
    return await metaService.subscribePageToWebhook(args);
  }
  if (key.includes('meta:verifyPageToken') || key.includes('meta.verifyPageToken')) {
    return await metaService.verifyPageToken(args);
  }

  // AI SALES COPILOT & ASSISTANT ACTIONS (DeepSeek API + RealSalePro Engine)
  if (key.includes('ai.chatWithAI') || key.includes('chatWithAI')) {
    try {
      const res = await aiService.chat({
        messages: args?.messages || [],
        tenant_id: args?.tenant_id,
        profileId: args?.profileId,
      });
      if (res?.reply) {
        return res.reply;
      }
    } catch (err: any) {
      console.warn('Backend AI chat error, evaluating fallback:', err);
      if (
        err?.code === 'PRO_REQUIRED' ||
        String(err?.message || '').includes('PRO_REQUIRED') ||
        String(err?.message || '').includes('exclusive Pro Plan feature')
      ) {
        throw new Error('PRO_REQUIRED: AI Sales Copilot is an exclusive Pro Plan feature. Upgrade your organization plan to access real-time AI sales coaching.');
      }
    }
    return generateAiSalesCopilotResponse(args);
  }
  if (key.includes('ai.generateOutreach') || key.includes('generateOutreach')) {
    return await generateAiOutreachTemplates(args);
  }
  if (key.includes('ai.analyzeFollowupAndScoreLead') || key.includes('analyzeFollowupAndScoreLead')) {
    return await analyzeFollowupAndScore(args);
  }

  // Fallback
  return null;
}

function generateAiSalesCopilotResponse(args: any): string {
  const messages = Array.isArray(args?.messages) ? args.messages : [];
  const lastUserMsg = [...messages].reverse().find((m: any) => m?.role === 'user')?.content || '';
  const text = String(lastUserMsg).trim().toLowerCase();

  // 1. Broad / Open-ended queries
  if (
    text.includes('i want to know') ||
    text.includes('want to know') ||
    text.includes('tell me') ||
    text.includes('what can you do') ||
    text.includes('how to use') ||
    text === 'help' ||
    text === 'help me' ||
    text === 'info' ||
    text === 'know' ||
    text === 'query'
  ) {
    return `Here are the main areas I can help you with right now:

1. Sales Pitching and Cold Calls: Openers, overcoming client objections like price or delays, and locking site visits.
2. WhatsApp Follow-ups: Post-inquiry follow-ups, site visit confirmation messages, and re-engaging inactive leads.
3. CRM Workflows: Phone masking, importing leads from Excel, and driver trip logs.
4. Closings and Bookings: Asking for booking tokens without being pushy and converting leads to sales.

What property, deal, or CRM process are you working on right now?`;
  }

  // 2. Greetings
  if (text === 'hi' || text === 'hello' || text === 'hey' || text === 'namaste' || text.startsWith('hi ') || text.startsWith('hello ') || text.includes('good morning') || text.includes('good afternoon')) {
    return `Hi, I am your sales copilot for RealSalePro.

I am here to help you handle client objections, write quick WhatsApp follow-up messages, or guide you through your sales pipeline and site visits.

What deal or customer situation are you working on today?`;
  }

  // 3. Cold Call / Calling / Pitch / Script
  if (text.includes('cold call') || text.includes('script') || text.includes('pitch') || text.includes('telecall') || text.includes('call') || text.includes('opener')) {
    return `Here is a natural real estate cold calling flow you can use:

1. The quick opener:
"Hi [Customer Name], I noticed you were looking into residential projects around [Project or Area]. I am calling from the sales team here. Did I catch you in the middle of something urgent?"

2. The value proposition:
"The reason for my quick call is that we just released a handful of pre-launch inventory units with zero floor rise charges and a flexible payment plan."

3. The qualifying question:
"Are you looking at this mainly for family living, or is capital appreciation your primary priority?"

4. The walkthrough close:
"I would not want to take up your time right now over the phone. Would Thursday at 4:30 PM or Saturday at 11:00 AM work better for a quick 15-minute walkthrough of the model flat?"

Tip: Always offer two specific time slots rather than asking if they are free.`;
  }

  // 4. Objection Handling: Price / Budget / Too Expensive
  if (text.includes('expensive') || text.includes('price') || text.includes('budget') || text.includes('discount') || text.includes('cost') || text.includes('mahnga') || text.includes('rate') || text.includes('negotiat') || text.includes('bargain')) {
    return `When a prospect says the price is too high or above budget:

1. First acknowledge and validate:
"I completely understand. Budget is always the most important factor when investing in property."

2. Pivot from price to capital appreciation:
"In this micro-market, values have been appreciating by about 12 to 14 percent year on year. You get certified delivery, extensive open green spaces, and a ready clubhouse."

3. Offer payment milestone flexibility:
"Rather than a heavy upfront commitment, the developer offers construction-linked installments, keeping your immediate cash outlay very manageable."

4. Suggest an on-site visit:
"Let us visit the site once together. If you genuinely like the layout, I will personally speak with the sales director to explore an exclusive spot-booking benefit for you."`;
  }

  // 5. Objection Handling: "I will think about it" / "Family consultation" / Delays
  if (text.includes('think') || text.includes('family') || text.includes('wife') || text.includes('husband') || text.includes('later') || text.includes('soch') || text.includes('delay')) {
    return `When a prospect says they need to think or discuss with family:

1. Validate the decision:
"That is completely reasonable. Buying a home is a milestone family decision."

2. Politely probe the core hesitation:
"Usually when buyers need time to think, it is either because the pricing is stretching beyond comfort, or there is a specific question about the floor layout or delivery timeline. Which of those two is on your mind?"

3. Offer a video walkthrough:
"How about I send a 3-minute video walkthrough directly to your WhatsApp so you can show your family tonight? Would tomorrow evening at 6 PM be a good time for a 5-minute feedback call?"`;
  }

  // 6. Objection Handling: "Already have a CRM" / "Using Excel"
  if (text.includes('already use') || text.includes('competitor') || text.includes('another crm') || text.includes('existing') || text.includes('excel')) {
    return `When a broker or builder says they already use Excel or another CRM:

1. Speed to Lead: With RealSalePro, incoming Meta and portal inquiries sync in under 30 seconds. Contacting a lead within 5 minutes increases conversion significantly.
2. Data Theft Protection: RealSalePro masks phone numbers for telecallers, so when staff leave, your company database is never compromised.
3. Mobile Driver Tracking: Site visit drivers log start and end odometer readings directly on their phones, calculating actual kilometers traveled automatically.
4. Auto Deal Conversion: Marking a lead as Converted instantly sets up the deal and payment milestones in the Sales ledger without double data entry.`;
  }

  // 7. Phone Masking & Lead Theft Prevention
  if (text.includes('mask') || text.includes('theft') || text.includes('security') || text.includes('steal') || text.includes('hide number')) {
    return `Phone number masking in RealSalePro protects your business data:

1. For sales executives, callers, and drivers, the last 5 digits of buyer phone numbers are masked like 98765 •••••.
2. Team members click the call button to trigger their dialer or click WhatsApp to chat, without ever needing to copy or export raw customer numbers.
3. Only Administrators have access to unmask numbers or download CSV exports.
4. This ensures your organization database stays safe from staff database theft.`;
  }

  // 8. Lead Management & Capture
  if (text.includes('add lead') || text.includes('lead') || text.includes('capture') || text.includes('portal') || text.includes('magicbricks') || text.includes('99acres') || text.includes('webhook') || text.includes('import')) {
    return `Managing leads in RealSalePro:

1. Automated Sync: Under Settings and Integrations, connect Facebook Lead Ads, Magicbricks, 99acres, or Housing.com webhooks for instant lead delivery.
2. Deduplication: Inquiries with existing phone numbers automatically update the existing lead timeline instead of creating duplicate records.
3. Direct Dialing: Call leads directly from the table or mobile card, or click the WhatsApp icon to open a pre-filled chat.
4. Bulk Import: Upload existing client sheets from the Leads section with CSV validation.`;
  }

  // 9. Site Visit / Closing / Token / Booking
  if (text.includes('site visit') || text.includes('visit') || text.includes('close') || text.includes('closing') || text.includes('token') || text.includes('booking') || text.includes('convert') || text.includes('sale')) {
    return `To convert a site visit into a booking:

1. Schedule with Cab: Go to Site Visits, pick the customer, project, and pickup location, and assign a company driver.
2. Experience First: Walk the client through the amenities and sample flat first to build emotional connection before opening the cost sheet.
3. Unit Choice: Ask which specific unit layout felt more like home to their family.
4. Urgency: Offer to block the chosen unit for 24 to 48 hours against an earnest token while their family finalizes.
5. 1-Click Conversion: Once the token is in, change lead status to Converted to automatically create the deal record in Sales.`;
  }

  // 10. WhatsApp / SMS / Follow-up Templates
  if (text.includes('whatsapp') || text.includes('sms') || text.includes('message') || text.includes('template') || text.includes('follow-up') || text.includes('followup') || text.includes('cadence')) {
    return `Here are two natural WhatsApp follow-up templates you can use:

Template 1 - Post inquiry follow-up:
"Hi [Customer Name], thank you for inquiring about [Project Name]. As requested, I have shared the floor plans and current price sheet for you. We have a few select units remaining in Phase 1. Would you like me to arrange a VIP site walkthrough for you this Saturday?"

Template 2 - Re-engaging an inactive lead:
"Hi [Customer Name], quick update for you. The developer just released a few high-floor units matching the budget you mentioned. Before they open to general brokers, I wanted to give you the first preview. Should I share the video walkthrough with you?"`;
  }

  // 11. Inventory, Units & Pricing
  if (text.includes('inventory') || text.includes('unit') || text.includes('flat') || text.includes('floor') || text.includes('bhk') || text.includes('tower')) {
    return `RealSalePro Inventory Management:

1. Unit Matrix: View real-time color-coded unit statuses (Available, Blocked/Hold, Booked).
2. Temporary Hold: Sales executives can place a 24 to 48 hour hold on units while booking cheques clear.
3. Unit Details: Track facing direction, carpet area, super built-up area, and base price.`;
  }

  return `Hi, I am your sales copilot for RealSalePro.

I can help you with practical sales scripts, handling client objections like price or delays, writing quick WhatsApp follow-up messages, or guiding you step by step through any feature in the CRM like lead assignment, site visits, or bookings.

What deal or customer situation are you working on right now?`;
}

async function generateAiOutreachTemplates(args: any) {
  let customerName = 'Valued Client';
  let projectName = 'our premium property';

  if (args?.leadId) {
    try {
      const allLeads = await leadsService.list(args?.tenant_id);
      const target = allLeads?.find((l: any) => String(l.id) === String(args.leadId) || String(l._id) === String(args.leadId));
      if (target?.customer_name) customerName = target.customer_name;
      if (target?.project?.name || target?.project_name) projectName = target?.project?.name || target?.project_name;
    } catch {}
  }

  return {
    whatsapp: `Namaste ${customerName}! 👋 Thank you for inquiring about ${projectName}. As requested, I have curated the floor plans, master layout, and current unit inventory for you. Would Thursday 4 PM or Saturday 11 AM work best for a 15-minute VIP walkthrough of the model residence?`,
    emailSubject: `Exclusive Property Details & Floor Plans for ${customerName} - ${projectName}`,
    emailBody: `Dear ${customerName},\n\nThank you for reaching out regarding ${projectName}. We have attached the complete brochure, master layout plan, and flexible developer payment schedules for your review.\n\nOur on-site luxury consultant is available this week to host a private walkthrough of the sample flat.\n\nPlease let us know your preferred date and time, and we will arrange your VIP site pass.\n\nWarm regards,\nSales & Advisory Team\nRealSalePro`,
  };
}

async function analyzeFollowupAndScore(args: any) {
  const remark = String(args?.followupRemark || '').toLowerCase();
  let score = 'Warm';
  if (remark.includes('booking') || remark.includes('token') || remark.includes('advance') || remark.includes('deal closed') || remark.includes('converted') || remark.includes('cheque')) {
    score = 'Hot';
  } else if (remark.includes('not interested') || remark.includes('lost') || remark.includes('wrong number') || remark.includes('budget mismatch') || remark.includes('dropped') || remark.includes('dnd')) {
    score = 'Cold';
  } else if (remark.includes('site visit') || remark.includes('visit confirmed') || remark.includes('interested') || remark.includes('positive') || remark.includes('call back')) {
    score = 'Hot';
  }

  if (args?.leadId) {
    try {
      await leadsService.update(args.leadId, { lead_score: score });
      invalidateQuery('leads');
    } catch (e) {
      console.warn('AI scoring update notice:', e);
    }
  }

  return { success: true, lead_score: score };
}

// Compatible useQuery hook connected to REST API
export function useQuery(fn: any, args?: any): any {
  const isSkip = args === 'skip' || !fn;
  const queryKey = isSkip ? '' : JSON.stringify({ fn: functionKeyOf(fn), args });
  const [data, setData] = useState<any>(undefined);

  useEffect(() => {
    if (isSkip) {
      setData(undefined);
      return;
    }

    let isMounted = true;
    const executeQuery = () => {
      resolveApiCall(fn, args)
        .then((result) => {
          if (isMounted) setData(result);
        })
        .catch((err) => {
          console.error('Bridge query error:', err);
          if (isMounted) setData(null);
          const msg = String(err?.message || '');
          if (msg.includes('Authentication required') || msg.includes('401') || msg.includes('Session expired')) {
            handleSessionExpired();
          }
        });
    };

    executeQuery();
    const unregister = registerListener(queryKey, executeQuery);

    return () => {
      isMounted = false;
      unregister();
    };
  }, [isSkip, queryKey]);

  return isSkip ? undefined : data;
}

// Compatible useMutation hook connected to REST API
export function useMutation(fn: any): (args: any) => Promise<any> {
  // Keep the latest fn in a ref so the returned callback stays referentially
  // stable (the Proxy-based `api` object is recreated on every access).
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(async (args: any) => {
    const result = await resolveApiCall(fnRef.current, args);
    // Invalidate queries so that UI refreshes instantly
    invalidateQuery();
    return result;
  }, []);
}

// Compatible useAction hook connected to REST API
export function useAction(fn: any): (args: any) => Promise<any> {
  return useMutation(fn);
}

// Compatible usePaginatedQuery hook
export function usePaginatedQuery(fn: any, args: any, options: any) {
  const data = useQuery(fn, args);
  return useMemo(() => ({
    results: Array.isArray(data) ? data : [],
    status: data === undefined ? 'LoadingFirstPage' : 'CanLoadMore',
    loadMore: () => {},
    isLoading: data === undefined,
  }), [data]);
}

// Direct access to the REST backend (no hooks)
export function useBackend() {
  return useMemo(() => ({
    query: (fn: any, args: any) => resolveApiCall(fn, args),
    mutation: (fn: any, args: any) => {
      const p = resolveApiCall(fn, args);
      invalidateQuery();
      return p;
    },
    action: (fn: any, args: any) => resolveApiCall(fn, args),
  }), []);
}

export const backend = {
  query: (fn: any, args: any) => resolveApiCall(fn, args),
  mutation: async (fn: any, args: any) => {
    const p = await resolveApiCall(fn, args);
    invalidateQuery();
    return p;
  },
  action: (fn: any, args: any) => resolveApiCall(fn, args),
};

