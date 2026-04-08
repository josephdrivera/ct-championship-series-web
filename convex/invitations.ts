/**
 * League invitation tracking: records sent invitations and marks them
 * accepted when a new user signs up via the Clerk webhook.
 */
import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrNull, requireSuperAdmin } from "./helpers";

/** Shared by super-admin cancel API and Clerk `invitation.revoked` webhook. */
async function removeInvitationRowAfterRevoke(
  ctx: MutationCtx,
  clerkInvitationId: string
): Promise<"deleted" | "missing" | "accepted"> {
  // Use collect(), not unique(): duplicate rows for the same Clerk id would make
  // unique() throw and surface as 500 from /api/invite/revoke.
  const invs = await ctx.db
    .query("leagueInvitations")
    .withIndex("by_clerk_id", (q) =>
      q.eq("clerkInvitationId", clerkInvitationId)
    )
    .collect();

  if (invs.length === 0) return "missing";
  if (invs.some((i) => i.status === "accepted")) return "accepted";
  for (const inv of invs) {
    await ctx.db.delete(inv._id);
  }
  return "deleted";
}

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
      .collect();

    if (existing.length > 0) return existing[0]._id;

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
    const viewer = await getCurrentUserOrNull(ctx);
    if (!viewer?.isSuperAdmin) {
      return [];
    }

    const rows = await ctx.db.query("leagueInvitations").collect();
    const invitations = rows.filter((inv) => inv.status !== "revoked");

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

/**
 * Removes the invitation row after Clerk revoke (invalidates the link).
 * Pending mistakes (wrong email, etc.) are fully cleared from league records.
 */
export const deleteInvitation = mutation({
  args: { clerkInvitationId: v.string() },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const result = await removeInvitationRowAfterRevoke(
      ctx,
      args.clerkInvitationId
    );
    if (result === "missing") return;
    if (result === "accepted") {
      throw new Error(
        "This invitation was already accepted; it cannot be removed from the list."
      );
    }
  },
});

/**
 * Clerk Dashboard / API revoke → `invitation.revoked` webhook. Keeps Convex in sync
 * when staff remove an invite outside the app.
 */
export const deleteByClerkInvitationId = internalMutation({
  args: { clerkInvitationId: v.string() },
  handler: async (ctx, args) => {
    await removeInvitationRowAfterRevoke(ctx, args.clerkInvitationId);
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
