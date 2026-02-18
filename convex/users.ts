import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { requireSuperAdmin, requireCommissioner } from "./helpers";

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
      .unique();
    return user;
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

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

export const upsertFromClerk = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    photo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        ...(args.photo !== undefined && { photo: args.photo }),
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
      });
      return userId;
    }
  },
});
