/**
 * Event check-in: players confirm attendance; commissioners see status and get email alerts.
 */
import {
  mutation,
  query,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  getCurrentUserOrNull,
  requireActiveUser,
  requireCommissioner,
} from "./helpers";

export const checkInForEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.status === "canceled") throw new Error("This event was canceled");

    const existing = await ctx.db
      .query("eventCheckIns")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { checkedInAt: now });
      return { status: "updated" as const };
    }

    await ctx.db.insert("eventCheckIns", {
      eventId: args.eventId,
      userId: user._id,
      checkedInAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.checkInsEmail.notifyCommissionersOfCheckIn, {
      eventId: args.eventId,
      checkedInUserId: user._id,
    });

    return { status: "confirmed" as const };
  },
});

export const getCheckInsForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const rows = await ctx.db
      .query("eventCheckIns")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const withNames = await Promise.all(
      rows.map(async (row) => {
        const u = await ctx.db.get(row.userId);
        return {
          userId: row.userId,
          name: u?.name ?? "Unknown",
          checkedInAt: row.checkedInAt,
        };
      })
    );

    return withNames.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const getMyCheckInForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) return null;
    const row = await ctx.db
      .query("eventCheckIns")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();
    if (!row) return null;
    return { checkedInAt: row.checkedInAt };
  },
});

export const internalGetCommissionerNotificationContext = internalQuery({
  args: {
    eventId: v.id("events"),
    checkedInUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    const player = await ctx.db.get(args.checkedInUserId);
    if (!event || !player) return null;

    const all = await ctx.db.query("users").collect();
    const staff = all.filter((u) => u.isCommissioner || u.isSuperAdmin);
    const seen = new Set<string>();
    const staffRows: { clerkId: string; email: string | undefined }[] = [];
    for (const u of staff) {
      const key = u.clerkId;
      if (seen.has(key)) continue;
      seen.add(key);
      staffRows.push({ clerkId: u.clerkId, email: u.email });
    }

    return {
      eventName: event.name,
      playerName: player.name,
      staff: staffRows,
    };
  },
});
