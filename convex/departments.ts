import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx: QueryCtx, args: { tenant_id: Id<"tenants"> }) => {
    return await ctx.db
      .query("departments")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .collect();
  },
});

export const create = mutation({
  args: {
    tenant_id: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("departments", {
      ...args,
      is_active: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("departments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
