import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByLead = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const followups = await ctx.db
      .query("lead_followups")
      .withIndex("by_lead", (q) => q.eq("lead_id", args.leadId))
      .order("desc")
      .collect();

    return await Promise.all(
      followups.map(async (f) => {
        const creator = f.created_by ? await ctx.db.get(f.created_by) : null;
        return {
          ...f,
          creator: creator ? {
            id: creator._id,
            full_name: creator.full_name,
            role: creator.role,
          } : null,
        };
      })
    );
  },
});

export const addFollowup = mutation({
  args: {
    tenant_id: v.id("tenants"),
    lead_id: v.id("leads"),
    followup_type: v.string(),
    discussion_summary: v.string(),
    customer_response: v.optional(v.string()),
    call_status: v.optional(v.string()),
    previous_status: v.optional(v.string()),
    new_status: v.string(),
    next_followup_date: v.optional(v.string()),
    created_by: v.optional(v.id("profiles")),
    followup_date: v.optional(v.string()),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const followupDateVal = args.followup_date || now.toISOString();

    // Check daily limit (max 3 per day)
    const todayFollowups = (
      await ctx.db
        .query("lead_followups")
        .withIndex("by_lead", (q) => q.eq("lead_id", args.lead_id))
        .collect()
    ).filter((f) => f.followup_date.slice(0, 10) === todayStr);

    if (todayFollowups.length >= 3) {
      throw new Error("Maximum 3 follow-ups per day allowed for this lead");
    }

    const { followup_date, ...insertArgs } = args;

    const id = await ctx.db.insert("lead_followups", {
      ...insertArgs,
      followup_date: followupDateVal,
      is_editable: true,
    });

    // Update lead status and denormalized fields
    const lead = await ctx.db.get(args.lead_id);
    const currentCount = lead?.followup_count || 0;

    await ctx.db.patch(args.lead_id, {
      lead_status: args.new_status,
      latest_followup_date: followupDateVal,
      latest_followup_status: args.new_status,
      next_followup_date: args.next_followup_date,
      followup_count: currentCount + 1,
      updated_at: now.toISOString(),
      updated_by: args.created_by,
    });

    return id;
  },
});

export const updateFollowup = mutation({
  args: {
    id: v.id("lead_followups"),
    discussion_summary: v.string(),
    customer_response: v.optional(v.string()),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Follow-up not found");

    // Check 24-hour immutability
    const createdAt = new Date(existing._creationTime);
    const now = new Date();
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) {
      await ctx.db.patch(args.id, { is_editable: false });
      throw new Error("Cannot modify follow-up entries older than 24 hours");
    }

    return await ctx.db.patch(args.id, {
      discussion_summary: args.discussion_summary,
      customer_response: args.customer_response,
      metadata: args.metadata,
    });
  },
});
