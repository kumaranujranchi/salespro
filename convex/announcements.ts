import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listPublished = query({
  args: { tenant_id: v.id("tenants"), limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .filter((q) => q.eq(q.field("is_published"), true))
      .order("desc")
      .take(args.limit);
  },
});

export const createAnnouncement = mutation({
  args: {
    tenant_id: v.id("tenants"),
    title: v.string(),
    content: v.string(),
    is_important: v.boolean(),
    is_published: v.boolean(),
    created_by: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("announcements", {
      ...args,
      created_at: new Date().toISOString(),
    });
  },
});
export const updateAnnouncement = mutation({
  args: {
    id: v.id("announcements"),
    title: v.string(),
    content: v.string(),
    is_important: v.boolean(),
    is_published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const listAll = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("announcements")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .order("desc")
      .collect();
  },
});
