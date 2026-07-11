import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function resolveTenantLogo(ctx: any, tenant: any) {
  if (!tenant) return tenant;
  if (tenant.settings?.appearance?.logo_url) {
    const logoUrlStr = tenant.settings.appearance.logo_url;
    if (logoUrlStr && !logoUrlStr.startsWith('http://') && !logoUrlStr.startsWith('https://') && !logoUrlStr.startsWith('data:')) {
      try {
        const logoUrl = await ctx.storage.getUrl(logoUrlStr);
        if (logoUrl) {
          tenant.settings = {
            ...tenant.settings,
            appearance: {
              ...tenant.settings.appearance,
              resolved_logo_url: logoUrl
            }
          };
        }
      } catch (e) {
        // Ignore
      }
    } else {
      tenant.settings = {
        ...tenant.settings,
        appearance: {
          ...tenant.settings.appearance,
          resolved_logo_url: logoUrlStr
        }
      };
    }
  }
  return tenant;
}

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    return await resolveTenantLogo(ctx, tenant);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    settings: v.any(),
    plan_tier: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("Tenant with this slug already exists");

    return await ctx.db.insert("tenants", {
      ...args,
      subscription_status: "trialing",
      is_active: true,
    });
  },
});
export const getById = query({
  args: { id: v.id("tenants") },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.id);
    return await resolveTenantLogo(ctx, tenant);
  },
});

export const update = mutation({
  args: {
    id: v.id("tenants"),
    name: v.optional(v.string()),
    settings: v.optional(v.any()),
    plan_tier: v.optional(v.string()),
    subscription_status: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    billing_cycle: v.optional(v.string()),
    subscription_id: v.optional(v.string()),
    razorpay_customer_id: v.optional(v.string()),
    next_billing_date: v.optional(v.string()),
    trial_ends_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const tenants = await ctx.db
      .query("tenants")
      .order("desc")
      .collect();

    return await Promise.all(
      tenants.map(async (tenant) => {
        const adminProfile = await ctx.db
          .query("profiles")
          .withIndex("by_tenant", (q) => q.eq("tenant_id", tenant._id))
          .filter((q) =>
            q.or(
              q.eq(q.field("role"), "admin"),
              q.eq(q.field("role"), "platform_admin")
            )
          )
          .first();

        const resolvedTenant = await resolveTenantLogo(ctx, tenant);

        return {
          ...resolvedTenant,
          contact_email: adminProfile?.email || null,
          contact_phone: adminProfile?.phone || null,
        };
      })
    );
  },
});

export const listBillingHistory = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("billing_history")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .order("desc")
      .collect();
  },
});
export const register = mutation({
  args: {
    company_name: v.string(),
    company_slug: v.string(),
    user_full_name: v.string(),
    contact_email: v.string(),
    contact_phone: v.optional(v.string()),
    referral_code: v.optional(v.string()),
    userId: v.string(), // The Auth ID from Clerk/simulation
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Check if slug exists
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.company_slug))
      .unique();
    if (existing) throw new Error("A company with this URL slug already exists");

    // 2. Create Tenant
    const tenantId = await ctx.db.insert("tenants", {
      name: args.company_name,
      slug: args.company_slug,
      settings: {
        general: { target_model: 'area' },
        branding: { primary_color: '#3B82F6' }
      },
      subscription_status: "trialing",
      plan_tier: "free",
      is_active: true,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // 3. Create Super Admin Profile
    await ctx.db.insert("profiles", {
      userId: args.userId,
      email: args.contact_email,
      full_name: args.user_full_name,
      phone: args.contact_phone || null,
      employee_id: "ADMIN-001",
      role: "super_admin",
      tenant_id: tenantId,
      is_active: true,
      force_password_change: false,
      password: args.password,
    });

    // 4. Handle referral if present
    if (args.referral_code) {
      const campaign = await ctx.db
        .query("referral_campaigns")
        .withIndex("by_code", (q) => q.eq("code", args.referral_code))
        .unique();
      
      if (campaign) {
        await ctx.db.insert("user_referrals", {
          tenant_id: campaign.tenant_id,
          campaign_id: campaign._id,
          referred_tenant_id: tenantId,
          status: "pending",
          metadata: { registered_at: new Date().toISOString() }
        });
      }
    }

    return tenantId;
  },
});

export const remove = mutation({
  args: { id: v.id("tenants") },
  handler: async (ctx, args) => {
    // 1. Delete associated profiles
    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.id))
      .collect();
    for (const profile of profiles) {
      await ctx.db.delete(profile._id);
    }

    // 2. Delete associated departments
    const departments = await ctx.db
      .query("departments")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.id))
      .collect();
    for (const dept of departments) {
      await ctx.db.delete(dept._id);
    }

    // 3. Delete the tenant itself
    await ctx.db.delete(args.id);
  },
});

export const resetUserPassword = mutation({
  args: { userId: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    // In a real app with Clerk/Auth0, you'd call their API.
    // In our simulation, we just log it or update a mock field if it existed.
    console.log(`Resetting password for user ${args.userId} to ${args.newPassword}`);
  },
});

export const getByMetaPageId = query({
  args: { pageId: v.string() },
  handler: async (ctx, args) => {
    const tenants = await ctx.db.query("tenants").collect();
    return tenants.find(
      (tenant) => tenant.settings?.integrations?.meta?.pageId === args.pageId
    );
  },
});

