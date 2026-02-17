import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireCommissioner } from "./helpers";

export const getAllCourses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("courses").collect();
  },
});

export const getCourseHoles = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const holes = await ctx.db
      .query("courseHoles")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    return holes.sort((a, b) => a.holeNumber - b.holeNumber);
  },
});

export const createCourse = mutation({
  args: {
    name: v.string(),
    par: v.number(),
    holes: v.number(),
    location: v.string(),
    description: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);
    return await ctx.db.insert("courses", args);
  },
});

export const getCoursesWithStats = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    const allEvents = await ctx.db.query("events").collect();

    const results = await Promise.all(
      courses.map(async (course) => {
        const holes = await ctx.db
          .query("courseHoles")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .collect();
        const eventCount = allEvents.filter(
          (e) => e.courseId === course._id
        ).length;
        return {
          ...course,
          holeDataComplete: holes.length === course.holes,
          holesEntered: holes.length,
          eventCount,
        };
      })
    );

    return results.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const addCourseHoles = mutation({
  args: {
    courseId: v.id("courses"),
    holes: v.array(
      v.object({
        holeNumber: v.number(),
        par: v.number(),
        yardage: v.number(),
        teeLat: v.optional(v.number()),
        teeLng: v.optional(v.number()),
        greenLat: v.optional(v.number()),
        greenLng: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    await requireCommissioner(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    if (args.holes.length !== course.holes) {
      throw new Error(
        `Expected ${course.holes} holes, received ${args.holes.length}`
      );
    }

    // Delete existing holes for this course (supports re-upload)
    const existingHoles = await ctx.db
      .query("courseHoles")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const hole of existingHoles) {
      await ctx.db.delete(hole._id);
    }

    // Insert all holes
    for (const hole of args.holes) {
      await ctx.db.insert("courseHoles", {
        courseId: args.courseId,
        ...hole,
      });
    }
  },
});
