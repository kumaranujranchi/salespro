import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  authService, tenantsService, profilesService, leadsService,
  salesService, projectsService, siteVisitsService, targetsService, miscService, systemService, capiService, metaService
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
    return await salesService.listPayments(args?.tenant_id, args?.sale_id);
  }
  if (key.includes('payments.addPayment') || key.includes('payments.add')) {
    return await salesService.addPayment(args);
  }
  if (key.includes('payments.deletePayment') || key.includes('payments.delete') || key.includes('payments.remove')) {
    return await salesService.deletePayment(args?.id || args?._id);
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
    return res;
  }
  if (key.includes('site_visits.update')) {
    const res = await siteVisitsService.update(args?.id || args?._id, args);
    invalidateQuery('site_visits');
    return res;
  }
  if (key.includes('site_visits.delete')) {
    const res = await siteVisitsService.delete(args?.id || args?._id);
    invalidateQuery('site_visits');
    return res;
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

  // AI SALES COPILOT & ASSISTANT ACTIONS
  if (key.includes('ai.chatWithAI') || key.includes('chatWithAI')) {
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

  // 1. Broad / Open-ended queries: "I want to know?", "Help", "What can you do?", "Tell me"
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
    return `I'd love to help! Here are the 4 key areas I can assist you with right now:

1. 🎯 **Sales Scripts & Pitching**: Cold call openers, overcoming "price is too high" or "I'll think and tell", and booking site visits.
2. 📱 **WhatsApp & Follow-up**: Instant post-inquiry messages, site visit confirmation templates, and dead-lead revival messages.
3. 🏢 **CRM & Lead Operations**: How telecaller phone masking works, importing leads from Excel, and connecting Meta / Magicbricks webhooks.
4. 💰 **Deals & Closings**: Asking for booking tokens without being pushy, locking inventory units, and tracking agent commissions.

Tell me what specific property, client situation, or CRM tool you're working on, and I'll give you step-by-step guidance!`;
  }

  // 2. Greetings
  if (text === 'hi' || text === 'hello' || text === 'hey' || text === 'namaste' || text.startsWith('hi ') || text.startsWith('hello ') || text.includes('good morning') || text.includes('good afternoon')) {
    return `Namaste! 👋 I'm your RealSalePro AI Sales Copilot.

I'm ready to help you handle client objections, draft high-converting WhatsApp pitches, or guide you through your sales pipeline. 

What property deal, objection, or CRM feature are you working on today?`;
  }

  // 3. Cold Call / Calling / Pitch / Script
  if (text.includes('cold call') || text.includes('script') || text.includes('pitch') || text.includes('telecall') || text.includes('call') || text.includes('opener')) {
    return `Here is a high-converting **Real Estate Cold Calling Script** designed to book site visits without sounding pushy:

* **The 10-Second Hook:** "Hi [Client Name], I noticed you recently checked out premium residences in [Location/Project]. I'm calling from RealSalePro Realty — am I catching you in the middle of something urgent?"
* **The Value Proposition:** "The reason for my quick call is that Developer [Developer Name] just opened 12 pre-launch units with zero floor rise charges and a flexible 20:80 payment structure."
* **Qualifying Question:** "Are you looking primarily for personal living, or is high-rental capital appreciation your main priority?"
* **The Low-Friction Close:** "I won't take more of your time today. Would Thursday 4:30 PM or Saturday 11:00 AM suit you better for a quick 15-minute VIP walkthrough of the model apartment?"

*Pro Tip:* Never ask "Are you free to visit?". Offer two concrete time slots so the decision is *when* to visit, not *if*.`;
  }

  // 4. Objection Handling: Price / Budget / Too Expensive / Discount / Negotiation
  if (text.includes('expensive') || text.includes('price') || text.includes('budget') || text.includes('discount') || text.includes('cost') || text.includes('mahnga') || text.includes('rate') || text.includes('negotiat') || text.includes('bargain')) {
    return `Here is how to effectively handle the **"Price is Too High / Over Budget"** objection:

* **Step 1 - Acknowledge & Validate:** "I completely understand [Client Name]. Budget is the most crucial factor when investing in a home."
* **Step 2 - Shift from Price to Value & Appreciation:** "When you look at comparable developments in this micro-market, prices have appreciated by 14% year-over-year. In our project, you're not just paying for square footage — you get RERA-certified delivery, 75% open green spaces, and a verified clubhouse."
* **Step 3 - Offer Payment Flexibility:** "Rather than a standard payment plan, the developer currently offers a construction-linked milestone or an easy 10:90 banking subvention. That keeps your immediate cash outlay extremely manageable."
* **Step 4 - Lock with Scarcity:** "Let's visit the site once. If you love the layout and inventory, I will personally speak with the sales director to explore an exclusive spot-booking festival discount."`;
  }

  // 5. Objection Handling: "I will think about it" / "Family consultation" / Delays
  if (text.includes('think') || text.includes('family') || text.includes('wife') || text.includes('husband') || text.includes('later') || text.includes('soch') || text.includes('delay')) {
    return `When a prospect says **"I will think and tell you"** or **"Need to discuss with family"**:

* **Why they say it:** It's usually a polite smokescreen for either (a) budget anxiety or (b) layout/amenity hesitation.
* **The Winning Response:** "That's completely reasonable, [Client Name] — buying a home is a milestone family decision. Usually when buyers need time to think, it's either because the pricing is stretching beyond comfort, or there's a specific concern about the floor layout or delivery timeline. Which of those two is on your mind?"
* **The Next Step:** "How about I send a 3-minute video walkthrough directly to your WhatsApp so you can show your family tonight? Would tomorrow evening at 6 PM be a good time for a 5-minute feedback call?"`;
  }

  // 6. Objection Handling: "Already have a CRM" / "Using Excel"
  if (text.includes('already use') || text.includes('competitor') || text.includes('another crm') || text.includes('existing') || text.includes('excel')) {
    return `Here is your winning pitch when a prospect says **"We already use a CRM / Excel"**:

* **Identify the Hidden Leakage:** Most standard CRMs only store contact numbers. They don't prevent lead leakage or speed up initial response time.
* **Speed to Lead Advantage:** With RealSalePro's native WhatsApp & Meta CAPI integration, incoming leads are pinged within 30 seconds. In real estate, contacting a lead within 5 minutes increases conversion by 391%.
* **Zero Duplication Loss:** RealSalePro automatically deduplicates leads across Meta, Google, and 99acres/MagicBricks, so your team never calls the same buyer twice with mismatched quotes.
* **Floor-Ready Mobile Access:** Site executives log visits, token bookings, and floor inventory updates directly on-site rather than updating sheets at 9 PM.`;
  }

  // 7. Phone Masking & Lead Theft Prevention
  if (text.includes('mask') || text.includes('theft') || text.includes('security') || text.includes('steal') || text.includes('hide number')) {
    return `**Phone Number Masking & Client Data Protection**:

* **How it works:** RealSalePro masks the last 5 digits of buyer phone numbers (e.g. \`+91 98765 •••••\`) for telecallers, sales executives, and drivers.
* **Dialing:** Team members can click the call button to trigger in-app or masked dialing without seeing or exporting customer contacts.
* **Admin Control:** Only Tenant Admins and Super Admins can unmask numbers or download contact CSVs.
* **Why it matters:** Eliminates staff database theft when brokers or sales executives leave your company.`;
  }

  // 8. Lead Management & Capture (Meta, Webhooks, Portals)
  if (text.includes('add lead') || text.includes('lead') || text.includes('capture') || text.includes('portal') || text.includes('magicbricks') || text.includes('99acres') || text.includes('webhook') || text.includes('import')) {
    return `**RealSalePro Lead Management Engine**:

* **Instant Webhook Capture:** Under **Settings > Integrations**, connect your Facebook Lead Ads, Magicbricks, 99acres, or Housing.com webhooks for sub-30 second automatic capture.
* **Smart Deduplication:** If an inquiry arrives with the same phone number or email, RealSalePro appends the new activity to the existing lead history instead of creating duplicate records.
* **Round-Robin Routing:** Automatically distributes incoming inquiries among active sales executives based on workload or property preferences.
* **CSV Bulk Import:** Upload existing client sheets from **Leads > Import Leads** with instant validation.`;
  }

  // 9. Site Visit / Closing / Token / Booking / Convert to Sale
  if (text.includes('site visit') || text.includes('visit') || text.includes('close') || text.includes('closing') || text.includes('token') || text.includes('booking') || text.includes('convert') || text.includes('sale')) {
    return `Here are the top 4 rules to convert a **Site Visit into a Token Booking**:

* **1. Confirm with a Cab / Route Pin:** Always send the Google Maps location pin and driver contact 2 hours prior to the scheduled visit. This cuts no-shows by over 40%.
* **2. Experience Before Numbers:** Walk the prospect through the amenities, entrance lobby, and model flat first. Build emotional resonance before opening the cost sheet.
* **3. The Unit Commitment Question:** "Between the 7th floor east-facing unit and the 12th floor pool-view, which layout felt more like home to your family?"
* **4. Spot Booking Urgency:** "The current inaugural rate is locked only against an earnest token of ₹50,000, which is 100% refundable within 7 days if your family decides otherwise. Let's block unit #802 so no one else grabs it today."
* **5. 1-Click Conversion in CRM:** Once token is logged, click **Convert to Sale** to automatically generate customer ledger, payment milestones, and broker commission splits!`;
  }

  // 10. WhatsApp / SMS / Follow-up Templates
  if (text.includes('whatsapp') || text.includes('sms') || text.includes('message') || text.includes('template') || text.includes('follow-up') || text.includes('followup') || text.includes('cadence')) {
    return `Here are two battle-tested **WhatsApp Follow-up Templates** with high reply rates:

* **Template 1: Post-Inquiry Warm Follow-up (Send within 2 hours):**
"Namaste [Client Name]! 👋 Thank you for inquiring about [Project Name] in [Location]. As requested, I have curated the floor plans, master layout, and current price sheet for you: [Link/PDF]. We have 3 garden-facing units remaining in Phase 1. Would you like me to reserve a VIP site visit for you this Saturday?"

* **Template 2: Re-engaging an Inactive Lead (Send after 48 hours of silence):**
"Hi [Client Name], quick update! The developer just released 4 high-floor 3BHK units with panoramic city views that match the budget you mentioned. Before they open to general brokers, I wanted to give you the first preview. Should I share the video walkthrough on WhatsApp?"`;
  }

  // 11. Dead / Lost Leads Revival
  if (text.includes('dead') || text.includes('lost') || text.includes('re-engage') || text.includes('reengage') || text.includes('cold') || text.includes('inactive')) {
    return `Here is a 3-step cadence to **revive cold or lost real estate leads**:

* **Step 1 - The Inventory Pivot:** Don't ask "Are you still looking?". Instead say: "Hi [Name], I know the previous project didn't match your budget. We just launched a new boutique tower in [Nearby Location] starting at ₹[Lower Budget]. Worth taking a look?"
* **Step 2 - Send a 30-Second Drone Video:** Visual proof creates instant re-engagement. Send a WhatsApp video showing actual construction progress or handover status.
* **Step 3 - The Polite Break-up Message:** "Hi [Name], since I haven't heard back, I assume you've already finalized a property or paused your search. Should I remove your number from our VIP priority list?" (This triggers FOMO and gets a 30%+ response rate!)`;
  }

  // 12. Inventory, Units, Floor Plans & Pricing
  if (text.includes('inventory') || text.includes('unit') || text.includes('flat') || text.includes('floor') || text.includes('bhk') || text.includes('tower')) {
    return `**RealSalePro Inventory & Unit Management**:

* **Real-Time Unit Matrix:** Navigate to **Inventory** to see color-coded unit statuses: Available (Green), Blocked/Token (Amber), and Sold (Red).
* **Double-Booking Shield:** When a sales executive inputs a token receipt, the chosen unit is locked instantaneously across all devices.
* **Unit Attributes:** Store facing direction, super built-up vs carpet area, floor rise tiers, and car parking slot allocations.`;
  }

  // 13. Dynamic Conversational Fallback (Never repeats the canned welcome block!)
  const preview = lastUserMsg.length > 50 ? `${lastUserMsg.slice(0, 50)}...` : lastUserMsg;
  return `I understand you're asking about **"${preview}"**.

Here are 3 ways I can help you with this right now:

1. 🎯 **Sales Script & Objection Handling**: Give me your client's budget and preferred property, and I'll generate a tailored pitch.
2. 📱 **WhatsApp Message Generator**: Tell me what you want to communicate, and I'll format an engaging WhatsApp template with call-to-actions.
3. ⚙️ **CRM Workflow Assistance**: Ask how to configure pipelines, lead routing, commission splits, or reports for your company.

Which of these would you like to explore next?`;
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

