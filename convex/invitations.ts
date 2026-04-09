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
import { ConvexError, v } from "convex/values";
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

/**
 * Super-admin only: row counts for revoke sync after Clerk says the invite is
 * already revoked (webhook may have deleted the Convex row first).
 */
export const invitationRowsForAdminRevoke = query({
  args: { clerkInvitationId: v.string() },
  handler: async (ctx, args) => {
    const viewer = await getCurrentUserOrNull(ctx);
    if (!viewer?.isSuperAdmin) {
      return { ok: false as const };
    }

    const invs = await ctx.db
      .query("leagueInvitations")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkInvitationId", args.clerkInvitationId)
      )
      .collect();

    return {
      ok: true as const,
      count: invs.length,
      hasAccepted: invs.some((i) => i.status === "accepted"),
    };
  },
});

/** Super-admin: one invitation row for remove-member API and admin UI. */
export const invitationDetailForSuperAdmin = query({
  args: { invitationId: v.id("leagueInvitations") },
  handler: async (ctx, args) => {
    const viewer = await getCurrentUserOrNull(ctx);
    if (!viewer?.isSuperAdmin) return null;

    const inv = await ctx.db.get(args.invitationId);
    if (!inv) return null;

    const member =
      inv.acceptedUserId !== undefined
        ? await ctx.db.get(inv.acceptedUserId)
        : null;

    return {
      invitationId: inv._id,
      email: inv.email,
      status: inv.status,
      clerkInvitationId: inv.clerkInvitationId,
      acceptedUserId: inv.acceptedUserId ?? null,
      memberExists: member !== null,
      memberClerkId: member?.clerkId ?? null,
      memberName: member?.name ?? null,
      memberIsSuperAdmin: member?.isSuperAdmin ?? false,
    };
  },
});

/**
 * Super-admin: remove only the Convex invitation row — pending invites, stale rows,
 * or accepted rows whose user record is already gone. Does not delete an active member;
 * use the remove-accepted API for that.
 */
export const superAdminForceDeleteInvitationRow = mutation({
  args: { invitationId: v.id("leagueInvitations") },
  handler: async (ctx, args) => {
    try {
      await requireSuperAdmin(ctx);
    } catch (e) {
      console.error("superAdminForceDeleteInvitationRow auth error:", e);
      if (e instanceof ConvexError) throw e;
      throw new ConvexError("Authentication failed — please refresh and try again");
    }

    const inv = await ctx.db.get(args.invitationId);
    if (!inv) return { deleted: false, reason: "already_gone" };

    if (inv.status === "accepted" && inv.acceptedUserId) {
      const user = await ctx.db.get(inv.acceptedUserId);
      if (user) {
        throw new ConvexError(
          "This member still has an account. Use Remove from league to delete their account and email them."
        );
      }
    }

    await ctx.db.delete(args.invitationId);
    return { deleted: true, reason: "removed" };
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
    try {
      await requireSuperAdmin(ctx);
    } catch (e) {
      if (e instanceof ConvexError) throw e;
      throw new ConvexError("Authentication failed — please refresh and try again");
    }

    const result = await removeInvitationRowAfterRevoke(
      ctx,
      args.clerkInvitationId
    );
    if (result === "missing") return;
    if (result === "accepted") {
      throw new ConvexError(
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
