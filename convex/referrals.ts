import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// --- REFERRAL CAMPAIGNS ---

export const listCampaigns = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("referral_campaigns")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .order("desc")
      .collect();
  },
});

export const createCampaign = mutation({
  args: {
    tenant_id: v.id("tenants"),
    code: v.string(),
    name: v.string(),
    referrer_email: v.optional(v.string()),
    referrer_commission_percent: v.number(),
    referee_discount_percent: v.number(),
    is_active: v.boolean(),
    created_by: v.optional(v.id("profiles")),
  },
  handler: async (ctx, args) => {
    // Check if code already exists for this tenant
    const existing = await ctx.db
      .query("referral_campaigns")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    
    if (existing && existing.tenant_id === args.tenant_id) {
      throw new Error("Referral code already exists");
    }

    return await ctx.db.insert("referral_campaigns", args);
  },
});

export const updateCampaign = mutation({
  args: {
    id: v.id("referral_campaigns"),
    code: v.string(),
    name: v.string(),
    referrer_email: v.optional(v.string()),
    referrer_commission_percent: v.number(),
    referee_discount_percent: v.number(),
    is_active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const toggleCampaignStatus = mutation({
  args: { id: v.id("referral_campaigns"), is_active: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { is_active: args.is_active });
  },
});

export const deleteCampaign = mutation({
  args: { id: v.id("referral_campaigns") },
  handler: async (ctx, args) => {
    // 1. Find all referrals for this campaign
    const referrals = await ctx.db
      .query("user_referrals")
      .withIndex("by_campaign", (q) => q.eq("campaign_id", args.id))
      .collect();

    for (const ref of referrals) {
      // 2. Find and delete commissions for each referral
      const commissions = await ctx.db
        .query("commissions")
        .withIndex("by_referral", (q) => q.eq("referral_id", ref._id))
        .collect();
      
      for (const comm of commissions) {
        await ctx.db.delete(comm._id);
      }

      // 3. Delete the referral
      await ctx.db.delete(ref._id);
    }

    // 4. Delete the campaign
    await ctx.db.delete(args.id);
  },
});

// --- ANALYTICS & STATS ---

export const getReferralAnalytics = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("user_referrals")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .collect();

    const commissions = await ctx.db
      .query("commissions")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .collect();

    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.amount, 0);

    // Join ledger with profiles and campaigns
    const ledger = await Promise.all(
      commissions.slice(0, 50).map(async (c) => {
        const referral = await ctx.db.get(c.referral_id);
        let referrerName = "Unknown";
        let campaignCode = "-";

        if (referral) {
          const campaign = await ctx.db.get(referral.campaign_id);
          campaignCode = campaign?.code || "-";

          if (referral.referrer_id) {
            const profile = await ctx.db.get(referral.referrer_id);
            referrerName = profile?.full_name || "Unknown";
          }
        }

        return {
          ...c,
          referrer_name: referrerName,
          campaign_code: campaignCode,
        };
      })
    );

    return {
      totalReferrals: referrals.length,
      totalCommissions,
      pendingCommissions,
      ledger,
    };
  },
});

export const getCampaignStats = query({
  args: { campaign_id: v.id("referral_campaigns") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("user_referrals")
      .withIndex("by_campaign", (q) => q.eq("campaign_id", args.campaign_id))
      .collect();

    const referralIds = new Set(referrals.map((r) => r._id));
    
    // This is a bit expensive in Convex without a dedicated index on referral_id for commissions
    // but we have by_referral index so it's okay.
    let allCommissions: any[] = [];
    for (const refId of referralIds) {
      const comms = await ctx.db
        .query("commissions")
        .withIndex("by_referral", (q) => q.eq("referral_id", refId))
        .collect();
      allCommissions = allCommissions.concat(comms);
    }

    const totalEarnings = allCommissions.reduce((sum, c) => sum + c.amount, 0);

    return {
      totalSignups: referrals.length,
      totalEarnings,
      ledger: allCommissions.sort((a, b) => (b._creationTime || 0) - (a._creationTime || 0)),
    };
  },
});

export const getCampaignByCreator = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("referral_campaigns")
      .withIndex("by_creator", (q) => q.eq("created_by_userId", args.userId))
      .first();
  },
});

export const affiliateRegister = mutation({
  args: {
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    referralCode: v.string(),
    channel: v.string(),
    userId: v.string(),
  },
  handler: async (ctx: any, args: any) => {
    // 1. Create Profile
    const profileId = await ctx.db.insert("profiles", {
      userId: args.userId,
      employee_id: `AFF-${args.userId.substring(0, 8).toUpperCase()}`,
      full_name: args.fullName,
      email: args.email,
      phone: args.phone,
      role: "affiliate",
      is_active: true,
      force_password_change: false,
    });

    // 2. Create Campaign
    const campaignId = await ctx.db.insert("referral_campaigns", {
      code: args.referralCode.toUpperCase(),
      name: `${args.fullName}'s Campaign`,
      referrer_email: args.email,
      referrer_commission_percent: 20.0,
      referee_discount_percent: 10.0,
      is_active: true,
      created_by: profileId,
      created_by_userId: args.userId,
    });

    return { profileId, campaignId };
  },
});

export const validateCode = query({
  args: { code: v.string() },
  handler: async (ctx: any, args: any) => {
    const campaign = await ctx.db
      .query("referral_campaigns")
      .withIndex("by_code", (q: any) => q.eq("code", args.code.toUpperCase()))
      .first();
    
    if (!campaign || !campaign.is_active) {
      return { is_valid: false };
    }

    return {
      is_valid: true,
      campaign_id: campaign._id,
      discount_percent: campaign.referee_discount_percent,
      referrer_email: campaign.referrer_email,
      name: campaign.name
    };
  },
});
