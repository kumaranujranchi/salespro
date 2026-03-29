import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByRazorpayId = query({
  args: { razorpay_subscription_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_razorpay_id", (q) => q.eq("razorpay_subscription_id", args.razorpay_subscription_id))
      .unique();
  },
});

export const getByTenant = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .order("desc")
      .first();
  },
});

export const upsert = mutation({
  args: {
    tenant_id: v.id("tenants"),
    razorpay_subscription_id: v.string(),
    plan_id: v.string(),
    status: v.string(),
    current_start: v.optional(v.string()),
    current_end: v.optional(v.string()),
    ended_at: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_razorpay_id", (q) => q.eq("razorpay_subscription_id", args.razorpay_subscription_id))
      .unique();

    if (existing) {
      const { ...data } = args;
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("subscriptions", args);
    }
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("subscriptions"),
    status: v.string(),
    ended_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const createBillingHistory = mutation({
  args: {
    tenant_id: v.id("tenants"),
    amount: v.number(),
    status: v.string(),
    razorpay_payment_id: v.string(),
    description: v.string(),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("billing_history", args);
  },
});
