/**
 * User management: public queries, profile/handicap mutations (commissioner+),
 * role changes and hard deletes (super admin only), suspend/unsuspend (commissioner+),
 * and Clerk webhook sync.
 */
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireSuperAdmin,
  requireCommissioner,
  requireActiveUser,
} from "./helpers";

// ── Queries (public, no auth required) ─────────────────────────────

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    return user;
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const { email: _email, ...publicUser } = user;
    return publicUser;
  },
});

/** Commissioner-only: members with optional email (for reminder fan-out). */
export const listLeagueMembersWithEmail = query({
  args: {},
  handler: async (ctx) => {
    await requireCommissioner(ctx);
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => !u.isSuspended)
      .map((u) => ({
        userId: u._id,
        name: u.name,
        email: u.email ?? null,
      }));
  },
});

// ── Super admin only (commissioners cannot assign admin roles) ─────

/** Sets `isCommissioner` / `isSuperAdmin`. Commissioners have no API path to change these fields. */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    isCommissioner: v.optional(v.boolean()),
    isSuperAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const patch: Record<string, boolean> = {};
    if (args.isCommissioner !== undefined) patch.isCommissioner = args.isCommissioner;
    if (args.isSuperAdmin !== undefined) patch.isSuperAdmin = args.isSuperAdmin;

    await ctx.db.patch(args.userId, patch);
  },
});

export const deletePlayer = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    if (admin._id === args.userId) throw new Error("You cannot delete yourself");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // Delete scores
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const score of scores) {
      await ctx.db.delete(score._id);
    }

    // Delete standings
    const allStandings = await ctx.db.query("standings").collect();
    for (const standing of allStandings) {
      if (standing.userId === args.userId) {
        await ctx.db.delete(standing._id);
      }
    }

    // Delete achievements
    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const a of achievements) {
      await ctx.db.delete(a._id);
    }

    // Delete head-to-head records
    const allH2H = await ctx.db.query("headToHead").collect();
    for (const h of allH2H) {
      if (h.userId1 === args.userId || h.userId2 === args.userId) {
        await ctx.db.delete(h._id);
      }
    }

    // Delete live rounds and their hole scores
    const liveRounds = await ctx.db
      .query("liveRounds")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const round of liveRounds) {
      const holeScores = await ctx.db
        .query("holeScores")
        .withIndex("by_round", (q) => q.eq("liveRoundId", round._id))
        .collect();
      for (const hs of holeScores) {
        await ctx.db.delete(hs._id);
      }
      await ctx.db.delete(round._id);
    }

    // Delete notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", args.userId))
      .collect();
    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }

    // Delete push subscriptions
    const pushSubs = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const ps of pushSubs) {
      await ctx.db.delete(ps._id);
    }

    // Delete messages
    const allMessages = await ctx.db.query("messages").collect();
    for (const m of allMessages) {
      if (m.userId === args.userId) {
        await ctx.db.delete(m._id);
      }
    }

    // Delete photos and their storage files
    const allPhotos = await ctx.db.query("photos").collect();
    for (const p of allPhotos) {
      if (p.userId === args.userId) {
        await ctx.storage.delete(p.storageId);
        await ctx.db.delete(p._id);
      }
    }

    // Clear championId references on seasons
    const allSeasons = await ctx.db.query("seasons").collect();
    for (const s of allSeasons) {
      if (s.championId === args.userId) {
        await ctx.db.patch(s._id, { championId: undefined });
      }
    }

    // Finally delete the user record
    await ctx.db.delete(args.userId);
  },
});

// ── Commissioner or super admin ───────────────────────────────────

export const updatePlayer = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    handicap: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: Record<string, string | number> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.handicap !== undefined) updates.handicap = args.handicap;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.userId, updates);
    }
  },
});

// ── Player self-service mutations ──────────────────────────────────

export const markWelcomeSeen = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { hasSeenWelcome: true });
  },
});

export const updateMyHandicap = mutation({
  args: { handicap: v.number() },
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const h = Math.round(args.handicap);
    if (h < 0 || h > 54) {
      throw new Error("Handicap must be between 0 and 54");
    }
    await ctx.db.patch(user._id, { handicap: h });
  },
});

export const bulkUpdateHandicaps = mutation({
  args: {
    updates: v.array(
      v.object({
        userId: v.id("users"),
        handicap: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    for (const { userId, handicap } of args.updates) {
      await ctx.db.patch(userId, { handicap });
    }
  },
});

// ── Account lifecycle (commissioner / super admin) ─────────────────

export const suspendPlayer = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireCommissioner(ctx);
    if (admin._id === args.userId) throw new Error("You cannot suspend yourself");

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, { isSuspended: true });

    // Notify the suspended player
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "Account Suspended",
      body: "Your account has been suspended. Contact a league administrator for more information.",
      type: "system",
      isRead: false,
      senderId: admin._id,
      createdAt: Date.now(),
    });
  },
});

export const unsuspendPlayer = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireCommissioner(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, { isSuspended: false });

    // Notify the reinstated player
    await ctx.db.insert("notifications", {
      userId: args.userId,
      title: "Account Reinstated",
      body: "Your account has been reinstated. Welcome back to the league!",
      type: "system",
      isRead: false,
      senderId: admin._id,
      createdAt: Date.now(),
    });
  },
});

export const setPlayerVisibility = mutation({
  args: {
    userId: v.id("users"),
    hidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, { hiddenFromDirectory: args.hidden });
  },
});

// ── Internal: Clerk webhook sync (server-only, not browser-callable) ──

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    photo: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        ...(args.photo !== undefined && { photo: args.photo }),
        ...(args.email !== undefined && { email: args.email }),
      });
      return existingUser._id;
    } else {
      const userId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        photo: args.photo,
        joinedYear: new Date().getFullYear(),
        isCommissioner: false,
        isSuperAdmin: false,
        ...(args.email !== undefined && { email: args.email }),
      });
      return userId;
    }
  },
});
