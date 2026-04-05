/**
 * Web Push subscription management (requireUser for all endpoints).
 * Pairs with pushNotifications.ts (server-side send) and
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY on the client.
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./helpers";

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Check if subscription already exists for this endpoint
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (existing) {
      // Update if it's from the same user
      if (existing.userId === user._id) {
        await ctx.db.patch(existing._id, {
          p256dh: args.p256dh,
          auth: args.auth,
        });
        return existing._id;
      }
      // Otherwise delete old one and create new
      await ctx.db.delete(existing._id);
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      p256dh: args.p256dh,
      auth: args.auth,
      createdAt: Date.now(),
    });
  },
});

export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .unique();

    if (subscription && subscription.userId === user._id) {
      await ctx.db.delete(subscription._id);
    }
  },
});

export const hasSubscription = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return !!subscription;
  },
});
