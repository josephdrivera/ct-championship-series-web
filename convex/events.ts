/**
 * Event management: storage upload, public reads (upcoming/season/byId),
 * and commissioner CRUD with auto-notifications on create and cancel.
 */
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { requireCommissioner } from "./helpers";

// ── Storage (commissioner) ─────────────────────────────────────────

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireCommissioner(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// ── Queries (public) ───────────────────────────────────────────────

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

// ── Commissioner CRUD ──────────────────────────────────────────────

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
    imageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const season = await ctx.db.get(args.seasonId);
    if (!season) throw new Error("Season not found");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    const eventId = await ctx.db.insert("events", {
      seasonId: args.seasonId,
      name: args.name,
      courseId: args.courseId,
      date: args.date,
      format: args.format,
      isMajor: args.isMajor,
      multiplier: args.isMajor ? 2 : 1,
      status: "upcoming",
      eventNumber: args.eventNumber,
      imageId: args.imageId,
    });

    const dateFormatted = new Date(args.date + "T12:00:00").toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric" }
    );
    await ctx.runMutation(internal.notifications.notifyAllPlayers, {
      title: "New Event Scheduled",
      body: `${args.name} at ${course.name} on ${dateFormatted}.${args.isMajor ? " This is a Major Championship!" : ""}`,
      type: "event_created",
      eventId,
      seasonId: args.seasonId,
    });

    return eventId;
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
    imageId: v.optional(v.id("_storage")),
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

    // Notify on cancellation
    if (args.status === "canceled" && event.status !== "canceled") {
      await ctx.runMutation(internal.notifications.notifyAllPlayers, {
        title: "Event Canceled",
        body: `${event.name} has been canceled.`,
        type: "event_canceled",
        eventId,
        seasonId: event.seasonId,
      });
    }
  },
});

export const getSeasonEvents = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_season", (q) => q.eq("seasonId", args.seasonId))
      .collect();

    const withCourses = await Promise.all(
      events.map(async (event) => {
        const course = await ctx.db.get(event.courseId);
        const imageUrl = event.imageId
          ? await ctx.storage.getUrl(event.imageId)
          : null;
        return { event, course, imageUrl };
      })
    );

    return withCourses.sort(
      (a, b) => a.event.eventNumber - b.event.eventNumber
    );
  },
});

export const getEventById = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const course = await ctx.db.get(event.courseId);
    const imageUrl = event.imageId
      ? await ctx.storage.getUrl(event.imageId)
      : null;

    return { event, course, imageUrl };
  },
});

export const getCompletedEventIds = query({
  args: {},
  handler: async (ctx) => {
    const completed = await ctx.db
      .query("events")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    return completed.map((e) => ({ eventId: e._id }));
  },
});
