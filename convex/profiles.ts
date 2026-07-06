import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getProfileWithDetails = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.profileId);
    if (!profile) return null;

    const tenant = profile.tenant_id ? await ctx.db.get(profile.tenant_id) : null;
    const roleDetails = profile.role_id ? await ctx.db.get(profile.role_id) : null;
    const departmentDetails = profile.department_id ? await ctx.db.get(profile.department_id) : null;

    return {
      ...profile,
      tenant,
      role_details: roleDetails,
      department_details: departmentDetails,
    };
  },
});

export const createUserProfile = mutation({
  args: {
    userId: v.string(),
    employee_id: v.string(),
    full_name: v.string(),
    email: v.string(),
    phone: v.union(v.string(), v.null()),
    role: v.string(),
    role_id: v.union(v.id("tenant_roles"), v.null()),
    department_id: v.union(v.id("departments"), v.null()),
    reporting_manager_id: v.union(v.id("profiles"), v.null()),
    image_url: v.union(v.string(), v.null()),
    dob: v.union(v.string(), v.null()),
    marriage_anniversary: v.union(v.string(), v.null()),
    joining_date: v.union(v.string(), v.null()),
    tenant_id: v.id("tenants"),
    is_active: v.boolean(),
    force_password_change: v.boolean(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) throw new Error("Profile with this email already exists");

    const existingEmp = await ctx.db
      .query("profiles")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .filter((q) => q.eq(q.field("employee_id"), args.employee_id))
      .unique();
    if (existingEmp) throw new Error(`Employee ID ${args.employee_id} already exists`);

    const { 
      phone, 
      role_id, 
      department_id, 
      reporting_manager_id, 
      image_url, 
      dob, 
      marriage_anniversary, 
      joining_date, 
      ...rest 
    } = args;

    const data = {
      ...rest,
      phone: phone ?? null,
      role_id: role_id ?? undefined,
      department_id: department_id ?? undefined,
      reporting_manager_id: reporting_manager_id ?? undefined,
      image_url: image_url ?? undefined,
      dob: dob ?? undefined,
      marriage_anniversary: marriage_anniversary ?? undefined,
      joining_date: joining_date ?? undefined,
      password: args.password,
    };

    return await ctx.db.insert("profiles", data);
  },
});

export const updateProfile = mutation({
  args: {
    id: v.id("profiles"),
    full_name: v.string(),
    phone: v.union(v.string(), v.null()),
    role: v.string(),
    role_id: v.union(v.id("tenant_roles"), v.null()),
    department_id: v.union(v.id("departments"), v.null()),
    reporting_manager_id: v.union(v.id("profiles"), v.null()),
    image_url: v.union(v.string(), v.null()),
    dob: v.union(v.string(), v.null()),
    marriage_anniversary: v.union(v.string(), v.null()),
    joining_date: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const { 
      id, 
      phone, 
      role_id, 
      department_id, 
      reporting_manager_id, 
      image_url, 
      dob, 
      marriage_anniversary, 
      joining_date, 
      ...rest 
    } = args;

    const data = {
      ...rest,
      phone: phone ?? null,
      role_id: role_id ?? undefined,
      department_id: department_id ?? undefined,
      reporting_manager_id: reporting_manager_id ?? undefined,
      image_url: image_url ?? undefined,
      dob: dob ?? undefined,
      marriage_anniversary: marriage_anniversary ?? undefined,
      joining_date: joining_date ?? undefined,
    };

    await ctx.db.patch(id, data);
  },
});

export const toggleProfileStatus = mutation({
  args: { id: v.id("profiles"), is_active: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { is_active: args.is_active });
  },
});

export const deleteProfile = mutation({
  args: { id: v.id("profiles") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const promoteToPlatformAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!profile) throw new Error("Profile not found");
    
    await ctx.db.patch(profile._id, { 
      role: "platform_admin",
      // Optionally clear tenant_id if platform admins shouldn't have one, 
      // but keeping it is fine as long as redirect works.
    });
    return { status: "success", profileId: profile._id };
  },
});

export const listUsersByTenant = query({
  args: { 
    tenant_id: v.id("tenants"),
    is_active: v.optional(v.boolean()) 
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("profiles")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id));
    
    if (args.is_active !== undefined) {
      q = q.filter((f) => f.eq(f.field("is_active"), args.is_active));
    }

    return await q.collect();
  },
});

export const listActiveStaff = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .filter((q) => 
        q.and(
          q.eq(q.field("is_active"), true),
          q.or(
            q.eq(q.field("role"), "sales_executive"),
            q.eq(q.field("role"), "team_leader")
          )
        )
      )
      .collect();
  },
});

export const listDrivers = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .filter((q) => 
        q.and(
          q.eq(q.field("is_active"), true),
          q.eq(q.field("role"), "driver")
        )
      )
      .collect();
  },
});

export const listExecutives = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .filter((q) => 
        q.and(
          q.eq(q.field("is_active"), true),
          q.or(
            q.eq(q.field("role"), "sales_executive"),
            q.eq(q.field("role"), "team_leader")
          )
        )
      )
      .collect();
  },
});
