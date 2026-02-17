import { mutation } from "./_generated/server";

/**
 * Seeds the database with sample data for development.
 * Run from the Convex dashboard: Functions → seed → run
 *
 * This will:
 * - Create sample courses (Connecticut golf courses)
 * - Create a 2026 season (active)
 * - Create sample events for the season
 *
 * NOTE: This does NOT create users — users are created via Clerk webhook
 * when they sign in. To make yourself a super admin, run promoteSuperAdmin
 * after signing in.
 */
export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingCourses = await ctx.db.query("courses").collect();
    if (existingCourses.length > 0) {
      throw new Error("Database already has data. Clear it first if you want to re-seed.");
    }

    // Create courses
    const courses = [
      { name: "Richter Park Golf Course", par: 72, holes: 18, location: "Danbury, CT" },
      { name: "Sterling Farms Golf Course", par: 72, holes: 18, location: "Stamford, CT" },
      { name: "Tashua Knolls Golf Course", par: 72, holes: 18, location: "Trumbull, CT" },
      { name: "Whitney Farms Golf Course", par: 72, holes: 18, location: "Monroe, CT" },
      { name: "Grassy Hill Country Club", par: 70, holes: 18, location: "Orange, CT" },
      { name: "Hawk's Landing Country Club", par: 72, holes: 18, location: "Southington, CT" },
    ];

    const courseIds = [];
    for (const course of courses) {
      const id = await ctx.db.insert("courses", course);
      courseIds.push(id);
    }

    // Create 2026 season
    const seasonId = await ctx.db.insert("seasons", {
      year: 2026,
      name: "2026 Championship Season",
      status: "active",
    });

    // Create events for the season
    const events = [
      { name: "Opening Day Classic", courseIdx: 0, date: "2026-04-18", format: "stroke" as const, isMajor: false, eventNumber: 1 },
      { name: "Spring Invitational", courseIdx: 1, date: "2026-05-16", format: "stroke" as const, isMajor: false, eventNumber: 2 },
      { name: "Memorial Tournament", courseIdx: 2, date: "2026-06-20", format: "stroke" as const, isMajor: true, eventNumber: 3 },
      { name: "Midsummer Classic", courseIdx: 3, date: "2026-07-18", format: "bestBall" as const, isMajor: false, eventNumber: 4 },
      { name: "CT Open", courseIdx: 4, date: "2026-08-15", format: "stroke" as const, isMajor: true, eventNumber: 5 },
      { name: "Fall Championship", courseIdx: 5, date: "2026-09-19", format: "stroke" as const, isMajor: false, eventNumber: 6 },
      { name: "Season Finale", courseIdx: 0, date: "2026-10-17", format: "stroke" as const, isMajor: false, eventNumber: 7 },
      { name: "Tour Championship", courseIdx: 1, date: "2026-11-07", format: "stroke" as const, isMajor: true, eventNumber: 8 },
    ];

    for (const ev of events) {
      await ctx.db.insert("events", {
        seasonId,
        name: ev.name,
        courseId: courseIds[ev.courseIdx],
        date: ev.date,
        format: ev.format,
        isMajor: ev.isMajor,
        multiplier: ev.isMajor ? 2 : 1,
        status: "upcoming",
        eventNumber: ev.eventNumber,
      });
    }

    return { coursesCreated: courses.length, eventsCreated: events.length };
  },
});

/**
 * Promotes a user to super admin by their Clerk ID.
 * Run from the Convex dashboard: Functions → seed:promoteSuperAdmin → run
 * Pass your Clerk user ID (found in Clerk Dashboard → Users).
 */
export const promoteSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Find the first user and make them super admin
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) {
      throw new Error("No users found. Sign in first to create your user.");
    }

    const firstUser = users[0];
    await ctx.db.patch(firstUser._id, {
      isCommissioner: true,
      isSuperAdmin: true,
    });

    return { promoted: firstUser.name, userId: firstUser._id };
  },
});
