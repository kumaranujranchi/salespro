import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx: QueryCtx, args: { tenant_id: Id<"tenants"> }) => {
    return await ctx.db
      .query("tenant_roles")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .collect();
  },
});

export const create = mutation({
  args: {
    tenant_id: v.id("tenants"),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tenant_roles", {
      ...args,
      is_system: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tenant_roles"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    permissions: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("tenant_roles") },
  handler: async (ctx, args) => {
    const role = await ctx.db.get(args.id);
    if (role?.is_system) throw new Error("Cannot delete system roles");
    await ctx.db.delete(args.id);
  },
});
