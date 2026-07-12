import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

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

export const listRunningProjects = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    const allProjects = await ctx.db
      .query("projects")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .order("desc")
      .collect();
    return allProjects.filter((p) => p.is_active);
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
    metadata: v.optional(v.any()),
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

// Project Units Queries and Mutations
export const listUnits = query({
  args: { project_id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("project_units")
      .withIndex("by_project", (q) => q.eq("project_id", args.project_id))
      .order("desc")
      .collect();
  },
});

export const createOrUpdateUnit = mutation({
  args: {
    id: v.optional(v.id("project_units")),
    tenant_id: v.id("tenants"),
    project_id: v.id("projects"),
    unit_number: v.string(),
    status: v.string(),
    custom_values: v.any(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, {
        ...data,
        updated_at: new Date().toISOString(),
      });
      return id;
    } else {
      return await ctx.db.insert("project_units", {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  },
});

export const deleteUnit = mutation({
  args: { id: v.id("project_units") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
