import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listIncentives = query({
  args: { 
    tenant_id: v.id("tenants"),
    executive_id: v.optional(v.id("profiles")),
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("incentives")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id));
    
    const results = await q.collect();

    let filtered = results;
    if (args.executive_id) {
        filtered = filtered.filter(i => i.sales_executive_id === args.executive_id);
    }
    if (args.year) {
        filtered = filtered.filter(i => i.calculation_year === args.year);
    }

    return await Promise.all(filtered.map(async (inc) => {
      const profile = await ctx.db.get(inc.sales_executive_id);
      return {
        ...inc,
        profiles: profile ? { full_name: profile.full_name } : null,
      };
    }));
  },
});

export const createIncentive = mutation({
  args: {
    tenant_id: v.id("tenants"),
    sales_executive_id: v.id("profiles"),
    calculation_month: v.string(), // Changed to string to match Supabase logic (e.g. "March")
    calculation_year: v.number(),
    total_incentive_amount: v.number(),
    status: v.string(),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incentives", {
      ...args,
      created_at: new Date().toISOString(),
    } as any);
  },
});

export const updateIncentive = mutation({
  args: {
    id: v.id("incentives"),
    sales_executive_id: v.id("profiles"),
    calculation_month: v.string(),
    calculation_year: v.number(),
    total_incentive_amount: v.number(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    return await ctx.db.patch(id, data);
  },
});

export const deleteIncentive = mutation({
  args: { id: v.id("incentives") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});

export const getIncentiveCalculationData = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
      .collect();
    
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
      .collect();
    
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_tenant", q => q.eq("tenant_id", args.tenant_id))
      .collect();

    return { sales, payments, profiles };
  }
});
