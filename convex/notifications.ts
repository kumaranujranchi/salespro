import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: { 
    user_id: v.id("profiles"),
    limit: v.number() 
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("user_id", args.user_id))
      .order("desc")
      .take(args.limit);
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { is_read: true });
  },
});

export const markAllRead = mutation({
  args: { user_id: v.id("profiles") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) => q.eq("user_id", args.user_id).eq("is_read", false))
      .collect();
    
    for (const n of unread) {
      await ctx.db.patch(n._id, { is_read: true });
    }
  },
});
