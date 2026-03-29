import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listTargets = query({
  args: { 
    tenant_id: v.id("tenants"),
    user_id: v.optional(v.id("profiles")),
    year: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("sales_targets")
      .withIndex("by_tenant_user_date", (q) => q.eq("tenant_id", args.tenant_id));
    
    if (args.user_id) {
       q = ctx.db.query("sales_targets").withIndex("by_user", q => q.eq("user_id", args.user_id!));
    }

    const targets = await q.collect();
    
    // Filter by year if provided
    if (args.year) {
      return targets.filter(t => t.start_date.startsWith(args.year!));
    }

    return targets;
  },
});

export const createTarget = mutation({
  args: {
    tenant_id: v.id("tenants"),
    user_id: v.id("profiles"),
    period_type: v.string(),
    target_sqft: v.number(),
    target_amount: v.number(),
    target_units: v.number(),
    start_date: v.string(),
    end_date: v.string(),
    created_by: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sales_targets", args);
  },
});

export const updateTarget = mutation({
  args: {
    id: v.id("sales_targets"),
    target_sqft: v.number(),
    target_amount: v.number(),
    target_units: v.number(),
    start_date: v.string(),
    end_date: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteTarget = mutation({
  args: { id: v.id("sales_targets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getMonthlyTarget = query({
  args: { 
    user_id: v.id("profiles"),
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, args) => {
    const monthStr = `${args.year}-${String(args.month).padStart(2, '0')}-01`;
    return await ctx.db
      .query("sales_targets")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("start_date"), monthStr))
      .unique();
  },
});
