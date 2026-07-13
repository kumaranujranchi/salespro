import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listPayments = query({
  args: { 
    tenant_id: v.id("tenants"),
    sale_id: v.optional(v.id("sales"))
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("payments")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id));
    
    if (args.sale_id) {
       q = q.filter((q) => q.eq(q.field("sale_id"), args.sale_id));
    }

    return await q.collect();
  },
});

export const addPayment = mutation({
  args: {
    tenant_id: v.id("tenants"),
    sale_id: v.id("sales"),
    payment_date: v.string(),
    amount: v.number(),
    payment_type: v.string(),
    payment_mode: v.string(),
    transaction_reference: v.optional(v.string()),
    remarks: v.optional(v.string()),
    recorded_by: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("payments", args);
  },
});

export const deletePayment = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
