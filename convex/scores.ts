import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireUser,
  requireCommissioner,
  calculateAndApplyEventPoints,
} from "./helpers";

export const getEventScores = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const withUsers = await Promise.all(
      scores.map(async (score) => ({
        score,
        user: await ctx.db.get(score.userId),
      }))
    );

    return withUsers.sort(
      (a, b) => a.score.finishPosition - b.score.finishPosition
    );
  },
});

export const submitScore = mutation({
  args: {
    eventId: v.id("events"),
    gross: v.number(),
    net: v.number(),
    handicap: v.number(),
    birdies: v.number(),
    eagles: v.number(),
    pars: v.number(),
    bogeys: v.number(),
    doublePlus: v.number(),
    pickups: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");
    if (event.status !== "active" && event.status !== "upcoming") {
      throw new Error("Event is not accepting scores");
    }

    // Check for duplicate score
    const existing = await ctx.db
      .query("scores")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userId", user._id)
      )
      .unique();
    if (existing) throw new Error("Score already submitted for this event");

    return await ctx.db.insert("scores", {
      ...args,
      userId: user._id,
      pointsEarned: 0,
      finishPosition: 0,
    });
  },
});

export const calculateEventPoints = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);
    await calculateAndApplyEventPoints(ctx, args.eventId);
  },
});
