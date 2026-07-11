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

    // Map relations (requester, driver)
    const page = await Promise.all(
      paginatedVisits.page.map(async (visit) => {
        const requester = await ctx.db.get(visit.requested_by);
        const driver = visit.driver_id ? await ctx.db.get(visit.driver_id) : null;
        const lead = visit.lead_id ? await ctx.db.get(visit.lead_id) : null;
        
        return {
          ...visit,
          id: visit._id,
          requester,
          driver,
          lead,
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
    lead_id: v.optional(v.id("leads")), // Optional link to CRM lead
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
    // For timeline entry on completion
    completed_by_profile_id: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    const { id, completed_by_profile_id, ...data } = args;
    await ctx.db.patch(id, data);

    // Auto-add a site visit timeline entry when trip is marked as completed
    if (args.status === "completed") {
      const visit = await ctx.db.get(id);
      if (visit?.lead_id) {
        // Get the lead to preserve its current status
        const lead = await ctx.db.get(visit.lead_id);
        if (lead) {
          const visitDateTime = `${visit.visit_date} ${visit.visit_time}`;
          const completedTime = new Date().toISOString();

          // Check daily followup limit
          const todayStr = new Date().toISOString().split("T")[0];
          const todayFollowups = (
            await ctx.db
              .query("lead_followups")
              .withIndex("by_lead", (q) => q.eq("lead_id", visit.lead_id!))
              .collect()
          ).filter((f) => f.followup_date.slice(0, 10) === todayStr);

          // Add timeline entry (skip if daily limit hit)
          if (todayFollowups.length < 3) {
            await ctx.db.insert("lead_followups", {
              tenant_id: visit.tenant_id,
              lead_id: visit.lead_id,
              followup_type: "Site Visit",
              followup_date: completedTime,
              discussion_summary: `Site visit completed. Pickup: ${visit.pickup_location}. Scheduled: ${visitDateTime}.${visit.notes ? " Notes: " + visit.notes : ""}`,
              new_status: lead.lead_status, // Keep existing lead status
              previous_status: lead.lead_status,
              is_editable: false,
              created_by: completed_by_profile_id ?? visit.requested_by,
              metadata: {
                type: "site_visit_completed",
                site_visit_id: id,
                end_odometer: args.end_odometer,
              },
            });

            // Update lead's latest followup date
            await ctx.db.patch(visit.lead_id, {
              latest_followup_date: completedTime,
              latest_followup_status: "Site Visit",
              updated_at: completedTime,
            });
          }
        }
      }
    }
  },
});

export const deleteSiteVisit = mutation({
  args: { id: v.id("site_visits") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
