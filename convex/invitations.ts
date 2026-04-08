/**
 * League invitation tracking: records sent invitations and marks them
 * accepted when a new user signs up via the Clerk webhook.
 */
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin } from "./helpers";

export const recordSent = mutation({
  args: {
    clerkInvitationId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);

    const normalizedEmail = args.email.trim().toLowerCase();

    const existing = await ctx.db
      .query("leagueInvitations")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkInvitationId", args.clerkInvitationId)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("leagueInvitations", {
      clerkInvitationId: args.clerkInvitationId,
      email: normalizedEmail,
      status: "pending",
      sentAt: Date.now(),
      invitedByUserId: admin._id,
    });
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const invitations = await ctx.db.query("leagueInvitations").collect();

    const withDetails = await Promise.all(
      invitations.map(async (inv) => {
        const invitedBy = inv.invitedByUserId
          ? await ctx.db.get(inv.invitedByUserId)
          : null;
        const acceptedUser = inv.acceptedUserId
          ? await ctx.db.get(inv.acceptedUserId)
          : null;

        return {
          ...inv,
          invitedByName: invitedBy?.name ?? null,
          acceptedUserName: acceptedUser?.name ?? null,
        };
      })
    );

    return withDetails.sort((a, b) => b.sentAt - a.sentAt);
  },
});

/** Called internally from the Clerk webhook when a new user signs up. */
export const markAcceptedByEmail = internalMutation({
  args: {
    email: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = args.email.trim().toLowerCase();

    const pending = await ctx.db
      .query("leagueInvitations")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .collect();

    for (const inv of pending) {
      if (inv.status === "pending") {
        await ctx.db.patch(inv._id, {
          status: "accepted",
          acceptedAt: Date.now(),
          acceptedUserId: args.userId,
        });
      }
    }
  },
});
