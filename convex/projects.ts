import { v } from "convex/values";
import { query } from "./_generated/server";

export const listAllProjects = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .order("desc")
      .collect();
  },
});

export const createProject = mutation({
  args: {
    tenant_id: v.id("tenants"),
    name: v.string(),
    address: v.optional(v.string()),
    google_maps_url: v.optional(v.string()),
    project_type: v.string(),
    image_url: v.optional(v.string()),
    status: v.string(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      ...args,
      site_photos: [],
      metadata: {},
    });
  },
});

export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
    address: v.optional(v.string()),
    google_maps_url: v.optional(v.string()),
    project_type: v.string(),
    image_url: v.optional(v.string()),
    status: v.string(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteProject = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    // Note: Check for references in leads before deleting?
    // For now, simple delete.
    await ctx.db.delete(args.id);
  },
});
