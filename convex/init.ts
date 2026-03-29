import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createAdmin = mutation({
  args: {
    email: v.string()
  },
  handler: async (ctx, args) => {
    // 1. Create or get default tenant
    let tenantId;
    const existingTenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", q => q.eq("slug", "default-tenant"))
      .first();

    if (existingTenant) {
      tenantId = existingTenant._id;
    } else {
      tenantId = await ctx.db.insert("tenants", {
        name: "SalesPro Core",
        slug: "default-tenant",
        settings: {},
        subscription_status: "active",
        plan_tier: "enterprise",
        is_active: true,
      });
    }

    // 2. Create or get admin role
    let roleId;
    const existingRole = await ctx.db
      .query("tenant_roles")
      .withIndex("by_tenant", q => q.eq("tenant_id", tenantId))
      .filter(q => q.eq(q.field("name"), "admin"))
      .first();

    if (existingRole) {
      roleId = existingRole._id;
    } else {
      roleId = await ctx.db.insert("tenant_roles", {
        name: "admin",
        permissions: ["all"],
        is_system: true,
        tenant_id: tenantId,
      });
    }

    // 3. Create or get profile
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_email", q => q.eq("email", args.email))
      .first();

    if (existingProfile) {
      return { status: "exists", profileId: existingProfile._id };
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: args.email, // Since AuthContext maps session id to email
      email: args.email,
      full_name: "Super Admin",
      employee_id: "ADM-001",
      phone: "+91-0000000000",
      role: "admin",
      tenant_id: tenantId,
      is_active: true,
      force_password_change: false,
      role_id: roleId,
    });

    return { status: "created", profileId, tenantId };
  }
});
