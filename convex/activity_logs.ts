import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listRecent = query({
  args: { tenant_id: v.id("tenants"), limit: v.number() },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("activity_logs")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .order("desc")
      .take(args.limit);
    
    return await Promise.all(logs.map(async (log) => {
      const user = await ctx.db.get(log.user_id);
      return {
        ...log,
        user: user ? { full_name: user.full_name, image_url: user.image_url } : null,
      };
    }));
  },
});

export const createLog = mutation({
  args: {
    tenant_id: v.id("tenants"),
    user_id: v.id("profiles"),
    action: v.string(),
    entity_type: v.string(),
    entity_id: v.optional(v.string()),
    details: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activity_logs", {
      ...args,
      created_at: new Date().toISOString(),
    });
  },
});
