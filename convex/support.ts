import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const listAll = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const tickets = await ctx.db
      .query("support_tickets")
      .order("desc")
      .collect();

    const ticketsWithData = await Promise.all(
      tickets.map(async (ticket: Doc<"support_tickets">) => {
        const tenant = await ctx.db.get(ticket.tenant_id);
        const profile = await ctx.db.get(ticket.created_by);
        return {
          ...ticket,
          tenants: tenant ? { name: tenant.name } : null,
          profiles: profile ? { full_name: profile.full_name, email: profile.email } : null,
        };
      })
    );

    return ticketsWithData;
  },
});

export const listByTenant = query({
  args: { tenant_id: v.id("tenants") },
  handler: async (ctx: QueryCtx, args: { tenant_id: Id<"tenants"> }) => {
    return await ctx.db
      .query("support_tickets")
      .withIndex("by_tenant", (q) => q.eq("tenant_id", args.tenant_id))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    tenant_id: v.id("tenants"),
    subject: v.string(),
    description: v.string(),
    priority: v.string(),
    created_by: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    // Generate simple ticket number
    const lastTicket = await ctx.db
      .query("support_tickets")
      .order("desc")
      .first();
    const ticketNumber = (lastTicket?.ticket_number || 1000) + 1;

    return await ctx.db.insert("support_tickets", {
      ...args,
      ticket_number: ticketNumber,
      status: "open",
    });
  },
});

export const resolve = mutation({
  args: {
    id: v.id("support_tickets"),
    resolution_notes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "resolved",
      resolution_notes: args.resolution_notes,
    });
  },
});
