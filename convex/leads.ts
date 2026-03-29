import { v } from "convex/values";
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

export const createLead = mutation({
  args: {
    tenant_id: v.id("tenants"),
    lead_source: v.string(),
    project_id: v.optional(v.id("projects")),
    sales_executive_id: v.optional(v.id("profiles")),
    customer_name: v.string(),
    mobile: v.string(),
    email: v.optional(v.string()),
    city: v.optional(v.string()),
    budget_range: v.optional(v.string()),
    purpose: v.optional(v.string()),
    preferred_locations: v.optional(v.array(v.string())),
    lead_status: v.string(),
    lead_score: v.string(),
    internal_notes: v.optional(v.string()),
    created_by: v.optional(v.id("profiles")),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate mobile within tenant
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .filter((q) => q.eq(q.field("mobile"), args.mobile))
      .unique();
    
    if (existing) throw new Error("A lead with this mobile number already exists");

    const lead_id = await generateLeadId(ctx, args.tenant_id);
    const now = new Date().toISOString();

    return await ctx.db.insert("leads", {
      ...args,
      lead_id,
      lead_date: now.split("T")[0],
      updated_by: args.created_by,
    });
  },
});

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

    // Server-side filtering
    if (args.showOnlyMyLeads && args.profileId) {
      q = ctx.db
        .query("leads")
        .withIndex("by_tenant_executive", (q) => 
          q.eq("tenant_id", args.tenant_id).eq("sales_executive_id", args.profileId)
        );
    } else if (args.executiveFilter && args.executiveFilter !== 'all') {
      q = ctx.db
        .query("leads")
        .withIndex("by_tenant_executive", (q) => 
          q.eq("tenant_id", args.tenant_id).eq("sales_executive_id", args.executiveFilter as any)
        );
    } else if (args.statusFilter && args.statusFilter !== 'all') {
        q = ctx.db
        .query("leads")
        .withIndex("by_tenant_status", (q) => 
          q.eq("tenant_id", args.tenant_id).eq("lead_status", args.statusFilter!)
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
    return await ctx.db.delete(args.id);
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

    for (let i = 0; i < args.leads.length; i++) {
      const leadData = args.leads[i];
      const rowNum = i + 2;

      try {
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

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const count = await ctx.db
          .query("leads")
          .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
          .collect();
        const leadId = `L-${dateStr}-${(count.length + 1).toString().padStart(5, "0")}`;

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
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

export const getDashboardStats = query({
  args: { 
    tenant_id: v.id("tenants"),
    executive_id: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    // Helper to get count for a specific status
    const getCount = async (status?: string) => {
      if (args.executive_id) {
        let q = ctx.db.query("leads")
          .withIndex("by_tenant_executive", q => q.eq("tenant_id", args.tenant_id).eq("sales_executive_id", args.executive_id!));
        
        if (status) {
           q = q.filter(q => q.eq(q.field("lead_status"), status));
        }
        return (await q.collect()).length;
      }

      if (status) {
        return (await ctx.db.query("leads")
          .withIndex("by_tenant_status", q => q.eq("tenant_id", args.tenant_id).eq("lead_status", status))
          .collect()).length;
      }

      return (await ctx.db.query("leads")
        .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
        .collect()).length;
    };

    return {
      totalLeads: await getCount(),
      newLeads: await getCount('New'),
      inProgress: await getCount('In Progress'),
      qualified: await getCount('Qualified'),
      siteVisitDone: await getCount('Site Visit Done'),
      converted: await getCount('Converted'),
      lost: await getCount('Lost'),
      
      // Sources
      adsLeads: 0,
      walkInLeads: 0,
      referenceLeads: 0,
      channelPartnerLeads: 0,
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
