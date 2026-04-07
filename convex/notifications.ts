/**
 * Notifications: user inbox queries/mutations (requireUser),
 * commissioner broadcast with push (requireCommissioner),
 * and internal fan-out mutation used by other modules.
 */
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireUser, requireCommissioner } from "./helpers";

// ── User inbox (requireUser) ───────────────────────────────────────

export const getUserNotifications = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const limit = args.limit ?? 30;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    return { count: unread.length };
  },
});

export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found");
    }

    await ctx.db.delete(args.notificationId);
  },
});

// ── Commissioner broadcast (requireCommissioner) ───────────────────

export const sendAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const sender = await requireCommissioner(ctx);

    const allUsers = await ctx.db.query("users").collect();
    const now = Date.now();

    for (const user of allUsers) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        title: args.title,
        body: args.body,
        type: "announcement",
        isRead: false,
        senderId: sender._id,
        createdAt: now,
      });
    }

    // Schedule push notification
    await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPushToAll, {
      title: args.title,
      body: args.body,
    });
  },
});

export const getSentAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireCommissioner(ctx);

    const announcements = await ctx.db
      .query("notifications")
      .order("desc")
      .collect();

    // Deduplicate by createdAt + senderId (one per broadcast)
    const seen = new Set<string>();
    const unique = [];
    for (const n of announcements) {
      if (n.type !== "announcement" || !n.senderId) continue;
      const key = `${n.senderId}-${n.createdAt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(n);
    }

    // Get sender names
    const results = await Promise.all(
      unique.slice(0, 20).map(async (n) => {
        const senderUser = n.senderId ? await ctx.db.get(n.senderId) : null;
        return {
          ...n,
          senderName: senderUser?.name ?? "Unknown",
        };
      })
    );

    return results;
  },
});

export const deleteAnnouncementBroadcast = mutation({
  args: {
    senderId: v.id("users"),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    // Find all notification copies from this broadcast (same sender + timestamp)
    const all = await ctx.db
      .query("notifications")
      .order("desc")
      .collect();

    const toDelete = all.filter(
      (n) =>
        n.type === "announcement" &&
        n.senderId === args.senderId &&
        n.createdAt === args.createdAt
    );

    for (const notification of toDelete) {
      await ctx.db.delete(notification._id);
    }
  },
});

// ── Internal fan-out (server-only, not browser-callable) ───────────

export const notifyAllPlayers = internalMutation({
  args: {
    title: v.string(),
    body: v.string(),
    type: v.union(
      v.literal("announcement"),
      v.literal("event_created"),
      v.literal("event_completed"),
      v.literal("event_canceled"),
      v.literal("season_started"),
      v.literal("score_result"),
      v.literal("system")
    ),
    eventId: v.optional(v.id("events")),
    seasonId: v.optional(v.id("seasons")),
    senderId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const now = Date.now();

    for (const user of allUsers) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        title: args.title,
        body: args.body,
        type: args.type,
        isRead: false,
        eventId: args.eventId,
        seasonId: args.seasonId,
        senderId: args.senderId,
        createdAt: now,
      });
    }

    // Schedule push notification
    await ctx.scheduler.runAfter(0, internal.pushNotifications.sendPushToAll, {
      title: args.title,
      body: args.body,
    });
  },
});
