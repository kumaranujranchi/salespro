import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const countPendingVisits = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    const visits = await ctx.db
      .query("site_visits")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .collect();
    return visits.filter(v => v.status === "pending").length;
  },
});

export const listSiteVisits = query({
  args: { 
    tenant_id: v.id("tenants"),
    role: v.string(),
    userId: v.id("profiles"),
    filterStatus: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("site_visits")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id));
    
    const visits = await q.order("desc").collect();

    // Mapping relations (requester, driver)
    const results = await Promise.all(
      visits.map(async (visit) => {
        const requester = await ctx.db.get(visit.requested_by);
        const driver = visit.driver_id ? await ctx.db.get(visit.driver_id) : null;
        
        return {
          ...visit,
          id: visit._id,
          requester,
          driver,
        };
      })
    );

    // Apply role-based and status filters
    const canViewAll = ["super_admin", "admin", "director"].includes(args.role);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return results.filter(v => {
      // Status filter
      if (args.filterStatus && args.filterStatus !== "all" && v.status !== args.filterStatus) return false;
      
      // Date filter for non-admins
      if (!canViewAll && new Date(v.visit_date) < thirtyDaysAgo) return false;
      
      // Role-based visibility
      if (canViewAll) return true;
      if (args.role === "driver" && v.driver_id === args.userId) return true;
      if (v.requested_by === args.userId) return true;
      
      return false;
    });
  },
});

export const createSiteVisit = mutation({
  args: {
    tenant_id: v.id("tenants"),
    requested_by: v.id("profiles"),
    customer_name: v.string(),
    mobile: v.string(),
    visit_date: v.string(),
    visit_time: v.string(),
    pickup_location: v.string(),
    notes: v.optional(v.string()),
    status: v.string(), // e.g. "pending"
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("site_visits", {
      ...args,
      metadata: {},
    });
  },
});

export const updateSiteVisit = mutation({
  args: {
    id: v.id("site_visits"),
    status: v.optional(v.string()),
    driver_id: v.optional(v.id("profiles")),
    rejection_reason: v.optional(v.string()),
    clarification_note: v.optional(v.string()),
    start_odometer: v.optional(v.string()),
    end_odometer: v.optional(v.string()),
    trip_start_time: v.optional(v.string()),
    trip_end_time: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteSiteVisit = mutation({
  args: { id: v.id("site_visits") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
