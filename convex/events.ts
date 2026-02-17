import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCommissioner } from "./helpers";

export const getUpcomingEvents = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_season", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const upcoming = events.filter(
      (e) => e.status === "upcoming" || e.status === "active"
    );

    const withCourses = await Promise.all(
      upcoming.map(async (event) => ({
        event,
        course: await ctx.db.get(event.courseId),
      }))
    );

    return withCourses.sort((a, b) =>
      a.event.date.localeCompare(b.event.date)
    );
  },
});

export const createEvent = mutation({
  args: {
    seasonId: v.id("seasons"),
    name: v.string(),
    courseId: v.id("courses"),
    date: v.string(),
    format: v.union(
      v.literal("stroke"),
      v.literal("match"),
      v.literal("bestBall"),
      v.literal("scramble"),
      v.literal("stableford"),
      v.literal("skins")
    ),
    isMajor: v.boolean(),
    eventNumber: v.number(),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const season = await ctx.db.get(args.seasonId);
    if (!season) throw new Error("Season not found");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    return await ctx.db.insert("events", {
      seasonId: args.seasonId,
      name: args.name,
      courseId: args.courseId,
      date: args.date,
      format: args.format,
      isMajor: args.isMajor,
      multiplier: args.isMajor ? 2 : 1,
      status: "upcoming",
      eventNumber: args.eventNumber,
    });
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    name: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    date: v.optional(v.string()),
    format: v.optional(
      v.union(
        v.literal("stroke"),
        v.literal("match"),
        v.literal("bestBall"),
        v.literal("scramble"),
        v.literal("stableford"),
        v.literal("skins")
      )
    ),
    isMajor: v.optional(v.boolean()),
    status: v.optional(
      v.union(
        v.literal("upcoming"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("canceled")
      )
    ),
    eventNumber: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const { eventId, ...updates } = args;

    // Recalculate multiplier if isMajor changes
    const patch: Record<string, unknown> = { ...updates };
    if (args.isMajor !== undefined) {
      patch.multiplier = args.isMajor ? 2 : 1;
    }

    await ctx.db.patch(eventId, patch);
  },
});
