import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const countPendingVisits = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return (await ctx.db
      .query("site_visits")
      .withIndex("by_tenant_status", (q) => q.eq("tenant_id", args.tenant_id).eq("status", "pending"))
      .collect()).length;
  },
});

export const listSiteVisits = query({
  args: { 
    paginationOpts: v.any(),
    tenant_id: v.id("tenants"),
    role: v.string(),
    userId: v.id("profiles"),
    filterStatus: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const normalizedRole = args.role.toLowerCase().replace(/[\s_-]+/g, "_");
    const canViewAll = ["super_admin", "admin", "director"].includes(normalizedRole);
    
    let q;
    
    if (canViewAll) {
      if (args.filterStatus && args.filterStatus !== "all") {
        q = ctx.db.query("site_visits")
          .withIndex("by_tenant_status", q => q.eq("tenant_id", args.tenant_id).eq("status", args.filterStatus!));
      } else {
        q = ctx.db.query("site_visits")
          .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id));
      }
    } else if (normalizedRole === "driver") {
       q = ctx.db.query("site_visits")
         .withIndex("by_driver", q => q.eq("driver_id", args.userId))
         .filter(q => q.eq(q.field("tenant_id"), args.tenant_id));
    } else {
       // Default to requester
       q = ctx.db.query("site_visits")
         .withIndex("by_requester", q => q.eq("requested_by", args.userId))
         .filter(q => q.eq(q.field("tenant_id"), args.tenant_id));
    }
    
    const paginatedVisits = await q.order("desc").paginate(args.paginationOpts);

    // Filter by date for non-admins (last 30 days) - this is done in memory on the page
    // Map relations (requester, driver)
    const page = await Promise.all(
      paginatedVisits.page.map(async (visit) => {
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

    return { ...paginatedVisits, page };
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
