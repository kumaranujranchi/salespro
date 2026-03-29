import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listSales = query({
  args: { 
    tenant_id: v.id("tenants"),
    executive_id: v.optional(v.id("profiles")),
    project_id: v.optional(v.id("projects")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("sales")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id));
    
    if (args.executive_id) {
      q = ctx.db.query("sales").withIndex("by_executive", q => q.eq("sales_executive_id", args.executive_id!));
    }

    const sales = await q.collect();
    
    // Manual filtering for remaining args as needed, or use .filter()
    let results = sales;
    if (args.project_id) results = results.filter(s => s.project_id === args.project_id);
    if (args.status) results = results.filter(s => s.status === args.status);

    // Resolve Joins
    return await Promise.all(results.map(async (sale) => {
      const project = await ctx.db.get(sale.project_id);
      const customer = await ctx.db.get(sale.customer_id);
      const executive = await ctx.db.get(sale.sales_executive_id);
      return {
        ...sale,
        project: project ? { name: project.name } : null,
        customer: customer ? { name: customer.customer_name, phone: customer.mobile } : null,
        executive: executive ? { full_name: executive.full_name, reporting_manager_id: executive.reporting_manager_id } : null
      };
    }));
  },
});

export const createSale = mutation({
  args: {
    tenant_id: v.id("tenants"),
    customer_id: v.id("leads"),
    project_id: v.id("projects"),
    sales_executive_id: v.id("profiles"),
    team_leader_id: v.optional(v.id("profiles")),
    sale_date: v.string(),
    property_type: v.optional(v.string()),
    unit_number: v.optional(v.string()),
    area_sqft: v.number(),
    rate_per_sqft: v.optional(v.number()),
    base_price: v.optional(v.number()),
    total_revenue: v.number(),
    booking_amount: v.number(),
    is_agreement_done: v.boolean(),
    agreement_date: v.optional(v.string()),
    is_registry_done: v.boolean(),
    registry_date: v.optional(v.string()),
    status: v.string(),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const saleId = await ctx.db.insert("sales", args);
    
    // Also update lead status to 'Converted'
    await ctx.db.patch(args.customer_id, { lead_status: 'Converted' });
    
    return saleId;
  },
});

export const updateSale = mutation({
  args: {
    id: v.id("sales"),
    status: v.optional(v.string()),
    is_agreement_done: v.optional(v.boolean()),
    agreement_date: v.optional(v.string()),
    is_registry_done: v.optional(v.boolean()),
    registry_date: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteSale = mutation({
  args: { id: v.id("sales") },
  handler: async (ctx, args) => {
    // Also delete associated payments
    const payments = await ctx.db.query("payments")
        .withIndex("by_sale", q => q.eq("sale_id", args.id))
        .collect();
    
    for (const p of payments) {
        await ctx.db.delete(p._id);
    }
    
    await ctx.db.delete(args.id);
  },
});

export const getSalesAnalytics = query({
  args: { 
    tenant_id: v.id("tenants"),
    executive_id: v.optional(v.id("profiles")),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("sales")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id));
    
    if (args.executive_id) {
       q = ctx.db.query("sales").withIndex("by_executive", q => q.eq("sales_executive_id", args.executive_id!));
    }

    const sales = await q.collect();
    const payments = await ctx.db
        .query("payments")
        .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
        .collect();

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = args.year;

    const statsByMonth = months.map((month, idx) => {
        const monthSales = sales.filter(s => {
            const date = new Date(s.sale_date);
            return date.getFullYear() === currentYear && date.getMonth() === idx;
        });
        
        const monthPayments = payments.filter(p => {
            const date = new Date(p.payment_date);
            return date.getFullYear() === currentYear && date.getMonth() === idx;
        });

        return {
            name: month,
            sales: monthSales.length,
            revenue: monthSales.reduce((sum, s) => sum + s.total_revenue, 0),
            collections: monthPayments.reduce((sum, p) => sum + p.amount, 0),
        };
    });

    return statsByMonth;
  },
});

export const getSalesOverview = query({
  args: { 
    tenant_id: v.id("tenants"),
    executive_id: v.id("profiles"),
    view: v.string(), // self, team, overall
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const yearStart = `${currentYear}-01-01`;

    // Helper for recursive subordinates
    const getSubordinateIds = async (managerId: Id<"profiles">): Promise<Id<"profiles">[]> => {
      const subs = await ctx.db
        .query("profiles")
        .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
        .filter(q => q.eq(q.field("reporting_manager_id"), managerId))
        .collect();
      
      let allIds = subs.map(s => s._id);
      for (const sub of subs) {
        const subSubIds = await getSubordinateIds(sub._id);
        allIds = [...allIds, ...subSubIds];
      }
      return allIds;
    };

    let executiveIds = [args.executive_id];
    
    if (args.view === 'team') {
       const teamIds = await getSubordinateIds(args.executive_id);
       executiveIds = [args.executive_id, ...teamIds];
    } else if (args.view === 'overall') {
       // Only for admins/receptionists, but we'll allow it if called
       const allStaff = await ctx.db
         .query("profiles")
         .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
         .collect();
       executiveIds = allStaff.map(p => p._id);
    }

    const allSales = await ctx.db
        .query("sales")
        .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
        .collect();
    
    const filteredSales = allSales.filter(s => executiveIds.includes(s.sales_executive_id));
    
    const monthlySales = filteredSales.filter(s => s.sale_date >= monthStart);
    const ytdSales = filteredSales.filter(s => s.sale_date >= yearStart);

    const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.total_revenue, 0);
    const ytdRevenue = ytdSales.reduce((sum, s) => sum + s.total_revenue, 0);
    const ytdTotalArea = ytdSales.reduce((sum, s) => sum + s.area_sqft, 0);

    // Target
    const target = await ctx.db
        .query("sales_targets")
        .withIndex("by_user", q => q.eq("user_id", args.executive_id))
        .filter(q => q.eq(q.field("start_date"), monthStart))
        .unique();

    // Incentives
    const incentives = await ctx.db
        .query("incentives")
        .withIndex("by_executive", q => q.eq("sales_executive_id", args.executive_id).eq("calculation_year", currentYear))
        .collect();

    const totalIncentives = incentives.reduce((sum, i) => sum + i.total_incentive_amount, 0);

    // Project Stats
    const projectMap = new Map<string, number>();
    for (const s of ytdSales) {
        projectMap.set(s.project_id, (projectMap.get(s.project_id) || 0) + s.area_sqft);
    }

    const projectStats = await Promise.all(
        Array.from(projectMap.entries()).map(async ([pid, area]) => {
            const p = await ctx.db.get(pid as Id<"projects">);
            return { name: p?.name || 'Unknown', area };
        })
    );

    // Trend
    const months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const name = d.toLocaleString('default', { month: 'short' });
        const key = d.toISOString().slice(0, 7);
        const monthRevenue = filteredSales
            .filter(s => s.sale_date.startsWith(key))
            .reduce((sum, s) => sum + s.total_revenue, 0);
        months.push({ name, sales: monthRevenue });
    }

    // Additional Team Data (Target/Visits)
    let teamTargets: any[] = [];
    let siteVisits = { total: 0, avgPerExec: 0, conversionRate: 0 };

    if (args.view === 'team' || args.view === 'overall') {
       const targets = await ctx.db
         .query("sales_targets")
         .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
         .filter(q => q.eq(q.field("month"), currentMonth))
         .filter(q => q.eq(q.field("year"), currentYear))
         .collect();
       
       const relevantTargets = targets.filter(t => executiveIds.includes(t.user_id as Id<"profiles">));
       
       teamTargets = await Promise.all(relevantTargets.map(async t => {
         const user = await ctx.db.get(t.user_id as Id<"profiles">);
         const achieved = filteredSales
           .filter(s => s.sales_executive_id === t.user_id && s.sale_date >= monthStart)
           .reduce((sum, s) => sum + s.area_sqft, 0);
         
         return {
           id: t.user_id,
           name: user?.full_name || 'Unknown',
           targetAmount: t.target_sqft,
           achievedAmount: achieved,
           percentage: t.target_sqft > 0 ? (achieved / t.target_sqft) * 100 : 0
         };
       }));

       const visits = await ctx.db
         .query("site_visits")
         .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
         .collect();
       
       const relevantVisits = visits.filter(v => executiveIds.includes(v.assigned_to_id as Id<"profiles">));
       siteVisits = {
         total: relevantVisits.length,
         avgPerExec: executiveIds.length > 0 ? relevantVisits.length / executiveIds.length : 0,
         conversionRate: relevantVisits.length > 0 ? (filteredSales.length / relevantVisits.length) * 100 : 0
       };
    }

    return {
        mySales: monthlySales.length,
        monthlyRevenue,
        myTarget: target?.target_amount || 0,
        achievementPercent: target?.target_amount ? (monthlyRevenue / target.target_amount) * 100 : 0,
        totalIncentives,
        ytdSalesCount: ytdSales.length,
        ytdTotalArea,
        ytdRevenue,
        projectStats: projectStats.sort((a,b) => b.area - a.area).slice(0, 4),
        salesTrend: months,
        teamTargets,
        siteVisits
    };
  },
});

export const getLeaderboard = query({
  args: {
    tenant_id: v.id("tenants"),
    timeFilter: v.string(), // today, this_week, this_month, this_year
    roleFilter: v.string(), // all, sales_executive, team_leader
  },
  handler: async (ctx, args) => {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), 0, 1); // This Year
    
    if (args.timeFilter === 'today') {
      startDate = new Date(now.setHours(0,0,0,0));
    } else if (args.timeFilter === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day;
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0,0,0,0);
    } else if (args.timeFilter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startStr = startDate.toISOString().split('T')[0];

    const allSales = await ctx.db
      .query("sales")
      .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
      .filter(q => q.gte(q.field("sale_date"), startStr))
      .collect();

    const leaderboardMap = new Map<string, {
      id: string;
      name: string;
      salesCount: number;
      revenue: number;
      image_url: string | null;
    }>();

    for (const sale of allSales) {
      const execId = sale.sales_executive_id;
      if (!leaderboardMap.has(execId)) {
        const profile = await ctx.db.get(execId);
        if (args.roleFilter !== 'all' && profile?.role !== args.roleFilter) continue;
        
        leaderboardMap.set(execId, {
          id: execId,
          name: profile?.full_name || 'Unknown',
          salesCount: 0,
          revenue: 0,
          image_url: profile?.image_url || null,
        });
      }
      
      const entry = leaderboardMap.get(execId);
      if (entry) {
        entry.salesCount++;
        entry.revenue += sale.total_revenue;
      }
    }

    return Array.from(leaderboardMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  },
});
