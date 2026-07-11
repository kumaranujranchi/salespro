import { v, ConvexError } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to generate Lead ID: L-[YYYYMMDD]-[XXXX]
async function generateLeadId(ctx: QueryCtx | MutationCtx, tenantId: Id<"tenants">) {
  const now = new Date();
  const datePart = now.toISOString().split("T")[0].replace(/-/g, "");
  
  const todayLeads = await ctx.db
    .query("leads")
    .withIndex("by_tenant_date", (q) => 
      q.eq("tenant_id", tenantId).eq("lead_date", now.toISOString().split("T")[0])
    )
    .collect();

  const sequenceNum = (todayLeads.length + 1).toString().padStart(4, "0");
  return `L-${datePart}-${sequenceNum}`;
}

function cleanNullFields<T extends Record<string, any>>(obj: T): { [K in keyof T]: T[K] extends null ? undefined : T[K] } {
  const result: any = {};
  for (const key in obj) {
    result[key] = obj[key] === null ? undefined : obj[key];
  }
  return result;
}

export const createLead = mutation({
  args: {
    tenant_id: v.id("tenants"),
    lead_source: v.string(),
    project_id: v.optional(v.union(v.id("projects"), v.null())),
    sales_executive_id: v.optional(v.union(v.id("profiles"), v.null())),
    customer_name: v.string(),
    mobile: v.string(),
    email: v.optional(v.union(v.string(), v.null())),
    city: v.optional(v.union(v.string(), v.null())),
    budget_range: v.optional(v.union(v.string(), v.null())),
    purpose: v.optional(v.union(v.string(), v.null())),
    preferred_locations: v.optional(v.array(v.string())),
    lead_status: v.string(),
    lead_score: v.string(),
    internal_notes: v.optional(v.union(v.string(), v.null())),
    created_by: v.optional(v.union(v.id("profiles"), v.null())),
    lead_date: v.optional(v.union(v.string(), v.null())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check and update tenant leads count to enforce 100,000 limit
    const tenant = await ctx.db.get(args.tenant_id);
    if (!tenant) throw new ConvexError("Tenant not found");

    let currentCount = tenant.leads_count;
    if (currentCount === undefined) {
      const existingLeads = await ctx.db
        .query("leads")
        .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
        .collect();
      currentCount = existingLeads.length;
    }

    if (currentCount >= 100000) {
      throw new ConvexError("Lead limit reached. You cannot add more than 1,00,000 leads.");
    }

    // Check for duplicate mobile within tenant
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .filter((q) => q.eq(q.field("mobile"), args.mobile))
      .unique();
    
    if (existing) {
      if (existing.lead_status === "Lost" || existing.lead_status === "Disqualified") {
        throw new ConvexError({
          code: "DUPLICATE_LOST_LEAD",
          message: "Lead already available in lost leads",
          leadId: existing._id
        });
      } else {
        throw new ConvexError("A lead with this mobile number already exists");
      }
    }

    const lead_id = await generateLeadId(ctx, args.tenant_id);
    const now = new Date().toISOString();

    const { lead_date, metadata, ...otherSchemaArgs } = args;
    const cleanedSchemaArgs = cleanNullFields(otherSchemaArgs);

    const newLeadId = await ctx.db.insert("leads", {
      ...cleanedSchemaArgs,
      lead_id,
      lead_date: lead_date || now.split("T")[0],
      updated_by: cleanedSchemaArgs.created_by,
      metadata: metadata || {},
    });

    await ctx.db.patch(args.tenant_id, {
      leads_count: currentCount + 1,
    });

    return newLeadId;
  },
});

export const updateLead = mutation({
  args: {
    id: v.id("leads"),
    lead_source: v.optional(v.string()),
    project_id: v.optional(v.union(v.id("projects"), v.null())),
    sales_executive_id: v.optional(v.union(v.id("profiles"), v.null())),
    customer_name: v.optional(v.string()),
    mobile: v.optional(v.string()),
    email: v.optional(v.union(v.string(), v.null())),
    city: v.optional(v.union(v.string(), v.null())),
    budget_range: v.optional(v.union(v.string(), v.null())),
    purpose: v.optional(v.union(v.string(), v.null())),
    preferred_locations: v.optional(v.array(v.string())),
    lead_status: v.optional(v.string()),
    lead_score: v.optional(v.string()),
    internal_notes: v.optional(v.union(v.string(), v.null())),
    lead_date: v.optional(v.union(v.string(), v.null())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lead not found");

    await ctx.db.patch(id, {
      ...cleanNullFields(data),
      updated_at: new Date().toISOString(),
    });
    return id;
  },
});

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

export const listLeadsByTenant = query({
  args: { 
    paginationOpts: v.any(),
    tenant_id: v.id("tenants"),
    showOnlyMyLeads: v.optional(v.boolean()),
    profileId: v.optional(v.id("profiles")),
    statusFilter: v.optional(v.string()),
    executiveFilter: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("leads")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id));

    // Resolve allowed profiles if caller is not admin
    let allowedIds: any[] | null = null;
    if (args.profileId) {
      const callerProfile = await ctx.db.get(args.profileId);
      if (callerProfile && !['super_admin', 'admin', 'director', 'platform_admin'].includes(callerProfile.role)) {
        const subIds = await getSubordinateProfileIds(ctx, args.tenant_id, args.profileId);
        allowedIds = [args.profileId, ...subIds];
      }
    }

    // Server-side filtering
    if (args.showOnlyMyLeads && args.profileId) {
      q = ctx.db
        .query("leads")
        .withIndex("by_tenant_executive", (q) => 
          q.eq("tenant_id", args.tenant_id).eq("sales_executive_id", args.profileId)
        );
    } else if (args.executiveFilter && args.executiveFilter !== 'all') {
      // Check if caller has permission for this executive
      let authorized = true;
      if (allowedIds && !allowedIds.includes(args.executiveFilter as any)) {
        authorized = false;
      }
      
      if (authorized) {
        q = ctx.db
          .query("leads")
          .withIndex("by_tenant_executive", (q) => 
            q.eq("tenant_id", args.tenant_id).eq("sales_executive_id", args.executiveFilter as any)
          );
      } else {
        // Not authorized: force empty query
        q = ctx.db
          .query("leads")
          .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
          .filter((q) => q.eq(q.field("mobile"), "FORCE_EMPTY_NOT_AUTHORIZED"));
      }
    } else if (args.statusFilter && args.statusFilter !== 'all') {
      if (args.statusFilter === 'active') {
        q = ctx.db
          .query("leads")
          .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
          .filter((q) => q.and(
            q.neq(q.field("lead_status"), "Lost"),
            q.neq(q.field("lead_status"), "Disqualified")
          ));
      } else {
        q = ctx.db
          .query("leads")
          .withIndex("by_tenant_status", (q) => 
            q.eq("tenant_id", args.tenant_id).eq("lead_status", args.statusFilter!)
          );
      }
    }

    // Apply allowedIds constraint to status or default queries
    if (allowedIds && !(args.showOnlyMyLeads && args.profileId) && !(args.executiveFilter && args.executiveFilter !== 'all')) {
      q = q.filter((q) => 
        q.or(
          ...allowedIds!.map(id => q.eq(q.field("sales_executive_id"), id))
        )
      );
    }

    const paginatedLeads = await q.order("desc").paginate(args.paginationOpts);

    // Map relations using denormalized data
    const page = await Promise.all(
      paginatedLeads.page.map(async (lead) => {
        const project = lead.project_id ? await ctx.db.get(lead.project_id) : null;
        const sales_executive = lead.sales_executive_id ? await ctx.db.get(lead.sales_executive_id) : null;
        
        // Use denormalized followup data instead of querying followups table
        const overdue_followup = lead.next_followup_date
          ? new Date(lead.next_followup_date) < new Date()
          : false;

        return {
          ...lead,
          id: lead._id,
          created_at: new Date(lead._creationTime).toISOString(),
          updated_at: lead.updated_at || new Date(lead._creationTime).toISOString(),
          project: project ? { 
            ...project, 
            id: project._id,
            created_at: new Date(project._creationTime).toISOString(),
            updated_at: (project as any).updated_at || new Date(project._creationTime).toISOString(),
          } : null,
          sales_executive: sales_executive ? { 
            ...sales_executive, 
            id: sales_executive._id,
            created_at: new Date(sales_executive._creationTime).toISOString(),
            updated_at: (sales_executive as any).updated_at || new Date(sales_executive._creationTime).toISOString(),
          } : null,
          overdue_followup,
        };
      })
    );

    return { ...paginatedLeads, page };
  },
});

export const deleteLead = mutation({
  args: { id: v.id("leads") },
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.id);
    if (lead) {
      const tenant = await ctx.db.get(lead.tenant_id);
      if (tenant && tenant.leads_count !== undefined) {
        await ctx.db.patch(lead.tenant_id, {
          leads_count: Math.max(0, tenant.leads_count - 1),
        });
      }
      await ctx.db.delete(args.id);
    }
  },
});

export const bulkInsertLeads = mutation({
  args: {
    tenant_id: v.id("tenants"),
    leads: v.array(v.object({
      customer_name: v.string(),
      mobile: v.string(),
      email: v.union(v.string(), v.null()),
      city: v.union(v.string(), v.null()),
      project_id: v.union(v.id("projects"), v.null()),
      budget_range: v.union(v.string(), v.null()),
      purpose: v.string(),
      lead_source: v.string(),
      lead_status: v.string(),
      lead_score: v.string(),
      lead_date: v.string(),
      sales_executive_id: v.id("profiles"),
      internal_notes: v.union(v.string(), v.null()),
    })),
    created_by: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; error: string; mobile: string }[],
    };

    const tenant = await ctx.db.get(args.tenant_id);
    if (!tenant) throw new Error("Tenant not found");

    let currentCount = tenant.leads_count;
    if (currentCount === undefined) {
      const existingLeads = await ctx.db
        .query("leads")
        .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
        .collect();
      currentCount = existingLeads.length;
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    for (let i = 0; i < args.leads.length; i++) {
      const leadData = args.leads[i];
      const rowNum = i + 2;

      try {
        if (currentCount >= 100000) {
          throw new Error("Lead limit reached (maximum 1,00,000 leads).");
        }

        const existing = await ctx.db
          .query("leads")
          .withIndex("by_tenant_mobile", (q) => 
            q.eq("tenant_id", args.tenant_id).eq("mobile", leadData.mobile)
          )
          .unique();

        if (existing) {
          if (existing.lead_status === "Lost") {
            await ctx.db.patch(existing._id, {
              lead_status: "New",
              sales_executive_id: leadData.sales_executive_id,
              customer_name: leadData.customer_name,
              updated_by: args.created_by,
              metadata: { 
                ...((existing.metadata as Record<string, any>) || {}), 
                reactivated_from_bulk: true, 
                reactivated_at: new Date().toISOString() 
              }
            });
            results.success++;
            continue;
          } else if (existing.lead_status !== "Converted") {
            throw new Error(`Mobile ${leadData.mobile} already exists (Status: ${existing.lead_status})`);
          }
        }

        const leadId = `L-${dateStr}-${(currentCount + 1).toString().padStart(5, "0")}`;

        await ctx.db.insert("leads", {
          ...leadData,
          email: leadData.email ?? undefined,
          city: leadData.city ?? undefined,
          project_id: leadData.project_id ?? undefined,
          budget_range: leadData.budget_range ?? undefined,
          internal_notes: leadData.internal_notes ?? undefined,
          tenant_id: args.tenant_id,
          lead_id: leadId,
          created_by: args.created_by,
          updated_by: args.created_by,
          metadata: { import_source: "excel" },
        });

        currentCount++;
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({
          row: rowNum,
          error: err.message,
          mobile: leadData.mobile,
        });
      }
    }

    await ctx.db.patch(args.tenant_id, {
      leads_count: currentCount,
    });

    return results;
  },
});

export const bulkAssignLeads = mutation({
  args: {
    ids: v.array(v.id("leads")),
    sales_executive_id: v.id("profiles"),
    updated_by: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, {
        sales_executive_id: args.sales_executive_id,
        updated_by: args.updated_by,
      });
    }
  },
});

export const bulkUpdateLeadStatus = mutation({
  args: {
    ids: v.array(v.id("leads")),
    lead_status: v.string(),
    updated_by: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, {
        lead_status: args.lead_status,
        updated_by: args.updated_by,
      });
    }
  },
});

export const bulkUpdateLeadProject = mutation({
  args: {
    ids: v.array(v.id("leads")),
    project_id: v.id("projects"),
    updated_by: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, {
        project_id: args.project_id,
        updated_by: args.updated_by,
      });
    }
  },
});

export const bulkDeleteLeads = mutation({
  args: { ids: v.array(v.id("leads")) },
  handler: async (ctx, args) => {
    let tenantId: Id<"tenants"> | null = null;
    let countDeleted = 0;

    for (const id of args.ids) {
      const lead = await ctx.db.get(id);
      if (lead) {
        if (!tenantId) tenantId = lead.tenant_id;
        countDeleted++;
        await ctx.db.delete(id);
      }
    }

    if (tenantId && countDeleted > 0) {
      const tenant = await ctx.db.get(tenantId);
      if (tenant && tenant.leads_count !== undefined) {
        await ctx.db.patch(tenantId, {
          leads_count: Math.max(0, tenant.leads_count - countDeleted),
        });
      }
    }
  },
});

export const getDashboardStats = query({
  args: { 
    tenant_id: v.id("tenants"),
    executive_id: v.optional(v.id("profiles")),
    callerProfileId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    let allowedIds: any[] | null = null;
    
    // Determine visibility restriction
    if (args.executive_id) {
      allowedIds = [args.executive_id];
    } else if (args.callerProfileId) {
      const callerProfile = await ctx.db.get(args.callerProfileId);
      if (callerProfile && !['super_admin', 'admin', 'director', 'platform_admin'].includes(callerProfile.role)) {
        const subIds = await getSubordinateProfileIds(ctx, args.tenant_id, args.callerProfileId);
        allowedIds = [args.callerProfileId, ...subIds];
      }
    }

    // Helper to get count for a specific status
    const getCount = async (status?: string) => {
      let q = ctx.db.query("leads");
      
      if (allowedIds) {
        if (allowedIds.length === 1) {
          q = q.withIndex("by_tenant_executive", q => q.eq("tenant_id", args.tenant_id).eq("sales_executive_id", allowedIds![0]));
        } else {
          q = q.withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
               .filter(q => q.or(...allowedIds!.map(id => q.eq(q.field("sales_executive_id"), id))));
        }
      } else {
        q = q.withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id));
      }

      if (status) {
        q = q.filter(q => q.eq(q.field("lead_status"), status));
      }

      return (await q.collect()).length;
    };

    const getSourceCount = async (source: string) => {
      let q = ctx.db.query("leads");
      
      if (allowedIds) {
        if (allowedIds.length === 1) {
          q = q.withIndex("by_tenant_executive", q => q.eq("tenant_id", args.tenant_id).eq("sales_executive_id", allowedIds![0]));
        } else {
          q = q.withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
               .filter(q => q.or(...allowedIds!.map(id => q.eq(q.field("sales_executive_id"), id))));
        }
      } else {
        q = q.withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id));
      }

      q = q.filter(q => q.eq(q.field("lead_source"), source));

      return (await q.collect()).length;
    };

    // Fetch all follow-ups for the tenant
    const followups = await ctx.db
      .query("lead_followups")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .collect();

    // Filter followups based on visibility (allowedIds)
    let filteredFollowups = followups;
    if (allowedIds) {
      const allowedSet = new Set(allowedIds.map((id) => id.toString()));
      filteredFollowups = followups.filter(
        (f) => f.created_by && allowedSet.has(f.created_by.toString())
      );
    }

    // Helper to format date as YYYY-MM-DD
    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    const today = new Date();
    const todayStr = formatDate(today);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    // Start of week (Monday)
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(today.getDate() + diffToMonday);
    const startOfWeekStr = formatDate(startOfWeek);

    // Start of month
    const startOfMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    const getPeriodStats = (periodFollowups: any[]) => {
      const callFollowups = periodFollowups.filter(f => f.followup_type === 'Call');
      const total = callFollowups.length;
      const connected = callFollowups.filter(f => f.call_status === 'Connected' || f.call_status === 'Asked to call later').length;
      const notResponding = callFollowups.filter(f => f.call_status === 'Not Responding').length;
      const ringing = callFollowups.filter(f => f.call_status === 'Ringing').length;
      const busy = callFollowups.filter(f => f.call_status === 'Busy').length;
      const disconnected = callFollowups.filter(f => f.call_status === 'Disconnected').length;
      return { total, connected, notResponding, ringing, busy, disconnected };
    };

    const getActiveAgentsCount = (periodFollowups: any[]) => {
      return new Set(
        periodFollowups
          .filter(f => f.created_by)
          .map(f => f.created_by!.toString())
      ).size;
    };

    const todayFollowups = filteredFollowups.filter(f => f.followup_date.slice(0, 10) === todayStr);
    const yesterdayFollowups = filteredFollowups.filter(f => f.followup_date.slice(0, 10) === yesterdayStr);
    const weekFollowups = filteredFollowups.filter(f => f.followup_date.slice(0, 10) >= startOfWeekStr);
    const monthFollowups = filteredFollowups.filter(f => f.followup_date.slice(0, 10) >= startOfMonthStr);

    // Fetch tenant profiles to get total agents (sales executives)
    const tenantProfiles = await ctx.db
      .query("profiles")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .collect();
    const totalAgentsCount = tenantProfiles.filter(p => p.role === 'sales_executive' && p.is_active).length || 1;

    const callOverview = {
      today: getPeriodStats(todayFollowups),
      yesterday: getPeriodStats(yesterdayFollowups),
      this_week: getPeriodStats(weekFollowups),
      this_month: getPeriodStats(monthFollowups),
      all_time: getPeriodStats(filteredFollowups),
    };

    const agentActivity = {
      total: totalAgentsCount,
      today: getActiveAgentsCount(todayFollowups),
      yesterday: getActiveAgentsCount(yesterdayFollowups),
      this_week: getActiveAgentsCount(weekFollowups),
      this_month: getActiveAgentsCount(monthFollowups),
      all_time: getActiveAgentsCount(filteredFollowups),
    };

    return {
      totalLeads: await getCount(),
      newLeads: await getCount('New'),
      inProgress: await getCount('In Progress'),
      qualified: await getCount('Qualified'),
      siteVisitDone: await getCount('Site Visit Done'),
      converted: await getCount('Converted'),
      lost: await getCount('Lost'),
      
      referralLeads: await getSourceCount('Referral'),
      acresLeads: await getSourceCount('99acres'),
      magicBrickLeads: await getSourceCount('MagicBrick'),
      housingLeads: await getSourceCount('Housing'),
      metaLeads: await getSourceCount('Meta'),
      googleLeads: await getSourceCount('Google'),
      walkInLeads: await getSourceCount('Walk-in'),

      callOverview,
      agentActivity,
    };
  },
});

export const getLeadByMobile = query({
  args: { 
    tenant_id: v.id("tenants"),
    mobile: v.string() 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .filter((q) => q.eq(q.field("mobile"), args.mobile))
      .unique();
  },
});

export const processWebhookLead = mutation({
  args: {
    tenant_id: v.id("tenants"),
    customer_name: v.string(),
    mobile: v.string(),
    email: v.optional(v.string()),
    city: v.optional(v.string()),
    budget_range: v.optional(v.string()),
    assignment_rule: v.string(), // "manual" | "round_robin"
    lead_source: v.string(), // "Meta" | "Google"
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenant_id);
    if (!tenant) throw new Error("Tenant not found");

    // Clean phone number (remove spaces, etc.)
    const cleanMobile = args.mobile.replace(/\s+/g, "");

    // Check duplicate
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_tenant_mobile", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("mobile", cleanMobile)
      )
      .unique();

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const sourceLabel = args.lead_source;

    if (existing) {
      // Reopen or add note
      const isClosed = ["Lost", "Disqualified"].includes(existing.lead_status);
      const noteContent = `\n[${sourceLabel} Integration - ${timestamp}]: Fresh lead inquiry received via ${sourceLabel} Ads.`;
      
      const updatedNotes = existing.internal_notes 
        ? `${existing.internal_notes}${noteContent}`
        : noteContent.trim();

      if (isClosed) {
        // Reopen lead
        await ctx.db.patch(existing._id, {
          lead_status: "New",
          internal_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Just add note
        await ctx.db.patch(existing._id, {
          internal_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        });
      }
      return existing._id;
    }

    // Lead does not exist, create new lead
    let currentCount = tenant.leads_count ?? 0;
    if (currentCount >= 100000) {
      throw new Error("Lead limit reached for this tenant.");
    }

    // 1. Determine assignment
    let sales_executive_id: Id<"profiles"> | undefined = undefined;
    if (args.assignment_rule === "round_robin") {
      const salesExecutives = await ctx.db
        .query("profiles")
        .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
        .filter((q) =>
          q.and(
            q.eq(q.field("role"), "sales_executive"),
            q.eq(q.field("is_active"), true)
          )
        )
        .collect();

      if (salesExecutives.length > 0) {
        // Sort deterministically by ID
        salesExecutives.sort((a, b) => a._id.localeCompare(b._id));
        
        const lastAssignedId = args.lead_source === "Meta"
          ? tenant.settings?.integrations?.meta?.lastAssignedExecutiveId
          : tenant.settings?.integrations?.google?.lastAssignedExecutiveId;
          
        let nextIndex = 0;
        
        if (lastAssignedId) {
          const lastIndex = salesExecutives.findIndex(se => se._id === lastAssignedId);
          if (lastIndex !== -1) {
            nextIndex = (lastIndex + 1) % salesExecutives.length;
          }
        }
        
        const assignedExec = salesExecutives[nextIndex];
        sales_executive_id = assignedExec._id;

        // Update lastAssignedExecutiveId in tenant settings
        const updatedIntegrations = { ...tenant.settings?.integrations };
        if (args.lead_source === "Meta") {
          updatedIntegrations.meta = {
            ...(updatedIntegrations.meta || {}),
            lastAssignedExecutiveId: assignedExec._id,
          };
        } else {
          updatedIntegrations.google = {
            ...(updatedIntegrations.google || {}),
            lastAssignedExecutiveId: assignedExec._id,
          };
        }

        const updatedSettings = {
          ...tenant.settings,
          integrations: updatedIntegrations
        };

        await ctx.db.patch(args.tenant_id, {
          settings: updatedSettings
        });
      }
    }

    const lead_id = await generateLeadId(ctx, args.tenant_id);
    const now = new Date().toISOString();

    const newLeadId = await ctx.db.insert("leads", {
      tenant_id: args.tenant_id,
      lead_id,
      lead_source: args.lead_source,
      customer_name: args.customer_name,
      mobile: cleanMobile,
      email: args.email,
      city: args.city,
      budget_range: args.budget_range,
      lead_status: "New",
      lead_score: "Warm",
      sales_executive_id,
      lead_date: now.split("T")[0],
      internal_notes: `[${sourceLabel} Integration - ${timestamp}]: Lead created via ${sourceLabel} Ads.`,
      metadata: { import_source: `${sourceLabel.toLowerCase()}_lead_ads` },
    });

    await ctx.db.patch(args.tenant_id, {
      leads_count: currentCount + 1,
    });

    return newLeadId;
  },
});

/**
 * Placeholder next-action assignment engine.
 * Future routing algorithms (like Round-Robin distribution) or instant WhatsApp notifications can hook here.
 */
function triggerLeadAssignmentEngine(lead: any) {
  console.log(`[LeadAssignmentEngine] Triggering next-action assignment for Lead: ${lead._id || lead.id}. Source: ${lead.lead_source}`);
}

export const saveUnifiedInboundLead = mutation({
  args: {
    tenant_id: v.id("tenants"),
    lead_source: v.string(),
    customer_name: v.string(),
    customer_phone: v.string(),
    customer_email: v.union(v.string(), v.null()),
    property_title: v.optional(v.string()),
    location: v.optional(v.string()),
    budget: v.optional(v.string()),
    raw_payload: v.string(),
    assignment_rule: v.string(), // "manual" | "round_robin"
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenant_id);
    if (!tenant) throw new Error("Tenant not found");

    const cleanMobile = args.customer_phone;

    // Check duplicate mobile within tenant
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_tenant_mobile", (q) =>
        q.eq("tenant_id", args.tenant_id).eq("mobile", cleanMobile)
      )
      .unique();

    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const sourceLabel = args.lead_source;
    let leadIdToReturn;

    if (existing) {
      // Reopen lead if closed, otherwise add internal note
      const isClosed = ["Lost", "Disqualified"].includes(existing.lead_status);
      const noteContent = `\n[${sourceLabel} Unified Inbound - ${timestamp}]: Fresh lead inquiry received for ${args.property_title || "property"}.`;
      
      const updatedNotes = existing.internal_notes 
        ? `${existing.internal_notes}${noteContent}`
        : noteContent.trim();

      const patchData: any = {
        internal_notes: updatedNotes,
        updated_at: new Date().toISOString(),
        metadata: {
          ...((existing.metadata as Record<string, any>) || {}),
          last_raw_payload: args.raw_payload,
        }
      };

      if (isClosed) {
        patchData.lead_status = "New";
      }

      await ctx.db.patch(existing._id, patchData);
      leadIdToReturn = existing._id;
    } else {
      // Create new lead
      let currentCount = tenant.leads_count ?? 0;
      if (currentCount >= 100000) {
        throw new Error("Lead limit reached (maximum 1,00,000 leads).");
      }

      // Handle Round Robin lead assignment if requested
      let sales_executive_id: Id<"profiles"> | undefined = undefined;
      if (args.assignment_rule === "round_robin") {
        const salesExecutives = await ctx.db
          .query("profiles")
          .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
          .filter((q) =>
            q.and(
              q.eq(q.field("role"), "sales_executive"),
              q.eq(q.field("is_active"), true)
            )
          )
          .collect();

        if (salesExecutives.length > 0) {
          salesExecutives.sort((a, b) => a._id.localeCompare(b._id));
          
          let lastAssignedId;
          const sourceLower = args.lead_source.toLowerCase();
          if (sourceLower.includes("99acres")) {
            lastAssignedId = tenant.settings?.integrations?.nineNineAcres?.lastAssignedExecutiveId;
          } else if (sourceLower.includes("magicbricks")) {
            lastAssignedId = tenant.settings?.integrations?.magicbricks?.lastAssignedExecutiveId;
          } else if (sourceLower.includes("housing")) {
            lastAssignedId = tenant.settings?.integrations?.housing?.lastAssignedExecutiveId;
          } else if (sourceLower.includes("whatsapp")) {
            lastAssignedId = tenant.settings?.integrations?.whatsapp?.lastAssignedExecutiveId;
          } else if (sourceLower.includes("google form")) {
            lastAssignedId = tenant.settings?.integrations?.googleForm?.lastAssignedExecutiveId;
          } else if (sourceLower.includes("google sheet")) {
            lastAssignedId = tenant.settings?.integrations?.googleSheet?.lastAssignedExecutiveId;
          }

          let nextIndex = 0;
          if (lastAssignedId) {
            const lastIndex = salesExecutives.findIndex(se => se._id === lastAssignedId);
            if (lastIndex !== -1) {
              nextIndex = (lastIndex + 1) % salesExecutives.length;
            }
          }

          const assignedExec = salesExecutives[nextIndex];
          sales_executive_id = assignedExec._id;

          // Update lastAssignedExecutiveId in tenant settings
          const updatedIntegrations = { ...tenant.settings?.integrations };
          if (sourceLower.includes("99acres")) {
            updatedIntegrations.nineNineAcres = {
              ...(updatedIntegrations.nineNineAcres || { enabled: true, assignmentRule: 'round_robin' }),
              lastAssignedExecutiveId: assignedExec._id,
            };
          } else if (sourceLower.includes("magicbricks")) {
            updatedIntegrations.magicbricks = {
              ...(updatedIntegrations.magicbricks || { enabled: true, assignmentRule: 'round_robin' }),
              lastAssignedExecutiveId: assignedExec._id,
            };
          } else if (sourceLower.includes("housing")) {
            updatedIntegrations.housing = {
              ...(updatedIntegrations.housing || { enabled: true, assignmentRule: 'round_robin' }),
              lastAssignedExecutiveId: assignedExec._id,
            };
          } else if (sourceLower.includes("whatsapp")) {
            updatedIntegrations.whatsapp = {
              ...(updatedIntegrations.whatsapp || { enabled: true, assignmentRule: 'round_robin' }),
              lastAssignedExecutiveId: assignedExec._id,
            };
          } else if (sourceLower.includes("google form")) {
            updatedIntegrations.googleForm = {
              ...(updatedIntegrations.googleForm || { enabled: true, assignmentRule: 'round_robin' }),
              lastAssignedExecutiveId: assignedExec._id,
            };
          } else if (sourceLower.includes("google sheet")) {
            updatedIntegrations.googleSheet = {
              ...(updatedIntegrations.googleSheet || { enabled: true, assignmentRule: 'round_robin' }),
              lastAssignedExecutiveId: assignedExec._id,
            };
          }

          await ctx.db.patch(args.tenant_id, {
            settings: {
              ...tenant.settings,
              integrations: updatedIntegrations
            }
          });
        }
      }

      const lead_id = await generateLeadId(ctx, args.tenant_id);
      const now = new Date().toISOString();

      const internalNotes = `[${sourceLabel} Unified Inbound - ${timestamp}]: Lead created via Unified Inbound Endpoint.\n` +
        `Property Interest: ${args.property_title || "N/A"}\n` +
        `Location Preference: ${args.location || "N/A"}\n` +
        `Budget: ${args.budget || "N/A"}`;

      const newLeadId = await ctx.db.insert("leads", {
        tenant_id: args.tenant_id,
        lead_id,
        lead_source: args.lead_source,
        customer_name: args.customer_name || "Unknown Inbound Lead",
        mobile: cleanMobile,
        email: args.customer_email || undefined,
        city: args.location || undefined,
        budget_range: args.budget || undefined,
        lead_status: "New",
        lead_score: "Warm",
        sales_executive_id,
        lead_date: now.split("T")[0],
        internal_notes: internalNotes,
        metadata: { 
          import_source: "unified_inbound",
          raw_payload: args.raw_payload,
          property_title: args.property_title,
          location: args.location
        },
      });

      await ctx.db.patch(args.tenant_id, {
        leads_count: currentCount + 1,
      });

      leadIdToReturn = newLeadId;
    }

    // Trigger next-action assignment engine
    const leadObj = await ctx.db.get(leadIdToReturn);
    triggerLeadAssignmentEngine(leadObj);

    return leadIdToReturn;
  }
});

export const listAllLeadsForTenant = query({
  args: {
    tenant_id: v.id("tenants"),
    profileId: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("leads")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id));

    let allowedIds: any[] | null = null;
    if (args.profileId) {
      const callerProfile = await ctx.db.get(args.profileId);
      if (callerProfile && !['super_admin', 'admin', 'director', 'platform_admin'].includes(callerProfile.role)) {
        const subIds = await getSubordinateProfileIds(ctx, args.tenant_id, args.profileId);
        allowedIds = [args.profileId, ...subIds];
      }
    }

    if (allowedIds) {
      q = q.filter((q) => 
        q.or(
          ...allowedIds!.map(id => q.eq(q.field("sales_executive_id"), id))
        )
      );
    }

    const leads = await q.collect();
    
    return leads.map(lead => {
      const overdue_followup = lead.next_followup_date
        ? new Date(lead.next_followup_date) < new Date()
        : false;
      return {
        ...lead,
        overdue_followup,
      };
    });
  }
});


