import { v } from "convex/values";
import { query } from "./_generated/server";

// Helper to get subordinate profiles recursively
async function getSubordinateProfileIds(ctx: any, tenantId: any, managerId: any): Promise<any[]> {
  const subordinates = await ctx.db
    .query("profiles")
    .withIndex("by_tenant", (q: any) => q.eq("tenant_id", tenantId))
    .filter((q: any) => q.eq(q.field("reporting_manager_id"), managerId))
    .collect();
    
  let ids = subordinates.map((s: any) => s._id);
  for (const sub of subordinates) {
    const subSubIds = await getSubordinateProfileIds(ctx, tenantId, sub._id);
    ids = [...ids, ...subSubIds];
  }
  return ids;
}

export const getReportsData = query({
  args: {
    tenant_id: v.id("tenants"),
    profileId: v.id("profiles"),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(),   // YYYY-MM-DD
    sourceFilter: v.optional(v.string()), // "All Sources" or source name
  },
  handler: async (ctx, args) => {
    // 1. Fetch user profile to check roles
    const callerProfile = await ctx.db.get(args.profileId);
    if (!callerProfile) throw new Error("Profile not found");

    // Determine visibility restrictions
    let allowedIds: any[] | null = null;
    if (!['super_admin', 'admin', 'director', 'platform_admin'].includes(callerProfile.role)) {
      const subIds = await getSubordinateProfileIds(ctx, args.tenant_id, args.profileId);
      allowedIds = [args.profileId, ...subIds];
    }

    // 2. Fetch all leads for date range and source
    let leadsQuery = ctx.db
      .query("leads")
      .withIndex("by_tenant_date", q => 
        q.eq("tenant_id", args.tenant_id)
         .gte("lead_date", args.startDate)
         .lte("lead_date", args.endDate)
      );

    let leads = await leadsQuery.collect();

    // Filter by source
    if (args.sourceFilter && args.sourceFilter !== 'All Sources') {
      leads = leads.filter(l => l.lead_source === args.sourceFilter);
    }

    // Filter by allowedIds
    if (allowedIds) {
      const allowedSet = new Set(allowedIds.map(id => id.toString()));
      leads = leads.filter(l => l.sales_executive_id && allowedSet.has(l.sales_executive_id.toString()));
    }

    // Resolve projects & profiles for Leads
    const detailedLeads = await Promise.all(leads.map(async (lead) => {
      const project = lead.project_id ? await ctx.db.get(lead.project_id) : null;
      const executive = lead.sales_executive_id ? await ctx.db.get(lead.sales_executive_id) : null;
      return {
        id: lead._id,
        leadId: lead.lead_id,
        customerName: lead.customer_name,
        mobile: lead.mobile,
        source: lead.lead_source,
        status: lead.lead_status,
        date: lead.lead_date,
        projectName: project?.name || "Not Specified",
        executiveName: executive?.full_name || "Unassigned"
      };
    }));

    // Calculate Leads KPI
    const totalLeadsImported = detailedLeads.length;
    const convertedLeads = detailedLeads.filter(l => l.status === 'Converted').length;
    const siteVisitsScheduled = detailedLeads.filter(l => l.status === 'Site Visit Scheduled' || l.status === 'Site Visit Done').length;

    // 3. Fetch Sales data
    let salesQuery = ctx.db
      .query("sales")
      .withIndex("by_tenant_date", q => 
        q.eq("tenant_id", args.tenant_id)
         .gte("sale_date", args.startDate)
         .lte("sale_date", args.endDate)
      );

    let sales = await salesQuery.collect();

    if (allowedIds) {
      const allowedSet = new Set(allowedIds.map(id => id.toString()));
      sales = sales.filter(s => s.sales_executive_id && allowedSet.has(s.sales_executive_id.toString()));
    }

    // Resolve projects, customers (leads), executives for Sales
    const detailedSales = await Promise.all(sales.map(async (sale) => {
      const project = await ctx.db.get(sale.project_id);
      const customer = await ctx.db.get(sale.customer_id);
      const executive = await ctx.db.get(sale.sales_executive_id);
      return {
        id: sale._id,
        customerName: customer?.customer_name || "Unknown",
        projectName: project?.name || "Unknown",
        unitNumber: sale.unit_number || "-",
        areaSqft: sale.area_sqft,
        totalRevenue: sale.total_revenue,
        bookingAmount: sale.booking_amount,
        date: sale.sale_date,
        executiveName: executive?.full_name || "Unknown"
      };
    }));

    const totalSalesValue = detailedSales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalBookings = detailedSales.length;
    const averageRevenue = totalBookings > 0 ? totalSalesValue / totalBookings : 0;

    // 4. Fetch Site Visits data
    let visitsQuery = ctx.db
      .query("site_visits")
      .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id));

    let visits = await visitsQuery.collect();

    // Filter in-memory by date
    visits = visits.filter(v => v.visit_date >= args.startDate && v.visit_date <= args.endDate);

    if (allowedIds) {
      const allowedSet = new Set(allowedIds.map(id => id.toString()));
      visits = visits.filter(v => v.requested_by && allowedSet.has(v.requested_by.toString()));
    }

    const detailedVisits = await Promise.all(visits.map(async (visit) => {
      const executive = await ctx.db.get(visit.requested_by);
      // Try to find a matching lead by mobile to get the project name
      const matchingLead = await ctx.db
        .query("leads")
        .withIndex("by_tenant_mobile", q => q.eq("tenant_id", args.tenant_id).eq("mobile", visit.mobile))
        .unique();
      const project = matchingLead?.project_id ? await ctx.db.get(matchingLead.project_id) : null;

      return {
        id: visit._id,
        customerName: visit.customer_name,
        mobile: visit.mobile,
        visitDate: visit.visit_date,
        status: visit.status,
        projectName: project?.name || "Not Specified",
        executiveName: executive?.full_name || "Unknown"
      };
    }));

    const totalVisits = detailedVisits.length;
    const visitsScheduledCount = detailedVisits.filter(v => ['pending', 'scheduled'].includes(v.status.toLowerCase())).length;
    const visitsDoneCount = detailedVisits.filter(v => ['trip_completed', 'completed', 'done', 'approved'].includes(v.status.toLowerCase())).length;

    // 5. Fetch Executive Performance data
    const allProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
      .collect();

    let salesExecutives = allProfiles.filter(p => p.role === 'sales_executive' && p.is_active);

    if (allowedIds) {
      const allowedSet = new Set(allowedIds.map(id => id.toString()));
      salesExecutives = salesExecutives.filter(p => allowedSet.has(p._id.toString()));
    }

    const executivePerformance = await Promise.all(salesExecutives.map(async (exec) => {
      const execLeads = detailedLeads.filter(l => l.executiveName === exec.full_name);
      const execSales = detailedSales.filter(s => s.executiveName === exec.full_name);
      const execVisits = detailedVisits.filter(v => v.executiveName === exec.full_name);

      const totalAssigned = execLeads.length;
      const converted = execLeads.filter(l => l.status === 'Converted').length;
      const conversionRate = totalAssigned > 0 ? (converted / totalAssigned) * 100 : 0;
      const revenue = execSales.reduce((sum, s) => sum + s.totalRevenue, 0);

      return {
        executiveName: exec.full_name,
        role: "Sales Executive",
        totalAssigned,
        converted,
        conversionRate,
        siteVisitsDone: execVisits.filter(v => ['trip_completed', 'completed', 'done', 'approved'].includes(v.status.toLowerCase())).length,
        totalRevenue: revenue
      };
    }));

    // Find best performer
    let bestPerformerName = "N/A";
    if (executivePerformance.length > 0) {
      const sorted = [...executivePerformance].sort((a, b) => b.converted - a.converted);
      if (sorted[0].converted > 0) {
        bestPerformerName = sorted[0].executiveName;
      }
    }

    return {
      leadsReport: {
        totalLeadsImported,
        convertedLeads,
        siteVisitsScheduled,
        detailedRegister: detailedLeads
      },
      salesReport: {
        totalSalesValue,
        totalBookings,
        averageRevenue,
        detailedRegister: detailedSales
      },
      siteVisitsReport: {
        totalVisits,
        scheduled: visitsScheduledCount,
        done: visitsDoneCount,
        detailedRegister: detailedVisits
      },
      executivePerformanceReport: {
        totalExecutives: salesExecutives.length,
        bestPerformer: bestPerformerName,
        totalLeadsAssigned: detailedLeads.length,
        detailedRegister: executivePerformance
      }
    };
  }
});
